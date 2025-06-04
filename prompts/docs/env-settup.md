# 🔧 Environment Variables Setup

This document explains how to set up environment variables for the ShopMefy application.

## 📁 Files Structure

```
AI4Devs-finalproject/
├── backend/
│   ├── env.template          ← Backend environment template
│   └── .env                  ← Your actual backend config (create this)
├── frontend/
│   ├── env.template          ← Frontend environment template  
│   └── .env                  ← Your actual frontend config (create this)
└── ENV_SETUP.md             ← This file
```

## 🚀 Quick Setup

### 1. Backend Environment
```bash
cd backend
cp env.template .env
# Edit .env with your actual values
```

### 2. Frontend Environment
```bash
cd frontend
cp env.template .env
# Edit .env with your actual values
```

## 🔑 Required Values to Fill

### Backend (.env)
- `OPENROUTER_API_KEY` → Your OpenRouter API key for AI services
- `JWT_SECRET` → Strong secret for JWT tokens (change in production!)
- `S3_BUCKET_NAME` → Your AWS S3 bucket name
- `EC2_HOST` → Your EC2 server IP/hostname
- `EC2_SSH_KEY` → Your private SSH key content

### Frontend (.env)
- `VITE_API_URL` → Backend API URL (http://localhost:3001 for dev)

## 🔒 Security Notes

- ⚠️ **NEVER commit .env files to git**
- ✅ **Use different values for production**
- ✅ **Keep secrets secure**
- ✅ **Rotate keys regularly**

## 📋 GitHub Secrets (for CI/CD)

These environment variables should also be configured as GitHub Secrets:

### Required Secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_ACCOUNT_ID`
- `S3_BUCKET_NAME`
- `EC2_HOST`
- `EC2_USER`
- `EC2_SSH_KEY`
- `OPENROUTER_API_KEY`
- `JWT_SECRET`
- `DATABASE_URL`

### How to add GitHub Secrets:
1. Go to: `Repository → Settings → Secrets and variables → Actions`
2. Click "New repository secret"
3. Add each secret with the exact name and value

## 🎯 Production vs Development

### Development:
- Database: Local PostgreSQL (port 5434)
- API: http://localhost:3001
- Frontend: http://localhost:3000

### Production:
- Database: Production PostgreSQL
- API: https://your-domain.com/api
- Frontend: https://your-domain.com 