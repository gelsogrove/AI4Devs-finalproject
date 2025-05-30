#!/bin/bash

# 🛑 Gusto Italiano - Stop All Services Script
echo "🛑 Stopping services..."

# Get project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Stop services using saved PIDs first
if [ -f "$PROJECT_ROOT/logs/backend.pid" ]; then
    BACKEND_PID=$(cat "$PROJECT_ROOT/logs/backend.pid")
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID 2>/dev/null
    fi
    rm -f "$PROJECT_ROOT/logs/backend.pid"
fi

if [ -f "$PROJECT_ROOT/logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$PROJECT_ROOT/logs/frontend.pid")
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    rm -f "$PROJECT_ROOT/logs/frontend.pid"
fi

# Force kill any remaining processes on common ports
PORTS=(8080 3000 3001 3002 3003 3004 3005 5173)

for port in "${PORTS[@]}"; do
    if command -v npx >/dev/null 2>&1; then
        npx kill-port $port >/dev/null 2>&1
    else
        lsof -ti:$port | xargs kill -9 2>/dev/null
    fi
done

echo "✅ Services stopped!" 