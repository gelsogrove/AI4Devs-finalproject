# ShopMe AWS Infrastructure with Terraform

## Overview
This document outlines the Terraform configuration for deploying the ShopMe application infrastructure on AWS. The infrastructure will be deployed via a GitHub Action workflow that can be triggered manually.

## Infrastructure Components
- **Region**: us-east-1
- **EC2 Instances**:
  - Frontend instance (t2.micro) - accessible on port 443 (HTTPS)
  - Backend instance (t2.micro) - accessible on port 8080
- **RDS PostgreSQL**:
  - Instance type: db.t3.micro
  - Minimum storage allocation
  - Weekly automated backups
  - Only accessible from the Backend EC2 instance
- **S3 Bucket**:
  - For application assets and Terraform state
- **Security Groups**:
  - Frontend: Allow HTTPS (port 443) and SSH access
  - Backend: Allow port 8080 and SSH access
  - RDS: Allow access only from Backend instance on port 5432

## Implementation Details
1. **AWS Configuration**:
   - Use existing AWS credentials for user "gelso" with FullAccess permissions
   - Utilize the default VPC and subnets
   - AWS credentials are already configured locally

2. **Terraform State**:
   - Store state in S3 bucket for team collaboration
   - Add terraform.tfstate and related files to .gitignore

3. **File Structure**:
   - All Terraform files will be placed in the `@tf` directory
   - Standard Terraform files: main.tf, variables.tf, outputs.tf, providers.tf

4. **GitHub Action Workflow**:
   - Create a new workflow file: `.github/workflows/terraform-deploy.yml`
   - Configure for manual triggering with `workflow_dispatch`
   - Include steps for Terraform init, plan, and apply
   - Use GitHub Secrets for AWS credentials

## Security Considerations
- Restrict RDS access to only the Backend EC2 instance
- Use security groups to limit access to necessary ports only
- Implement HTTPS for Frontend access
- Store sensitive information in GitHub Secrets, not in code

## Outputs
- Frontend public IP and DNS
- Backend public IP and DNS
- RDS endpoint (for internal configuration)
- S3 bucket details

## Maintenance
- Weekly automated backups for RDS
- Terraform state stored in S3 for durability

## Implementation Steps
1. Create the `@tf` directory
2. Create Terraform configuration files
3. Create GitHub Action workflow file
4. Configure GitHub Secrets for AWS credentials
5. Manually trigger the workflow to deploy infrastructure

# Terraform
*.tfstate
*.tfstate.backup
.terraform/
crash.log
override.tf
override.tf.json
*_override.tf
*_override.tf.json
.terraform.lock.hcl

- Attiviami bucket s3
- BACKUP automatici del DB  settimanali
- region         = "us-east-1"

el @backend debe ser accesible por medio del puerto 8080

el @frontend debe ser accesible por medio del puerto 80

- Utiliza terraform en la carpeta @tf


nel file di env hai tutti i nomi necesssari se non capisci qualcosa chiedi


