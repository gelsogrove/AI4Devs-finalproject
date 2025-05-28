#!/bin/bash

# Simple script to run E2E tests with both backend and frontend
# 1. Cleans up ports
# 2. Starts backend
# 3. Starts frontend
# 4. Runs tests

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo_msg() {
  echo -e "${YELLOW}[E2E Test]${NC} $1"
}

# Cleanup ports
echo_msg "Cleaning up ports..."

# Check and kill processes on common ports (3000, 3001, 3003)
for PORT in 3000 3001 3003 8080; do
  PID=$(lsof -t -i:$PORT -sTCP:LISTEN)
  if [ -n "$PID" ]; then
    echo_msg "Killing process on port $PORT (PID: $PID)"
    kill -9 $PID
  else
    echo_msg "No process found on port $PORT"
  fi
done

# Navigate to project root
cd "$(dirname "$0")/.." || { echo_msg "${RED}Failed to navigate to project root${NC}"; exit 1; }
ROOT_DIR=$(pwd)

# Start backend
echo_msg "Starting backend server..."
cd "$ROOT_DIR/backend" || { echo_msg "${RED}Failed to navigate to backend directory${NC}"; exit 1; }
npm run dev &
BACKEND_PID=$!

# Wait for backend
echo_msg "Waiting for backend to be ready..."
attempt=0
max_attempts=30
while ! curl -s http://localhost:8080/api/health > /dev/null; do
  attempt=$((attempt+1))
  if [ $attempt -eq $max_attempts ]; then
    echo_msg "${RED}Backend failed to start${NC}"
    if [ -n "$BACKEND_PID" ]; then kill -9 $BACKEND_PID || true; fi
    exit 1
  fi
  echo_msg "Waiting for backend... (attempt $attempt/$max_attempts)"
  sleep 1
done
echo_msg "${GREEN}Backend is running!${NC}"

# Start frontend
echo_msg "Starting frontend server..."
cd "$ROOT_DIR/frontend" || { echo_msg "${RED}Failed to navigate to frontend directory${NC}"; exit 1; }
npm run dev &
FRONTEND_PID=$!

# Wait for frontend
echo_msg "Waiting for frontend to be ready..."
attempt=0
max_attempts=30
while ! curl -s http://localhost:3000 > /dev/null; do
  attempt=$((attempt+1))
  if [ $attempt -eq $max_attempts ]; then
    echo_msg "${RED}Frontend failed to start${NC}"
    if [ -n "$BACKEND_PID" ]; then kill -9 $BACKEND_PID || true; fi
    if [ -n "$FRONTEND_PID" ]; then kill -9 $FRONTEND_PID || true; fi
    exit 1
  fi
  echo_msg "Waiting for frontend... (attempt $attempt/$max_attempts)"
  sleep 1
done
echo_msg "${GREEN}Frontend is running!${NC}"

# Run tests in headless mode
echo_msg "${GREEN}Running E2E tests in headless mode...${NC}"
cd "$ROOT_DIR/frontend" && npx cypress run
TEST_EXIT_CODE=$?

# Cleanup processes
echo_msg "Cleaning up processes..."
if [ -n "$FRONTEND_PID" ]; then
  kill -9 $FRONTEND_PID || true
fi
if [ -n "$BACKEND_PID" ]; then
  kill -9 $BACKEND_PID || true
fi

# Return test result
if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo_msg "${GREEN}Tests completed successfully!${NC}"
  exit 0
else
  echo_msg "${RED}Tests failed with exit code $TEST_EXIT_CODE${NC}"
  exit $TEST_EXIT_CODE
fi 