# Application Deployment Workflow Generation Prompt

Generate a complete GitHub Actions workflow for deploying a Node.js/React application to AWS EC2 with the following specifications:

## Deployment Flow
1. **Repository Checkout** - Get latest code from repository
2. **AWS Configuration** - Configure AWS credentials for S3 access
3. **Node.js Setup** - Install Node.js 20 with npm caching
4. **Backend Build** - Install dependencies and build backend application
5. **Frontend Build** - Install dependencies and build React frontend
6. **S3 Upload** - Sync built files to S3 bucket (backend and frontend separately)
7. **SSH Connection** - Connect to EC2 instance using SSH key
8. **Deployment Trigger** - Execute systemd service for automated deployment
9. **Health Checks** - Verify PM2 processes, Nginx status, and application health
10. **Cleanup** - Remove temporary SSH keys and files

## Workflow Features
11. **Manual Trigger** - workflow_dispatch with environment selection
12. **Environment Options** - Production and staging deployment targets
13. **Build Optimization** - Exclude unnecessary files from S3 upload
14. **Error Handling** - Comprehensive deployment status checks
15. **Service Management** - Automatic PM2 and Nginx service verification
16. **Deployment Summary** - Display connection details and management commands

## Technical Requirements
- **Node.js Version**: 20 with npm cache optimization
- **Build Process**: Production builds for both backend and frontend
- **S3 Sync**: Exclude node_modules, .git, logs, and .env files
- **EC2 Integration**: Use pre-configured shopmefy-deploy systemd service
- **Health Endpoint**: Check /api/health for application status
- **User Context**: Deploy as 'shopme' user with proper permissions

## Output Information
17. **Access URLs** - Frontend, backend API, and health check endpoints
18. **SSH Commands** - Connection and management commands
19. **Service Status** - PM2 process monitoring and log access
20. **Deployment Time** - Timestamp and environment details
