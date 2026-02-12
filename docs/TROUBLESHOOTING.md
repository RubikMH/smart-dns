# Troubleshooting Guide

## Common Issues and Solutions

### Port 53 Already in Use (macOS)

**Error:**
```
Error response from daemon: ports are not available: exposing port UDP 0.0.0.0:53 -> 127.0.0.1:0: listen udp 0.0.0.0:53: bind: address already in use
```

**Cause:** macOS has a built-in DNS service running on port 53.

**Solutions:**

#### Option 1: Use Alternative Port (Recommended for macOS)
Use port 5353 instead of 53 for DNS:

```bash
# Stop any running containers
docker-compose down

# Use the alternative port configuration
cp docker-compose.yml docker-compose.yml.backup
cp docker-compose.alt-ports.yml docker-compose.yml

# Start services
docker-compose up -d
```

Then configure your devices to use port 5353:
```bash
# Test DNS on alternative port
dig @localhost -p 5353 google.com
```

#### Option 2: Disable macOS DNS Responder (Advanced)
⚠️ **Warning:** This may affect other system services.

```bash
# Stop macOS DNS responder
sudo launchctl unload -w /System/Library/LaunchDaemons/com.apple.mDNSResponder.plist

# Start Smart DNS
docker-compose up -d

# To re-enable later:
sudo launchctl load -w /System/Library/LaunchDaemons/com.apple.mDNSResponder.plist
```

#### Option 3: Use Network Mode (Docker Desktop for Mac)
Requires Docker Desktop with proper networking:

```bash
# Edit docker-compose.yml
# Change network_mode to "host" for smart-dns-nginx service
# Note: This may not work on all macOS versions
```

#### Option 4: Route Through Another Service
Use dnsmasq or similar to forward to Smart DNS on alternative port:

```bash
# Install dnsmasq
brew install dnsmasq

# Configure dnsmasq to forward to localhost:5353
echo "server=127.0.0.1#5353" >> /usr/local/etc/dnsmasq.conf

# Start dnsmasq
sudo brew services start dnsmasq
```

### Identifying What's Using Port 53

```bash
# macOS/Linux
sudo lsof -i :53

# See all listening processes
sudo netstat -an | grep :53
```

Common services using port 53:
- macOS mDNSResponder (system DNS)
- dnsmasq
- systemd-resolved (Linux)
- Another Docker container
- Local DNS server (bind9, unbound, etc.)

### Other Common Issues

#### Cannot Access Admin Panel (Port 8090)

**Check if service is running:**
```bash
docker-compose ps
curl http://localhost:9090/health
```

**Solutions:**
- Restart admin-backend: `docker-compose restart admin-backend`
- Check logs: `docker-compose logs admin-backend`
- Verify port not in use: `lsof -i :8090`

#### Nginx Configuration Errors

**Test configuration:**
```bash
docker-compose exec smart-dns-nginx nginx -t
```

**View errors:**
```bash
docker-compose logs smart-dns-nginx
```

**Common issues:**
- Missing SSL certificates: Run `make ssl` first
- Syntax errors in .conf files
- Upstream servers unreachable

#### SSL Certificate Issues

**Generate new certificates:**
```bash
make ssl
# or
./scripts/generate-ssl.sh
```

**Check certificate validity:**
```bash
openssl x509 -in ssl/server.crt -noout -dates
```

#### Docker Permission Issues

**Error:** "permission denied while trying to connect to Docker daemon"

**Solutions:**
```bash
# Add user to docker group (Linux)
sudo usermod -aG docker $USER
newgrp docker

# macOS: Ensure Docker Desktop is running
open -a Docker

# Use sudo (temporary fix)
sudo docker-compose up -d
```

#### DNS Resolution Not Working

**Test DNS manually:**
```bash
# Test on standard port
dig @localhost google.com

# Test on alternative port
dig @localhost -p 5353 google.com

# Test with nslookup
nslookup google.com localhost
```

**Check upstream connectivity:**
```bash
ping 1.1.1.1
ping 8.8.8.8
```

**Solutions:**
- Verify nginx is running: `docker-compose ps`
- Check firewall settings
- Ensure upstream DNS servers are reachable
- Check DNS routing config in `nginx/conf.d/dns-routing.conf`

#### Services Won't Start

**View all logs:**
```bash
docker-compose logs
```

**Check individual service:**
```bash
docker-compose logs smart-dns-nginx
docker-compose logs admin-backend
```

**Rebuild containers:**
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

#### High CPU/Memory Usage

**Check resource usage:**
```bash
docker stats
```

**Solutions:**
- Reduce nginx worker processes in `nginx/nginx.conf`
- Decrease cache sizes
- Limit worker connections
- Check for DNS query loops
- Review blocked domain lists (very large lists can impact performance)

#### GeoIP Database Missing

**Error:** Cannot load GeoIP database

**Solution:**
```bash
# Download GeoIP databases
sudo mkdir -p /usr/share/GeoIP
cd /usr/share/GeoIP

# Free databases (legacy format)
wget http://geolite.maxmind.com/download/geoip/database/GeoLiteCountry/GeoIP.dat.gz
gunzip GeoIP.dat.gz

wget http://geolite.maxmind.com/download/geoip/database/GeoLiteCity.dat.gz
gunzip GeoLiteCity.dat.gz
```

### Platform-Specific Issues

#### macOS
- Port 53 conflicts with mDNSResponder
- May need to use alternative ports
- Docker Desktop networking limitations

#### Linux
- systemd-resolved may use port 53
- Requires root/sudo for port 53
- Firewall (ufw/firewalld) may block ports

#### Windows
- WSL2 networking may need configuration
- Windows Defender Firewall rules
- Use Docker Desktop with WSL2 backend

### Getting Help

If you're still having issues:

1. **Check logs:** `docker-compose logs -f`
2. **Test configuration:** `make test` or `./scripts/test.sh`
3. **Review documentation:** See `docs/` directory
4. **Report issue:** https://github.com/RubikMH/smart-dns/issues

Include in your report:
- Operating system and version
- Docker and Docker Compose versions
- Full error message
- Output of `docker-compose ps`
- Relevant logs from `docker-compose logs`