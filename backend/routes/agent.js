const express = require('express');
const router = express.Router();
const db = require('../db');

// Sync bulk activity logs from desktop agent
router.post('/sync', async (req, res) => {
    const { userId, macAddress, deviceName, osInfo, logs, idleLogs } = req.body;

    if (!userId || !macAddress) {
        return res.status(400).json({ message: 'Missing device identifiers' });
    }

    try {
        // Ensure user exists first because of foreign key constraints
        let userRes = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
        let user = userRes.rows[0];
        if (!user) {
            // Create a placeholder user account for the machine doing the tracking
            // Ensure email is unique
            await db.query(`
                INSERT INTO users (id, name, email, password_hash, role) 
                VALUES ($1, $2, $3, $4, $5)
            `, [userId, `Agent ${deviceName}`, `${userId}@local.host`, 'auto-generated', 'employee']);
        }

        // Ensure device exists or update it
        let deviceRes = await db.query('SELECT id FROM devices WHERE mac_address = $1', [macAddress]);
        let device = deviceRes.rows[0];
        let deviceId;

        if (!device) {
            // Keep deviceId identical to macAddress for easier lookup instead of random string
            deviceId = macAddress; 
            await db.query('INSERT INTO devices (id, user_id, mac_address, device_name, os_info, last_ping) VALUES ($1, $2, $3, $4, $5, $6)',
              [deviceId, userId, macAddress, deviceName, JSON.stringify(osInfo), new Date().toISOString()]);
        } else {
            deviceId = device.id;
            await db.query('UPDATE devices SET last_ping = $1 WHERE id = $2', [new Date().toISOString(), deviceId]);
        }

        // Insert new activity logs
        if (logs && logs.length > 0) {
            const client = await db.connect();
            try {
                await client.query('BEGIN');
                for (const log of logs) {
                    await client.query(
                        'INSERT INTO activity_logs (device_id, user_id, app_name, window_title, start_time, duration_seconds) VALUES ($1, $2, $3, $4, $5, $6)',
                        [deviceId, userId, log.appName || 'Unknown', log.windowTitle || '', new Date(log.timestamp).toISOString(), log.duration || 5]
                    );
                }
                await client.query('COMMIT');
            } catch (e) {
                await client.query('ROLLBACK');
                throw e;
            } finally {
                client.release();
            }
        }

        res.json({ success: true, message: 'Synced successfully' });
    } catch (error) {
        console.error('Agent Sync Error:', error.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
