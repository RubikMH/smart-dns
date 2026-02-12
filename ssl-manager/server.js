const express = require('express');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const util = require('util');

const execPromise = util.promisify(exec);

const app = express();
const PORT = process.env.SSL_PORT || 9094;
const SSL_PATH = process.env.SSL_PATH || '/app/ssl';

app.use(express.json());

// Get SSL certificate status
app.get('/ssl-status', async (req, res) => {
    try {
        const certPath = path.join(SSL_PATH, 'server.crt');
        const keyPath = path.join(SSL_PATH, 'server.key');
        
        const [certExists, keyExists] = await Promise.all([
            fs.access(certPath).then(() => true).catch(() => false),
            fs.access(keyPath).then(() => true).catch(() => false)
        ]);
        
        if (certExists && keyExists) {
            // Get certificate info
            const { stdout } = await execPromise(`openssl x509 -in ${certPath} -noout -dates -subject`);
            
            res.json({
                status: 'valid',
                certificate: stdout,
                certPath,
                keyPath
            });
        } else {
            res.json({
                status: 'missing',
                certExists,
                keyExists
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Generate self-signed certificate
app.post('/generate-cert', async (req, res) => {
    try {
        const { commonName = 'localhost', days = 365 } = req.body;
        
        const certPath = path.join(SSL_PATH, 'server.crt');
        const keyPath = path.join(SSL_PATH, 'server.key');
        
        const command = `openssl req -x509 -newkey rsa:2048 -nodes \
            -keyout ${keyPath} -out ${certPath} \
            -days ${days} \
            -subj "/C=US/ST=State/L=City/O=SmartDNS/CN=${commonName}"`;
        
        await execPromise(command);
        
        // Set proper permissions
        await execPromise(`chmod 600 ${keyPath}`);
        await execPromise(`chmod 644 ${certPath}`);
        
        res.json({
            success: true,
            message: 'Certificate generated successfully',
            certPath,
            keyPath
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`SSL Manager service running on port ${PORT}`);
});