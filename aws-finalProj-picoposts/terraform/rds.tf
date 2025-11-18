# Generate a random DB password
resource "random_password" "db" {
  length  = 20
  special = true
}

# Store DB password in SSM Parameter Store (avoid reserved /aws prefix)
resource "aws_ssm_parameter" "db_password" {
  name  = "/app/${lower(var.project)}/db/password"
  type  = "SecureString"
  value = random_password.db.result
}

# Primary RDS instance (free-tier friendly)
resource "aws_db_instance" "primary" {
  identifier        = "${lower(var.project)}-db"
  engine            = var.db_engine
  engine_version    = var.db_engine_version
  instance_class    = "db.t3.micro"
  db_name           = var.db_name
  username          = var.db_username
  password          = random_password.db.result
  allocated_storage = var.db_allocated_storage
  storage_type      = "gp2"

  # Free-tier restriction workaround: only 0 or 1 days allowed in your plan.
  backup_retention_period    = 1
  multi_az                   = false
  publicly_accessible        = false
  skip_final_snapshot        = true
  auto_minor_version_upgrade = true
  copy_tags_to_snapshot      = true
  monitoring_interval        = 0

  db_subnet_group_name   = aws_db_subnet_group.rds.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  enabled_cloudwatch_logs_exports = var.db_engine == "postgres" ? ["postgresql"] : ["error", "general", "slowquery"]
  deletion_protection             = false
}

# Optional read replica (off by default via enable_read_replica)
resource "aws_db_instance" "replica" {
  count = var.enable_read_replica ? 1 : 0

  identifier                 = "${lower(var.project)}-db-replica"
  engine                     = aws_db_instance.primary.engine
  instance_class             = "db.t3.micro"
  replicate_source_db        = aws_db_instance.primary.identifier
  publicly_accessible        = false
  auto_minor_version_upgrade = true
  db_subnet_group_name       = aws_db_subnet_group.rds.name
  vpc_security_group_ids     = [aws_security_group.rds.id]
  deletion_protection        = false
}
