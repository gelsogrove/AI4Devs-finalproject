# CI/CD Workflow Documentation

## 🎯 **Current Workflow Architecture**

ShopMefy uses a **simplified CI/CD approach** with GitHub Actions for automated deployment to AWS EC2.

## 📋 **Workflow Overview**

### **Single Deployment Workflow** (`.github/workflows/deploy.yml`)

The project uses **one main workflow** that handles:
1. **Code Deployment**: Direct SSH to EC2 + Git pull
2. **Environment Setup**: Auto-create .env files with secrets
3. **Application Build**: Backend + Frontend build on EC2
4. **Service Management**: Start services with Nginx proxy
5. **Health Verification**: Process checks and status

## 🏗️ **Deployment Architecture**

### **Infrastructure**
- **EC2 Instance**: t3.small (2GB RAM) with Ubuntu
- **RDS PostgreSQL**: Managed database service
- **S3 Bucket**: Document uploads storage
- **Nginx**: Reverse proxy (Frontend + Backend)

### **Service Stack**
```
Internet → Nginx (Port 80) → {
  / → React Frontend (Port 3000)
  /api → Node.js Backend (Port 8080)
}
```

## 🔄 **Deployment Flow**

### **1. Trigger Conditions**
- **Automatic**: Push to `main` branch
- **Manual**: `workflow_dispatch` in GitHub Actions

### **2. Deployment Steps**
```yaml
1. Environment Setup
   - Configure AWS credentials
   - Prepare SSH private key

2. Process Management
   - Stop existing Node.js processes
   - Stop existing Vite processes

3. Code Deployment
   - SSH to EC2 instance
   - Git fetch + reset to origin/main
   - Clean untracked files

4. Backend Deployment
   - npm ci --production
   - Create .env with secrets
   - npm run build
   - Prisma migrate + seed
   - Start on port 8080

5. Frontend Deployment
   - npm ci --production
   - Create .env with API URL
   - npm run build
   - Start on port 3000

6. Nginx Configuration
   - Generate reverse proxy config
   - Restart Nginx service

7. Health Verification
   - Wait for services startup
   - Check running processes
   - Display deployment summary
```

## 🔑 **Required GitHub Secrets**

### **Infrastructure Secrets**
```
AWS_ACCESS_KEY_ID          # AWS access key
AWS_SECRET_ACCESS_KEY      # AWS secret key
EC2_HOST                   # EC2 public IP
SSH_PRIVATE_KEY            # SSH private key for EC2
```

### **Application Secrets**
```
DATABASE_URL               # PostgreSQL connection string
OPENROUTER_API_KEY         # AI service API key
JWT_SECRET                 # Authentication secret
```

## 🧪 **Testing Strategy**

### **Local Development Testing**
```bash
# Backend tests
cd backend
npm run test:unit           # Unit tests
npm run test:integration    # Integration tests
npm run test:coverage       # Coverage report

# Frontend tests
cd frontend
npm run test               # Unit tests (Vitest)
npm run test:e2e           # E2E tests (Cypress)
```

### **Pre-Deployment Validation**
- **Manual Testing**: Local development environment
- **Code Review**: Pull request process
- **Build Verification**: Local `npm run build` success

## 🚀 **Deployment Commands**

### **Manual Deployment**
```bash
# Via GitHub Actions UI
GitHub → Actions → Deploy Application → Run workflow
```

### **Infrastructure Management**
```bash
# Create infrastructure
cd terraform && terraform apply

# Get deployment info
terraform output web_public_ip
terraform output ssh_command
```

### **Direct SSH Deployment** (Emergency)
```bash
# Connect to EC2
ssh -i key.pem ubuntu@EC2_HOST

# Manual deployment
cd ~/AI4Devs-finalproject
git pull origin main
cd backend && npm ci && npm run build && npm start &
cd frontend && npm ci && npm run build && npm start &
```

## 🔍 **Monitoring & Debugging**

### **Deployment Logs**
```bash
# GitHub Actions logs
GitHub → Actions → Latest workflow run → View logs

# Production logs (SSH to EC2)
ssh -i key.pem ubuntu@EC2_HOST
tail -f ~/AI4Devs-finalproject/backend.log
tail -f ~/AI4Devs-finalproject/frontend.log
```

### **Health Checks**
```bash
# Application URLs
Frontend: http://EC2_HOST/
Backend API: http://EC2_HOST/api
Health Check: http://EC2_HOST/api/health

# Process monitoring
ssh -i key.pem ubuntu@EC2_HOST
ps aux | grep -E "(node|vite)"
sudo systemctl status nginx
```

### **Database Monitoring**
```bash
# Database connection test
ssh -i key.pem ubuntu@EC2_HOST
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users;"
```

## 🛠️ **Troubleshooting**

### **Common Deployment Issues**

#### **SSH Connection Failed**
```bash
# Check SSH key format
cat SSH_PRIVATE_KEY | head -1
# Should start with: -----BEGIN RSA PRIVATE KEY-----

# Test SSH connection
ssh -i key.pem ubuntu@EC2_HOST echo "Connection OK"
```

#### **Build Failures**
```bash
# Check Node.js version on EC2
ssh -i key.pem ubuntu@EC2_HOST node --version
# Should be: v20.x.x

# Check disk space
ssh -i key.pem ubuntu@EC2_HOST df -h
```

#### **Service Start Issues**
```bash
# Check port availability
ssh -i key.pem ubuntu@EC2_HOST
lsof -i :3000  # Frontend
lsof -i :8080  # Backend

# Kill hanging processes
pkill -f "node dist/index.js"
pkill -f "vite preview"
```

#### **Database Connection Issues**
```bash
# Test database connectivity
ssh -i key.pem ubuntu@EC2_HOST
psql "$DATABASE_URL" -c "SELECT 1;"

# Check RDS status in AWS Console
AWS Console → RDS → Databases → shopmefy-db
```

## 📊 **Deployment Metrics**

### **Typical Deployment Time**
- **Code Update**: ~30 seconds
- **Backend Build**: ~2 minutes
- **Frontend Build**: ~1 minute
- **Service Restart**: ~30 seconds
- **Total**: ~4-5 minutes

### **Success Indicators**
- ✅ GitHub Actions workflow completes successfully
- ✅ Application accessible at http://EC2_HOST/
- ✅ API responds at http://EC2_HOST/api/health
- ✅ Database queries work correctly
- ✅ File uploads to S3 function

## 🔒 **Security Considerations**

### **Secrets Management**
- ✅ All secrets stored in GitHub environment secrets
- ✅ SSH private key with restricted permissions
- ✅ Database credentials auto-generated by Terraform
- ✅ API keys rotated regularly

### **Network Security**
- ✅ RDS in private subnets only
- ✅ Security groups restrict access
- ✅ SSH access via private key only
- ✅ Nginx proxy for external access

## 📚 **Related Documentation**

- **Infrastructure**: `prompts/docs/infra-workflow-prompt.md`
- **Environment Setup**: `prompts/docs/env-settup.md`
- **Scripts**: `prompts/docs/scripts.md`
- **Database**: `prompts/docs/database-schema.md`

## 🎯 **Best Practices**

### **Development Workflow**
1. ✅ Test locally before pushing to main
2. ✅ Use feature branches for development
3. ✅ Monitor deployment logs in GitHub Actions
4. ✅ Verify application health after deployment

### **Deployment Safety**
1. ✅ Always backup database before major changes
2. ✅ Test infrastructure changes in separate environment
3. ✅ Monitor application metrics after deployment
4. ✅ Have rollback plan ready for critical issues

