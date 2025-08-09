# Vevurn POS System - Infrastructure as Code
# Terraform configuration for AWS deployment

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    # Configure based on your AWS setup
    # bucket = "vevurn-terraform-state"
    # key    = "infrastructure/terraform.tfstate"
    # region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

# Variables
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "development"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "vevurn-pos"
}

# VPC Configuration
module "vpc" {
  source = "./modules/vpc"
  
  project_name = var.project_name
  environment  = var.environment
  
  vpc_cidr = "10.0.0.0/16"
  
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.10.0/24", "10.0.20.0/24"]
  
  availability_zones = slice(data.aws_availability_zones.available.names, 0, 2)
}

# Database Module
module "database" {
  source = "./modules/database"
  
  project_name = var.project_name
  environment  = var.environment
  
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  
  db_instance_class = var.environment == "production" ? "db.t3.medium" : "db.t3.micro"
  db_allocated_storage = var.environment == "production" ? 100 : 20
}

# Redis Module
module "redis" {
  source = "./modules/redis"
  
  project_name = var.project_name
  environment  = var.environment
  
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  
  node_type = var.environment == "production" ? "cache.t3.medium" : "cache.t3.micro"
}

# Web Services Module
module "web_service" {
  source = "./modules/web-service"
  
  project_name = var.project_name
  environment  = var.environment
  
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  
  database_endpoint = module.database.endpoint
  redis_endpoint    = module.redis.endpoint
}

# Monitoring Module
module "monitoring" {
  source = "./modules/monitoring"
  
  project_name = var.project_name
  environment  = var.environment
  
  vpc_id            = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
}

# Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "database_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = module.database.endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis cluster endpoint"
  value       = module.redis.endpoint
}

output "web_service_url" {
  description = "Web service URL"
  value       = module.web_service.service_url
}
