const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.CONFIG_PORT || 9092;
const CONFIG_PATH = process.env.CONFIG_PATH || '/app/config';
const NGINX_CONFIG_PATH = process.env.NGINX_CONFIG_PATH || '/app/nginx-config';

app.use(express.json());

// Get configuration file
app.get('/config/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(CONFIG_PATH, filename);
        const content = await fs.readFile(filePath, 'utf8');
        
        res.json({ filename, content });
    } catch (error) {
        res.status(404).json({ error: 'Configuration file not found' });
    }
});

// Update configuration file
app.put('/config/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const { content } = req.body;
        const filePath = path.join(CONFIG_PATH, filename);
        
        // Backup current file
        try {
            const backup = await fs.readFile(filePath, 'utf8');
            await fs.writeFile(`${filePath}.bak`, backup);
        } catch (e) {
            // No existing file to backup
        }
        
        // Write new content
        await fs.writeFile(filePath, content);
        
        res.json({ success: true, message: 'Configuration updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update configuration' });
    }
});

// List all configuration files
app.get('/config', async (req, res) => {
    try {
        const files = await fs.readdir(CONFIG_PATH);
        const configs = files.filter(f => f.endsWith('.conf'));
        
        res.json({ files: configs });
    } catch (error) {
        res.status(500).json({ error: 'Failed to list configurations' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Config Manager service running on port ${PORT}`);
});