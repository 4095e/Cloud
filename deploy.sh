#!/bin/bash

# Cloud Storage Application Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."
    
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install it first."
        exit 1
    fi
    
    print_success "All requirements are met"
}

# Check AWS credentials
check_aws_credentials() {
    print_status "Checking AWS credentials..."
    
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials are not configured. Run 'aws configure' first."
        exit 1
    fi
    
    print_success "AWS credentials are configured"
}

# Deploy infrastructure with Terraform
deploy_infrastructure() {
    print_status "Deploying infrastructure with Terraform..."
    
    cd terraform
    
    # Check if terraform.tfvars exists
    if [ ! -f "terraform.tfvars" ]; then
        print_warning "terraform.tfvars not found. Creating from example..."
        cp terraform.tfvars.example terraform.tfvars
        print_warning "Please edit terraform.tfvars with your desired values, then run this script again."
        exit 1
    fi
    
    # Initialize Terraform
    print_status "Initializing Terraform..."
    terraform init
    
    # Plan deployment
    print_status "Planning Terraform deployment..."
    terraform plan -out=deployment.tfplan
    
    # Ask for confirmation
    echo -e "\n${YELLOW}Please review the Terraform plan above.${NC}"
    read -p "Do you want to proceed with the deployment? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Deployment cancelled"
        exit 1
    fi
    
    # Apply infrastructure
    print_status "Applying Terraform configuration..."
    terraform apply deployment.tfplan
    
    # Save outputs
    print_status "Saving Terraform outputs..."
    terraform output -json > ../terraform-outputs.json
    
    print_success "Infrastructure deployed successfully"
    cd ..
}

# Install backend dependencies
install_backend_dependencies() {
    print_status "Installing backend dependencies..."
    
    for dir in backend/src/auth backend/src/files backend/src/users; do
        if [ -d "$dir" ]; then
            print_status "Installing dependencies for $dir..."
            cd "$dir"
            npm install --production
            cd - > /dev/null
        fi
    done
    
    print_success "Backend dependencies installed"
}

# Build and deploy frontend
deploy_frontend() {
    print_status "Building and deploying frontend..."
    
    cd frontend
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    # Create production config from Terraform outputs
    print_status "Creating production configuration..."
    if [ -f "../terraform-outputs.json" ]; then
        node -e "
        const outputs = require('../terraform-outputs.json');
        const config = {
            apiUrl: outputs.api_gateway_url.value,
            region: 'us-east-1',
            cognitoUserPoolId: outputs.cognito_user_pool_id.value,
            cognitoUserPoolClientId: outputs.cognito_user_pool_client_id.value,
            cognitoIdentityPoolId: outputs.cognito_identity_pool_id.value,
            s3FilesBucket: outputs.s3_files_bucket_name.value,
            cloudfrontDomain: outputs.cloudfront_domain_name.value
        };
        
        const configJs = 'window.APP_CONFIG = ' + JSON.stringify(config, null, 2) + ';';
        require('fs').writeFileSync('public/config.js', configJs);
        "
        
        # Add config script to index.html
        if ! grep -q "config.js" public/index.html; then
            sed -i.bak 's|</head>|    <script src="/config.js"></script>\n</head>|' public/index.html
        fi
    else
        print_warning "Terraform outputs not found. Using default configuration."
    fi
    
    # Build frontend
    print_status "Building frontend..."
    npm run build
    
    # Get S3 bucket name from Terraform outputs
    if [ -f "../terraform-outputs.json" ]; then
        FRONTEND_BUCKET=$(node -e "console.log(require('../terraform-outputs.json').s3_frontend_bucket_name.value)")
        DISTRIBUTION_ID=$(node -e "console.log(require('../terraform-outputs.json').cloudfront_distribution_id.value)")
        
        # Deploy to S3
        print_status "Deploying to S3 bucket: $FRONTEND_BUCKET..."
        aws s3 sync dist/ "s3://$FRONTEND_BUCKET" --delete
        
        # Invalidate CloudFront cache
        print_status "Invalidating CloudFront cache..."
        aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*" > /dev/null
        
        print_success "Frontend deployed successfully"
    else
        print_error "Cannot deploy frontend: Terraform outputs not found"
        exit 1
    fi
    
    cd ..
}

# Main deployment function
main() {
    echo -e "${BLUE}"
    echo "=================================="
    echo "  Cloud Storage Deployment"
    echo "=================================="
    echo -e "${NC}"
    
    check_requirements
    check_aws_credentials
    
    # Parse command line arguments
    case "${1:-all}" in
        "infrastructure"|"infra")
            deploy_infrastructure
            ;;
        "frontend")
            install_backend_dependencies
            deploy_frontend
            ;;
        "all")
            deploy_infrastructure
            install_backend_dependencies
            deploy_frontend
            ;;
        *)
            echo "Usage: $0 [all|infrastructure|frontend]"
            echo "  all            - Deploy infrastructure and frontend (default)"
            echo "  infrastructure - Deploy only infrastructure"
            echo "  frontend       - Deploy only frontend"
            exit 1
            ;;
    esac
    
    echo -e "\n${GREEN}=================================="
    echo "  Deployment Complete!"
    echo "==================================${NC}"
    
    if [ -f "terraform-outputs.json" ]; then
        CLOUDFRONT_URL=$(node -e "console.log(require('./terraform-outputs.json').cloudfront_domain_name.value)")
        echo -e "Application URL: ${BLUE}https://$CLOUDFRONT_URL${NC}"
    fi
    
    echo -e "\nNext steps:"
    echo -e "1. Visit your application URL"
    echo -e "2. Register a new admin user"
    echo -e "3. Start uploading files!"
}

# Run main function
main "$@"