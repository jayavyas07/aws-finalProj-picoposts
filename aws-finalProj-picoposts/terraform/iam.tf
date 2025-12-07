# ECS instance profile to allow ECS agent, ECR pulls, CW logs
resource "aws_iam_role" "ecs_instance_role" {
  name               = "${var.project}-ecs-instance-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_trust.json
}

data "aws_iam_policy_document" "ec2_trust" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy" "ecs_instance_minimal" {
  name = "${var.project}-ecs-instance-minimal"
  role = aws_iam_role.ecs_instance_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      # --- ECS agent minimal permissions ---
      {
        Effect = "Allow",
        Action = [
          "ecs:RegisterContainerInstance",
          "ecs:DeregisterContainerInstance",
          "ecs:DiscoverPollEndpoint",
          "ecs:Submit*",
          "ecs:Poll"
        ],
        Resource = "*"
      },

      # --- CloudWatch logs only for this app ---
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Resource = "arn:aws:logs:${var.region}:${data.aws_caller_identity.current.account_id}:log-group:/ecs/${var.project}:*"
      },

      # --- ECR read only for ONE repo ---
      {
        Effect = "Allow",
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer"
        ],
        Resource = "arn:aws:ecr:${var.region}:${data.aws_caller_identity.current.account_id}:repository/${var.project}-api"
      }
    ]
  })
}


resource "aws_iam_instance_profile" "ecs_instance_profile" {
  name = "${var.project}-ecs-instance-profile"
  role = aws_iam_role.ecs_instance_role.name
}

# ECS task execution role (pull image, write logs)
resource "aws_iam_role" "ecs_exec" {
  name               = "${var.project}-ecs-exec-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_trust.json
}

data "aws_iam_policy_document" "ecs_tasks_trust" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy_attachment" "ecs_exec_default" {
  role       = aws_iam_role.ecs_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ECS task role (app access to S3 uploads + SSM param)
resource "aws_iam_role" "ecs_task" {
  name               = "${var.project}-ecs-task-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_trust.json
}

resource "aws_iam_role_policy" "ecs_task_inline" {
  name = "${var.project}-task-inline"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["ssm:GetParameter"]
        Resource = aws_ssm_parameter.db_password.arn
      },
      {
        Effect   = "Allow"
        Action   = ["s3:PutObject", "s3:GetObject"]
        Resource = ["${aws_s3_bucket.uploads.arn}/*"]
      },
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "*"
      }
    ]
  })
}
