# Google Drive-like Cloud Storage Application

A complete, professional cloud storage application similar to Google Drive built with Terraform on AWS.

## Features

- **File Upload**: Users can upload files and folders with drag-and-drop support
- **File Management**: View, download, and organize files in a hierarchical structure  
- **Role-Based Access Control**: 
  - **Admin/Editor Role**: Can upload, edit, delete, and view all files
  - **Viewer Role**: Can only view and upload files (cannot edit or delete)
- **User Authentication**: Secure login system with JWT tokens
- **Professional UI**: Clean, modern interface similar to Google Drive

## Architecture

The application uses a serverless architecture on AWS:

- **AWS S3**: Primary storage for files with server-side encryption
- **AWS Lambda**: Serverless backend API functions
- **AWS API Gateway**: RESTful API endpoints
- **AWS Cognito**: User authentication and authorization
- **AWS CloudFront**: CDN for fast file delivery
- **AWS DynamoDB**: Metadata storage for files and user permissions
- **AWS IAM**: Proper roles and policies for security

## Project Structure

```
/terraform/          # Infrastructure as code
/frontend/           # Web application
/backend/            # Lambda functions
/docs/               # Documentation
```

## Quick Start

1. **Prerequisites**
   - AWS CLI configured
   - Terraform installed
   - Node.js for frontend and Lambda development

2. **Deploy Infrastructure**
   ```bash
   cd terraform
   terraform init
   terraform plan
   terraform apply
   ```

3. **Deploy Frontend**
   ```bash
   cd frontend
   npm install
   npm run build
   # Upload to S3 bucket created by Terraform
   ```

4. **Deploy Backend**
   ```bash
   cd backend
   npm install
   # Lambda functions deployed via Terraform
   ```

## Security

- Encrypted file storage (S3 server-side encryption)
- Secure API endpoints with proper authentication
- Role-based access validation on all operations
- CORS configuration for web access
- Input validation and sanitization

## Documentation

See the `/docs` directory for detailed documentation on:
- [Deployment Guide](docs/deployment.md)
- [Usage Guide](docs/usage.md)
- [API Reference](docs/api.md)

## License

MIT License - see LICENSE file for details.