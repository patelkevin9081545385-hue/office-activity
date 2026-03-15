const express = require('express');
const router = express.Router();
const db = require('../db');

// Get Dashboard Statistics
router.get('/stats', async (req, res) => {
    try {
        const usersRes = await db.query('SELECT COUNT(*) as count FROM users');
        const userCount = parseInt(usersRes.rows[0].count, 10);

        // Count people who have sent activity in the last 15 minutes
        const activeUsersRes = await db.query(`
            SELECT COUNT(DISTINCT user_id) as count 
            FROM activity_logs 
            WHERE start_time > NOW() - INTERVAL '15 minutes'
        `);
        const activeCount = parseInt(activeUsersRes.rows[0].count, 10);
        
        // Sum total duration of all activity logs for today (in seconds) -> convert to hours
        const totalHoursRes = await db.query(`
            SELECT SUM(duration_seconds) as total_seconds
            FROM activity_logs
            WHERE DATE(start_time) = CURRENT_DATE
        `);
        const totalSeconds = parseInt(totalHoursRes.rows[0].total_seconds || 0, 10);
        const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;

        // Top Apps query
        const topAppsRes = await db.query(`
            SELECT app_name as name, SUM(duration_seconds) as usage
            FROM activity_logs
            WHERE DATE(start_time) = CURRENT_DATE
            GROUP BY app_name
            ORDER BY usage DESC
            LIMIT 4
        `);
        const topApps = topAppsRes.rows.map(app => ({
            name: app.name,
            usage: Math.round(app.usage / 60) // convert to minutes for charting
        }));

        // Recent Activity
        const recentRes = await db.query(`
            SELECT users.name as user, activity_logs.app_name as action, activity_logs.start_time as time
            FROM activity_logs
            JOIN users ON users.id = activity_logs.user_id
            ORDER BY activity_logs.start_time DESC
            LIMIT 4
        `);
        // Basic mapping for "time ago" string
        const recentActivity = recentRes.rows.map((log, i) => ({
             id: i,
             user: log.user,
             action: `Opened ${log.action}`,
             time: new Date(log.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }));

        res.json({
            totalEmployees: userCount,
            onlineEmployees: activeCount,
            avgProductivity: 0, // Requires complex logic/categorization
            totalHours,
            topApps,
            recentActivity
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// Get Live Employee Data
router.get('/live', async (req, res) => {
    try {
        // Get the latest activity for every user
        const resData = await db.query(`
            SELECT 
                u.id, u.name, u.department, 
                a.app_name as currentapp,
                a.start_time as last_active,
                (SELECT SUM(duration_seconds) FROM activity_logs WHERE user_id = u.id AND DATE(start_time) = CURRENT_DATE) as total_seconds
            FROM users u
            LEFT JOIN (
                SELECT user_id, app_name, start_time
                FROM activity_logs
                WHERE id IN (
                    SELECT MAX(id) FROM activity_logs GROUP BY user_id
                )
            ) a ON u.id = a.user_id
        `);
        
        const rawData = resData.rows;
        const liveEmployees = rawData.map(user => {
            // Determine "Status" based on how recent the last activity was
            let status = 'Offline';
            if (user.last_active) {
                const diffMs = Date.now() - new Date(user.last_active).getTime();
                const diffMins = diffMs / 1000 / 60;
                if (diffMins < 5) status = 'Active';
                else if (diffMins < 30) status = 'Idle';
            }

            const totalMins = Math.floor(parseInt(user.total_seconds || 0, 10) / 60);
            const hours = Math.floor(totalMins / 60);
            const mins = totalMins % 60;

            return {
                id: user.id,
                name: user.name,
                department: user.department || 'Unassigned',
                status,
                currentApp: user.currentapp || '-',
                todayHours: `${hours}h ${mins}m`
            };
        });

        res.json(liveEmployees);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
