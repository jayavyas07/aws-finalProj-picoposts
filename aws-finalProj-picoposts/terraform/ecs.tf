# resource "aws_ecs_cluster" "this" {
#   name = "${var.project}-cluster"
# }
#
# resource "aws_cloudwatch_log_group" "api" {
#   name              = "/ecs/${var.project}/api"
#   retention_in_days = 7
# }
#
# resource "aws_ecs_task_definition" "api" {
#   family                   = "${var.project}-task"
#   requires_compatibilities = ["EC2"]
#   network_mode             = "bridge"
#   cpu                      = 256
#   memory                   = 512
#   execution_role_arn       = aws_iam_role.ecs_exec.arn
#   task_role_arn            = aws_iam_role.ecs_task.arn
#
#   container_definitions = jsonencode([
#     {
#       name      = "api"
#       image     = var.api_image
#       essential = true
#       portMappings = [
#         { containerPort = 3000 }
#       ]
#       environment = [
#         { name = "DB_HOST_WRITE", value = aws_db_instance.primary.address },
#         { name = "DB_USER", value = var.db_username },
#         { name = "DB_NAME", value = var.db_name },
#         # For now just pass password directly from SSM param value if you want:
#         { name = "DB_PASSWORD", value = random_password.db.result }
#       ]
#       logConfiguration = {
#         logDriver = "awslogs"
#         options = {
#           awslogs-group         = aws_cloudwatch_log_group.api.name
#           awslogs-region        = var.region
#           awslogs-stream-prefix = "api"
#         }
#       }
#     },
#     {
#       name      = "nginx"
#       image     = "nginx:alpine"
#       essential = true
#       portMappings = [
#         { containerPort = 80, hostPort = 80 }
#       ]
#       dependsOn = [
#         { containerName = "api", condition = "START" }
#       ]
#       logConfiguration = {
#         logDriver = "awslogs"
#         options = {
#           awslogs-group         = aws_cloudwatch_log_group.api.name
#           awslogs-region        = var.region
#           awslogs-stream-prefix = "nginx"
#         }
#       }
#       command = [
#         "/bin/sh", "-c",
#         "mkdir -p /etc/nginx && cat <<'CF' > /etc/nginx/nginx.conf\n${file("${path.module}/../app/backend/nginx.conf")}\nCF\n&& nginx -g 'daemon off;'"
#       ]
#     }
#   ])
# }
#
# resource "aws_ecs_service" "api" {
#   name            = "${var.project}-svc"
#   cluster         = aws_ecs_cluster.this.id
#   task_definition = aws_ecs_task_definition.api.arn
#   desired_count   = 1
#
#   deployment_controller {
#     type = "ECS"
#   }
# }
