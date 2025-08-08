output "db_instance_id" {
  description = "The RDS instance ID"
  value       = aws_db_instance.main.id
}

output "db_instance_arn" {
  description = "The RDS instance ARN"
  value       = aws_db_instance.main.arn
}

output "db_instance_endpoint" {
  description = "The RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "db_instance_hosted_zone_id" {
  description = "The canonical hosted zone ID of the DB instance"
  value       = aws_db_instance.main.hosted_zone_id
}

output "db_instance_port" {
  description = "The RDS instance port"
  value       = aws_db_instance.main.port
}

output "db_instance_name" {
  description = "The database name"
  value       = aws_db_instance.main.db_name
}

output "db_instance_username" {
  description = "The master username for the database"
  value       = aws_db_instance.main.username
  sensitive   = true
}

output "db_instance_master_user_secret_arn" {
  description = "The ARN of the master user secret"
  value       = aws_db_instance.main.master_user_secret[0].secret_arn
}

output "db_subnet_group_id" {
  description = "The database subnet group name"
  value       = aws_db_subnet_group.main.id
}

output "db_subnet_group_arn" {
  description = "The ARN of the database subnet group"
  value       = aws_db_subnet_group.main.arn
}

output "security_group_id" {
  description = "The security group ID"
  value       = aws_security_group.rds.id
}

output "parameter_group_id" {
  description = "The database parameter group name"
  value       = aws_db_parameter_group.main.id
}

output "parameter_group_arn" {
  description = "The ARN of the database parameter group"
  value       = aws_db_parameter_group.main.arn
}
