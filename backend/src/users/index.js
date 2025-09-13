const AWS = require('aws-sdk');

// Configure AWS SDK
const dynamodb = new AWS.DynamoDB.DocumentClient();
const cognito = new AWS.CognitoIdentityServiceProvider();

const TABLE_NAME = process.env.DYNAMODB_TABLE;
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

/**
 * Users Management Lambda Function
 * Handles user profile operations, role management, and user administration
 */
exports.handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    try {
        const { httpMethod, path, body, queryStringParameters, headers: requestHeaders } = event;
        const parsedBody = body ? JSON.parse(body) : {};

        console.log('Users Lambda Event:', { httpMethod, path, body: parsedBody, queryStringParameters });

        // Handle OPTIONS requests for CORS
        if (httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ message: 'CORS preflight' })
            };
        }

        // Extract user info from JWT (this would normally be done by API Gateway authorizer)
        const userId = extractUserFromAuth(requestHeaders);
        const userRole = extractRoleFromAuth(requestHeaders);

        switch (true) {
            case path === '/users/profile' && httpMethod === 'GET':
                return await handleGetProfile(userId, headers);
            case path === '/users/profile' && httpMethod === 'PUT':
                return await handleUpdateProfile(parsedBody, userId, headers);
            case path === '/users' && httpMethod === 'GET':
                return await handleListUsers(queryStringParameters, userRole, headers);
            case path.startsWith('/users/') && path.endsWith('/role') && httpMethod === 'PUT':
                return await handleUpdateUserRole(path, parsedBody, userRole, headers);
            case path.startsWith('/users/') && httpMethod === 'DELETE':
                return await handleDeleteUser(path, userRole, headers);
            default:
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Not found' })
                };
        }
    } catch (error) {
        console.error('Users Lambda Error:', error);
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
 * Get user profile
 */
async function handleGetProfile(userId, headers) {
    try {
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
                body: JSON.stringify({ error: 'Profile not found' })
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
                    createdAt: result.Item.createdAt,
                    updatedAt: result.Item.updatedAt
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

/**
 * Update user profile
 */
async function handleUpdateProfile(body, userId, headers) {
    const { name } = body;

    if (!name) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Name is required' })
        };
    }

    try {
        // Update in DynamoDB
        await dynamodb.update({
            TableName: TABLE_NAME,
            Key: {
                pk: `USER#${userId}`,
                sk: 'PROFILE'
            },
            UpdateExpression: 'SET #name = :name, updatedAt = :updatedAt',
            ExpressionAttributeNames: {
                '#name': 'name'
            },
            ExpressionAttributeValues: {
                ':name': name,
                ':updatedAt': new Date().toISOString()
            }
        }).promise();

        // Update in Cognito
        await cognito.adminUpdateUserAttributes({
            UserPoolId: USER_POOL_ID,
            Username: userId,
            UserAttributes: [
                {
                    Name: 'name',
                    Value: name
                }
            ]
        }).promise();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                message: 'Profile updated successfully',
                user: {
                    id: userId,
                    name,
                    updatedAt: new Date().toISOString()
                }
            })
        };
    } catch (error) {
        console.error('Update profile error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to update profile',
                message: error.message 
            })
        };
    }
}

/**
 * List users (admin only)
 */
async function handleListUsers(queryParams, userRole, headers) {
    // Only admins can list all users
    if (userRole !== 'admin') {
        return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Access denied. Admin role required.' })
        };
    }

    try {
        const limit = parseInt(queryParams?.limit) || 50;
        const nextToken = queryParams?.nextToken;

        // Query DynamoDB for all user profiles
        const params = {
            TableName: TABLE_NAME,
            IndexName: 'GSI1',
            KeyConditionExpression: 'begins_with(gsi1pk, :userPrefix)',
            ExpressionAttributeValues: {
                ':userPrefix': 'USER#'
            },
            Limit: limit
        };

        if (nextToken) {
            params.ExclusiveStartKey = JSON.parse(Buffer.from(nextToken, 'base64').toString());
        }

        const result = await dynamodb.query(params).promise();

        const users = result.Items
            .filter(item => item.sk === 'PROFILE')
            .map(item => ({
                id: item.pk.replace('USER#', ''),
                email: item.email,
                name: item.name,
                role: item.role,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
            }));

        const response = {
            users,
            count: users.length
        };

        if (result.LastEvaluatedKey) {
            response.nextToken = Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64');
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response)
        };
    } catch (error) {
        console.error('List users error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to list users',
                message: error.message 
            })
        };
    }
}

/**
 * Update user role (admin only)
 */
async function handleUpdateUserRole(path, body, userRole, headers) {
    // Only admins can update user roles
    if (userRole !== 'admin') {
        return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Access denied. Admin role required.' })
        };
    }

    const targetUserId = path.split('/')[2];
    const { role } = body;

    if (!role || !['admin', 'editor', 'viewer'].includes(role)) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid role. Must be admin, editor, or viewer.' })
        };
    }

    try {
        // Check if user exists
        const userResult = await dynamodb.get({
            TableName: TABLE_NAME,
            Key: {
                pk: `USER#${targetUserId}`,
                sk: 'PROFILE'
            }
        }).promise();

        if (!userResult.Item) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'User not found' })
            };
        }

        // Update role in DynamoDB
        await dynamodb.update({
            TableName: TABLE_NAME,
            Key: {
                pk: `USER#${targetUserId}`,
                sk: 'PROFILE'
            },
            UpdateExpression: 'SET #role = :role, updatedAt = :updatedAt',
            ExpressionAttributeNames: {
                '#role': 'role'
            },
            ExpressionAttributeValues: {
                ':role': role,
                ':updatedAt': new Date().toISOString()
            }
        }).promise();

        // Update role in Cognito
        await cognito.adminUpdateUserAttributes({
            UserPoolId: USER_POOL_ID,
            Username: targetUserId,
            UserAttributes: [
                {
                    Name: 'custom:role',
                    Value: role
                }
            ]
        }).promise();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                message: 'User role updated successfully',
                user: {
                    id: targetUserId,
                    role,
                    updatedAt: new Date().toISOString()
                }
            })
        };
    } catch (error) {
        console.error('Update user role error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to update user role',
                message: error.message 
            })
        };
    }
}

/**
 * Delete user (admin only)
 */
async function handleDeleteUser(path, userRole, headers) {
    // Only admins can delete users
    if (userRole !== 'admin') {
        return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Access denied. Admin role required.' })
        };
    }

    const targetUserId = path.split('/')[2];

    try {
        // Check if user exists
        const userResult = await dynamodb.get({
            TableName: TABLE_NAME,
            Key: {
                pk: `USER#${targetUserId}`,
                sk: 'PROFILE'
            }
        }).promise();

        if (!userResult.Item) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'User not found' })
            };
        }

        // Delete from Cognito
        await cognito.adminDeleteUser({
            UserPoolId: USER_POOL_ID,
            Username: targetUserId
        }).promise();

        // Soft delete from DynamoDB (mark as deleted)
        await dynamodb.update({
            TableName: TABLE_NAME,
            Key: {
                pk: `USER#${targetUserId}`,
                sk: 'PROFILE'
            },
            UpdateExpression: 'SET isDeleted = :deleted, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':deleted': true,
                ':updatedAt': new Date().toISOString()
            }
        }).promise();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'User deleted successfully' })
        };
    } catch (error) {
        console.error('Delete user error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to delete user',
                message: error.message 
            })
        };
    }
}

/**
 * Extract user ID from authorization header (placeholder)
 */
function extractUserFromAuth(headers) {
    // In a real implementation, this would parse the JWT token
    // For now, return a placeholder
    return 'placeholder-user-id';
}

/**
 * Extract user role from authorization header (placeholder)
 */
function extractRoleFromAuth(headers) {
    // In a real implementation, this would parse the JWT token
    // For now, return a default role
    return 'admin';
}