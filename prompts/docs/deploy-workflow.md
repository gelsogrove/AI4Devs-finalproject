# Application Deployment Workflow Documentation

## Current Deployment Architecture

The ShopMefy application uses a **direct SSH deployment** approach to AWS EC2 with the following specifications:

## Deployment Flow

### **1. Environment Setup** ⚙️
- Configure AWS credentials for RDS access
- Prepare SSH private key for EC2 connection
- Set deployment environment (dev/production)

### **2. Process Management** 🛑
- Stop existing Node.js backend processes (`node dist/index.js`)
- Stop existing Vite frontend processes (`vite preview`)
- Clean up any hanging npm processes

### **3. Code Deployment** 📥
- **Git Clone/Update**: Direct repository clone on EC2 server
- **Fresh Code**: `git fetch origin` + `git reset --hard origin/main`
- **Clean State**: Remove untracked files with `git clean -fd`

### **4. Backend Deployment** 🔧
- **Dependencies**: `npm ci --production` (production-only packages)
- **Environment**: Create `.env` with DATABASE_URL, OPENROUTER_API_KEY, JWT_SECRET
- **Build**: `npm run build` (TypeScript → JavaScript in dist/)
- **Database**: `npx prisma migrate deploy` + `npx prisma db seed`
- **Start**: `npm run start` → `node dist/index.js` on port 8080

### **5. Frontend Deployment** 🎨
- **Dependencies**: `npm ci --production`
- **Environment**: Create `.env` with VITE_API_URL pointing to backend
- **Build**: `npm run build` (React → static files in dist/)
- **Start**: `npm run start` → `vite preview --port 3000 --host`

### **6. Nginx Reverse Proxy** 🌐
- **Frontend Route**: `/` → `http://localhost:3000`
- **Backend Route**: `/api` → `http://localhost:8080`
- **Configuration**: Dynamic nginx config generation via echo commands
- **Service**: `nginx -t` validation + `systemctl restart nginx`

### **7. Health Verification** ✅
- Wait 10 seconds for services startup
- Check running processes: `ps aux | grep -E "(node|vite)"`
- Display application URLs and API endpoints
- Show deployment summary with timestamps

## Infrastructure Requirements

### **AWS Resources**
- **EC2 Instance**: t3.small (2GB RAM) with Ubuntu
- **RDS PostgreSQL**: Database service (always running)
- **S3 Bucket**: Document upload storage
- **Elastic IP**: Fixed public IP address
- **Security Groups**: Ports 22, 80, 443, 3000, 8080

### **Server Setup** (via Terraform user_data)
- **Node.js 20.x**: Latest LTS version
- **PM2**: Process manager (installed globally)
- **Nginx**: Reverse proxy server
- **Git**: Repository cloning capability

## GitHub Secrets Required

### **AWS Access**
- `AWS_ACCESS_KEY_ID`: AWS access key for RDS
- `AWS_SECRET_ACCESS_KEY`: AWS secret key for RDS

### **EC2 Connection**
- `EC2_HOST`: Public IP address of EC2 instance
- `SSH_PRIVATE_KEY`: RSA private key for SSH access

### **Application Configuration**
- `DATABASE_URL`: PostgreSQL connection string
- `OPENROUTER_API_KEY`: AI service API key
- `JWT_SECRET`: Authentication secret

## Workflow Triggers

### **Automatic Deployment**
- Triggers after successful CI/CD pipeline completion
- Only on `main` branch with successful tests

### **Manual Deployment**
- `workflow_dispatch` with environment selection
- Available environments: dev (production ready)

## Service Architecture

### **Application Stack**
```
Internet → Nginx (Port 80) → {
  / → React Frontend (Port 3000)
  /api → Node.js Backend (Port 8080)
}
```

### **Backend Services**
- **API Server**: Express.js with TypeScript
- **Database**: PostgreSQL via Prisma ORM
- **File Storage**: AWS S3 for document uploads
- **AI Integration**: OpenRouter API for chatbot

### **Frontend Services**
- **React App**: Vite-built static files served by Vite preview
- **UI Framework**: shadcn/ui with Tailwind CSS
- **State Management**: TanStack Query for API calls

## Deployment Benefits

### **Simplified Architecture**
- ✅ No S3 artifact uploads needed
- ✅ Direct git-based deployment
- ✅ Real-time code updates
- ✅ Simplified secret management

### **Cost Optimization**
- ✅ Single EC2 instance deployment
- ✅ Managed RDS for reliability
- ✅ S3 only for user uploads
- ✅ Elastic IP for consistent access

### **Development Workflow**
- ✅ Push to main → Auto deploy
- ✅ Manual deployment option
- ✅ Environment-specific configs
- ✅ Health check verification

## Access Information

### **Application URLs**
- **Frontend**: `http://{EC2_HOST}/`
- **Backend API**: `http://{EC2_HOST}/api`
- **Health Check**: `http://{EC2_HOST}/api/health`

### **Management Commands**
- **SSH Access**: `ssh -i key.pem ubuntu@{EC2_HOST}`
- **Backend Logs**: `tail -f ~/AI4Devs-finalproject/backend.log`
- **Frontend Logs**: `tail -f ~/AI4Devs-finalproject/frontend.log`
- **Process Status**: `ps aux | grep -E "(node|vite)"`

## Security Considerations

### **Network Security**
- SSH access via private key only
- Database accessible only from EC2
- S3 bucket with restricted access
- Nginx proxy for external access

### **Application Security**
- Environment variables for secrets
- JWT-based authentication
- Input validation and sanitization
- CORS and security headers configured
