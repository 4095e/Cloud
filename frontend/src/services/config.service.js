/**
 * Configuration Service
 * Manages application configuration and environment settings
 */
export class ConfigService {
    constructor() {
        this.config = {
            // Default development configuration
            apiUrl: 'https://your-api-id.execute-api.us-east-1.amazonaws.com/v1',
            region: 'us-east-1',
            cognitoUserPoolId: 'us-east-1_xxxxxxxxx',
            cognitoUserPoolClientId: 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
            cognitoIdentityPoolId: 'us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
            s3FilesBucket: 'cloud-storage-files-dev-xxxxxxxx',
            cloudfrontDomain: 'xxxxxxxxxxxxxx.cloudfront.net'
        };
        
        this.initialized = false;
    }

    /**
     * Initialize configuration
     * In a real deployment, this would fetch configuration from Terraform outputs
     */
    async init() {
        try {
            // Check if we have environment-specific configuration
            if (window.APP_CONFIG) {
                this.config = { ...this.config, ...window.APP_CONFIG };
            }

            // Override with environment variables if available
            if (process.env.NODE_ENV === 'development') {
                // Development overrides
                console.log('Running in development mode');
            }

            this.initialized = true;
            console.log('Configuration initialized:', this.config);
        } catch (error) {
            console.error('Failed to initialize configuration:', error);
            throw error;
        }
    }

    /**
     * Get complete configuration object
     */
    getConfig() {
        if (!this.initialized) {
            throw new Error('Configuration not initialized. Call init() first.');
        }
        return this.config;
    }

    /**
     * Get specific configuration value
     */
    get(key) {
        if (!this.initialized) {
            throw new Error('Configuration not initialized. Call init() first.');
        }
        return this.config[key];
    }

    /**
     * Update configuration value
     */
    set(key, value) {
        this.config[key] = value;
    }

    /**
     * Get API URL with path
     */
    getApiUrl(path = '') {
        const baseUrl = this.get('apiUrl');
        return path ? `${baseUrl}${path.startsWith('/') ? path : '/' + path}` : baseUrl;
    }

    /**
     * Get S3 bucket name
     */
    getS3Bucket() {
        return this.get('s3FilesBucket');
    }

    /**
     * Get CloudFront domain
     */
    getCloudfrontDomain() {
        return this.get('cloudfrontDomain');
    }

    /**
     * Check if running in production
     */
    isProduction() {
        return process.env.NODE_ENV === 'production';
    }

    /**
     * Check if running in development
     */
    isDevelopment() {
        return process.env.NODE_ENV === 'development';
    }
}