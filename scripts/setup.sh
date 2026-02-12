#!/bin/bash

# Smart DNS Quick Setup Script for macOS/Linux
# Run this after cloning the repository

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Smart DNS Quick Setup${NC}"
echo "================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Please install Docker from https://www.docker.com/"
    exit 1
fi

# Check if Docker Compose is installed  
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    echo "Please install Docker Compose"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"
echo ""

# Create required directories
echo -e "${YELLOW}📁 Creating directories...${NC}"
mkdir -p logs ssl

# Generate SSL certificates if they don't exist
if [ ! -f ssl/server.crt ] || [ ! -f ssl/server.key ]; then
    echo -e "${YELLOW}🔐 Generating SSL certificates...${NC}"
    openssl req -x509 -newkey rsa:2048 -nodes \
        -keyout ssl/server.key \
        -out ssl/server.crt \
        -days 365 \
        -subj "/C=US/ST=State/L=City/O=SmartDNS/CN=localhost" \
        2>/dev/null
    
    chmod 600 ssl/server.key
    chmod 644 ssl/server.crt
    echo -e "${GREEN}✅ SSL certificates generated${NC}"
else
    echo -e "${GREEN}✅ SSL certificates already exist${NC}"
fi

# Set permissions
chmod 755 logs
chmod 755 ssl

echo ""
echo -e "${YELLOW}🐳 Starting Docker containers...${NC}"
docker-compose up -d

echo ""
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 5

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Services are running!${NC}"
else
    echo -e "${RED}❌ Some services failed to start${NC}"
    echo "Run 'docker-compose logs' to see what went wrong"
    exit 1
fi

# Get local IP
if [[ "$OSTYPE" == "darwin"* ]]; then
    LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
else
    LOCAL_IP=$(hostname -I | awk '{print $1}')
fi

echo ""
echo -e "${GREEN}🎉 Smart DNS is now running!${NC}"
echo "================================="
echo ""
echo -e "${YELLOW}📊 Admin Panel:${NC}"
echo "   http://localhost:8090"
echo "   or http://${LOCAL_IP}:8090"
echo ""
echo -e "${YELLOW}🌐 Configure Your Devices:${NC}"
echo "   DNS Server: ${LOCAL_IP}:53"
echo "   HTTP Proxy: ${LOCAL_IP}:8080"
echo "   HTTPS Proxy: ${LOCAL_IP}:8443"
echo "   DoH URL: https://${LOCAL_IP}/dns-query"
echo ""
echo -e "${YELLOW}🔧 Configuration Files:${NC}"
echo "   Geo Domains: config/geo-domains.conf"
echo "   Blocked Domains: config/blocked-domains.conf"
echo "   Nginx Config: nginx/nginx.conf"
echo ""
echo -e "${YELLOW}📝 Useful Commands:${NC}"
echo "   Start:    docker-compose start"
echo "   Stop:     docker-compose stop"
echo "   Restart:  docker-compose restart"
echo "   Logs:     docker-compose logs -f"
echo "   Status:   docker-compose ps"
echo ""
echo -e "${YELLOW}🧪 Test DNS:${NC}"
echo "   dig @localhost google.com"
echo "   nslookup netflix.com localhost"
echo ""
echo -e "${GREEN}📖 For more information, see docs/QUICK_START.md${NC}"
echo ""