# CI/CD Workflow Documentation

## 🎯 **Current Workflow Architecture**

ShopMefy uses a **modern CI/CD approach** with GitHub Actions for build and S3 for artifact distribution.

## 📋 **Workflow Overview**

### **Build and Deploy Workflow** (`.github/workflows/deploy-new.yml`)

The project uses **one optimized workflow** that handles:
1. **Build on GitHub Actions**: Backend + Frontend compilation with unlimited RAM
2. **S3 Artifact Storage**: Upload pre-compiled builds to S3
3. **EC2 Deployment**: Download from S3 and deploy (no build needed)
4. **Service Management**: Start services with Nginx proxy
5. **Health Verification**: Process checks and status

## ⚡ **Performance Benefits**

- 🏗️ **Build on GitHub Actions**: Unlimited RAM, no memory issues
- 📦 **Pre-compiled Artifacts**: No compilation on EC2
- ☁️ **S3 Distribution**: Fast, reliable artifact delivery
- 🚀 **Fast Deployment**: ~2 minutes vs 10+ minutes
- 💾 **Low EC2 Memory Usage**: Only runs services, no builds

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
- **Manual**: `workflow_dispatch` in GitHub Actions
- **Infrastructure Check**: Automatic EC2 status verification
- **Force Deploy**: Option to auto-start stopped infrastructure

### **2. Modern Deployment Steps**
```yaml
1. Infrastructure Check
   - Verify EC2 status and IP association
   - Auto-start infrastructure if needed

2. Build Phase (GitHub Actions)
   - Checkout code
   - Setup Node.js 20 with caching
   - Build backend (TypeScript → JavaScript)
   - Build frontend (React → Static files)
   - Package deployment artifacts

3. Artifact Distribution
   - Upload build to S3 bucket
   - Create versioned and latest artifacts
   - Generate deployment metadata

4. EC2 Deployment
   - SSH to EC2 instance
   - Download artifacts from S3
   - Extract pre-compiled builds
   - Install production dependencies only
   - Run database migrations
   - Start services (no build needed!)

5. Service Configuration
   - Configure Nginx reverse proxy
   - Start backend (port 8080)
   - Start frontend (port 3000)
   - Restart Nginx

6. Health Verification
   - Test application endpoints
   - Verify service status
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

