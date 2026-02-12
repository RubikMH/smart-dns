# Project Structure

```
smart-dns/
│
├── README.md                      # Main documentation
├── LICENSE                        # MIT License
├── CHANGELOG.md                   # Version history
├── CONTRIBUTING.md                # Contribution guidelines
├── Makefile                       # Build automation
├── docker-compose.yml             # Service orchestration
├── .gitignore                     # Git ignore rules
│
├── nginx/                         # Nginx configurations
│   ├── nginx.conf                 # Main nginx config
│   └── conf.d/                    # Additional configs
│       ├── upstream-dns.conf      # DNS upstream servers
│       ├── upstream-http.conf     # HTTP upstream servers
│       ├── dns-routing.conf       # DNS routing rules
│       ├── doh-server.conf        # DNS over HTTPS
│       ├── proxy-server.conf      # HTTP/HTTPS proxy
│       └── admin-server.conf      # Admin panel server
│
├── config/                        # Application configuration
│   ├── geo-domains.conf           # Geo-unblocking domains
│   └── blocked-domains.conf       # Blocked domains list
│
├── admin-backend/                 # Admin API service
│   ├── Dockerfile                 # Container definition
│   ├── package.json               # Node.js dependencies
│   └── server.js                  # Express API server
│
├── dns-stats/                     # DNS statistics service
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
│
├── config-manager/                # Configuration manager
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
│
├── websocket-server/              # WebSocket service
│   ├── Dockerfile
│   └── server.js
│
├── ssl-manager/                   # SSL certificate manager
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
│
├── web/                           # Admin web interface
│   ├── index.html                 # Main HTML
│   ├── css/
│   │   └── style.css              # Styles
│   └── js/
│       └── app.js                 # JavaScript logic
│
├── docs/                          # Documentation
│   ├── ARCHITECTURE.md            # System architecture
│   └── QUICK_START.md             # Quick start guide
│
├── scripts/                       # Helper scripts
│   ├── setup.sh                   # Quick setup script
│   ├── install.sh                 # Full installation
│   └── test.sh                    # Testing script
│
├── monitoring/                    # Monitoring configs
│   └── prometheus.yml             # Prometheus config
│
├── ssl/                           # SSL certificates
│   └── .gitkeep                   # (certificates go here)
│
└── logs/                          # Log files
    └── .gitkeep                   # (logs go here)
```

## Key Components

### Core Services
- **nginx**: Main DNS and HTTP proxy server
- **admin-backend**: RESTful API for management
- **dns-stats**: DNS query statistics
- **config-manager**: Configuration file management
- **websocket-server**: Real-time updates
- **ssl-manager**: SSL certificate management

### Optional Services
- **redis**: Caching layer
- **prometheus**: Metrics collection
- **grafana**: Visualization dashboards

## Port Mapping

| Service | Port | Description |
|---------|------|-------------|
| DNS | 53 | DNS queries (UDP/TCP) |
| HTTP | 80 | HTTP traffic |
| HTTPS/DoH | 443 | HTTPS and DNS over HTTPS |
| DoT | 853 | DNS over TLS |
| HTTP Proxy | 8080 | HTTP proxy |
| HTTPS Proxy | 8443 | HTTPS proxy |
| Admin Panel | 8090 | Web management interface |
| Admin API | 9090 | Backend API |
| DNS Stats | 9091 | Statistics service |
| Config Manager | 9092 | Configuration API |
| WebSocket | 9093 | Real-time updates |
| SSL Manager | 9094 | Certificate management |

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/RubikMH/smart-dns.git
   cd smart-dns
   ```

2. **Quick setup**
   ```bash
   make setup
   # or
   ./scripts/setup.sh
   ```

3. **Start services**
   ```bash
   make start
   # or
   docker-compose up -d
   ```

4. **Access admin panel**
   ```
   http://localhost:8090
   ```

## Management Commands

```bash
make setup      # Initial setup
make start      # Start all services
make stop       # Stop all services
make restart    # Restart all services
make logs       # View logs
make status     # Show status
make test       # Run tests
make backup     # Backup configuration
```

For detailed documentation, see the [docs](./docs) directory.