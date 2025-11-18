output "cdn_domain" { value = aws_cloudfront_distribution.cdn.domain_name }
output "frontend_bucket" { value = aws_s3_bucket.frontend.id }
output "uploads_bucket" { value = aws_s3_bucket.uploads.id }
output "db_primary_endpoint" { value = aws_db_instance.primary.address }
output "db_replica_endpoint" { value = var.enable_read_replica && length(aws_db_instance.replica) > 0 ? aws_db_instance.replica[0].address : "" }