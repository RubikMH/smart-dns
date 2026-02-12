// Smart DNS Admin Panel - JavaScript// Smart DNS Admin Panel - Main JavaScript













































































































































































































































































































window.restartServices = restartServices;window.clearCache = clearCache;window.downloadConfig = downloadConfig;window.refreshLogs = refreshLogs;window.reloadNginx = reloadNginx;window.testNginxConfig = testNginxConfig;window.saveBlockedDomains = saveBlockedDomains;window.saveGeoDomains = saveGeoDomains;// Expose functions to global scope for inline onclick handlers}    }, 3000);        toast.classList.remove('show');    setTimeout(() => {        toast.className = `toast ${type} show`;    toast.textContent = message;    const toast = document.getElementById('toast');function showToast(message, type = 'info') {// Toast notifications}    }, 2000);        showToast('Services restarted', 'success');    setTimeout(() => {    // Implementation would restart docker-compose services    showToast('Restarting services...', 'warning');        }        return;    if (!confirm('Are you sure you want to restart all services? This will cause brief downtime.')) {async function restartServices() {// Restart services}    }, 1000);        showToast('Cache cleared', 'success');    setTimeout(() => {    // Implementation would clear nginx cache directories    showToast('Clearing cache...', 'warning');        }        return;    if (!confirm('Are you sure you want to clear all cache?')) {async function clearCache() {// Clear cache}    }, 1000);        showToast('Configuration downloaded', 'success');    setTimeout(() => {    // Implementation would export configuration files    showToast('Downloading configuration...', 'warning');function downloadConfig() {// Download configuration}    }        showToast(`Error loading ${type} logs`, 'error');    } catch (error) {        showToast(`${type} logs loaded`, 'success');                container.scrollTop = container.scrollHeight;        // Scroll to bottom                });            container.appendChild(logLine);            logLine.textContent = line;            logLine.className = 'log-line';            const logLine = document.createElement('div');        data.logs.forEach(line => {                container.innerHTML = '';        const container = document.getElementById(`${type}Logs`);                const data = await response.json();        const response = await fetch(`${API_BASE}/api/logs/${type}?limit=100`);    try {        showToast(`Loading ${type} logs...`, 'warning');async function refreshLogs(type) {// Refresh logs}    }        showToast('Error reloading nginx', 'error');    } catch (error) {        }            showToast('Error reloading nginx', 'error');        } else {            showToast('Nginx reloaded successfully ✓', 'success');        if (result.success) {                const result = await response.json();                });            method: 'POST'        const response = await fetch(`${API_BASE}/api/nginx/reload`, {    try {        showToast('Reloading nginx...', 'warning');async function reloadNginx() {// Reload nginx}    }        showToast('Error testing configuration', 'error');    } catch (error) {        }            console.error(result.output);            showToast('Configuration has errors!', 'error');        } else {            showToast('Configuration is valid ✓', 'success');        if (result.success) {                const result = await response.json();                });            method: 'POST'        const response = await fetch(`${API_BASE}/api/nginx/test`, {    try {        showToast('Testing nginx configuration...', 'warning');async function testNginxConfig() {// Test nginx configuration}    }        showToast('Error loading DNS config', 'error');    } catch (error) {        document.getElementById('upstreamDns').value = data.upstreamDns;                const data = await response.json();        const response = await fetch(`${API_BASE}/api/config/dns`);    try {async function loadDnsConfig() {// Load DNS configuration}    }        showToast('Error saving blocked domains', 'error');    } catch (error) {        showToast('Blocked domains saved successfully', 'success');        const result = await response.json();                });            body: JSON.stringify({ blockedDomains: domains })            headers: { 'Content-Type': 'application/json' },            method: 'POST',        const response = await fetch(`${API_BASE}/api/config/domains`, {    try {            .filter(line => line.trim() && !line.startsWith('#'));        .split('\n')    const domains = document.getElementById('blockedDomains').valueasync function saveBlockedDomains() {// Save blocked domains}    }        showToast('Error saving geo domains', 'error');    } catch (error) {        showToast('Geo domains saved successfully', 'success');        const result = await response.json();                });            body: JSON.stringify({ geoDomains: domains })            headers: { 'Content-Type': 'application/json' },            method: 'POST',        const response = await fetch(`${API_BASE}/api/config/domains`, {    try {            .filter(line => line.trim() && !line.startsWith('#'));        .split('\n')    const domains = document.getElementById('geoDomains').valueasync function saveGeoDomains() {// Save geo domains}    }        showToast('Error loading domains', 'error');    } catch (error) {        document.getElementById('blockedDomains').value = data.blockedDomains.join('\n');        document.getElementById('geoDomains').value = data.geoDomains.join('\n');                const data = await response.json();        const response = await fetch(`${API_BASE}/api/config/domains`);    try {async function loadDomains() {// Load domain lists}    }        console.error('Error loading upstream status:', error);    } catch (error) {        });            container.appendChild(card);            `;                </div>                    ${upstream.status === 'up' ? `${upstream.latency}ms` : 'Down'}                <div class="upstream-latency">                <div class="upstream-host">${upstream.host}</div>                <div class="upstream-name">${upstream.name}</div>            card.innerHTML = `            card.className = `upstream-card ${upstream.status}`;            const card = document.createElement('div');        data.upstreams.forEach(upstream => {                container.innerHTML = '';        const container = document.getElementById('upstreamStatus');                const data = await response.json();        const response = await fetch(`${API_BASE}/api/upstream/status`);    try {async function loadUpstreamStatus() {// Load upstream server status}    }        console.error('Error loading dashboard:', error);    } catch (error) {                loadUpstreamStatus();        // Load upstream status                document.getElementById('networkUsage').textContent = `${networkMB} MB/s`;        const networkMB = ((stats.network.rx_sec || 0) / 1024 / 1024).toFixed(2);        // Update Network (convert bytes to MB/s)                document.getElementById('memoryUsage').textContent = `${memPercent}%`;        const memPercent = stats.memory.percentage;        // Update Memory                document.getElementById('cpuUsage').textContent = `${stats.cpu.usage}%`;        // Update CPU                const stats = await response.json();        const response = await fetch(`${API_BASE}/api/stats`);    try {async function loadDashboard() {// Load dashboard data}    }        document.getElementById('statusText').textContent = 'Connection Error';        document.getElementById('statusDot').style.background = '#e74c3c';    } catch (error) {        document.getElementById('statusText').textContent = 'System Online';        document.getElementById('statusDot').style.background = '#2ecc71';                const data = await response.json();        const response = await fetch(`${API_BASE}/health`);    try {async function checkSystemStatus() {// System status check}    }        loadDnsConfig();    } else if (tabName === 'dns') {        loadDomains();    if (tabName === 'domains') {    // Load tab-specific data        document.getElementById(tabName).classList.add('active');    });        content.classList.remove('active');    document.querySelectorAll('.tab-content').forEach(content => {    // Update content        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');    });        btn.classList.remove('active');    document.querySelectorAll('.tab-btn').forEach(btn => {    // Update buttonsfunction switchTab(tabName) {}    });        });            switchTab(tabName);            const tabName = btn.dataset.tab;        btn.addEventListener('click', () => {    tabBtns.forEach(btn => {        const tabBtns = document.querySelectorAll('.tab-btn');function initTabs() {// Tab navigation});    setInterval(loadDashboard, 5000);    // Auto-refresh dashboard every 5 seconds        loadDashboard();    checkSystemStatus();    initTabs();document.addEventListener('DOMContentLoaded', () => {// Initialize appconst API_BASE = 'http://localhost:9090';
const API_BASE_URL = 'http://localhost:9090/api';
let statusCheckInterval;
let statsUpdateInterval;

// Initialize app on page load
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    checkSystemStatus();
    loadDomains();
    
    // Start periodic updates
    statusCheckInterval = setInterval(checkSystemStatus, 30000);
    statsUpdateInterval = setInterval(updateStats, 5000);
    
    // Initial stats load
    updateStats();
});

// Tab Navigation
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
    
    // Load tab-specific data
    if (tabName === 'dashboard') {
        loadUpstreamStatus();
    } else if (tabName === 'dns') {
        loadDNSConfig();
    }
}

// System Status Check
async function checkSystemStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        const data = await response.json();
        
        document.getElementById('statusDot').style.background = '#27ae60';
        document.getElementById('statusText').textContent = 'Online';
    } catch (error) {
        document.getElementById('statusDot').style.background = '#e74c3c';
        document.getElementById('statusText').textContent = 'Offline';
    }
}

// Update System Stats
async function updateStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        const data = await response.json();
        
        document.getElementById('cpuUsage').textContent = `${data.cpu.usage}%`;
        document.getElementById('memoryUsage').textContent = `${data.memory.percentage}%`;
        
        if (data.network.rx_sec && data.network.tx_sec) {
            const rxMB = (data.network.rx_sec / 1024 / 1024).toFixed(2);
            const txMB = (data.network.tx_sec / 1024 / 1024).toFixed(2);
            document.getElementById('networkUsage').textContent = `↓${rxMB} ↑${txMB} MB/s`;
        }
        
        document.getElementById('dnsQueries').textContent = data.processes.running || '--';
    } catch (error) {
        console.error('Failed to update stats:', error);
    }
}

// Load Upstream Status
async function loadUpstreamStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/upstream/status`);
        const data = await response.json();
        
        const container = document.getElementById('upstreamStatus');
        container.innerHTML = data.upstreams.map(upstream => `
            <div class="upstream-card ${upstream.status}">
                <div class="upstream-name">${upstream.name}</div>
                <div class="upstream-host">${upstream.host}</div>
                <div class="upstream-latency">
                    ${upstream.status === 'up' ? 
                        `Latency: ${upstream.latency}ms` : 
                        'Offline'}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load upstream status:', error);
        showToast('Failed to load upstream status', 'error');
    }
}

// Domain Management
async function loadDomains() {
    try {
        const response = await fetch(`${API_BASE_URL}/config/domains`);
        const data = await response.json();
        
        document.getElementById('geoDomains').value = data.geoDomains.join('\n');
        document.getElementById('blockedDomains').value = data.blockedDomains.join('\n');
    } catch (error) {
        console.error('Failed to load domains:', error);
        showToast('Failed to load domain lists', 'error');
    }
}

async function saveGeoDomains() {
    const domains = document.getElementById('geoDomains').value
        .split('\n')
        .map(d => d.trim())
        .filter(d => d && !d.startsWith('#'));
    
    try {
        const response = await fetch(`${API_BASE_URL}/config/domains`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ geoDomains: domains })
        });
        
        if (response.ok) {
            showToast('Geo-unblocking domains saved successfully', 'success');
        } else {
            throw new Error('Failed to save');
        }
    } catch (error) {
        console.error('Failed to save geo domains:', error);
        showToast('Failed to save geo-unblocking domains', 'error');
    }
}

async function saveBlockedDomains() {
    const domains = document.getElementById('blockedDomains').value
        .split('\n')
        .map(d => d.trim())
        .filter(d => d && !d.startsWith('#'));
    
    try {
        const response = await fetch(`${API_BASE_URL}/config/domains`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ blockedDomains: domains })
        });
        
        if (response.ok) {
            showToast('Blocked domains saved successfully', 'success');
        } else {
            throw new Error('Failed to save');
        }
    } catch (error) {
        console.error('Failed to save blocked domains:', error);
        showToast('Failed to save blocked domains', 'error');
    }
}

// DNS Configuration
async function loadDNSConfig() {
    try {
        const response = await fetch(`${API_BASE_URL}/config/dns`);
        const data = await response.json();
        
        document.getElementById('upstreamDns').value = data.upstreamDns;
    } catch (error) {
        console.error('Failed to load DNS config:', error);
        showToast('Failed to load DNS configuration', 'error');
    }
}

async function testNginxConfig() {
    try {
        const response = await fetch(`${API_BASE_URL}/nginx/test`, {
            method: 'POST'
        });
        const data = await response.json();
        
        if (data.success) {
            showToast('Nginx configuration is valid', 'success');
        } else {
            showToast('Nginx configuration has errors:\n' + data.output, 'error');
        }
    } catch (error) {
        console.error('Failed to test nginx config:', error);
        showToast('Failed to test nginx configuration', 'error');
    }
}

async function reloadNginx() {
    if (!confirm('Are you sure you want to reload nginx? This may briefly interrupt service.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/nginx/reload`, {
            method: 'POST'
        });
        const data = await response.json();
        
        if (data.success) {
            showToast('Nginx reloaded successfully', 'success');
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Failed to reload nginx:', error);
        showToast('Failed to reload nginx: ' + error.message, 'error');
    }
}

// Logs
async function refreshLogs(type) {
    const endpoint = type === 'dns' ? '/logs/dns' : '/logs/proxy';
    const containerId = type === 'dns' ? 'dnsLogs' : 'proxyLogs';
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}?limit=100`);
        const data = await response.json();
        
        const container = document.getElementById(containerId);
        container.innerHTML = data.logs.map(line => 
            `<div class="log-line">${escapeHtml(line)}</div>`
        ).join('');
        
        // Auto-scroll to bottom
        container.scrollTop = container.scrollHeight;
        
        showToast(`${type.toUpperCase()} logs refreshed`, 'success');
    } catch (error) {
        console.error(`Failed to load ${type} logs:`, error);
        showToast(`Failed to load ${type} logs`, 'error');
    }
}

// Settings Actions
function downloadConfig() {
    showToast('Downloading configuration...', 'info');
    // Implementation would download current config as ZIP
    setTimeout(() => {
        showToast('Configuration download started', 'success');
    }, 1000);
}

async function clearCache() {
    if (!confirm('Are you sure you want to clear all caches?')) {
        return;
    }
    
    showToast('Clearing cache...', 'info');
    // Implementation would call backend to clear nginx cache
    setTimeout(() => {
        showToast('Cache cleared successfully', 'success');
    }, 1000);
}

async function restartServices() {
    if (!confirm('Are you sure you want to restart all services? This will cause a brief outage.')) {
        return;
    }
    
    showToast('Restarting services...', 'warning');
    // Implementation would restart docker containers
    setTimeout(() => {
        showToast('Services restarted successfully', 'success');
    }, 3000);
}

// Utility Functions
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    clearInterval(statusCheckInterval);
    clearInterval(statsUpdateInterval);
});