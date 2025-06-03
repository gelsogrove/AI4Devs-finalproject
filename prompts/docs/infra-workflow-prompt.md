# Terraform Infrastructure Workflow Generation Prompt


## Infrastructure Requirements
1. **AWS Provider Setup** - Configure AWS credentials and Terraform
2. **VPC & Networking** - Create VPC, subnets, internet gateway, route tables
3. **Security Groups** - Web server (SSH, HTTP, HTTPS) and database security groups
4. **EC2 Instance** - t3.micro Ubuntu with pre-configured software stack
5. **RDS PostgreSQL** - Managed database with automatic backups
6. **S3 Bucket** - For application deployments with versioning
7. **Secrets Manager** - Database credentials management
8. **IAM Roles** - EC2 and RDS monitoring permissions
9. **Elastic IP** - Static IP for web server
10. **User Data Script** - Auto-install Node.js, PM2, Nginx, Docker, create shopme user
11. **Environment Configuration** - Complete .env file with all required variables
12. **API Keys Integration** - GitHub Secrets to production environment variables

## Workflow Features
13. **Manual Trigger** - workflow_dispatch with action choice (plan/apply/destroy)
14. **Instance Type Selection** - t3.micro/small/medium options
15. **Terraform Generation** - Dynamic main.tf and user_data.sh creation
16. **Output Display** - Show connection details and next steps
17. **Cost Estimation** - Display monthly cost (~$27-30)
18. **GitHub Secrets** - List required secrets for subsequent deployments

## Required GitHub Secrets
- **AWS_ACCESS_KEY_ID** - AWS access key for Terraform operations
- **AWS_SECRET_ACCESS_KEY** - AWS secret key for Terraform operations
- **OPENROUTER_API_KEY** - API key for ChatGPT/Claude LLM integration
- **HUGGINGFACE_API_KEY** - API key for embeddings and document search
- **JWT_SECRET** - Secret key for authentication tokens

## Environment Variables Configured
The workflow automatically creates a complete .env file with:
- NODE_ENV=production
- PORT=8080
- DATABASE_URL (from AWS Secrets Manager)
- OPENROUTER_API_KEY (from GitHub Secrets)
- HUGGINGFACE_API_KEY (from GitHub Secrets)
- JWT_SECRET (from GitHub Secrets)
- FRONTEND_URL (dynamic public IP)
- AWS_REGION and AWS_S3_BUCKET

## Technical Specifications
- **Region**: us-east-1
- **Environment**: Production only
- **Database**: PostgreSQL 15.4, db.t3.micro, 20GB storage
- **Security**: Basic security groups, private database subnet
- **Monitoring**: CloudWatch basic logging
- **Backup**: 7-day retention, automated maintenance windows
- **Deploy Integration**: Compatible with existing CI/CD S3 upload pattern

