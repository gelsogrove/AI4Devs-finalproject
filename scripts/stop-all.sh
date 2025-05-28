#!/bin/bash

# 🛑 Gusto Italiano - Stop All Services Script

echo "🛑 Stopping Gusto Italiano services..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Get the script directory and navigate to project root (parent of scripts)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Navigate to project root
cd "$PROJECT_ROOT"

# Stop services using saved PIDs if available
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    print_status "Stopping backend (PID: $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null && print_success "Backend stopped" || print_warning "Backend PID not found"
    rm -f logs/backend.pid
fi

if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    print_status "Stopping frontend (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID 2>/dev/null && print_success "Frontend stopped" || print_warning "Frontend PID not found"
    rm -f logs/frontend.pid
fi

# Force kill any remaining processes on our ports
print_status "Force killing any remaining processes..."
lsof -ti:8080,3000,3001,3002,3003,3004,3005,3006,3007,3008,3009,3010,5173 | xargs kill -9 2>/dev/null || print_warning "No additional processes found"

print_success "🎉 All Gusto Italiano services stopped!"
print_status "To restart: ./scripts/restart-all.sh" 