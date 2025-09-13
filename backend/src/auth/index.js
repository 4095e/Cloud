const AWS = require('aws-sdk');

// Configure AWS SDK
const dynamodb = new AWS.DynamoDB.DocumentClient();
const cognito = new AWS.CognitoIdentityServiceProvider();

const TABLE_NAME = process.env.DYNAMODB_TABLE;
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

/**
 * Authentication and Authorization Lambda Function
 * Handles user registration, login, token validation, and role management
 */
exports.handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    try {
        const { httpMethod, path, body, headers: requestHeaders } = event;
        const parsedBody = body ? JSON.parse(body) : {};

        console.log('Auth Lambda Event:', { httpMethod, path, body: parsedBody });

        // Handle OPTIONS requests for CORS
        if (httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ message: 'CORS preflight' })
            };
        }

        switch (path) {
            case '/auth/register':
                return await handleRegister(parsedBody, headers);
            case '/auth/login':
                return await handleLogin(parsedBody, headers);
            case '/auth/verify':
                return await handleVerifyToken(requestHeaders, headers);
            case '/auth/profile':
                return await handleGetProfile(requestHeaders, headers);
            default:
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Not found' })
                };
        }
    } catch (error) {
        console.error('Auth Lambda Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error.message 
            })
        };
    }
};

/**
 * Handle user registration
 */
async function handleRegister(body, headers) {
    const { email, password, name, role = 'viewer' } = body;

    if (!email || !password || !name) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing required fields' })
        };
    }

    try {
        // Create user in Cognito
        const params = {
            UserPoolId: USER_POOL_ID,
            Username: email,
            UserAttributes: [
                { Name: 'email', Value: email },
                { Name: 'name', Value: name },
                { Name: 'custom:role', Value: role },
                { Name: 'email_verified', Value: 'true' }
            ],
            TemporaryPassword: password,
            MessageAction: 'SUPPRESS'
        };

        const result = await cognito.adminCreateUser(params).promise();
        
        // Set permanent password
        await cognito.adminSetUserPassword({
            UserPoolId: USER_POOL_ID,
            Username: email,
            Password: password,
            Permanent: true
        }).promise();

        // Store user metadata in DynamoDB
        await dynamodb.put({
            TableName: TABLE_NAME,
            Item: {
                pk: `USER#${result.User.Username}`,
                sk: 'PROFILE',
                email,
                name,
                role,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        }).promise();

        return {
            statusCode: 201,
            headers,
            body: JSON.stringify({ 
                message: 'User registered successfully',
                userId: result.User.Username
            })
        };
    } catch (error) {
        console.error('Registration error:', error);
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ 
                error: 'Registration failed',
                message: error.message 
            })
        };
    }
}

/**
 * Handle user login (placeholder - Cognito handles this via frontend SDK)
 */
async function handleLogin(body, headers) {
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
            message: 'Login handled by Cognito SDK on frontend' 
        })
    };
}

/**
 * Verify JWT token and return user info
 */
async function handleVerifyToken(requestHeaders, headers) {
    const authHeader = requestHeaders.Authorization || requestHeaders.authorization;
    
    if (!authHeader) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Missing Authorization header' })
        };
    }

    // In a real implementation, you would validate the JWT token here
    // For now, we'll return a placeholder response
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
            valid: true,
            message: 'Token validation handled by API Gateway JWT authorizer'
        })
    };
}

/**
 * Get user profile
 */
async function handleGetProfile(requestHeaders, headers) {
    try {
        // Extract user ID from JWT token (this would be done by API Gateway authorizer)
        // For now, we'll use a placeholder
        const userId = 'placeholder-user-id';

        const result = await dynamodb.get({
            TableName: TABLE_NAME,
            Key: {
                pk: `USER#${userId}`,
                sk: 'PROFILE'
            }
        }).promise();

        if (!result.Item) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'User not found' })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                user: {
                    id: userId,
                    email: result.Item.email,
                    name: result.Item.name,
                    role: result.Item.role,
                    createdAt: result.Item.createdAt
                }
            })
        };
    } catch (error) {
        console.error('Get profile error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to get profile',
                message: error.message 
            })
        };
    }
}