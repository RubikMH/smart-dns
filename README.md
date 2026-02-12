# Smart DNS with Nginx

A comprehensive smart DNS solution using nginx that provides:
- 🌍 **Geo-unblocking** - Access geo-restricted content
- ⚖️ **Load balancing** - Distribute DNS queries across multiple providers  
- 🛡️ **Content filtering** - Block unwanted domains and ads
- 🔒 **Privacy & security** - Route through secure DNS providers
- 🚀 **High performance** - Nginx-powered with caching
- 📊 **Monitoring** - Built-in logging and metrics

## Features

### Core Capabilities
- **DNS Proxy Server** - Route DNS queries through nginx stream module
- **HTTP/HTTPS Proxy** - Smart domain-based routing for web traffic
- **DNS over HTTPS (DoH)** - Secure DNS queries over HTTPS
- **DNS over TLS (DoT)** - Encrypted DNS queries over TLS
- **GeoIP Routing** - Route domains based on geographic location
- **Domain Blocking** - Block ads, malware, and unwanted content
- **Upstream Rotation** - Automatic failover between DNS providers

### Supported DNS Providers
- Cloudflare (1.1.1.1 / 1.0.0.1)
- Google (8.8.8.8 / 8.8.4.4)
- Quad9 (9.9.9.9 / 149.112.112.112)
- OpenDNS (208.67.222.222 / 208.67.220.220)
- AdGuard (94.140.14.14 / 94.140.15.15)
- Custom DNS servers

## Quick Start

### Using Docker (Recommended)
```bash
# Clone and start
git clone https://github.com/RubikMH/smart-dns.git
cd smart-dns
docker-compose up -d

# If you get "port 53 already in use" error (common on macOS):
./scripts/fix-port-conflict.sh

# Configure your devices to use:
# DNS: localhost:53 (or localhost:5353 if using alternative ports)
# HTTP Proxy: localhost:8080
```

### Manual Installation
```bash
# Install nginx with stream module
./scripts/install.sh

# Start services
sudo systemctl start nginx
sudo systemctl start smart-dns

# Configure DNS on your devices to point to your server
```

## Configuration

### Basic Setup
1. Edit `config/domains.conf` - Add domains for geo-unblocking
2. Edit `config/blocked-domains.conf` - Add domains to block
3. Edit `config/upstream-dns.conf` - Configure DNS providers
4. Restart services: `docker-compose restart`

### Advanced Configuration
- **GeoIP routing**: Edit `config/geoip-rules.conf`
- **Custom upstream servers**: Edit `nginx/upstream.conf`
- **SSL certificates**: Place in `ssl/` directory
- **Monitoring**: Configure in `config/monitoring.conf`

## Project Structure
See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture information.

## License
MIT License - see [LICENSE](LICENSE)