# Quick Start Guide

## Prerequisites
- Docker and Docker Compose installed
- Ports 53, 80, 443, 853, 8080, 8090 available
- Root/sudo access (for port 53)

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/RubikMH/smart-dns.git
cd smart-dns
```

### 2. Create SSL Certificates
```bash
# Create ssl directory
mkdir -p ssl

# Generate self-signed certificate (or use your own)
openssl req -x509 -newkey rsa:2048 -nodes \
    -keyout ssl/server.key \
    -out ssl/server.crt \
    -days 365 \
    -subj "/C=US/ST=State/L=City/O=SmartDNS/CN=localhost"

chmod 600 ssl/server.key
chmod 644 ssl/server.crt
```

### 3. Create Required Directories
```bash
mkdir -p logs
mkdir -p web
chmod 755 logs
```

### 4. Start Services
```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 5. Access Admin Panel
Open your browser and navigate to:
```
http://localhost:8090
```

## Configuration

### Configure Your Devices

#### Method 1: Manual DNS Configuration
1. Go to your network settings
2. Set DNS server to your Smart DNS server IP
3. Save and test

**Example (macOS):**
```bash
networksetup -setdnsservers Wi-Fi <your-server-ip>
```

**Example (Linux):**
```bash
# Edit /etc/resolv.conf
nameserver <your-server-ip>
```

**Example (Windows):**
```
Control Panel → Network → Change Adapter Settings
→ Right-click adapter → Properties → IPv4
→ Use the following DNS server addresses
```

#### Method 2: Router Configuration
Configure your router's DHCP settings to use your Smart DNS server as the primary DNS.

### Custom Domains

#### Add Geo-Unblocking Domains
Edit `config/geo-domains.conf` and add domains:
```
netflix.com
*.netflix.com
hulu.com
*.hulu.com
```

Or use the admin panel → Domains tab.

#### Add Blocked Domains
Edit `config/blocked-domains.conf`:
```
ads.example.com
tracker.example.com
```

## Testing

### Test DNS Resolution
```bash
# Test basic DNS
dig @localhost google.com

# Test DoH (DNS over HTTPS)
curl -H "accept: application/dns-message" \
     "https://localhost/dns-query?dns=AAABAAABAAAAAAAAA3d3dwdleGFtcGxlA2NvbQAAAQAB"

# Test specific domain
nslookup netflix.com localhost
```

### Test HTTP Proxy
Configure your browser to use proxy:
- HTTP Proxy: localhost:8080
- HTTPS Proxy: localhost:8443

### Check Logs
```bash
# View all logs
docker-compose logs

# View specific service
docker-compose logs smart-dns-nginx

# Follow logs in real-time
docker-compose logs -f smart-dns-nginx
```

## Common Tasks

### Update Domain Lists
```bash
# Edit geo domains
nano config/geo-domains.conf

# Edit blocked domains
nano config/blocked-domains.conf

# Reload nginx to apply changes
docker-compose exec smart-dns-nginx nginx -s reload
```

### Restart Services
```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart smart-dns-nginx
```

### View Statistics
```bash
# Access admin panel
http://localhost:8090

# Or use API directly
curl http://localhost:9090/api/stats
```

### Backup Configuration
```bash
# Create backup
tar -czf smart-dns-backup-$(date +%Y%m%d).tar.gz \
    config/ \
    nginx/conf.d/ \
    ssl/

# Restore from backup
tar -xzf smart-dns-backup-YYYYMMDD.tar.gz
```

## Troubleshooting

### Port 53 Permission Denied
```bash
# On Linux, allow docker to bind to port 53
sudo setcap 'cap_net_bind_service=+ep' /usr/bin/docker

# Or run with sudo
sudo docker-compose up -d
```

### DNS Not Working
```bash
# Check if nginx is running
docker-compose ps

# Check nginx logs
docker-compose logs smart-dns-nginx

# Test nginx config
docker-compose exec smart-dns-nginx nginx -t

# Restart nginx
docker-compose restart smart-dns-nginx
```

### Admin Panel Not Loading
```bash
# Check if admin backend is running
docker-compose ps admin-backend

# Check logs
docker-compose logs admin-backend

# Verify port 9090 is accessible
curl http://localhost:9090/health
```

### DNS Queries Timing Out
```bash
# Check upstream connectivity
ping 1.1.1.1
ping 8.8.8.8

# Check nginx stream module
docker-compose logs smart-dns-nginx | grep -i dns

# Verify port 53 is open
sudo netstat -tulpn | grep :53
```

## Advanced Configuration

### Add Custom Upstream DNS
Edit `nginx/conf.d/upstream-dns.conf`:
```nginx
upstream custom_dns_backends {
    server your-dns-server:53 weight=5;
    server backup-dns-server:53 weight=3;
}
```

### Configure GeoIP Routing
1. Download GeoIP databases (see installation script)
2. Edit `nginx/conf.d/dns-routing.conf`
3. Add country-specific routing rules

### Enable Monitoring (Prometheus + Grafana)
```bash
# Start with monitoring profile
docker-compose --profile monitoring up -d

# Access Grafana
http://localhost:3000
# Default credentials: admin/admin123
```

### SSL Certificate from Let's Encrypt
```bash
# Install certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone \
    -d your-domain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/server.crt
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/server.key

# Restart services
docker-compose restart
```

## Security Recommendations

1. **Change Default Passwords**
   - Update admin panel authentication
   - Use strong passwords

2. **Firewall Configuration**
   - Allow only necessary ports
   - Restrict admin panel to trusted IPs

3. **SSL Certificates**
   - Use valid SSL certificates for production
   - Enable HSTS headers

4. **Regular Updates**
   - Keep Docker images updated
   - Update blocked domain lists
   - Monitor security advisories

## Performance Tuning

### For High Traffic
Edit `nginx/nginx.conf`:
```nginx
worker_processes auto;
worker_connections 4096;
```

### For Low Resources
Reduce cache sizes in config files and limit worker processes.

## Getting Help

- **Documentation:** Check [ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Issues:** Report on [GitHub Issues](https://github.com/RubikMH/smart-dns/issues)
- **Logs:** Always include logs when reporting issues

## Next Steps

- Customize domain lists for your needs
- Set up monitoring dashboards
- Configure your router to use Smart DNS
- Add additional upstream DNS providers
- Implement backup and monitoring