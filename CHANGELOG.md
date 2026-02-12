# Changelog

All notable changes to Smart DNS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-12

### Added
- Initial release of Smart DNS
- DNS proxy server with nginx stream module
- HTTP/HTTPS smart proxy for geo-unblocking
- DNS over HTTPS (DoH) support - RFC 8484 compliant
- DNS over TLS (DoT) support on port 853
- Multiple upstream DNS provider support:
  - Cloudflare (1.1.1.1)
  - Google (8.8.8.8)
  - Quad9 (9.9.9.9)
  - OpenDNS (208.67.222.222)
  - AdGuard (94.140.14.14)
- Smart DNS routing based on:
  - Client IP address
  - Geographic location (GeoIP)
  - Time of day
  - Domain patterns
- Content filtering and ad-blocking
- Domain blocking for malware and unwanted content
- Family-safe DNS filtering options
- Web-based admin panel with:
  - Real-time system statistics
  - Domain management interface
  - Configuration editor
  - Log viewer
  - Service control
- Backend API services:
  - Admin API (Node.js/Express)
  - DNS statistics service
  - Configuration manager
  - WebSocket server for real-time updates
  - SSL certificate manager
- Docker Compose setup for easy deployment
- Redis caching for improved performance
- Comprehensive logging system
- SSL/TLS support with self-signed certificates
- Rate limiting for security
- Load balancing across upstream servers
- Health monitoring for upstream servers
- Optional Prometheus & Grafana monitoring
- Installation scripts for various platforms
- Comprehensive documentation

### Features
- **Geo-Unblocking**: Access geo-restricted streaming services
- **Privacy Protection**: Route through privacy-focused DNS providers
- **Ad Blocking**: Block ads and trackers at DNS level
- **Content Filtering**: Family-safe and custom filtering options
- **High Performance**: nginx-powered with caching
- **Easy Management**: Web-based admin interface
- **Docker Support**: Quick deployment with Docker Compose
- **Monitoring**: Built-in statistics and optional Prometheus integration
- **Flexibility**: Highly configurable with multiple routing options

### Documentation
- README with feature overview
- Quick start guide
- Architecture documentation
- Contributing guidelines
- Installation guide for multiple platforms
- Configuration examples

### Infrastructure
- Docker containerization for all services
- Health checks for reliability
- Automated SSL certificate generation
- Log rotation support
- Backup and restore capabilities

## Future Plans

### [1.1.0] - Planned
- Let's Encrypt integration for automatic SSL certificates
- Enhanced GeoIP database with automatic updates
- DNS-over-QUIC (DoQ) support
- Improved admin dashboard with charts
- Mobile-responsive admin interface
- API authentication and user management
- Enhanced caching mechanisms
- Performance metrics and analytics

### [1.2.0] - Planned
- Kubernetes deployment support
- Multi-region DNS routing
- Custom DNS record management
- Integration with popular home automation platforms
- Machine learning for intelligent routing
- Advanced threat protection
- CDN integration

### [2.0.0] - Future
- Distributed deployment support
- Anycast DNS implementation
- Advanced DDoS protection
- Custom plugin system
- Professional monitoring integration
- Enterprise features

---

For detailed information about each release, see the [GitHub Releases](https://github.com/RubikMH/smart-dns/releases) page.