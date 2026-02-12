#!/bin/bash

# Smart DNS Installation Script
# Installs and configures Smart DNS with nginx

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SMART_DNS_DIR="/opt/smart-dns"
NGINX_USER="nginx"
LOG_DIR="/var/log/nginx"

echo -e "${BLUE}🚀 Smart DNS Installation Script${NC}"
echo "================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root (use sudo)${NC}"
    exit 1
fi

# Detect OS
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
    else
        echo -e "${RED}❌ Cannot detect OS${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Detected OS: $OS $VER${NC}"
}

# Install dependencies based on OS
install_dependencies() {
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    
    case $OS in
        *"Ubuntu"*|*"Debian"*)
            apt update
            apt install -y nginx-full curl wget docker.io docker-compose git openssl
            systemctl enable docker
            systemctl start docker
            ;;
        *"CentOS"*|*"Red Hat"*|*"Fedora"*)
            yum update -y
            yum install -y nginx curl wget docker docker-compose git openssl
            systemctl enable docker
            systemctl start docker
            ;;
        *"Alpine"*)
            apk update
            apk add nginx curl wget docker docker-compose git openssl
            rc-update add docker
            service docker start
            ;;
        *)
            echo -e "${RED}❌ Unsupported OS: $OS${NC}"
            exit 1
            ;;
    esac
    
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

# Create directory structure
create_directories() {
    echo -e "${YELLOW}📁 Creating directory structure...${NC}"
    
    mkdir -p "$SMART_DNS_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p /etc/nginx/conf.d
    mkdir -p /var/www/smart-dns-admin
    mkdir -p /etc/nginx/ssl
    
    # Set permissions
    chown -R $NGINX_USER:$NGINX_USER "$LOG_DIR"
    chmod 755 "$SMART_DNS_DIR"
    
    echo -e "${GREEN}✅ Directories created${NC}"
}

# Generate SSL certificates
generate_ssl_certs() {
    echo -e "${YELLOW}🔐 Generating SSL certificates...${NC}"
    
    SSL_DIR="/etc/nginx/ssl"
    
    # Generate private key
    openssl genrsa -out "$SSL_DIR/server.key" 2048
    
    # Generate certificate
    openssl req -new -x509 -key "$SSL_DIR/server.key" -out "$SSL_DIR/server.crt" -days 365 -subj "/C=US/ST=State/L=City/O=SmartDNS/CN=localhost"
    
    # Set permissions
    chmod 600 "$SSL_DIR/server.key"
    chmod 644 "$SSL_DIR/server.crt"
    chown $NGINX_USER:$NGINX_USER "$SSL_DIR"/*
    
    echo -e "${GREEN}✅ SSL certificates generated${NC}"
}

# Configure nginx
configure_nginx() {
    echo -e "${YELLOW}⚙️  Configuring nginx...${NC}"
    
    # Enable stream module (if available)
    if [ -f /etc/nginx/modules-enabled/50-mod-stream.conf ]; then
        ln -sf /usr/share/nginx/modules-available/mod-stream.conf /etc/nginx/modules-enabled/50-mod-stream.conf
    fi
    
    # Test nginx configuration
    nginx -t
    
    # Enable and start nginx
    systemctl enable nginx
    systemctl restart nginx
    
    echo -e "${GREEN}✅ Nginx configured and started${NC}"
}

# Configure firewall  
configure_firewall() {
    echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
    
    if command -v ufw &> /dev/null; then
        # Ubuntu/Debian UFW
        ufw allow 53/udp
        ufw allow 53/tcp
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw allow 853/tcp
        ufw allow 8080/tcp
        ufw allow 8090/tcp
    elif command -v firewall-cmd &> /dev/null; then
        # CentOS/RHEL/Fedora firewalld
        firewall-cmd --permanent --add-port=53/udp
        firewall-cmd --permanent --add-port=53/tcp
        firewall-cmd --permanent --add-port=80/tcp
        firewall-cmd --permanent --add-port=443/tcp
        firewall-cmd --permanent --add-port=853/tcp
        firewall-cmd --permanent --add-port=8080/tcp
        firewall-cmd --permanent --add-port=8090/tcp
        firewall-cmd --reload
    fi
    
    echo -e "${GREEN}✅ Firewall configured${NC}"
}

# Download GeoIP databases
setup_geoip() {
    echo -e "${YELLOW}🌍 Setting up GeoIP databases...${NC}"
    
    GEOIP_DIR="/usr/share/GeoIP"
    mkdir -p "$GEOIP_DIR"
    
    # Download free GeoIP databases
    cd "$GEOIP_DIR"
    
    if ! [ -f "GeoIP.dat" ]; then
        wget -q "http://geolite.maxmind.com/download/geoip/database/GeoLiteCountry/GeoIP.dat.gz"
        gunzip GeoIP.dat.gz
    fi
    
    if ! [ -f "GeoLiteCity.dat" ]; then
        wget -q "http://geolite.maxmind.com/download/geoip/database/GeoLiteCity.dat.gz"  
        gunzip GeoLiteCity.dat.gz
    fi
    
    echo -e "${GREEN}✅ GeoIP databases installed${NC}"
}

# Create systemd service
create_service() {
    echo -e "${YELLOW}🔧 Creating systemd service...${NC}"
    
    cat > /etc/systemd/system/smart-dns.service << EOF
[Unit]
Description=Smart DNS Service
After=network.target nginx.service docker.service
Requires=nginx.service

[Service]
Type=forking
ExecStart=/usr/bin/docker-compose -f $SMART_DNS_DIR/docker-compose.yml up -d
ExecStop=/usr/bin/docker-compose -f $SMART_DNS_DIR/docker-compose.yml down
WorkingDirectory=$SMART_DNS_DIR
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable smart-dns
    
    echo -e "${GREEN}✅ Systemd service created${NC}"
}

# Create management script
create_management_script() {
    echo -e "${YELLOW}🛠️  Creating management script...${NC}"
    
    cat > /usr/local/bin/smart-dns << 'EOF'
#!/bin/bash

SMART_DNS_DIR="/opt/smart-dns"
cd "$SMART_DNS_DIR"

case $1 in
    start)
        echo "Starting Smart DNS..."
        systemctl start smart-dns
        ;;
    stop)
        echo "Stopping Smart DNS..."
        systemctl stop smart-dns
        ;;
    restart)
        echo "Restarting Smart DNS..."
        systemctl restart smart-dns
        ;;
    status)
        systemctl status smart-dns
        docker-compose ps
        ;;
    logs)
        docker-compose logs -f ${2:-}
        ;;
    update)
        echo "Updating Smart DNS..."
        git pull
        docker-compose pull
        docker-compose up -d
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|update}"
        echo ""
        echo "Examples:"
        echo "  smart-dns start    - Start all services"
        echo "  smart-dns logs     - Show all logs"
        echo "  smart-dns logs nginx - Show nginx logs only"
        exit 1
        ;;
esac
EOF

    chmod +x /usr/local/bin/smart-dns
    
    echo -e "${GREEN}✅ Management script created${NC}"
}

# Main installation process
main() {
    echo -e "${BLUE}Starting installation...${NC}"
    
    detect_os
    install_dependencies
    create_directories
    generate_ssl_certs
    setup_geoip
    configure_nginx
    configure_firewall
    create_service
    create_management_script
    
    echo ""
    echo -e "${GREEN}🎉 Smart DNS installation completed!${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Copy your Smart DNS files to $SMART_DNS_DIR"
    echo "2. Edit configuration files in $SMART_DNS_DIR/config/"
    echo "3. Start the service: smart-dns start"
    echo "4. Access admin interface: http://localhost:8090"
    echo ""
    echo -e "${YELLOW}Quick commands:${NC}"
    echo "  smart-dns start    - Start all services"
    echo "  smart-dns status   - Check service status"
    echo "  smart-dns logs     - View logs"
    echo ""
    echo -e "${YELLOW}Configure your devices to use:${NC}"
    echo "  DNS Server: $(hostname -I | awk '{print $1}'):53"
    echo "  HTTP Proxy: $(hostname -I | awk '{print $1}'):8080"
    echo "  DoH URL: https://$(hostname -I | awk '{print $1}')/dns-query"
}

# Run main function
main "$@"