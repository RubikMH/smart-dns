#!/bin/bash

# Fix Port 53 Conflict on macOS
# This script helps resolve the port 53 conflict issue

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Smart DNS Port 53 Conflict Fixer${NC}"
echo "===================================="
echo ""

# Check what's using port 53
echo -e "${YELLOW}Checking what's using port 53...${NC}"
if command -v lsof &> /dev/null; then
    PORT_53_USERS=$(sudo lsof -i :53 2>/dev/null || true)
    if [ -n "$PORT_53_USERS" ]; then
        echo -e "${RED}Port 53 is in use:${NC}"
        echo "$PORT_53_USERS"
        echo ""
    else
        echo -e "${GREEN}Port 53 is available${NC}"
        echo ""
    fi
fi

echo -e "${YELLOW}Choose a solution:${NC}"
echo ""
echo "1. Use alternative port 5353 (RECOMMENDED for macOS)"
echo "2. Stop macOS mDNSResponder (requires admin, may affect system)"
echo "3. View troubleshooting guide"
echo "4. Exit"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo -e "${YELLOW}Setting up Smart DNS on alternative port 5353...${NC}"
        
        # Backup original docker-compose.yml
        if [ -f docker-compose.yml ] && [ ! -f docker-compose.yml.backup ]; then
            cp docker-compose.yml docker-compose.yml.backup
            echo -e "${GREEN}✅ Backed up original docker-compose.yml${NC}"
        fi
        
        # Use alternative port configuration
        cp docker-compose.alt-ports.yml docker-compose.yml
        echo -e "${GREEN}✅ Switched to alternative port configuration${NC}"
        
        # Stop any running containers
        docker-compose down 2>/dev/null || true
        
        # Start services
        echo ""
        echo -e "${YELLOW}Starting services...${NC}"
        docker-compose up -d
        
        echo ""
        echo -e "${GREEN}🎉 Smart DNS is now running on alternative ports!${NC}"
        echo ""
        echo -e "${YELLOW}Configure your devices to use:${NC}"
        echo "  DNS Server: $(ipconfig getifaddr en0 || hostname -I | awk '{print $1}'):5353"
        echo "  DoT: $(ipconfig getifaddr en0 || hostname -I | awk '{print $1}'):8853"
        echo ""
        echo -e "${YELLOW}Test DNS resolution:${NC}"
        echo "  dig @localhost -p 5353 google.com"
        echo ""
        ;;
        
    2)
        echo ""
        echo -e "${RED}⚠️  WARNING: This will stop macOS DNS responder!${NC}"
        echo "This may affect other system services."
        echo ""
        read -p "Are you sure? (yes/no): " confirm
        
        if [ "$confirm" = "yes" ]; then
            echo ""
            echo -e "${YELLOW}Stopping mDNSResponder...${NC}"
            sudo launchctl unload -w /System/Library/LaunchDaemons/com.apple.mDNSResponder.plist 2>/dev/null || \
            sudo launchctl stop com.apple.mDNSResponder
            
            echo -e "${GREEN}✅ mDNSResponder stopped${NC}"
            
            # Start Smart DNS on standard port
            echo ""
            echo -e "${YELLOW}Starting Smart DNS on port 53...${NC}"
            docker-compose down 2>/dev/null || true
            docker-compose up -d
            
            echo ""
            echo -e "${GREEN}🎉 Smart DNS is running on port 53${NC}"
            echo ""
            echo -e "${YELLOW}To restore mDNSResponder later, run:${NC}"
            echo "  sudo launchctl load -w /System/Library/LaunchDaemons/com.apple.mDNSResponder.plist"
            echo ""
        else
            echo "Operation cancelled."
        fi
        ;;
        
    3)
        echo ""
        cat << 'EOF'
=== TROUBLESHOOTING GUIDE ===

Option A: Use Alternative Port (RECOMMENDED)
--------------------------------------------
1. Run this script and choose option 1
   OR manually:
   cp docker-compose.alt-ports.yml docker-compose.yml
   docker-compose up -d

2. Test DNS on port 5353:
   dig @localhost -p 5353 google.com

3. Configure devices to use port 5353


Option B: Use dnsmasq Forwarder
--------------------------------
1. Install dnsmasq:
   brew install dnsmasq

2. Configure forwarding:
   echo "server=127.0.0.1#5353" >> /usr/local/etc/dnsmasq.conf

3. Start dnsmasq:
   sudo brew services start dnsmasq

4. Use dnsmasq as system DNS


Option C: Disable Conflicting Service
--------------------------------------
Find what's using port 53:
  sudo lsof -i :53

Common services:
- mDNSResponder (macOS system DNS)
- dnsmasq
- Local DNS server

Stop the service before starting Smart DNS


For more help, see docs/TROUBLESHOOTING.md
EOF
        echo ""
        ;;
        
    4)
        echo "Exiting..."
        exit 0
        ;;
        
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo -e "${YELLOW}For detailed troubleshooting, see:${NC}"
echo "  docs/TROUBLESHOOTING.md"
echo ""