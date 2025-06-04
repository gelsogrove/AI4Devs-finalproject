# ===================================
# OUTPUTS
# ===================================

output "web_public_ip" {
  description = "Public IP address of the web server"
  value       = aws_eip.web.public_ip
}

output "web_public_dns" {
  description = "Public DNS name of the web server"
  value       = aws_eip.web.public_dns
}

output "database_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.postgres.endpoint
  sensitive   = true
}

output "database_host" {
  description = "RDS instance host (without port)"
  value       = split(":", aws_db_instance.postgres.endpoint)[0]
  sensitive   = true
}

output "s3_bucket_name" {
  description = "S3 bucket name for deployments"
  value       = aws_s3_bucket.deployments.bucket
}

output "secret_manager_arn" {
  description = "AWS Secrets Manager ARN for database credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "ssh_private_key" {
  description = "SSH private key for connecting to the server"
  value       = tls_private_key.main.private_key_pem
  sensitive   = true
}

output "ssh_command" {
  description = "SSH command to connect to the server"
  value       = "ssh -i shopmefy_key.pem ubuntu@${aws_eip.web.public_ip}"
}

output "database_password" {
  description = "Database password"
  value       = random_password.db_password.result
  sensitive   = true
}

output "database_url" {
  description = "Complete database URL"
  value       = "postgresql://shopmefy:${random_password.db_password.result}@${split(":", aws_db_instance.postgres.endpoint)[0]}:5432/shopmefy"
  sensitive   = true
} 