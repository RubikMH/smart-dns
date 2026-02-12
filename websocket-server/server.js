const WebSocket = require('ws');
const fs = require('fs');
const { Tail } = require('tail');

const PORT = process.env.WS_PORT || 9093;
const LOG_PATH = process.env.LOG_PATH || '/app/logs';

const wss = new WebSocket.Server({ port: PORT, host: '0.0.0.0' });

console.log(`WebSocket server running on port ${PORT}`);

wss.on('connection', (ws) => {
    console.log('Client connected');
    
    // Send initial message
    ws.send(JSON.stringify({ type: 'connected', message: 'Connected to Smart DNS WebSocket' }));
    
    // Setup log tailing (if log files exist)
    let dnsLogTail, proxyLogTail;
    
    try {
        dnsLogTail = new Tail(`${LOG_PATH}/dns_access.log`, { follow: true });
        dnsLogTail.on('line', (data) => {
            ws.send(JSON.stringify({ type: 'dns_log', data }));
        });
    } catch (e) {
        console.log('DNS log file not available yet');
    }
    
    try {
        proxyLogTail = new Tail(`${LOG_PATH}/proxy_access.log`, { follow: true });
        proxyLogTail.on('line', (data) => {
            ws.send(JSON.stringify({ type: 'proxy_log', data }));
        });
    } catch (e) {
        console.log('Proxy log file not available yet');
    }
    
    // Send periodic stats
    const statsInterval = setInterval(() => {
        const stats = {
            type: 'stats',
            timestamp: new Date().toISOString(),
            connections: wss.clients.size
        };
        ws.send(JSON.stringify(stats));
    }, 5000);
    
    ws.on('close', () => {
        console.log('Client disconnected');
        clearInterval(statsInterval);
        if (dnsLogTail) dnsLogTail.unwatch();
        if (proxyLogTail) proxyLogTail.unwatch();
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});