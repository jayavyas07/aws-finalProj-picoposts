#############################
# EC2 backend for PicoPosts #
#############################

# Who am I (account id)?
data "aws_caller_identity" "current" {}

# Amazon Linux 2 AMI for EC2 instances
data "aws_ami" "amazon_linux2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

#########################
# Security Group        #
#########################

resource "aws_security_group" "app_ec2" {
  name        = "${var.project}-app-ec2-sg"
  description = "Allow HTTP from internet to app EC2"
  vpc_id      = aws_vpc.this.id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Project = var.project
    Name    = "${var.project}-app-ec2-sg"
  }
}

#########################
# IAM for EC2           #
#########################

# Role so EC2 can talk to ECR + SSM
resource "aws_iam_role" "app_ec2_role" {
  name = "${var.project}-app-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect    = "Allow",
        Principal = { Service = "ec2.amazonaws.com" },
        Action    = "sts:AssumeRole"
      }
    ]
  })
}

# Allow SSM (optional, handy) and ECR read-only
resource "aws_iam_role_policy_attachment" "app_ec2_ssm" {
  role       = aws_iam_role.app_ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "app_ec2_ecr" {
  role       = aws_iam_role.app_ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

# Inline: allow reading the DB password from SSM
resource "aws_iam_role_policy" "app_ec2_ssm_inline" {
  name = "${var.project}-app-ec2-ssm-inline"
  role = aws_iam_role.app_ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = ["ssm:GetParameter"],
        Resource = aws_ssm_parameter.db_password.arn
      }
    ]
  })
}

resource "aws_iam_instance_profile" "app_ec2_profile" {
  name = "${var.project}-app-ec2-profile"
  role = aws_iam_role.app_ec2_role.name
}

#########################
# Launch template       #
#########################

resource "aws_launch_template" "app" {
  name_prefix   = "${var.project}-app-"
  image_id      = data.aws_ami.amazon_linux2.id
  instance_type = var.instance_type

  iam_instance_profile {
    name = aws_iam_instance_profile.app_ec2_profile.name
  }

  vpc_security_group_ids = [aws_security_group.app_ec2.id]

  # Cloud-init / user data to install Docker, login to ECR, run the container
  user_data = base64encode(<<-EOF
    #!/bin/bash
    set -xe

    yum update -y
    amazon-linux-extras install docker -y || yum install -y docker
    systemctl enable docker
    systemctl start docker

    # Install awscli if not present
    if ! command -v aws >/dev/null 2>&1; then
      yum install -y awscli
    fi

    # Login to ECR
    aws ecr get-login-password --region ${var.region} \
      | docker login --username AWS --password-stdin \
        ${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.region}.amazonaws.com

    # Pull latest API image
    docker pull \
      ${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.region}.amazonaws.com/aws-finalproj-picoposts-api:latest

    # Export env vars for the app
    export DB_HOST_WRITE="${aws_db_instance.primary.address}"
    export DB_HOST_READ="${aws_db_instance.primary.address}"
    export DB_USER="${var.db_username}"
    export DB_NAME="${var.db_name}"
    export DB_PASSWORD_PARAM="${aws_ssm_parameter.db_password.name}"
    export AWS_REGION="${var.region}"

    # Run container on port 80 -> container port 3000 (Express)
    docker run -d \
      --name picoposts-api \
      -e DB_HOST_WRITE \
      -e DB_HOST_READ \
      -e DB_USER \
      -e DB_NAME \
      -e DB_PASSWORD_PARAM \
      -e AWS_REGION \
      -p 80:3000 \
      ${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.region}.amazonaws.com/aws-finalproj-picoposts-api:latest
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Project = var.project
      Name    = "${var.project}-app-ec2"
    }
  }
}

#########################
# Auto Scaling Group    #
#########################

resource "aws_autoscaling_group" "app" {
  name              = "${var.project}-app-asg"
  desired_capacity  = 1
  min_size          = 1
  max_size          = 2
  health_check_type = "EC2"

  # Use your two public subnets
  vpc_zone_identifier = [for s in aws_subnet.public : s.id]

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Project"
    value               = var.project
    propagate_at_launch = true
  }

  tag {
    key                 = "Name"
    value               = "${var.project}-app-ec2"
    propagate_at_launch = true
  }
}

#########################
# Output for backend    #
#########################

# Discover the instances created by the ASG
data "aws_instances" "app" {
  depends_on = [aws_autoscaling_group.app]

  instance_tags = {
    Name = "${var.project}-app-ec2"
  }

  instance_state_names = ["running"]
}

output "app_public_ip" {
  value       = length(data.aws_instances.app.public_ips) > 0 ? data.aws_instances.app.public_ips[0] : ""
  description = "Public IP of one app EC2 instance. Use this in frontend API_BASE."
}
