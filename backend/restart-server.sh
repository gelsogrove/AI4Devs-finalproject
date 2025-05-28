#!/bin/bash

echo "🔄 Restarting Gusto Italiano Server..."

# Kill any process using port 8080
echo "🛑 Stopping any process on port 8080..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || echo "No process found on port 8080"

# Wait a moment
sleep 2

# Start the server
echo "🚀 Starting server..."
npm run dev 