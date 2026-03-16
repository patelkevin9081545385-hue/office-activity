const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
// Serve uploaded screenshots statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure upload directory exists (may fail in serverless environments like Vercel)
const uploadsDir = path.join(__dirname, 'uploads', 'screenshots');
try {
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
} catch (err) {
    console.warn('Could not create uploads directory (expected on Vercel):', err.message);
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/agent', require('./routes/agent'));

// Basic root route
app.get('/', (req, res) => {
    res.json({ message: 'Office Activity Tracking API is running' });
});

// Only listen on port if not running in Vercel serverless environment
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;
