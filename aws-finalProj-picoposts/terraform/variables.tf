# General
variable "project" {
  default = "aws-finalProj-picoposts"
}

variable "region" {
  default = "us-west-1"
}

variable "api_image" {
  description = "ECR image uri for backend"
  type        = string
  default     = "240378375517.dkr.ecr.us-west-1.amazonaws.com/aws-finalproj-picoposts-api:latest"
}


variable "azs" {
  type    = list(string)
  default = ["us-west-1a", "us-west-1c"]
}

# ECS/EC2
variable "instance_type" {
  default = "t3.micro"
}

variable "desired_capacity" {
  default = 1
}

variable "max_capacity" {
  default = 2
}



# RDS
variable "use_rds" {
  type    = bool
  default = true
}

variable "enable_read_replica" {
  type    = bool
  default = false
}

variable "db_username" {
  default = "appuser"
}

variable "db_name" {
  default = "picoposts"
}

variable "db_engine" {
  # switch to "postgres" if you prefer
  default = "mysql"
}

variable "db_engine_version" {
  # e.g., "16" for Postgres
  default = "8.0"
}

variable "db_allocated_storage" {
  default = 20
}

# Frontend
variable "frontend_index_cache_ttl" {
  default = 60
}
