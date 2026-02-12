// Activity monitoring for Smart DNS Admin Panel
const ACTIVITY_API_BASE = 'http://localhost:9090';

// Load recent activity
async function loadRecentActivity() {
    try {
        const response = await fetch(`${ACTIVITY_API_BASE}/api/activity/recent`);
        const data = await response.json();
        
        const container = document.getElementById('recentActivity');
        if (!data.activities || data.activities.length === 0) {
            container.innerHTML = '<p class="loading">No recent activity</p>';
            return;
        }
        
        container.innerHTML = '';
        data.activities.forEach(activity => {
            const item = document.createElement('div');
            item.className = `activity-item ${activity.type}`;
            
            const iconMap = {
                'dns': '🌐',
                'query': '🔍',
                'client': '👤',
                'system': '✅',
                'check': '✓',
                'user': '👥'
            };
            
            const icon = iconMap[activity.icon] || '📝';
            const time = new Date(activity.timestamp).toLocaleTimeString();
            
            item.innerHTML = `
                <span class="activity-icon">${icon}</span>
                <span class="activity-message">${activity.message}</span>
                <span class="activity-time">${time}</span>
            `;
            container.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading recent activity:', error);
        const container = document.getElementById('recentActivity');
        container.innerHTML = '<p class="loading">Unable to load activity</p>';
    }
}

// Initialize activity loading
document.addEventListener('DOMContentLoaded', function() {
    // Load activity initially
    setTimeout(() => {
        loadRecentActivity();
        // Refresh every 30 seconds
        setInterval(loadRecentActivity, 30000);
    }, 1000);
});
