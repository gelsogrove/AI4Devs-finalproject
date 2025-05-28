#!/bin/bash

echo "🔄 Restarting Frontend..."

# Kill any process using port 5173 (Vite default)
echo "🛑 Stopping any process on port 5173..."
lsof -ti:5173 | xargs kill -9 2>/dev/null || echo "No process found on port 5173"

# Wait a moment
sleep 2

# Start the frontend
echo "🚀 Starting frontend..."
npm run dev 