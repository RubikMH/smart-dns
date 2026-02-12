# Makefile for Smart DNS

.PHONY: help setup start stop restart logs status clean build update test

# Default target
help:
	@echo "Smart DNS - Available Commands:"
	@echo "  make setup      - Initial setup (create dirs, generate SSL)"
	@echo "  make start      - Start all services"
	@echo "  make stop       - Stop all services"
	@echo "  make restart    - Restart all services"
	@echo "  make logs       - View logs (all services)"
	@echo "  make status     - Show service status"
	@echo "  make build      - Build Docker images"
	@echo "  make clean      - Stop and remove containers"
	@echo "  make update     - Pull latest images and restart"
	@echo "  make test       - Run tests"
	@echo "  make ssl        - Generate SSL certificates"

# Initial setup
setup:
	@echo "🚀 Setting up Smart DNS..."
	@./scripts/setup.sh

# Generate SSL certificates
ssl:
	@echo "🔐 Generating SSL certificates..."
	@mkdir -p ssl
	@openssl req -x509 -newkey rsa:2048 -nodes \
		-keyout ssl/server.key \
		-out ssl/server.crt \
		-days 365 \
		-subj "/C=US/ST=State/L=City/O=SmartDNS/CN=localhost"
	@chmod 600 ssl/server.key
	@chmod 644 ssl/server.crt
	@echo "✅ SSL certificates generated"

# Start services
start:
	@echo "Starting Smart DNS services..."
	@docker-compose up -d || (echo "\n⚠️  If port 53 is in use, run: ./scripts/fix-port-conflict.sh" && exit 1)
	@echo "✅ Services started"
	@make status

# Stop services
stop:
	@echo "Stopping Smart DNS services..."
	@docker-compose stop
	@echo "✅ Services stopped"

# Restart services
restart:
	@echo "Restarting Smart DNS services..."
	@docker-compose restart
	@echo "✅ Services restarted"

# View logs
logs:
	@docker-compose logs -f

# Show status
status:
	@echo "Service Status:"
	@docker-compose ps

# Build images
build:
	@echo "Building Docker images..."
	@docker-compose build
	@echo "✅ Build complete"

# Clean up
clean:
	@echo "Cleaning up..."
	@docker-compose down -v
	@echo "✅ Cleanup complete"

# Update and restart
update:
	@echo "Updating Smart DNS..."
	@git pull
	@docker-compose pull
	@docker-compose up -d
	@echo "✅ Update complete"

# Run tests
test:
	@echo "Running tests..."
	@dig @localhost google.com
	@curl -f http://localhost:8090/health || echo "Admin panel not accessible"
	@curl -f http://localhost:9090/health || echo "API not accessible"

# Backup configuration
backup:
	@echo "Creating backup..."
	@tar -czf smart-dns-backup-$$(date +%Y%m%d-%H%M%S).tar.gz \
		config/ nginx/conf.d/ ssl/ docker-compose.yml
	@echo "✅ Backup created"

# Monitor logs in real-time
monitor:
	@docker-compose logs -f smart-dns-nginx

# Show nginx configuration test
nginx-test:
	@docker-compose exec smart-dns-nginx nginx -t

# Reload nginx
nginx-reload:
	@docker-compose exec smart-dns-nginx nginx -s reload
	@echo "✅ Nginx reloaded"