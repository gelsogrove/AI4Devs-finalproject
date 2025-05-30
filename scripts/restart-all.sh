#!/bin/bash

# 🚀 Gusto Italiano - Complete System Management Script
echo "🚀 Starting system restart..."

# Get the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Step 1: Stop all services quietly
./scripts/stop-all.sh > /dev/null 2>&1

# Step 2: Kill processes on common ports using kill-port
PORTS=(8080 3000 3001 3002 3003 3004 3005 5173)
for port in "${PORTS[@]}"; do
    if command -v npx >/dev/null 2>&1; then
        npx kill-port $port >/dev/null 2>&1
    else
        lsof -ti:$port | xargs kill -9 2>/dev/null
    fi
done

sleep 2

# Step 3: Setup backend
cd "$PROJECT_ROOT/backend" || exit 1
mkdir -p "$PROJECT_ROOT/logs"

# Regenerate Prisma client silently
npx prisma generate >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Failed to regenerate Prisma client"
    exit 1
fi

# Step 4: Start backend server
npm run dev > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$PROJECT_ROOT/logs/backend.pid"

sleep 3

# Check if backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Failed to start backend"
    exit 1
fi

# Step 5: Start frontend
cd "$PROJECT_ROOT/frontend" || exit 1
npm run dev > "$PROJECT_ROOT/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$PROJECT_ROOT/logs/frontend.pid"

sleep 3

# Check if frontend is running
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "❌ Failed to start frontend"
    exit 1
fi

echo "✅ System ready!"
echo "📊 Backend: http://localhost:8080"
echo "📊 Frontend: Check terminal for port"
echo "🛑 Stop: ./scripts/stop-all.sh"

cd "$PROJECT_ROOT" 