variable "name" {
  description = "Name of the RDS instance"
  type        = string
}

variable "engine" {
  description = "The database engine"
  type        = string
  default     = "postgres"
}

variable "engine_version" {
  description = "The engine version"
  type        = string
  default     = "15.4"
}

variable "instance_class" {
  description = "The instance type of the RDS instance"
  type        = string
  default     = "db.t3.micro"
}

variable "allocated_storage" {
  description = "The allocated storage in gigabytes"
  type        = number
  default     = 20
}

variable "max_allocated_storage" {
  description = "The upper limit to which Amazon RDS can automatically scale the storage"
  type        = number
  default     = 100
}

variable "storage_type" {
  description = "One of standard (magnetic), gp2 (general purpose SSD), or io1 (provisioned IOPS SSD)"
  type        = string
  default     = "gp2"
}

variable "storage_encrypted" {
  description = "Specifies whether the DB instance is encrypted"
  type        = bool
  default     = true
}

variable "db_name" {
  description = "The name of the database to create when the DB instance is created"
  type        = string
  default     = "vevurn"
}

variable "username" {
  description = "Username for the master DB user"
  type        = string
  default     = "postgres"
}

variable "manage_master_user_password" {
  description = "Set to true to allow RDS to manage the master user password in Secrets Manager"
  type        = bool
  default     = true
}

variable "port" {
  description = "The port on which the DB accepts connections"
  type        = string
  default     = "5432"
}

variable "vpc_id" {
  description = "ID of the VPC where to create security group"
  type        = string
}

variable "subnet_ids" {
  description = "A list of VPC subnet IDs"
  type        = list(string)
}

variable "allowed_security_groups" {
  description = "A list of security group IDs that are allowed to access the DB"
  type        = list(string)
  default     = []
}

variable "allowed_cidr_blocks" {
  description = "A list of CIDR blocks that are allowed to access the DB"
  type        = list(string)
  default     = []
}

variable "backup_retention_period" {
  description = "The backup retention period"
  type        = number
  default     = 30
}

variable "backup_window" {
  description = "The daily time range during which automated backups are created"
  type        = string
  default     = "03:00-04:00"
}

variable "maintenance_window" {
  description = "The window to perform maintenance in"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "auto_minor_version_upgrade" {
  description = "Indicates that minor engine upgrades will be applied automatically to the DB instance during the maintenance window"
  type        = bool
  default     = true
}

variable "multi_az" {
  description = "Specifies if the RDS instance is multi-AZ"
  type        = bool
  default     = false
}

variable "publicly_accessible" {
  description = "Bool to control if instance is publicly accessible"
  type        = bool
  default     = false
}

variable "monitoring_interval" {
  description = "The interval, in seconds, between points when Enhanced Monitoring metrics are collected for the DB instance"
  type        = number
  default     = 60
}

variable "performance_insights_enabled" {
  description = "Specifies whether Performance Insights are enabled"
  type        = bool
  default     = true
}

variable "performance_insights_retention_period" {
  description = "The amount of time in days to retain Performance Insights data"
  type        = number
  default     = 7
}

variable "deletion_protection" {
  description = "The database can't be deleted when this value is set to true"
  type        = bool
  default     = true
}

variable "skip_final_snapshot" {
  description = "Determines whether a final DB snapshot is created before the DB instance is deleted"
  type        = bool
  default     = false
}

variable "copy_tags_to_snapshot" {
  description = "On delete, copy all Instance tags to the final snapshot"
  type        = bool
  default     = true
}

variable "tags" {
  description = "A mapping of tags to assign to the resource"
  type        = map(string)
  default     = {}
}
