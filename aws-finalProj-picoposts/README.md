# 📌 PicoPosts - Tiny Social Feed on AWS

> **A micro social platform demonstrating AWS infrastructure, containerized deployment, and secure cloud architecture**

PicoPosts is a full-stack cloud application built to showcase modern AWS services and infrastructure-as-code practices. Users can create accounts, post content, and view their personalized feed—all powered by enterprise-grade AWS services.

**Tech Stack:** EC2 • RDS • S3 • CloudFront • ECR • SSM • Terraform

---

## 🎯 What Can Users Do?

- ✅ **Create an account** with email → receive unique UUID
- ✅ **Post short messages** to their personal feed
- ✅ **Load their feed** from RDS via a containerized Node.js API

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    CloudFront (CDN)                      │
│                     HTTPS Distribution                   │
└────┬───────────────────────────────────────────┬────────┘
     │                                           │
     │ Static Assets                        │ API Calls
     ▼                                           ▼
┌─────────────┐                      ┌──────────────────┐
│   S3 Bucket │                      │   EC2 Instance   │
│  (Frontend) │                      │  + Node.js API   │
│ HTML/CSS/JS │                      │  (Docker)        │
└─────────────┘                      └────────┬─────────┘
                                              │
                         ┌────────────────────┼────────────────┐
                         │                    │                │
                         ▼                    ▼                ▼
                  ┌─────────────┐     ┌─────────────┐  ┌──────────┐
                  │  RDS MySQL  │     │     SSM     │  │   ECR    │
                  │  (Private)  │     │  Parameter  │  │  Docker  │
                  │   Database  │     │    Store    │  │  Images  │
                  └─────────────┘     └─────────────┘  └──────────┘
```

**All infrastructure provisioned with Terraform**

### Key Components

| Service | Purpose |
|---------|---------|
| **CloudFront** | HTTPS CDN for fast, secure content delivery |
| **S3** | Static frontend hosting (HTML/JS) |
| **EC2 + ALB** | Application server running Dockerized Node.js API |
| **RDS MySQL** | Relational database (private subnets) |
| **SSM Parameter Store** | Encrypted credential management |
| **ECR** | Private Docker image registry |
| **Terraform** | Infrastructure as Code (IaC) |

---

## 🚀 Deployment Guide

### Prerequisites

Install the following tools:

- [AWS CLI](https://aws.amazon.com/cli/) (configured with credentials)
- [Terraform](https://www.terraform.io/) (v1.0+)
- [Docker](https://www.docker.com/)
- MySQL client

**Verify AWS configuration:**
```bash
aws configure
aws sts get-caller-identity
```

---

### Step 1: Build & Push Docker Image to ECR

Navigate to the backend directory and set variables:

```bash
cd backend

export ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export REGION=us-west-1
export REPO_NAME=aws-finalproj-picoposts-api
```

**Create ECR repository** (if it doesn't exist):
```bash
aws ecr create-repository \
  --repository-name ${REPO_NAME} \
  --region ${REGION} || true
```

**Authenticate Docker to ECR:**
```bash
aws ecr get-login-password --region ${REGION} \
  | docker login --username AWS --password-stdin \
    ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com
```

**Build and push image:**
```bash
docker buildx build \
  --platform linux/amd64 \
  -t ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${REPO_NAME}:latest \
  . \
  --push
```

> 📝 **Save the image URI** — you'll need it for Terraform configuration

---

### Step 2: Configure Terraform

Navigate to the Terraform directory:

```bash
cd terraform
```

Create a `terraform.tfvars` file:

```hcl
region      = "us-west-1"
project     = "aws-finalProj-picoposts"

db_username = "appuser"
db_name     = "picoposts"

api_image   = "YOUR_ECR_IMAGE_URI_HERE"
```

Replace `YOUR_ECR_IMAGE_URI_HERE` with the ECR image URI from Step 1.

---

### Step 3: Deploy Infrastructure

Initialize and apply Terraform configuration:

```bash
terraform init
terraform plan
terraform apply
```

**What gets created:**
- ✅ VPC with public/private subnets
- ✅ Security groups and IAM roles
- ✅ RDS MySQL database
- ✅ EC2 instance with Application Load Balancer
- ✅ S3 bucket for frontend
- ✅ CloudFront distribution
- ✅ SSM Parameter Store secret

**Important Terraform outputs:**
- `app_public_ip` — EC2 instance IP
- `db_primary_endpoint` — RDS endpoint
- `frontend_bucket` — S3 bucket name
- `cdn_domain` — CloudFront domain

---

### Step 4: Initialize Database Schema

**Retrieve database password from SSM:**
```bash
aws ssm get-parameter \
  --name "/app/aws-finalproj-picoposts/db/password" \
  --with-decryption \
  --query Parameter.Value \
  --output text
```

**Connect to RDS:**
```bash
mysql -h <DB_ENDPOINT> -u appuser -p
```

**Run schema creation:**
```sql
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
```

---

### Step 5: Configure & Deploy Frontend

**Update API endpoint** in `frontend/app.js`:

```javascript
// Recommended: Use same-origin (CloudFront)
const API_BASE = "";

// Alternative: Direct EC2 access (not recommended for production)
// const API_BASE = "http://<app_public_ip>";
```

**Upload frontend to S3:**
```bash
cd frontend

export FRONTEND_BUCKET=$(terraform output -raw frontend_bucket)

aws s3 sync . s3://${FRONTEND_BUCKET} --delete
```

**Invalidate CloudFront cache:**
```bash
export DIST_ID=$(terraform output -raw cloudfront_distribution_id)

aws cloudfront create-invalidation \
  --distribution-id ${DIST_ID} \
  --paths "/*"
```

---

## ✅ Testing Your Application

Open your CloudFront domain in a browser:
```
https://<cdn_domain>
```

### Test Workflow

1. **Create User Account**
    - Enter email address
    - Click **SIGN UP**
    - Copy the generated `userId` (UUID format)

2. **Create a Post**
    - Paste your `userId`
    - Enter post content
    - Click **POST**

3. **View Your Feed**
    - Paste your `userId`
    - Click **LOAD FEED**
    - Your posts appear as JSON

---

## 📡 API Reference

### Create User
```http
POST /api/users
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### Create Post
```http
POST /api/posts
Content-Type: application/json

{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "content": "Hello, PicoPosts!"
}
```

**Response:**
```json
{
  "postId": "660e8400-e29b-41d4-a716-446655440001"
}
```

---

### Get Feed
```http
GET /api/feed?userId=550e8400-e29b-41d4-a716-446655440000
```

**Response:**
```json
{
  "posts": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "content": "Hello, PicoPosts!",
      "created_at": "2025-11-18T10:30:00Z"
    }
  ]
}
```

---

## 🧹 Cleanup

To destroy all AWS resources and avoid charges:

```bash
cd terraform
terraform destroy
```



---

## 📚 Outcomes

This project demonstrates:

- ✅ **Infrastructure as Code** with Terraform
- ✅ **Containerization** with Docker and ECR
- ✅ **Secure credential management** using SSM Parameter Store
- ✅ **Serverless-adjacent architecture** with S3 and CloudFront
- ✅ **Database design** with RDS MySQL
- ✅ **API development** with Node.js and Express
- ✅ **Network security** with VPCs, subnets, and security groups
- ✅ **CDN optimization** for global content delivery

---
