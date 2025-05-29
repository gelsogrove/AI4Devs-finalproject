#!/bin/bash

# 🚀 Gusto Italiano - Start All Services Script
# This script starts the entire application stack

echo "🚀 Starting Gusto Italiano services..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get the script directory and navigate to project root (parent of scripts)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Navigate to project root and create logs directory
cd "$PROJECT_ROOT"
mkdir -p logs

# Backend setup
print_status "Setting up backend..."
cd backend

# Regenerate Prisma client to ensure it's up to date
print_status "Regenerating Prisma client..."
npx prisma generate

if [ $? -eq 0 ]; then
    print_success "Prisma client regenerated successfully"
else
    print_error "Failed to regenerate Prisma client"
    exit 1
fi

# Start backend in background
print_status "Starting backend server..."
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Check if backend is running
if curl -s http://localhost:8080/api/health > /dev/null; then
    print_success "Backend started successfully on port 8080 (PID: $BACKEND_PID)"
else
    print_error "Backend failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start frontend
print_status "Starting frontend..."
cd ../frontend

# Start frontend in background
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

# Save PIDs for future reference
cd ..
echo $BACKEND_PID > logs/backend.pid
echo $FRONTEND_PID > logs/frontend.pid

print_success "All services started successfully!"
print_status "Backend PID: $BACKEND_PID (Port: 8080)"
print_status "Frontend PID: $FRONTEND_PID (Port: 3000+)"
print_status ""
print_status "📊 Access points:"
print_status "• Backend API: http://localhost:8080/api/health"
print_status "• Frontend: Check terminal for actual port (usually 3000+)"
print_status "• API Docs: http://localhost:8080/api-docs"
print_status ""
print_status "📝 Logs:"
print_status "• Backend: logs/backend.log"
print_status "• Frontend: logs/frontend.log"
print_status ""
print_status "🛑 To stop all services: ./scripts/stop-all.sh"

# Test the system
print_status "Testing system health..."
sleep 2

if curl -s http://localhost:8080/api/health > /dev/null; then
    print_success "✅ Backend health check passed"
else
    print_warning "⚠️ Backend health check failed"
fi

# Test integration endpoint
if curl -s http://localhost:8080/api/chat/integration-test > /dev/null; then
    print_success "✅ Integration test endpoint accessible"
else
    print_warning "⚠️ Integration test endpoint not accessible"
fi

print_success "🎉 Gusto Italiano system is ready!"
print_status "Use 'tail -f logs/backend.log' or 'tail -f logs/frontend.log' to monitor logs" 