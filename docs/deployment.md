# Deployment Guide

This guide walks you through deploying the Google Drive-like cloud storage application to AWS.

## Prerequisites

Before deploying, ensure you have the following tools installed:

- [AWS CLI](https://aws.amazon.com/cli/) (v2.x)
- [Terraform](https://www.terraform.io/downloads.html) (v1.0+)
- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/) (v8+)

## AWS Configuration

1. **Configure AWS CLI**:
   ```bash
   aws configure
   ```
   Provide your AWS Access Key ID, Secret Access Key, default region, and output format.

2. **Verify AWS credentials**:
   ```bash
   aws sts get-caller-identity
   ```

## Step 1: Deploy Infrastructure

1. **Navigate to the terraform directory**:
   ```bash
   cd terraform
   ```

2. **Initialize Terraform**:
   ```bash
   terraform init
   ```

3. **Review the deployment plan**:
   ```bash
   terraform plan
   ```

4. **Apply the infrastructure**:
   ```bash
   terraform apply
   ```
   Type `yes` when prompted to confirm the deployment.

5. **Save the outputs**:
   ```bash
   terraform output > ../terraform-outputs.json
   ```

The infrastructure deployment will create:
- S3 buckets for file storage and frontend hosting
- DynamoDB tables for metadata storage
- Cognito User Pool for authentication
- Lambda functions for the backend API
- API Gateway for REST endpoints
- CloudFront distribution for CDN
- IAM roles and policies

## Step 2: Build and Deploy Backend

The Lambda functions are automatically deployed as part of the Terraform infrastructure. If you need to update them:

1. **Install dependencies for each Lambda function**:
   ```bash
   cd ../backend/src/auth && npm install
   cd ../files && npm install
   cd ../users && npm install
   cd ../../..
   ```

2. **Redeploy with Terraform**:
   ```bash
   cd terraform
   terraform apply
   ```

## Step 3: Build and Deploy Frontend

1. **Navigate to the frontend directory**:
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create configuration file**:
   Create a `src/config.prod.js` file with the Terraform outputs:
   ```javascript
   window.APP_CONFIG = {
     apiUrl: 'YOUR_API_GATEWAY_URL',
     region: 'YOUR_AWS_REGION',
     cognitoUserPoolId: 'YOUR_USER_POOL_ID',
     cognitoUserPoolClientId: 'YOUR_USER_POOL_CLIENT_ID',
     cognitoIdentityPoolId: 'YOUR_IDENTITY_POOL_ID',
     s3FilesBucket: 'YOUR_S3_FILES_BUCKET',
     cloudfrontDomain: 'YOUR_CLOUDFRONT_DOMAIN'
   };
   ```

4. **Build the frontend**:
   ```bash
   npm run build
   ```

5. **Deploy to S3**:
   ```bash
   aws s3 sync dist/ s3://YOUR_FRONTEND_BUCKET_NAME --delete
   ```

6. **Invalidate CloudFront cache**:
   ```bash
   aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
   ```

## Step 4: Configure Domain (Optional)

If you want to use a custom domain:

1. **Update Terraform variables**:
   ```bash
   cd ../terraform
   ```
   
   Edit `terraform.tfvars`:
   ```hcl
   domain_name = "your-domain.com"
   ```

2. **Apply the changes**:
   ```bash
   terraform apply
   ```

3. **Update DNS records**:
   Create a CNAME record pointing your domain to the CloudFront distribution domain.

## Step 5: Create Admin User

1. **Access the application** at your CloudFront domain or S3 website URL
2. **Register a new user** with the role "admin"
3. **Confirm your email** (check spam folder if needed)
4. **Sign in** with admin credentials

## Environment Configuration

### Development Environment

For development, you can override the default configuration:

```bash
export ENVIRONMENT=dev
export AWS_REGION=us-east-1
```

### Production Environment

For production deployment:

```bash
export ENVIRONMENT=prod
export AWS_REGION=us-east-1
```

Update `terraform.tfvars`:
```hcl
environment = "prod"
s3_force_destroy = false
```

## Security Considerations

### Production Deployment

1. **Enable deletion protection**:
   ```hcl
   s3_force_destroy = false
   ```

2. **Use KMS encryption**:
   Consider using customer-managed KMS keys for enhanced security.

3. **Enable CloudTrail**:
   Enable AWS CloudTrail for audit logging.

4. **Configure WAF**:
   Consider adding AWS WAF for additional protection.

5. **Set up monitoring**:
   Configure CloudWatch alarms for monitoring.

### Access Control

1. **Review IAM policies**: Ensure least privilege access
2. **Enable MFA**: For admin users
3. **Regular security audits**: Review access logs and permissions

## Troubleshooting

### Common Issues

1. **Terraform fails with permission errors**:
   - Ensure your AWS credentials have sufficient permissions
   - Check that you're using the correct AWS region

2. **Lambda functions not deploying**:
   - Verify Node.js dependencies are installed
   - Check that zip files are created correctly

3. **Frontend not loading**:
   - Verify S3 bucket policy allows CloudFront access
   - Check that configuration values are correct

4. **API requests failing**:
   - Verify API Gateway deployment
   - Check Lambda function logs in CloudWatch

### Debugging

1. **Check CloudWatch Logs**:
   ```bash
   aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/cloud-storage"
   ```

2. **Monitor API Gateway**:
   ```bash
   aws apigateway get-deployments --rest-api-id YOUR_API_ID
   ```

3. **Test Lambda functions**:
   ```bash
   aws lambda invoke --function-name cloud-storage-auth-dev response.json
   ```

## Cleanup

To remove all resources:

```bash
cd terraform
terraform destroy
```

**Warning**: This will delete all data including uploaded files. Make sure to backup any important data first.

## Next Steps

After deployment:

1. Configure monitoring and alerting
2. Set up automated backups
3. Implement CI/CD pipeline
4. Set up staging environment
5. Configure custom domain and SSL certificate

For more information, see:
- [Usage Guide](usage.md)
- [API Reference](api.md)