const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// Helper for generating UUID-like strings without the uuid package
const generateId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_in_production';

// Register User
router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please enter all required fields' });
    }

    try {
        // Check for existing user
        const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = userRes.rows[0];

        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        const id = generateId();
        const userRole = role || 'employee';

        await db.query('INSERT INTO users (id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)', [id, name, email, password_hash, userRole]);
        
        const newUserRes = await db.query('SELECT id, name, email, role FROM users WHERE id = $1', [id]);
        const newUser = newUserRes.rows[0];

        jwt.sign(
            { id: newUser.id, role: newUser.role },
            JWT_SECRET,
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: newUser
                });
            }
        );

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// Login User
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter all required fields' });
    }

    try {
        // Check for existing user
        const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = userRes.rows[0];

        if (!user) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        // Clean user object before sending
        const userResponse = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        jwt.sign(
            { id: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: userResponse
                });
            }
        );

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
