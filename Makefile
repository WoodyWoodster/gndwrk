.PHONY: dev dev-all stop clean install setup help

# Default target
help:
	@echo "Gndwrk Development Commands"
	@echo ""
	@echo "  make dev        - Start all services (recommended)"
	@echo "  make stop       - Stop all background services"
	@echo "  make install    - Install dependencies"
	@echo "  make setup      - First-time setup (install + convex init)"
	@echo "  make clean      - Clean build artifacts and node_modules"
	@echo ""
	@echo "Individual services:"
	@echo "  make web        - Start web app only"
	@echo "  make mobile     - Start mobile app only"
	@echo "  make convex     - Start convex backend only"
	@echo "  make tunnels    - Start ngrok + stripe listeners"

# Start everything for development
dev: tunnels
	@echo "Starting all services..."
	@mkdir -p .dev-pids
	@# Start Convex in background
	@cd packages/convex && convex dev > /tmp/gndwrk-convex.log 2>&1 & echo $$! > .dev-pids/convex.pid
	@sleep 2
	@# Start web and mobile via turbo
	@pnpm dev

# Start just the tunnels (ngrok + stripe)
tunnels:
	@echo "Starting tunnels..."
	@mkdir -p .dev-pids
	@# Kill existing if running
	@-pkill -f "ngrok http" 2>/dev/null || true
	@-pkill -f "stripe listen" 2>/dev/null || true
	@sleep 1
	@# Start ngrok
	@ngrok http --domain=open-hen-infinitely.ngrok-free.app 3000 > /tmp/gndwrk-ngrok.log 2>&1 & echo $$! > .dev-pids/ngrok.pid
	@sleep 2
	@# Start stripe listen
	@stripe listen --forward-to localhost:3000/api/webhooks/stripe > /tmp/gndwrk-stripe.log 2>&1 & echo $$! > .dev-pids/stripe.pid
	@sleep 2
	@echo "Tunnels started. Ngrok URL:"
	@curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -oP '"public_url":"\K[^"]+' | head -1 || echo "  (ngrok not ready yet, check /tmp/gndwrk-ngrok.log)"

# Individual services
web:
	cd apps/web && pnpm dev

mobile:
	cd apps/mobile && pnpm dev

convex:
	cd packages/convex && convex dev

# Stop all background services
stop:
	@echo "Stopping services..."
	@-pkill -f "ngrok http" 2>/dev/null || true
	@-pkill -f "stripe listen" 2>/dev/null || true
	@-pkill -f "convex dev" 2>/dev/null || true
	@rm -rf .dev-pids
	@echo "All services stopped."

# Install dependencies
install:
	pnpm install

# First-time setup
setup: install
	@echo "Setting up Convex..."
	cd packages/convex && convex dev --once
	@echo ""
	@echo "Setup complete! Run 'make dev' to start developing."

# Clean everything
clean: stop
	rm -rf node_modules
	rm -rf apps/web/node_modules apps/web/.next
	rm -rf apps/mobile/node_modules apps/mobile/.expo
	rm -rf packages/*/node_modules
	rm -rf .turbo
	@echo "Cleaned all build artifacts and node_modules"

# Show status of services
status:
	@echo "=== Service Status ==="
	@echo -n "ngrok:  " && (pgrep -f "ngrok http" > /dev/null && echo "running" || echo "stopped")
	@echo -n "stripe: " && (pgrep -f "stripe listen" > /dev/null && echo "running" || echo "stopped")
	@echo -n "convex: " && (pgrep -f "convex dev" > /dev/null && echo "running" || echo "stopped")
	@echo ""
	@echo "=== Ngrok URL ==="
	@curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -oP '"public_url":"\K[^"]+' | head -1 || echo "(not running)"

# View logs
logs-ngrok:
	tail -f /tmp/gndwrk-ngrok.log

logs-stripe:
	tail -f /tmp/gndwrk-stripe.log

logs-convex:
	tail -f /tmp/gndwrk-convex.log
