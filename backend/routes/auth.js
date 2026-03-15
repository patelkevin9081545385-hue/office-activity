const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');
const db = require('../db');

// Initialize Google Auth Client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper for generating UUID-like strings without the uuid package
const generateId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_in_production';

// Nodemailer transporter
const createTransporter = () => nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// ─────────────────────────────────────────────
// POST /api/auth/register — Sign Up with email verification
// ─────────────────────────────────────────────
router.post('/register', async (req, res) => {
    const { name, email, password, role, phone_number, date_of_birth } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'Name, email, password and role are required.' });
    }

    const allowedRoles = ['employee', 'manager', 'admin'];
    if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role. Must be employee, manager, or admin.' });
    }

    try {
        // Check if already a verified user
        const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'An account with this email already exists.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);

        if (emailConfigured) {
            // ── EMAIL VERIFICATION FLOW ──
            // Remove any old pending entry for this email
            await db.query('DELETE FROM pending_users WHERE email = $1', [email]);

            const verificationToken = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const id = generateId();

            await db.query(
                `INSERT INTO pending_users (id, name, email, password_hash, role, phone_number, date_of_birth, verification_token, expires_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [id, name, email, password_hash, role, phone_number || null, date_of_birth || null, verificationToken, expiresAt]
            );

            const backendUrl = process.env.BACKEND_URL || `http://localhost:5000`;
            const verifyUrl = `${backendUrl}/api/auth/verify-email/${verificationToken}`;

            try {
                const transporter = createTransporter();
                await transporter.sendMail({
                    from: `"Office Activity Tracker" <${process.env.EMAIL_USER}>`,
                    to: email,
                    subject: 'Verify your Office Activity Tracker account',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc;">
                            <h2 style="color: #1e293b; margin-bottom: 8px;">Verify your email</h2>
                            <p style="color: #475569; margin-bottom: 24px;">Hi <b>${name}</b>, click the button below to activate your account.</p>
                            <a href="${verifyUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
                                Verify Email Address
                            </a>
                            <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">This link expires in 24 hours. If you didn't sign up, please ignore this email.</p>
                        </div>
                    `,
                });
            } catch (emailError) {
                console.error('Email send failed:', emailError.message);
                await db.query('DELETE FROM pending_users WHERE id = $1', [id]);
                return res.status(500).json({ message: 'Could not send verification email.', details: emailError.message });
            }

            return res.json({ message: 'Verification email sent. Please check your inbox.', verified: false });

        } else {
            // ── DIRECT REGISTRATION (no email verification) ──
            const id = generateId();
            await db.query(
                `INSERT INTO users (id, name, email, password_hash, role, phone_number, date_of_birth, is_active)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, 1)`,
                [id, name, email, password_hash, role, phone_number || null, date_of_birth || null]
            );

            const user = { id, name, email, role, phone_number: phone_number || null, date_of_birth: date_of_birth || null };

            // Generate JWT so the frontend can auto-login
            const token = jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '7d' });

            return res.json({
                message: 'Account created successfully!',
                verified: true,
                token,
                user,
            });
        }

    } catch (error) {
        console.error('Register Error:', error.message);
        res.status(500).json({ message: 'Server error. Please try again.', details: error.message });
    }
});

// ─────────────────────────────────────────────
// GET /api/auth/verify-email/:token — Email verification link
// ─────────────────────────────────────────────
router.get('/verify-email/:token', async (req, res) => {
    const { token } = req.params;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    try {
        const pendingRes = await db.query('SELECT * FROM pending_users WHERE verification_token = $1', [token]);
        const pending = pendingRes.rows[0];

        if (!pending) {
            return res.redirect(`${frontendUrl}/email-verified?success=false&reason=invalid`);
        }

        if (new Date() > new Date(pending.expires_at)) {
            await db.query('DELETE FROM pending_users WHERE id = $1', [pending.id]);
            return res.redirect(`${frontendUrl}/email-verified?success=false&reason=expired`);
        }

        // Check if user already verified and exists
        let user;
        const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [pending.email]);
        if (existingUser.rows.length > 0) {
            await db.query('DELETE FROM pending_users WHERE id = $1', [pending.id]);
            user = existingUser.rows[0];
        } else {
            // Create the verified user
            const newId = generateId();
            await db.query(
                `INSERT INTO users (id, name, email, password_hash, role, phone_number, date_of_birth, is_active)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, 1)`,
                [newId, pending.name, pending.email, pending.password_hash, pending.role, pending.phone_number, pending.date_of_birth]
            );
            // Remove from pending
            await db.query('DELETE FROM pending_users WHERE id = $1', [pending.id]);
            const newUserRes = await db.query('SELECT * FROM users WHERE id = $1', [newId]);
            user = newUserRes.rows[0];
        }

        // Generate JWT for auto-login
        const jwtToken = jwt.sign(
            { id: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        const userPayload = encodeURIComponent(JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone_number: user.phone_number || null,
            date_of_birth: user.date_of_birth || null,
        }));

        // Redirect to frontend with token — frontend will store and navigate to dashboard
        return res.redirect(`${frontendUrl}/email-verified?success=true&token=${jwtToken}&user=${userPayload}`);

    } catch (error) {
        console.error('Email Verify Error:', error.message);
        return res.redirect(`${frontendUrl}/email-verified?success=false&reason=error`);
    }
});


// ─────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter all required fields' });
    }

    try {
        const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = userRes.rows[0];

        if (!user) {
            // Check if they're pending verification
            const pending = await db.query('SELECT id FROM pending_users WHERE email = $1', [email]);
            if (pending.rows.length > 0) {
                return res.status(400).json({ message: 'Please verify your email before signing in. Check your inbox.' });
            }
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const userResponse = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone_number: user.phone_number,
            date_of_birth: user.date_of_birth,
        };

        jwt.sign(
            { id: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: userResponse });
            }
        );

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// ─────────────────────────────────────────────
// POST /api/auth/google — Google Sign-In / Sign-Up
// ─────────────────────────────────────────────
router.post('/google', async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ message: 'No Google token provided' });
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { sub: googleId, email, name } = payload;

        const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        let user = userRes.rows[0];

        if (!user) {
            const id = generateId();
            const userRole = 'employee'; // New Google sign-ups default to employee
            await db.query(
                'INSERT INTO users (id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
                [id, name, email, null, userRole]
            );
            const newUserRes = await db.query('SELECT id, name, email, role FROM users WHERE id = $1', [id]);
            user = newUserRes.rows[0];
        }

        const userResponse = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };

        jwt.sign(
            { id: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' },
            (err, jwtToken) => {
                if (err) throw err;
                res.json({ token: jwtToken, user: userResponse });
            }
        );

    } catch (error) {
        console.error('Google Auth Error:', error.message);
        res.status(401).json({
            message: 'Invalid Google Token',
            details: error.message,
            clientIdConfigured: !!process.env.GOOGLE_CLIENT_ID
        });
    }
});

module.exports = router;
