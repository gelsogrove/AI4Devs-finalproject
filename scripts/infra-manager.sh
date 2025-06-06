#!/bin/bash

# ===================================
# ShopMefy Infrastructure Manager
# ===================================

set -e

# Configuration
INSTANCE_ID="i-008b6c493b1f842a9"
FIXED_EIP_ALLOCATION="eipalloc-0001d20efe88091c7"
AWS_REGION="us-east-1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}=================================${NC}"
    echo -e "${BLUE}  ShopMefy Infrastructure Manager${NC}"
    echo -e "${BLUE}=================================${NC}"
    echo ""
}

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI not found. Please install it first."
        exit 1
    fi
    
    if ! aws sts get-caller-identity > /dev/null 2>&1; then
        print_error "AWS CLI not configured. Please run 'aws configure' first."
        exit 1
    fi
}

get_infrastructure_status() {
    echo "🔍 Checking infrastructure status..."
    
    # EC2 Status
    EC2_STATE=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID --query "Reservations[0].Instances[0].State.Name" --output text --region $AWS_REGION)
    echo "EC2 Instance ($INSTANCE_ID): $EC2_STATE"
    
    # Fixed IP Status
    FIXED_IP=$(aws ec2 describe-addresses --allocation-ids $FIXED_EIP_ALLOCATION --query "Addresses[0].PublicIp" --output text --region $AWS_REGION 2>/dev/null || echo "Not found")
    echo "Fixed IP: $FIXED_IP"
    
    # IP Association
    CURRENT_ASSOCIATION=$(aws ec2 describe-addresses --allocation-ids $FIXED_EIP_ALLOCATION --query "Addresses[0].InstanceId" --output text --region $AWS_REGION 2>/dev/null || echo "None")
    if [ "$CURRENT_ASSOCIATION" = "$INSTANCE_ID" ]; then
        echo "IP Association: ✅ Associated to EC2"
    else
        echo "IP Association: 🔒 Not associated"
    fi
    
    # RDS Status
    RDS_STATE=$(aws rds describe-db-instances --db-instance-identifier shopmefy-db-b070a7e8 --query "DBInstances[0].DBInstanceStatus" --output text --region $AWS_REGION 2>/dev/null || echo "not-found")
    echo "RDS Database: $RDS_STATE"
    
    echo ""
    
    # Cost calculation
    if [ "$EC2_STATE" = "stopped" ]; then
        echo "💰 Current monthly cost: ~$16.1 (EC2 stopped)"
        echo "💡 Potential savings: ~$15/month vs running"
    else
        echo "💰 Current monthly cost: ~$27.5 (EC2 running)"
        echo "💡 Potential savings: ~$15/month if stopped"
    fi
    
    echo ""
    
    # Application URLs (if running)
    if [ "$EC2_STATE" = "running" ] && [ "$CURRENT_ASSOCIATION" = "$INSTANCE_ID" ]; then
        echo "🌐 Application URLs:"
        echo "   Frontend: http://$FIXED_IP/"
        echo "   API: http://$FIXED_IP/api"
        echo "   Swagger: http://$FIXED_IP/api-docs"
        echo "   SSH: ssh -i key.pem ubuntu@$FIXED_IP"
    fi
}

start_infrastructure() {
    echo "🚀 Starting infrastructure..."
    
    EC2_STATE=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID --query "Reservations[0].Instances[0].State.Name" --output text --region $AWS_REGION)
    
    if [ "$EC2_STATE" = "stopped" ]; then
        print_status "Starting EC2 instance..."
        aws ec2 start-instances --instance-ids $INSTANCE_ID --region $AWS_REGION
        
        print_status "Waiting for instance to be running..."
        aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region $AWS_REGION
        
        print_status "Associating fixed Elastic IP..."
        aws ec2 associate-address --instance-id $INSTANCE_ID --allocation-id $FIXED_EIP_ALLOCATION --region $AWS_REGION
        
        FIXED_IP=$(aws ec2 describe-addresses --allocation-ids $FIXED_EIP_ALLOCATION --query "Addresses[0].PublicIp" --output text --region $AWS_REGION)
        print_status "Infrastructure started! Fixed IP: $FIXED_IP"
        
        print_warning "Waiting 30 seconds for SSH to be ready..."
        sleep 30
        
    elif [ "$EC2_STATE" = "running" ]; then
        print_status "EC2 instance is already running"
        
        # Ensure IP is associated
        CURRENT_ASSOCIATION=$(aws ec2 describe-addresses --allocation-ids $FIXED_EIP_ALLOCATION --query "Addresses[0].InstanceId" --output text --region $AWS_REGION 2>/dev/null || echo "None")
        if [ "$CURRENT_ASSOCIATION" != "$INSTANCE_ID" ]; then
            print_status "Re-associating fixed Elastic IP..."
            aws ec2 associate-address --instance-id $INSTANCE_ID --allocation-id $FIXED_EIP_ALLOCATION --region $AWS_REGION
        fi
    else
        print_error "EC2 instance is in state: $EC2_STATE"
        print_error "Cannot start from this state. Please check AWS console."
        exit 1
    fi
}

stop_infrastructure() {
    echo "🛑 Stopping infrastructure..."
    
    EC2_STATE=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID --query "Reservations[0].Instances[0].State.Name" --output text --region $AWS_REGION)
    
    if [ "$EC2_STATE" = "running" ]; then
        print_status "Disassociating Elastic IP (keeping it allocated)..."
        ASSOCIATION_ID=$(aws ec2 describe-addresses --allocation-ids $FIXED_EIP_ALLOCATION --query "Addresses[0].AssociationId" --output text --region $AWS_REGION 2>/dev/null || echo "None")
        if [ "$ASSOCIATION_ID" != "None" ] && [ "$ASSOCIATION_ID" != "null" ]; then
            aws ec2 disassociate-address --association-id $ASSOCIATION_ID --region $AWS_REGION
        fi
        
        print_status "Stopping EC2 instance..."
        aws ec2 stop-instances --instance-ids $INSTANCE_ID --region $AWS_REGION
        
        print_status "Waiting for instance to be stopped..."
        aws ec2 wait instance-stopped --instance-ids $INSTANCE_ID --region $AWS_REGION
        
        FIXED_IP=$(aws ec2 describe-addresses --allocation-ids $FIXED_EIP_ALLOCATION --query "Addresses[0].PublicIp" --output text --region $AWS_REGION)
        print_status "Infrastructure stopped successfully!"
        print_status "Fixed IP preserved: $FIXED_IP"
        print_status "You are now saving ~$15/month on compute costs!"
    else
        print_warning "EC2 instance is already $EC2_STATE"
    fi
}

test_application() {
    echo "🏥 Testing application health..."
    
    FIXED_IP=$(aws ec2 describe-addresses --allocation-ids $FIXED_EIP_ALLOCATION --query "Addresses[0].PublicIp" --output text --region $AWS_REGION)
    
    # Test endpoints
    echo "Testing frontend..."
    FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 http://$FIXED_IP/ || echo "000")
    
    echo "Testing API health..."
    API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 http://$FIXED_IP/api/health || echo "000")
    
    echo "Testing API services..."
    SERVICES_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 http://$FIXED_IP/api/services || echo "000")
    
    echo ""
    echo "Health Check Results:"
    
    if [ "$FRONTEND_STATUS" = "200" ]; then
        print_status "Frontend: HTTP $FRONTEND_STATUS"
    else
        print_error "Frontend: HTTP $FRONTEND_STATUS"
    fi
    
    if [ "$API_STATUS" = "200" ]; then
        print_status "API Health: HTTP $API_STATUS"
    else
        print_error "API Health: HTTP $API_STATUS"
    fi
    
    if [ "$SERVICES_STATUS" = "200" ]; then
        print_status "API Services: HTTP $SERVICES_STATUS"
    else
        print_error "API Services: HTTP $SERVICES_STATUS"
    fi
    
    echo ""
    
    if [ "$FRONTEND_STATUS" = "200" ] && [ "$API_STATUS" = "200" ]; then
        print_status "Application is healthy!"
    else
        print_warning "Application may need deployment or time to start"
    fi
}

trigger_github_action() {
    local action=$1
    echo "🚀 Triggering GitHub Action: $action"
    
    if ! command -v gh &> /dev/null; then
        print_error "GitHub CLI (gh) not found. Please install it first."
        print_warning "You can manually trigger the action from GitHub web interface."
        return 1
    fi
    
    case $action in
        "start")
            gh workflow run "infra-control.yml" -f action=start
            ;;
        "stop")
            gh workflow run "infra-control.yml" -f action=stop
            ;;
        "start-and-deploy")
            gh workflow run "infra-control.yml" -f action=start-and-deploy
            ;;
        "deploy")
            gh workflow run "deploy.yml" -f environment=dev
            ;;
        "deploy-force")
            gh workflow run "deploy.yml" -f environment=dev -f force_deploy=true
            ;;
        *)
            print_error "Unknown action: $action"
            return 1
            ;;
    esac
    
    print_status "GitHub Action triggered. Check the Actions tab for progress."
}

show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  status              Show current infrastructure status"
    echo "  start               Start EC2 and associate IP"
    echo "  stop                Stop EC2 and preserve IP"
    echo "  test                Test application health"
    echo "  github-start        Trigger GitHub Action to start infrastructure"
    echo "  github-stop         Trigger GitHub Action to stop infrastructure"
    echo "  github-deploy       Trigger GitHub Action to deploy application"
    echo "  github-start-deploy Trigger GitHub Action to start and deploy"
    echo "  github-deploy-force Trigger GitHub Action to force deploy"
    echo "  help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 status           # Check current status"
    echo "  $0 start            # Start infrastructure locally"
    echo "  $0 github-deploy    # Deploy via GitHub Actions"
}

# Main script
print_header

case "${1:-help}" in
    "status")
        check_aws_cli
        get_infrastructure_status
        ;;
    "start")
        check_aws_cli
        start_infrastructure
        echo ""
        get_infrastructure_status
        ;;
    "stop")
        check_aws_cli
        stop_infrastructure
        echo ""
        get_infrastructure_status
        ;;
    "test")
        check_aws_cli
        test_application
        ;;
    "github-start")
        trigger_github_action "start"
        ;;
    "github-stop")
        trigger_github_action "stop"
        ;;
    "github-deploy")
        trigger_github_action "deploy"
        ;;
    "github-start-deploy")
        trigger_github_action "start-and-deploy"
        ;;
    "github-deploy-force")
        trigger_github_action "deploy-force"
        ;;
    "help"|*)
        show_help
        ;;
esac 