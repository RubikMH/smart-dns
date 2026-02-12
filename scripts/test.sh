#!/bin/bash

# Test Smart DNS Installation
# Run this script to verify your installation is working correctly

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Smart DNS Testing Script${NC}"
echo "================================="
echo ""

# Test 1: Check if Docker is running
echo -e "${YELLOW}Test 1: Docker Status${NC}"
if docker info >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Docker is running${NC}"
else
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi
echo ""

# Test 2: Check if services are running
echo -e "${YELLOW}Test 2: Service Status${NC}"
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Services are running${NC}"
    docker-compose ps
else
    echo -e "${RED}❌ Services are not running${NC}"
    echo "Try: docker-compose up -d"
    exit 1
fi
echo ""

# Test 3: Test DNS resolution
echo -e "${YELLOW}Test 3: DNS Resolution${NC}"
if command -v dig &> /dev/null; then
    if dig @localhost google.com +short | grep -q .; then
        echo -e "${GREEN}✅ DNS resolution works${NC}"
        dig @localhost google.com +short | head -1
    else
        echo -e "${RED}❌ DNS resolution failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  dig not installed, skipping DNS test${NC}"
fi
echo ""

# Test 4: Test Admin API
echo -e "${YELLOW}Test 4: Admin API${NC}"
if curl -f -s http://localhost:9090/health >/dev/null; then
    echo -e "${GREEN}✅ Admin API is accessible${NC}"
    curl -s http://localhost:9090/health | head -1
else
    echo -e "${RED}❌ Admin API is not accessible${NC}"
fi
echo ""

# Test 5: Test Admin Panel
echo -e "${YELLOW}Test 5: Admin Panel${NC}"
if curl -f -s http://localhost:8090 >/dev/null; then
    echo -e "${GREEN}✅ Admin panel is accessible${NC}"
    echo "   URL: http://localhost:8090"
else
    echo -e "${RED}❌ Admin panel is not accessible${NC}"
fi
echo ""

# Test 6: SSL Certificates
echo -e "${YELLOW}Test 6: SSL Certificates${NC}"
if [ -f ssl/server.crt ] && [ -f ssl/server.key ]; then
    echo -e "${GREEN}✅ SSL certificates exist${NC}"
    openssl x509 -in ssl/server.crt -noout -subject | head -1
else
    echo -e "${RED}❌ SSL certificates missing${NC}"
fi
echo ""

# Test 7: Configuration Files
echo -e "${YELLOW}Test 7: Configuration Files${NC}"
CONFIG_OK=true

if [ ! -f config/geo-domains.conf ]; then
    echo -e "${RED}❌ geo-domains.conf missing${NC}"
    CONFIG_OK=false
fi

if [ ! -f config/blocked-domains.conf ]; then
    echo -e "${RED}❌ blocked-domains.conf missing${NC}"
    CONFIG_OK=false
fi

if [ ! -f nginx/nginx.conf ]; then
    echo -e "${RED}❌ nginx.conf missing${NC}"
    CONFIG_OK=false
fi

if $CONFIG_OK; then
    echo -e "${GREEN}✅ All configuration files present${NC}"
fi
echo ""

# Test 8: Nginx Configuration
echo -e "${YELLOW}Test 8: Nginx Configuration${NC}"
if docker-compose exec -T smart-dns-nginx nginx -t 2>&1 | grep -q "successful"; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
else
    echo -e "${RED}❌ Nginx configuration has errors${NC}"
    docker-compose exec -T smart-dns-nginx nginx -t
fi
echo ""

# Test 9: Upstream Connectivity
echo -e "${YELLOW}Test 9: Upstream DNS Servers${NC}"
for dns in "1.1.1.1" "8.8.8.8" "9.9.9.9"; do
    if ping -c 1 -W 2 $dns >/dev/null 2>&1; then
        echo -e "${GREEN}✅ $dns reachable${NC}"
    else
        echo -e "${RED}❌ $dns unreachable${NC}"
    fi
done
echo ""

# Summary
echo -e "${BLUE}=================================${NC}"
echo -e "${BLUE}📊 Test Summary${NC}"
echo -e "${BLUE}=================================${NC}"
echo ""
echo -e "${GREEN}Your Smart DNS installation appears to be working!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Configure your devices to use this DNS server"
echo "2. Customize domain lists in config/"
echo "3. Access admin panel at http://localhost:8090"
echo "4. Monitor logs: docker-compose logs -f"
echo ""