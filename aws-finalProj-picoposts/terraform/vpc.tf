resource "aws_vpc" "this" {
  cidr_block           = "10.20.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = { Name = "${var.project}-vpc" }
}


resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.this.id
}


# Public subnets (ECS EC2 + tasks)
resource "aws_subnet" "public" {
  for_each                = toset(var.azs)
  vpc_id                  = aws_vpc.this.id
  cidr_block              = cidrsubnet(aws_vpc.this.cidr_block, 4, index(var.azs, each.key))
  map_public_ip_on_launch = true
  availability_zone       = each.key
  tags                    = { Name = "${var.project}-public-${each.key}" }
}


resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id
}
resource "aws_route" "igw" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.igw.id
}
resource "aws_route_table_association" "pub_assoc" {
  for_each       = aws_subnet.public
  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}


# Private subnets (RDS)
resource "aws_subnet" "private" {
  for_each          = toset(var.azs)
  vpc_id            = aws_vpc.this.id
  cidr_block        = cidrsubnet(aws_vpc.this.cidr_block, 4, 8 + index(var.azs, each.key))
  availability_zone = each.key
  tags              = { Name = "${var.project}-private-${each.key}" }
}


resource "aws_db_subnet_group" "rds" {
  name       = "${lower(var.project)}-rds-subnets"
  subnet_ids = [for s in aws_subnet.private : s.id]
}