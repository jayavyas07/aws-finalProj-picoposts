

# Security group for ECS EC2 hosts

resource "aws_security_group" "ecs_host" {
  name        = "${var.project}-ecs-host-sg"
  description = "Allow HTTP from internet and outbound for ECS hosts"
  vpc_id      = values(aws_subnet.public)[0].vpc_id

  # Allow HTTP (port 80) from anywhere for now
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.project}-ecs-host-sg"
    Project = var.project
  }
}

# ECS EC2 capacity
data "aws_ssm_parameter" "ecs_ami" {
  name = "/aws/service/ecs/optimized-ami/amazon-linux-2/recommended/image_id"
}

# Launch template for ECS container instances
resource "aws_launch_template" "ecs" {
  name_prefix   = "${var.project}-ecs-"
  image_id      = data.aws_ssm_parameter.ecs_ami.value
  instance_type = var.instance_type

  iam_instance_profile {
    name = aws_iam_instance_profile.ecs_instance_profile.name
  }

  # Put instances in public subnets, with the ECS host security group
  network_interfaces {
    associate_public_ip_address = true
    security_groups             = [aws_security_group.ecs_host.id]
  }

  # Make each EC2 instance join our ECS cluster
  # user_data = base64encode(<<-EOF
  #   #!/bin/bash
  #   echo ECS_CLUSTER=${aws_ecs_cluster.this.name} >> /etc/ecs/ecs.config
  # EOF
  # )

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Group for ECS cluster capacity
resource "aws_autoscaling_group" "ecs" {
  name                = "${var.project}-ecs-asg"
  max_size            = var.max_capacity # from variables.tf (e.g. 2)
  min_size            = 1
  desired_capacity    = var.desired_capacity # e.g. 1
  vpc_zone_identifier = [for s in aws_subnet.public : s.id]
  health_check_type   = "EC2"
  force_delete        = true

  launch_template {
    id      = aws_launch_template.ecs.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.project}-ecs-instance"
    propagate_at_launch = true
  }

  # This tag lets ECS know these instances are container instances it can use
  tag {
    key                 = "AmazonECSManaged"
    value               = "true"
    propagate_at_launch = true
  }
}
