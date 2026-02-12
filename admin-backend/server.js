const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const winston = require('winston');

const execPromise = util.promisify(exec);

// Configuration
const PORT = process.env.API_PORT || 9090;
const CONFIG_PATH = process.env.CONFIG_PATH || '/app/config';
const NGINX_CONFIG_PATH = process.env.NGINX_CONFIG_PATH || '/app/nginx-config';
const LOG_PATH = process.env.LOG_PATH || '/app/logs';

// Logger setup
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: path.join(LOG_PATH, 'admin-error.log'), level: 'error' }),
        new winston.transports.File({ filename: path.join(LOG_PATH, 'admin-combined.log') }),
        new winston.transports.Console({ format: winston.format.simple() })
    ]
});

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8090'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get system statistics
app.get('/api/stats', async (req, res) => {
    try {
        const si = require('systeminformation');
        
        const [cpu, mem, network, processes] = await Promise.all([
            si.currentLoad(),
            si.mem(),
            si.networkStats(),
            si.processes()
        ]);
        
        res.json({
            cpu: {
                usage: cpu.currentLoad.toFixed(2),
                cores: cpu.cpus.length
            },
            memory: {
                total: mem.total,
                used: mem.used,
                free: mem.free,
                percentage: ((mem.used / mem.total) * 100).toFixed(2)
            },
            network: network[0] || {},
            processes: {
                all: processes.all,
                running: processes.running,
                blocked: processes.blocked
            }
        });
    } catch (error) {
        logger.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Get DNS configurations
app.get('/api/config/dns', async (req, res) => {
    try {
        const upstreamDns = await fs.readFile(path.join(NGINX_CONFIG_PATH, 'upstream-dns.conf'), 'utf8');
        const dnsRouting = await fs.readFile(path.join(NGINX_CONFIG_PATH, 'dns-routing.conf'), 'utf8');
        
        res.json({
            upstreamDns,
            dnsRouting
        });
    } catch (error) {
        logger.error('Error reading DNS config:', error);
        res.status(500).json({ error: 'Failed to read DNS configuration' });
    }
});

// Get domain lists
app.get('/api/config/domains', async (req, res) => {
    try {
        const [geoDomains, blockedDomains] = await Promise.all([
            fs.readFile(path.join(CONFIG_PATH, 'geo-domains.conf'), 'utf8'),
            fs.readFile(path.join(CONFIG_PATH, 'blocked-domains.conf'), 'utf8')
        ]);
        
        res.json({
            geoDomains: geoDomains.split('\n').filter(line => line && !line.startsWith('#')),
            blockedDomains: blockedDomains.split('\n').filter(line => line && !line.startsWith('#'))
        });
    } catch (error) {
        logger.error('Error reading domain lists:', error);
        res.status(500).json({ error: 'Failed to read domain lists' });
    }
});

// Update domain lists
app.post('/api/config/domains', async (req, res) => {
    try {
        const { geoDomains, blockedDomains } = req.body;
        
        if (geoDomains) {
            const content = '# Geo-unblocking domains\n' + geoDomains.join('\n');
            await fs.writeFile(path.join(CONFIG_PATH, 'geo-domains.conf'), content);
        }
        
        if (blockedDomains) {
            const content = '# Blocked domains\n' + blockedDomains.join('\n');
            await fs.writeFile(path.join(CONFIG_PATH, 'blocked-domains.conf'), content);
        }
        
        logger.info('Domain lists updated');
        res.json({ success: true, message: 'Domain lists updated' });
    } catch (error) {
        logger.error('Error updating domain lists:', error);
        res.status(500).json({ error: 'Failed to update domain lists' });
    }
});

// Get DNS query logs
app.get('/api/logs/dns', async (req, res) => {
    try {
        const logFile = path.join(LOG_PATH, 'dns_access.log');
        const limit = parseInt(req.query.limit) || 100;
        
        const content = await fs.readFile(logFile, 'utf8');
        const lines = content.split('\n').filter(Boolean).slice(-limit);
        
        res.json({ logs: lines });
    } catch (error) {
        logger.error('Error reading DNS logs:', error);
        res.status(500).json({ error: 'Failed to read DNS logs' });
    }
});

// Get proxy logs
app.get('/api/logs/proxy', async (req, res) => {
    try {
        const logFile = path.join(LOG_PATH, 'proxy_access.log');
        const limit = parseInt(req.query.limit) || 100;
        
        const content = await fs.readFile(logFile, 'utf8');
        const lines = content.split('\n').filter(Boolean).slice(-limit);
        
        res.json({ logs: lines });
    } catch (error) {
        logger.error('Error reading proxy logs:', error);
        res.status(500).json({ error: 'Failed to read proxy logs' });
    }
});

// Test nginx configuration
app.post('/api/nginx/test', async (req, res) => {
    try {
        const { stdout, stderr } = await execPromise('nginx -t 2>&1');
        res.json({ 
            success: !stderr.includes('error'),
            output: stdout + stderr 
        });
    } catch (error) {
        res.json({ 
            success: false, 
            output: error.message 
        });
    }
});

// Reload nginx
app.post('/api/nginx/reload', async (req, res) => {
    try {
        // Test first
        await execPromise('nginx -t 2>&1');
        
        // Reload
        await execPromise('nginx -s reload');
        
        logger.info('Nginx reloaded successfully');
        res.json({ success: true, message: 'Nginx reloaded successfully' });
    } catch (error) {
        logger.error('Error reloading nginx:', error);
        res.status(500).json({ error: 'Failed to reload nginx: ' + error.message });
    }
});

// Get upstream server status
app.get('/api/upstream/status', async (req, res) => {
    try {
        const axios = require('axios');
        
        const upstreams = [
            { name: 'Cloudflare', host: '1.1.1.1' },
            { name: 'Google', host: '8.8.8.8' },
            { name: 'Quad9', host: '9.9.9.9' },
            { name: 'OpenDNS', host: '208.67.222.222' }
        ];
        
        const results = await Promise.all(upstreams.map(async (upstream) => {
            const start = Date.now();
            try {
                await execPromise(`timeout 2 ping -c 1 ${upstream.host}`);
                const latency = Date.now() - start;
                return { ...upstream, status: 'up', latency };
            } catch {
                return { ...upstream, status: 'down', latency: null };
            }
        }));
        
        res.json({ upstreams: results });
    } catch (error) {
        logger.error('Error checking upstream status:', error);
        res.status(500).json({ error: 'Failed to check upstream status' });
    }
});

// Error handling
app.use((err, req, res, next) => {
    logger.error('Express error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Admin backend server running on port ${PORT}`);
});