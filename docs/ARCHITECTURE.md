# Smart DNS Architecture

## Overview
Smart DNS is a comprehensive DNS and proxy solution built on nginx that provides geo-unblocking, content filtering, privacy protection, and load balancing capabilities.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Devices                        │
│   (Computers, Phones, Tablets, Smart TVs, Game Consoles)    │
└────────────┬──────────────────────────┬────────────────────┘
             │                          │
             │ DNS (Port 53)            │ HTTP/HTTPS Proxy
             │                          │ (Ports 8080/8443)
             ▼                          ▼
┌────────────────────────────────────────────────────────────┐
│                    Smart DNS Server                         │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Nginx Core                              │  │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────────────┐  │  │
│  │  │  Stream  │  │   HTTP   │  │  Admin Panel    │  │  │
│  │  │  Module  │  │  Module  │  │   (Port 8090)   │  │  │
│  │  │          │  │          │  │                 │  │  │
│  │  │ DNS Proxy│  │HTTP Proxy│  │  Web Interface  │  │  │
│  │  │  DoH/DoT │  │  Routes  │  │   API Backend   │  │  │
│  │  └──────────┘  └──────────┘  └─────────────────┘  │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │           Backend Services (Docker)                  │  │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────────────┐ │  │
│  │  │Admin API │ │DNS Stats │ │ Config Manager     │ │  │
│  │  │(Node.js) │ │ Service  │ │    Service         │ │  │
│  │  └──────────┘ └──────────┘ └────────────────────┘ │  │
│  │                                                      │  │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────────────┐ │  │
│  │  │WebSocket │ │SSL Mgr   │ │  Redis Cache       │ │  │
│  │  │ Server   │ │ Service  │ │                    │ │  │
│  │  └──────────┘ └──────────┘ └────────────────────┘ │  │
│  └─────────────────────────────────────────────────────┘  │
└──────────────┬────────────────────────┬───────────────────┘
               │                        │
               │ DNS Queries            │ HTTP/HTTPS Requests
               ▼                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Upstream Services                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │Cloudflare│ │  Google  │ │  Quad9   │ │   OpenDNS    │  │
│  │1.1.1.1   │ │ 8.8.8.8  │ │ 9.9.9.9  │ │208.67.222.222│  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Nginx Core
- **DNS Proxy (Stream Module)**
  - Handles DNS queries on UDP/TCP port 53
  - Routes to appropriate upstream DNS servers
  - Supports DNS over TLS (DoT) on port 853
  - Implements intelligent routing based on client IP, time, and geography

- **HTTP/HTTPS Proxy**
  - Handles web traffic on ports 8080/8443
  - Smart domain-based routing for geo-restricted content
  - SSL/TLS termination
  - Caching for performance optimization

- **DNS over HTTPS (DoH)**
  - RFC 8484 compliant DoH server on port 443
  - Supports both GET and POST methods
  - Provides secure DNS resolution over HTTPS

### 2. Backend Services

#### Admin API (Node.js/Express)
- **Port:** 9090
- **Purpose:** RESTful API for configuration management
- **Features:**
  - System statistics (CPU, memory, network)
  - Configuration file management
  - Log file access
  - Nginx control (test, reload)
  - Upstream server health monitoring

#### DNS Stats Service
- **Port:** 9091
- **Purpose:** DNS query statistics and analytics
- **Features:**
  - Query counting and categorization
  - Response time tracking
  - Most queried domains
  - Blocked query statistics

#### Config Manager Service
- **Port:** 9092
- **Purpose:** Dynamic configuration management
- **Features:**
  - Domain list management
  - Upstream server configuration
  - Routing rule management
  - Configuration validation

#### WebSocket Server
- **Port:** 9093
- **Purpose:** Real-time monitoring and updates
- **Features:**
  - Live log streaming
  - Real-time statistics
  - System event notifications
  - Dashboard updates

#### SSL Manager Service
- **Port:** 9094
- **Purpose:** SSL/TLS certificate management
- **Features:**
  - Certificate generation
  - Auto-renewal (Let's Encrypt integration ready)
  - Certificate status monitoring
  - SNI support

#### Redis Cache
- **Port:** 6379 (internal)
- **Purpose:** Caching and session management
- **Features:**
  - DNS query result caching
  - Session storage for admin interface
  - Rate limiting data
  - Temporary data storage

### 3. Admin Web Interface
- **Port:** 8090
- **Technology:** HTML5, CSS3, Vanilla JavaScript
- **Features:**
  - Dashboard with system overview
  - Domain management (geo-unblocking, blocking)
  - DNS configuration editor
  - Log viewer
  - Settings and system control

## Data Flow

### DNS Query Flow
```
1. Client → Smart DNS (Port 53)
2. Smart DNS applies routing rules
3. Smart DNS → Upstream DNS (1.1.1.1, 8.8.8.8, etc.)
4. Upstream DNS → Smart DNS (response)
5. Smart DNS → Client (response)
```

### HTTP Proxy Flow
```
1. Client → Smart DNS HTTP Proxy (Port 8080)
2. Smart DNS identifies domain
3. Smart DNS applies geo-routing rules
4. Smart DNS → Target Server (with appropriate headers)
5. Target Server → Smart DNS (response)
6. Smart DNS → Client (response)
```

### DoH Flow
```
1. Client → Smart DNS HTTPS (Port 443 /dns-query)
2. Smart DNS → Upstream DoH Server (cloudflare-dns.com)
3. Upstream DoH → Smart DNS (DNS response over HTTPS)
4. Smart DNS → Client (DNS response)
```

## Routing Logic

### DNS Routing Decision Tree
```
┌─────────────────────┐
│  DNS Query Received │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────┐     Yes    ┌──────────────────┐
│ Domain in blocklist? ├───────────►│ Return NXDOMAIN  │
└──────────┬───────────┘            └──────────────────┘
           │ No
           ▼
┌──────────────────────┐     Yes    ┌──────────────────┐
│ Domain in geo-list?  ├───────────►│Use geo_dns_backends│
└──────────┬───────────┘            └──────────────────┘
           │ No
           ▼
┌──────────────────────┐     Match  ┌──────────────────┐
│ Client IP routing?   ├───────────►│Use client_upstream│
└──────────┬───────────┘            └──────────────────┘
           │ No match
           ▼
┌──────────────────────┐
│ Use dns_backends     │
│ (default)            │
└──────────────────────┘
```

## Security Features

1. **Rate Limiting**
   - API endpoint protection
   - DNS query rate limiting
   - Per-client limits

2. **Access Control**
   - Admin interface IP whitelisting
   - Authentication (optional)
   - Private network restrictions

3. **SSL/TLS**
   - DoH encryption
   - DoT encryption
   - Admin interface HTTPS
   - Configurable cipher suites

4. **Content Filtering**
   - Ad blocking
   - Malware domain blocking
   - Family-safe filtering
   - Custom blocklists

## Scalability

### Horizontal Scaling
- Multiple nginx instances with load balancer
- Shared Redis for state synchronization
- Database backend for configuration (optional)

### Vertical Scaling
- Worker process tuning
- Connection limits optimization
- Cache size adjustment
- Memory allocation

## Monitoring

### Metrics Collected
- DNS query rate
- Response times
- Cache hit ratio
- Upstream server health
- System resources (CPU, memory, network)
- Error rates

### Monitoring Stack (Optional)
- Prometheus for metrics collection
- Grafana for visualization
- Alert Manager for notifications
- Log aggregation with ELK stack

## Deployment Options

### 1. Docker Compose (Recommended)
- Easy setup and management
- Service isolation
- Auto-restart capabilities
- Volume management

### 2. Standalone Installation
- Direct nginx installation
- Systemd service management
- Manual configuration
- Better performance (no containerization overhead)

### 3. Kubernetes
- Production-grade orchestration
- Auto-scaling
- High availability
- Rolling updates

## Configuration Files

```
smart-dns/
├── nginx/
│   ├── nginx.conf                 # Main nginx configuration
│   └── conf.d/
│       ├── upstream-dns.conf      # DNS upstream servers
│       ├── upstream-http.conf     # HTTP upstream servers
│       ├── dns-routing.conf       # DNS routing rules
│       ├── doh-server.conf        # DoH server config
│       ├── proxy-server.conf      # HTTP proxy config
│       └── admin-server.conf      # Admin interface config
├── config/
│   ├── geo-domains.conf           # Geo-unblocking domains
│   └── blocked-domains.conf       # Blocked domains
└── docker-compose.yml             # Service orchestration
```

## Performance Considerations

- **DNS Caching:** Reduces upstream queries
- **Connection Pooling:** Reuses connections to upstreams
- **Worker Processes:** Auto-tuned to CPU cores
- **Event-Driven:** Non-blocking I/O for high concurrency
- **HTTP/2:** Multiplexed connections for DoH

## License
MIT License