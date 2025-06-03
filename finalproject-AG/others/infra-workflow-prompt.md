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

## Workflow Features
11. **Manual Trigger** - workflow_dispatch with action choice (plan/apply/destroy)
12. **Instance Type Selection** - t3.micro/small/medium options
13. **Terraform Generation** - Dynamic main.tf and user_data.sh creation
14. **Output Display** - Show connection details and next steps
15. **Cost Estimation** - Display monthly cost (~$27-30)
16. **GitHub Secrets** - List required secrets for subsequent deployments

## Technical Specifications
- **Region**: us-east-1
- **Environment**: Production only
- **Database**: PostgreSQL 15.4, db.t3.micro, 20GB storage
- **Security**: Basic security groups, private database subnet
- **Monitoring**: CloudWatch basic logging
- **Backup**: 7-day retention, automated maintenance windows
- **Deploy Integration**: Compatible with existing CI/CD S3 upload pattern

