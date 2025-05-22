# Deployment Process

This document outlines the CI/CD pipeline implementation using GitHub Actions for a Node.js application with frontend and backend components.

## CI/CD Workflow (.github/workflows/ci-cd.yml)

The pipeline triggers on pull requests to the main branch and consists of two main jobs: build and deploy.

### Build Job Steps:
1. Checkout repository
2. Install dependencies for both backend and frontend
3. Run backend tests
4. Build both backend and frontend
5. Execute Prisma migrations
6. Set up Docker and Docker Compose
7. Start database services
8. Launch backend (port 3001) and frontend (port 3000)
9. Wait for services to become available
10. Run Cypress E2E tests

### Deploy Job Steps:
The deployment process involves uploading to S3 first, then deploying to EC2.

## Deployment Commands (In Order)

### S3 Upload Commands
```
# 1. Configure AWS credentials (if not already set up)
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_REGION="your-aws-region"

# 2. Upload backend to S3
aws s3 cp ./backend s3://your-bucket-name --recursive
```

### EC2 Deployment Commands
```
# 3. Connect to EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-instance-ip

# 4. Download backend from S3
aws s3 cp s3://your-bucket-name /path/to/destination --recursive

# 5. Navigate to backend directory
cd /path/to/destination

# 6. Install dependencies
npm install

# 7. Build the backend
npm run build

# 8. Install PM2 globally
npm install -g pm2

# 9. Start backend with PM2
pm2 start npm --name backend -- start

# 10. Make PM2 persist across reboots
pm2 save
pm2 startup

# 11. Install and configure Nginx
sudo apt-get update
sudo apt-get install nginx -y

# 12. Configure Nginx as reverse proxy
sudo nano /etc/nginx/sites-available/default
# Add configuration to redirect /api to backend

# 13. Validate Nginx config and restart
sudo nginx -t
sudo systemctl restart nginx
```

## Additional Requirements
- Backend runs in the background managed by PM2
- Cypress tests execute only when all services are ready
- Backend logs accessible via `pm2 logs`
- PM2 ensures backend resilience by restarting on failure
- Nginx serves as a reverse proxy redirecting port 80 traffic to the backend 