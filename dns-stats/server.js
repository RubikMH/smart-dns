const express = require('express');
const fs = require('fs');
const readline = require('readline');

const app = express();
const PORT = process.env.STATS_PORT || 9091;
const LOG_PATH = process.env.LOG_PATH || '/app/logs';

let stats = {
    totalQueries: 0,
    queriesByDomain: {},
    queriesByClient: {},
    lastUpdate: new Date()
};

// Parse DNS log file
async function parseDnsLogs() {
    const logFile = `${LOG_PATH}/dns_access.log`;
    
    try {
        const fileStream = fs.createReadStream(logFile);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        for await (const line of rl) {
            // Parse log line (customize based on your log format)
            const parts = line.split(' ');
            if (parts.length > 0) {
                const client = parts[0];
                stats.totalQueries++;
                
                stats.queriesByClient[client] = (stats.queriesByClient[client] || 0) + 1;
            }
        }
        
        stats.lastUpdate = new Date();
    } catch (error) {
        console.error('Error parsing DNS logs:', error);
    }
}

// Update stats periodically
setInterval(parseDnsLogs, 60000); // Every minute

app.get('/stats', (req, res) => {
    res.json(stats);
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`DNS Stats service running on port ${PORT}`);
    parseDnsLogs(); // Initial parse
});