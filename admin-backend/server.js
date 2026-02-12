const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const winston = require('winston');
const { PassThrough } = require('stream');

const execPromise = util.promisify(exec);

// Configuration
const PORT = process.env.API_PORT || 9090;
const CONFIG_PATH = process.env.CONFIG_PATH || '/app/config';
const NGINX_CONFIG_PATH = process.env.NGINX_CONFIG_PATH || '/app/nginx-config';
const LOG_PATH = process.env.LOG_PATH || '/app/logs';
const NGINX_CONTAINER_NAME = process.env.NGINX_CONTAINER_NAME || 'smart-dns-nginx';
const DOCKER_SOCKET = process.env.DOCKER_SOCKET || '/var/run/docker.sock';

let docker;
try {
    // Lazy optional dependency at runtime (available after adding to package.json)
    const Docker = require('dockerode');
    docker = new Docker({ socketPath: DOCKER_SOCKET });
} catch {
    docker = null;
}

async function dockerExec(containerName, cmd) {
    if (!docker) {
        throw new Error('Docker API unavailable (dockerode not installed or docker socket not mounted)');
    }

    const container = docker.getContainer(containerName);
    const execInstance = await container.exec({
        Cmd: cmd,
        AttachStdout: true,
        AttachStderr: true
    });

    const stream = await execInstance.start({ hijack: true, stdin: false });
    const stdout = new PassThrough();
    const stderr = new PassThrough();
    docker.modem.demuxStream(stream, stdout, stderr);

    const chunks = [];
    stdout.on('data', (d) => chunks.push(Buffer.from(d)));
    stderr.on('data', (d) => chunks.push(Buffer.from(d)));

    await new Promise((resolve, reject) => {
        stream.on('end', resolve);
        stream.on('error', reject);
    });

    const inspect = await execInstance.inspect();
    return {
        exitCode: inspect.ExitCode,
        output: Buffer.concat(chunks).toString('utf8')
    };
}

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
    max: 2000,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // The admin UI polls these endpoints periodically; do not rate-limit them.
        if (req.method !== 'GET') return false;
        return (
            req.originalUrl === '/api/stats' ||
            req.originalUrl === '/api/dns/stats' ||
            req.originalUrl === '/api/upstream/status' ||
            req.originalUrl === '/api/activity/recent'
        );
    }
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

// Update DNS configurations
app.post('/api/config/dns', async (req, res) => {
    try {
        const { upstreamDns, dnsRouting } = req.body;

        if (typeof upstreamDns === 'string') {
            await fs.writeFile(path.join(NGINX_CONFIG_PATH, 'upstream-dns.conf'), upstreamDns);
        }

        if (typeof dnsRouting === 'string') {
            await fs.writeFile(path.join(NGINX_CONFIG_PATH, 'dns-routing.conf'), dnsRouting);
        }

        logger.info('DNS config updated');
        res.json({ success: true, message: 'DNS configuration updated' });
    } catch (error) {
        logger.error('Error updating DNS config:', error);
        res.status(500).json({ error: 'Failed to update DNS configuration' });
    }
});

// DNS stats summary (for realtime dashboard DNS Queries card)
app.get('/api/dns/stats', async (req, res) => {
    try {
        const axios = require('axios');
        const dnsStatsUrl = process.env.DNS_STATS_URL || 'http://dns-stats:9091';
        const statsResponse = await axios.get(`${dnsStatsUrl}/stats`, { timeout: 2000 });
        res.json(statsResponse.data);
    } catch (error) {
        logger.error('Error fetching DNS stats:', error);
        res.status(500).json({ error: 'Failed to fetch DNS stats' });
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
        const result = await dockerExec(NGINX_CONTAINER_NAME, ['nginx', '-t']);
        res.json({
            success: result.exitCode === 0,
            output: result.output
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
        // Test first (inside nginx container)
        const testResult = await dockerExec(NGINX_CONTAINER_NAME, ['nginx', '-t']);
        if (testResult.exitCode !== 0) {
            return res.status(400).json({
                success: false,
                error: 'Nginx configuration test failed',
                output: testResult.output
            });
        }

        // Reload (inside nginx container)
        const reloadResult = await dockerExec(NGINX_CONTAINER_NAME, ['nginx', '-s', 'reload']);
        if (reloadResult.exitCode !== 0) {
            return res.status(500).json({
                success: false,
                error: 'Failed to reload nginx',
                output: reloadResult.output
            });
        }
        
        logger.info('Nginx reloaded successfully');
        res.json({ success: true, message: 'Nginx reloaded successfully' });
    } catch (error) {
        logger.error('Error reloading nginx:', error);
        res.status(500).json({ error: 'Failed to reload nginx: ' + error.message });
    }
});

function parseUpstreamsFromNginxConfig(configText) {
    const upstreams = [];
    const seen = new Set();
    let currentLabel = '';

    const lines = String(configText).split(/\r?\n/);
    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        if (line.startsWith('#')) {
            const label = line.replace(/^#\s*/, '').trim();
            if (label) currentLabel = label;
            continue;
        }

        const serverMatch = line.match(/^server\s+([^\s;]+)\b/);
        if (!serverMatch) continue;

        const hostPort = serverMatch[1];
        let host = hostPort;
        let port = 53;

        // Handle [IPv6]:port
        const ipv6Match = hostPort.match(/^\[(.+)\]:(\d+)$/);
        if (ipv6Match) {
            host = ipv6Match[1];
            port = parseInt(ipv6Match[2], 10);
        } else {
            const lastColon = hostPort.lastIndexOf(':');
            if (lastColon > -1) {
                const maybePort = hostPort.slice(lastColon + 1);
                if (/^\d+$/.test(maybePort)) {
                    host = hostPort.slice(0, lastColon);
                    port = parseInt(maybePort, 10);
                }
            }
        }

        // Dashboard UDP check only supports classic DNS (port 53)
        if (port !== 53) continue;

        if (!host || seen.has(host)) continue;
        seen.add(host);

        upstreams.push({
            name: currentLabel || host,
            host,
            port
        });
    }

    return upstreams;
}

// Get upstream server status
app.get('/api/upstream/status', async (req, res) => {
    try {
        const dgram = require('dgram');

        const upstreamConfig = await fs.readFile(path.join(NGINX_CONFIG_PATH, 'upstream-dns.conf'), 'utf8');
        const upstreams = parseUpstreamsFromNginxConfig(upstreamConfig);
        if (!upstreams.length) {
            return res.json({ upstreams: [] });
        }
        
        // Function to check DNS server with UDP query
        const checkDns = (host, port) => {
            return new Promise((resolve) => {
                const start = Date.now();
                const client = dgram.createSocket('udp4');
                const timeout = setTimeout(() => {
                    client.close();
                    resolve({ success: false, latency: null });
                }, 2000);
                
                // Simple DNS query for google.com (A record)
                const query = Buffer.from([
                    0x00, 0x01, // Transaction ID
                    0x01, 0x00, // Flags: standard query
                    0x00, 0x01, // Questions: 1
                    0x00, 0x00, // Answer RRs: 0
                    0x00, 0x00, // Authority RRs: 0
                    0x00, 0x00, // Additional RRs: 0
                    // Query: google.com
                    0x06, 0x67, 0x6f, 0x6f, 0x67, 0x6c, 0x65, 0x03, 0x63, 0x6f, 0x6d, 0x00,
                    0x00, 0x01, // Type: A
                    0x00, 0x01  // Class: IN
                ]);
                
                client.on('message', () => {
                    clearTimeout(timeout);
                    const latency = Date.now() - start;
                    client.close();
                    resolve({ success: true, latency });
                });
                
                client.on('error', () => {
                    clearTimeout(timeout);
                    client.close();
                    resolve({ success: false, latency: null });
                });
                
                client.send(query, port, host, (err) => {
                    if (err) {
                        clearTimeout(timeout);
                        client.close();
                        resolve({ success: false, latency: null });
                    }
                });
            });
        };
        
        const results = await Promise.all(upstreams.map(async (upstream) => {
            const result = await checkDns(upstream.host, upstream.port || 53);
            return {
                ...upstream,
                status: result.success ? 'up' : 'down',
                latency: result.latency
            };
        }));
        
        res.json({ upstreams: results });
    } catch (error) {
        logger.error('Error checking upstream status:', error);
        res.status(500).json({ error: 'Failed to check upstream status' });
    }
});

// Get recent activity
app.get('/api/activity/recent', async (req, res) => {
    try {
        const axios = require('axios');
        const dns_stats_url = process.env.DNS_STATS_URL || 'http://dns-stats:9091';
        
        // Get DNS stats
        const statsResponse = await axios.get(`${dns_stats_url}/stats`);
        const stats = statsResponse.data;
        
        // Format activity items
        const activities = [];
        
        // Add DNS query activity
        if (stats.totalQueries > 0) {
            activities.push({
                type: 'query',
                message: `${stats.totalQueries} DNS queries processed`,
                timestamp: stats.lastUpdate,
                icon: 'dns'
            });
            
            // Top querying clients
            const topClients = Object.entries(stats.queriesByClient)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3);
            
            topClients.forEach(([client, count]) => {
                activities.push({
                    type: 'client',
                    message: `${count} queries from ${client}`,
                    timestamp: stats.lastUpdate,
                    icon: 'user'
                });
            });
        }
        
        // Add system status
        activities.push({
            type: 'system',
            message: 'All services running normally',
            timestamp: new Date().toISOString(),
            icon: 'check'
        });
        
        // Sort by timestamp (newest first)
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        res.json({ activities: activities.slice(0, 10) }); // Return top 10
    } catch (error) {
        logger.error('Error fetching recent activity:', error);
        // Return empty activity if stats service is unavailable
        res.json({
            activities: [{
                type: 'system',
                message: 'System monitoring active',
                timestamp: new Date().toISOString(),
                icon: 'check'
            }]
        });
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