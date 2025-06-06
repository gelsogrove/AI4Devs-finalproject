#!/bin/bash

# ===================================
# Setup Fixed Elastic IP for ShopMefy
# ===================================

echo "🔒 Setting up fixed Elastic IP for ShopMefy..."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Allocate new Elastic IP
echo "📍 Allocating new Elastic IP..."
EIP_RESULT=$(aws ec2 allocate-address --domain vpc --output json)

if [ $? -ne 0 ]; then
    echo "❌ Failed to allocate Elastic IP"
    exit 1
fi

# Extract allocation ID and public IP
ALLOCATION_ID=$(echo $EIP_RESULT | jq -r '.AllocationId')
PUBLIC_IP=$(echo $EIP_RESULT | jq -r '.PublicIp')

echo "✅ Elastic IP allocated successfully!"
echo "   Allocation ID: $ALLOCATION_ID"
echo "   Public IP: $PUBLIC_IP"

# Update the GitHub workflow file
WORKFLOW_FILE=".github/workflows/infra-control.yml"

if [ ! -f "$WORKFLOW_FILE" ]; then
    echo "❌ Workflow file not found: $WORKFLOW_FILE"
    exit 1
fi

echo "🔧 Updating GitHub workflow with fixed IP..."

# Replace the placeholder with actual allocation ID
sed -i.bak "s/FIXED_EIP_ALLOCATION: eipalloc-PLACEHOLDER/FIXED_EIP_ALLOCATION: $ALLOCATION_ID/" "$WORKFLOW_FILE"

if [ $? -eq 0 ]; then
    echo "✅ GitHub workflow updated successfully!"
    echo "   Backup created: ${WORKFLOW_FILE}.bak"
else
    echo "❌ Failed to update GitHub workflow"
    exit 1
fi

echo ""
echo "🎉 Fixed IP setup completed!"
echo ""
echo "📋 Summary:"
echo "   Fixed IP Address: $PUBLIC_IP"
echo "   Allocation ID: $ALLOCATION_ID"
echo "   Monthly Cost: ~$3.6 (always allocated)"
echo ""
echo "🚀 Next steps:"
echo "   1. Commit and push the updated workflow file"
echo "   2. Use GitHub Actions to start/stop infrastructure"
echo "   3. Your app will always use IP: $PUBLIC_IP"
echo ""
echo "💡 To update GitHub secrets with the new IP:"
echo "   PUBLIC_URL: http://$PUBLIC_IP"
echo "" 