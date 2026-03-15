const express = require('express');
const router = express.Router();
const path = require('path');

// Generate and download a ready-to-use tracker script for a specific user
router.get('/:userId', (req, res) => {
    const userId = req.params.userId;
    const backendUrl = process.env.BACKEND_URL || `https://${req.get('host')}`;

    // A simple standalone Node.js script that the user can run instantly
    const scriptContent = `// Office Activity Tracker - Auto-generated for your account
const http = require('http');
const https = require('https');
const os = require('os');
const { execSync } = require('child_process');

const BACKEND_URL = '${backendUrl}/api/agent/sync';
const USER_ID = '${userId}';

console.log("==================================================");
console.log("    Office Activity Tracker - Starting Up...      ");
console.log("==================================================");
console.log("User ID:", USER_ID);
console.log("Tracking every 5 seconds. Keep this window open!");
console.log("==================================================\\n");

let activityLogs = [];

// Fallback active window grabber for Windows using PowerShell
function getActiveWindow() {
    try {
        const cmd = \`powershell -NoProfile -Command "Add-Type '@' 
[DllImport(\\"user32.dll\\")] public static extern IntPtr GetForegroundWindow(); 
[DllImport(\\"user32.dll\\")] public static extern int GetWindowThreadProcessId(IntPtr hWnd, out int lpdwProcessId); 
'@' -Name Win32 -Namespace System; 
\\$hwnd = [System.Win32]::GetForegroundWindow(); 
\\$pidOut = 0; 
[System.Win32]::GetWindowThreadProcessId(\\$hwnd, [ref]\\$pidOut) | Out-Null; 
\\$proc = Get-Process -Id \\$pidOut -ErrorAction SilentlyContinue; 
if (\\$proc) { Write-Output \\$proc.ProcessName }"\`;
        
        const appName = execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
        return appName || 'Unknown';
    } catch (e) {
        return 'Unknown';
    }
}

function track() {
    const appName = getActiveWindow();
    if (appName) {
        activityLogs.push({
            appName: appName,
            windowTitle: appName,
            timestamp: Date.now(),
            duration: 5
        });
        process.stdout.write("\\r[Tracking] Active App: " + appName.padEnd(30));
    }
}

function sync() {
    if (activityLogs.length === 0) return;
    
    const logsToSend = [...activityLogs];
    activityLogs = [];
    
    const payload = JSON.stringify({
        userId: USER_ID,
        macAddress: os.hostname() + '-' + os.userInfo().username,
        deviceName: os.hostname(),
        osInfo: { platform: os.platform(), release: os.release() },
        logs: logsToSend
    });
    
    const isHttps = BACKEND_URL.startsWith('https');
    const client = isHttps ? https : http;
    const url = new URL(BACKEND_URL);
    
    const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    };
    
    const req = client.request(options, (res) => {
        if (res.statusCode === 200) {
            process.stdout.write("\\n[System] Synced logs to server.\\n");
        }
    });
    
    req.on('error', (e) => {
        // Silently fail and queue logs for next time
        activityLogs = [...logsToSend, ...activityLogs];
    });
    
    req.write(payload);
    req.end();
}

setInterval(track, 5000);
setInterval(sync, 15000);
track();
`;

    res.setHeader('Content-disposition', `attachment; filename=run-tracker.js`);
    res.setHeader('Content-type', 'application/javascript');
    res.send(scriptContent);
});

module.exports = router;
