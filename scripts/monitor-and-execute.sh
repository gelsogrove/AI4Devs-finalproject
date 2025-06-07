#!/bin/bash

# Monitor deployment completion and execute next process
# Usage: ./scripts/monitor-and-execute.sh

set -e

echo "🔍 Starting deployment monitor..."

# Configuration
SERVER_IP="52.7.57.53"
MAX_WAIT_TIME=600  # 10 minutes
CHECK_INTERVAL=30  # 30 seconds
PROCESS_02_NAME="deployment"
PROCESS_03_NAME="next-process"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if deployment is complete
check_deployment_status() {
    log "Checking deployment status on server..."
    
    # Check if backend process is running with normal CPU
    local cpu_usage=$(ssh ubuntu@${SERVER_IP} "ps aux | grep 'node dist/src/index.js' | grep -v grep | awk '{print \$3}'" 2>/dev/null || echo "0")
    
    if [ -z "$cpu_usage" ] || [ "$cpu_usage" = "0" ]; then
        return 1  # Process not running
    fi
    
    # Check if CPU usage is reasonable (less than 10%)
    local cpu_int=$(echo "$cpu_usage" | cut -d'.' -f1)
    if [ "$cpu_int" -lt 10 ]; then
        # Additional check: verify the code doesn't contain checkTestPassword
        local has_old_code=$(ssh ubuntu@${SERVER_IP} "cd shopmefy-deployment/backend && grep -c 'checkTestPassword' dist/src/controllers/auth.controller.js 2>/dev/null || echo '0'")
        
        if [ "$has_old_code" = "0" ]; then
            return 0  # Deployment complete and healthy
        else
            return 1  # Still has old code
        fi
    else
        return 1  # High CPU usage, still problematic
    fi
}

# Function to execute process 03
execute_process_03() {
    success "Process 02 (${PROCESS_02_NAME}) completed successfully!"
    log "Starting Process 03 (${PROCESS_03_NAME})..."
    
    # TODO: Andrea, specify what Process 03 should do here
    # Examples:
    
    # Option 1: Test login functionality
    test_login_functionality
    
    # Option 2: Run automated tests
    # run_automated_tests
    
    # Option 3: Execute specific script
    # ./scripts/process-03.sh
    
    success "Process 03 completed!"
}

# Function to test login functionality
test_login_functionality() {
    log "Testing login functionality..."
    
    # Test health endpoint first
    log "Checking backend health..."
    local health_status=$(curl -s -o /dev/null -w "%{http_code}" http://${SERVER_IP}/api/health || echo "000")
    
    if [ "$health_status" = "200" ]; then
        success "Backend health check passed"
    else
        error "Backend health check failed (HTTP $health_status)"
        return 1
    fi
    
    # Test login endpoint
    log "Testing login endpoint..."
    local login_response=$(curl -s -m 10 -X POST http://${SERVER_IP}/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"ShopMefy2024"}' \
        -w "HTTPSTATUS:%{http_code}" 2>/dev/null || echo "HTTPSTATUS:000")
    
    local http_status=$(echo "$login_response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    local response_body=$(echo "$login_response" | sed 's/HTTPSTATUS:[0-9]*$//')
    
    if [ "$http_status" = "200" ]; then
        success "Login test passed! Response: $response_body"
        return 0
    else
        error "Login test failed (HTTP $http_status)"
        return 1
    fi
}

# Main monitoring loop
main() {
    log "Monitoring deployment completion for Process 02..."
    log "Server: $SERVER_IP"
    log "Max wait time: $MAX_WAIT_TIME seconds"
    log "Check interval: $CHECK_INTERVAL seconds"
    
    local elapsed_time=0
    
    while [ $elapsed_time -lt $MAX_WAIT_TIME ]; do
        if check_deployment_status; then
            execute_process_03
            exit 0
        else
            warning "Process 02 still running or not healthy. Waiting..."
            sleep $CHECK_INTERVAL
            elapsed_time=$((elapsed_time + CHECK_INTERVAL))
        fi
    done
    
    error "Timeout reached. Process 02 did not complete within $MAX_WAIT_TIME seconds."
    exit 1
}

# Run main function
main "$@" 