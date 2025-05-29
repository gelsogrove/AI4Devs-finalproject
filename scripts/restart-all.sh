#!/bin/bash

# 🔄 Gusto Italiano - Complete System Restart Script
# This script completely restarts the entire application stack

echo "🚀 Starting Gusto Italiano complete system restart..."

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

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Step 1: Stop all existing services first
print_status "Stopping all existing services..."
"$SCRIPT_DIR/stop-all.sh"

# Wait a moment for processes to fully terminate
sleep 3

# Step 2: Start all services
print_status "Starting all services..."
"$SCRIPT_DIR/start-all.sh"

print_success "🎉 Gusto Italiano system restart completed!" 