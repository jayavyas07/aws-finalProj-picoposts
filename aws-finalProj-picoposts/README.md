📌 PicoPosts — Tiny Social Feed on AWS

EC2 + RDS + S3 + CloudFront + ECR + SSM + Terraform

PicoPosts is a fully serverless-ready micro social platform built as an end-to-end cloud project for learning AWS infrastructure, containerized backend deployment, secure credential management, and CDN-accelerated frontend delivery.

Users can:

Create an account (email → UUID)

Create tiny posts

Load their personalized feed from RDS via the API running on EC2

🚀 Architecture Overview
CloudFront (HTTPS CDN)
|
|-- S3 (Static Frontend)
|
+-- /api/* → EC2 Application Load Balancer → EC2 Instance (Node.js API)
|
+-- RDS MySQL (Private Subnets)
|
+-- SSM Parameter Store (DB Password)
|
+-- ECR (API Docker Image)


All AWS resources are provisioned using Terraform.

✨ Features

Backend: Node.js + Express (Dockerized)

Frontend: Pure HTML/JS served from S3 + CloudFront

Database: MySQL on Amazon RDS

Compute: EC2 behind an ALB (Terraform managed)

Secrets: Stored securely in AWS SSM Parameter Store

Images: Stored in Amazon ECR

IaC: Full infrastructure defined using Terraform

CDN: CloudFront distribution for secure HTTPS delivery

🛠 Deployment Instructions
1. Prerequisites

Install and configure:

AWS CLI

Terraform

Docker

MySQL client

Ensure your AWS CLI is configured:

aws configure

2. Build & Push Backend Docker Image to ECR
   cd backend
   ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
   REGION=us-west-1
   REPO_NAME=aws-finalproj-picoposts-api


Create repository (if not exists):

aws ecr create-repository \
--repository-name ${REPO_NAME} \
--region ${REGION} || true


Login and push:

aws ecr get-login-password --region ${REGION} \
| docker login --username AWS --password-stdin \
${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com

docker buildx build \
--platform linux/amd64 \
-t ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${REPO_NAME}:latest \
. \
--push


Copy the final image URI — you'll use it in Terraform.

3. Configure Terraform
   cd terraform


Create terraform.tfvars:

region        = "us-west-1"
project       = "aws-finalProj-picoposts"

db_username   = "appuser"
db_name       = "picoposts"

api_image     = "YOUR_ECR_IMAGE_URI"

4. Deploy AWS Infrastructure
   terraform init
   terraform plan
   terraform apply


Terraform provisions:

VPC & subnets

Security groups

RDS MySQL

EC2 + ALB + IAM role

S3 bucket for frontend

CloudFront distribution

Parameter Store secret

Important outputs:

app_public_ip

db_primary_endpoint

frontend_bucket

cdn_domain

5. Initialize Database Schema

Fetch DB password from SSM:

aws ssm get-parameter \
--name "/app/aws-finalproj-picoposts/db/password" \
--with-decryption \
--query Parameter.Value \
--output text


Connect:

mysql -h <DB_ENDPOINT> -u appuser -p


Inside MySQL:

CREATE DATABASE IF NOT EXISTS picoposts;
USE picoposts;

CREATE TABLE IF NOT EXISTS users (
id VARCHAR(36) PRIMARY KEY,
email VARCHAR(255) NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
id VARCHAR(36) PRIMARY KEY,
user_id VARCHAR(36) NOT NULL,
content TEXT NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (user_id) REFERENCES users(id)
);

6. Configure Frontend

In frontend/app.js, update API base:

const API_BASE = "";   // CloudFront default (same origin)


Or direct to EC2 (not recommended):

const API_BASE = "http://<app_public_ip>";

7. Upload Frontend to S3
   cd frontend

FRONTEND_BUCKET=<terraform output>

aws s3 sync . s3://${FRONTEND_BUCKET} --delete

8. Invalidate CloudFront Cache
   aws cloudfront create-invalidation \
   --distribution-id <DIST_ID> \
   --paths "/*"

✔ Testing the Application

Open:

https://<cdn_domain>

1. Create user

Enter email → SIGN UP

A UUID userId appears

2. Create a post

Enter content → POST

3. Load feed

Paste same userId → LOAD FEED

Posts appear in JSON format

📡 API Reference
POST /api/users

Request:

{
"email": "jaya@sjsu.edu"
}


Response:

{
"userId": "uuid-string"
}

POST /api/posts
{
"userId": "uuid-string",
"content": "Hello!"
}

GET /api/feed?userId=<uuid>

Returns:

{
"posts": [
{
"id": "uuid",
"content": "Hello",
"created_at": "timestamp"
}
]
}

🧹 Cleanup

To delete all AWS resources:

terraform destroy