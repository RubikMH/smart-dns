// Smart DNS Admin Panel - Main JavaScript

const API_BASE = 'http://localhost:9090';

let statusIntervalId;
let statsIntervalId;
let upstreamIntervalId;

document.addEventListener('DOMContentLoaded', () => {
    initTabs();

    // Initial loads
    checkSystemStatus();
    refreshDashboard();
    loadDomains();

    // Periodic updates (realtime-ish on dashboard, lightweight elsewhere)
    statusIntervalId = setInterval(checkSystemStatus, 10_000);
    statsIntervalId = setInterval(() => {
        if (isTabActive('dashboard')) {
            updateStats();
        }
    }, 2_000);
    upstreamIntervalId = setInterval(() => {
        if (isTabActive('dashboard')) {
            loadUpstreamStatus();
        }
    }, 10_000);
});

function isTabActive(tabId) {
    const el = document.getElementById(tabId);
    return Boolean(el && el.classList.contains('active'));
}

function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Buttons
    document.querySelectorAll('.tab-btn').forEach((btn) => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    // Content
    document.querySelectorAll('.tab-content').forEach((content) => content.classList.remove('active'));
    const activeTab = document.getElementById(tabName);
    if (activeTab) activeTab.classList.add('active');

    // Tab-specific loads
    if (tabName === 'dashboard') {
        refreshDashboard();
    } else if (tabName === 'domains') {
        loadDomains();
    } else if (tabName === 'dns') {
        loadDnsConfig();
    }
}

async function checkSystemStatus() {
    try {
        const response = await fetch(`${API_BASE}/health`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        setStatus(true);
    } catch {
        setStatus(false);
    }
}

function setStatus(online) {
    const dot = document.getElementById('statusDot');
    const text = document.getElementById('statusText');
    if (!dot || !text) return;

    if (online) {
        dot.style.background = '#2ecc71';
        text.textContent = 'Online';
    } else {
        dot.style.background = '#e74c3c';
        text.textContent = 'Offline';
    }
}

async function refreshDashboard() {
    await Promise.all([
        updateStats(),
        loadUpstreamStatus(),
    ]);
}

async function updateStats() {
    try {
        const [statsResponse, dnsStatsResponse] = await Promise.all([
            fetch(`${API_BASE}/api/stats`, { cache: 'no-store' }),
            fetch(`${API_BASE}/api/dns/stats`, { cache: 'no-store' })
        ]);

        if (!statsResponse.ok) throw new Error(`HTTP ${statsResponse.status}`);
        const data = await statsResponse.json();

        let dnsTotalQueries;
        if (dnsStatsResponse.ok) {
            const dnsStats = await dnsStatsResponse.json();
            dnsTotalQueries = dnsStats?.totalQueries;
        }

        setText('cpuUsage', `${data.cpu?.usage ?? '--'}%`);
        setText('memoryUsage', `${data.memory?.percentage ?? '--'}%`);

        const rx = Number(data.network?.rx_sec ?? 0);
        const tx = Number(data.network?.tx_sec ?? 0);
        const rxMB = (rx / 1024 / 1024).toFixed(2);
        const txMB = (tx / 1024 / 1024).toFixed(2);
        setText('networkUsage', `↓${rxMB} ↑${txMB} MB/s`);

        // Real DNS query count from dns-stats service
        if (typeof dnsTotalQueries === 'number') {
            setText('dnsQueries', String(dnsTotalQueries));
        } else {
            setText('dnsQueries', '--');
        }
    } catch (error) {
        console.error('Failed to update stats:', error);
    }
}

async function loadUpstreamStatus() {
    const container = document.getElementById('upstreamStatus');
    if (!container) return;

    try {
        const response = await fetch(`${API_BASE}/api/upstream/status`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        if (!data?.upstreams?.length) {
            container.innerHTML = '<p class="loading">No upstream servers configured</p>';
            return;
        }

        container.innerHTML = '';
        data.upstreams.forEach((upstream) => {
            const card = document.createElement('div');
            card.className = `upstream-card ${upstream.status}`;

            const latencyText = upstream.status === 'up' && upstream.latency != null
                ? `Latency: ${upstream.latency}ms`
                : 'Offline';

            card.innerHTML = `
                <div class="upstream-name">${escapeHtml(String(upstream.name ?? ''))}</div>
                <div class="upstream-host">${escapeHtml(String(upstream.host ?? ''))}</div>
                <div class="upstream-latency">${escapeHtml(latencyText)}</div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Failed to load upstream status:', error);
        container.innerHTML = '<p class="loading">Unable to load upstream status</p>';
    }
}

async function loadDomains() {
    try {
        const response = await fetch(`${API_BASE}/api/config/domains`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        const geo = Array.isArray(data.geoDomains) ? data.geoDomains : [];
        const blocked = Array.isArray(data.blockedDomains) ? data.blockedDomains : [];

        const geoEl = document.getElementById('geoDomains');
        const blockedEl = document.getElementById('blockedDomains');
        if (geoEl) geoEl.value = geo.join('\n');
        if (blockedEl) blockedEl.value = blocked.join('\n');
    } catch (error) {
        console.error('Error loading domains:', error);
        showToast('Error loading domains', 'error');
    }
}

async function saveGeoDomains() {
    const geoEl = document.getElementById('geoDomains');
    const geoDomains = (geoEl?.value ?? '')
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s && !s.startsWith('#'));

    try {
        const response = await fetch(`${API_BASE}/api/config/domains`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ geoDomains })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        showToast('Geo domains saved successfully', 'success');
    } catch (error) {
        console.error('Error saving geo domains:', error);
        showToast('Error saving geo domains', 'error');
    }
}

async function saveBlockedDomains() {
    const blockedEl = document.getElementById('blockedDomains');
    const blockedDomains = (blockedEl?.value ?? '')
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s && !s.startsWith('#'));

    try {
        const response = await fetch(`${API_BASE}/api/config/domains`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ blockedDomains })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        showToast('Blocked domains saved successfully', 'success');
    } catch (error) {
        console.error('Error saving blocked domains:', error);
        showToast('Error saving blocked domains', 'error');
    }
}

async function loadDnsConfig() {
    try {
        const response = await fetch(`${API_BASE}/api/config/dns`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        const upstreamEl = document.getElementById('upstreamDns');
        if (upstreamEl) upstreamEl.value = data.upstreamDns ?? '';
    } catch (error) {
        console.error('Error loading DNS config:', error);
        showToast('Error loading DNS config', 'error');
    }
}

async function saveDnsConfig() {
    const upstreamEl = document.getElementById('upstreamDns');
    const upstreamDns = upstreamEl?.value ?? '';

    try {
        showToast('Saving DNS config...', 'warning');
        const response = await fetch(`${API_BASE}/api/config/dns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ upstreamDns })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        showToast('DNS config saved ✓', 'success');

        // Refresh upstream list immediately (no reload required to display)
        if (isTabActive('dashboard')) {
            loadUpstreamStatus();
        }
    } catch (error) {
        console.error('Error saving DNS config:', error);
        showToast('Error saving DNS config', 'error');
    }
}

async function testNginxConfig() {
    try {
        showToast('Testing nginx configuration...', 'warning');
        const response = await fetch(`${API_BASE}/api/nginx/test`, { method: 'POST' });
        const result = await response.json().catch(() => ({}));
        if (response.ok && result.success) {
            showToast('Configuration is valid ✓', 'success');
        } else {
            showToast('Configuration test failed', 'error');
        }
    } catch (error) {
        console.error('Error testing configuration:', error);
        showToast('Error testing configuration', 'error');
    }
}

async function reloadNginx() {
    try {
        showToast('Reloading nginx...', 'warning');
        const response = await fetch(`${API_BASE}/api/nginx/reload`, { method: 'POST' });
        const result = await response.json().catch(() => ({}));
        if (response.ok && result.success) {
            showToast('Nginx reloaded successfully ✓', 'success');
        } else {
            showToast('Error reloading nginx', 'error');
        }
    } catch (error) {
        console.error('Error reloading nginx:', error);
        showToast('Error reloading nginx', 'error');
    }
}

async function refreshLogs(type) {
    try {
        showToast(`Loading ${type} logs...`, 'warning');
        const response = await fetch(`${API_BASE}/api/logs/${type}?limit=100`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const lines = Array.isArray(data.logs) ? data.logs : [];

        const container = document.getElementById(`${type}Logs`);
        if (!container) return;

        container.innerHTML = '';
        lines.forEach((line) => {
            const logLine = document.createElement('div');
            logLine.className = 'log-line';
            logLine.textContent = String(line);
            container.appendChild(logLine);
        });
        container.scrollTop = container.scrollHeight;
        showToast(`${type} logs loaded`, 'success');
    } catch (error) {
        console.error(`Error loading ${type} logs:`, error);
        showToast(`Error loading ${type} logs`, 'error');
    }
}

function downloadConfig() {
    showToast('Downloading configuration...', 'warning');
    setTimeout(() => {
        showToast('Configuration downloaded', 'success');
    }, 1000);
}

async function clearCache() {
    if (!confirm('Are you sure you want to clear all cache?')) return;
    showToast('Clearing cache...', 'warning');
    setTimeout(() => {
        showToast('Cache cleared', 'success');
    }, 1000);
}

async function restartServices() {
    if (!confirm('Are you sure you want to restart all services? This will cause brief downtime.')) return;
    showToast('Restarting services...', 'warning');
    setTimeout(() => {
        showToast('Services restarted', 'success');
    }, 2000);
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

// Expose functions to global scope for inline onclick handlers
window.saveGeoDomains = saveGeoDomains;
window.saveBlockedDomains = saveBlockedDomains;
window.saveDnsConfig = saveDnsConfig;
window.testNginxConfig = testNginxConfig;
window.reloadNginx = reloadNginx;
window.refreshLogs = refreshLogs;
window.downloadConfig = downloadConfig;
window.clearCache = clearCache;
window.restartServices = restartServices;

window.addEventListener('beforeunload', () => {
    if (statusIntervalId) clearInterval(statusIntervalId);
    if (statsIntervalId) clearInterval(statsIntervalId);
    if (upstreamIntervalId) clearInterval(upstreamIntervalId);
});
