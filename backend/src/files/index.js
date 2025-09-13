const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Configure AWS SDK
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.DYNAMODB_TABLE;
const S3_BUCKET = process.env.S3_FILES_BUCKET;

/**
 * Files Management Lambda Function
 * Handles file upload, download, delete, list, and metadata operations
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

        console.log('Files Lambda Event:', { httpMethod, path, body: parsedBody, queryStringParameters });

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
            case path === '/files/upload' && httpMethod === 'POST':
                return await handleGetUploadUrl(parsedBody, userId, headers);
            case path === '/files/confirm' && httpMethod === 'POST':
                return await handleConfirmUpload(parsedBody, userId, headers);
            case path === '/files' && httpMethod === 'GET':
                return await handleListFiles(queryStringParameters, userId, userRole, headers);
            case path.startsWith('/files/') && httpMethod === 'GET':
                return await handleDownloadFile(path, userId, userRole, headers);
            case path.startsWith('/files/') && httpMethod === 'DELETE':
                return await handleDeleteFile(path, userId, userRole, headers);
            case path.startsWith('/files/') && httpMethod === 'PUT':
                return await handleUpdateFile(path, parsedBody, userId, userRole, headers);
            default:
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Not found' })
                };
        }
    } catch (error) {
        console.error('Files Lambda Error:', error);
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
 * Generate pre-signed URL for file upload
 */
async function handleGetUploadUrl(body, userId, headers) {
    const { fileName, fileSize, fileType, folder = '' } = body;

    if (!fileName || !fileSize || !fileType) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing required fields' })
        };
    }

    try {
        const fileId = uuidv4();
        const s3Key = folder ? `${userId}/${folder}/${fileId}-${fileName}` : `${userId}/${fileId}-${fileName}`;

        // Generate pre-signed URL for upload
        const uploadUrl = await s3.getSignedUrlPromise('putObject', {
            Bucket: S3_BUCKET,
            Key: s3Key,
            ContentType: fileType,
            Expires: 300 // 5 minutes
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                uploadUrl,
                fileId,
                s3Key
            })
        };
    } catch (error) {
        console.error('Upload URL generation error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to generate upload URL',
                message: error.message 
            })
        };
    }
}

/**
 * Confirm file upload and store metadata
 */
async function handleConfirmUpload(body, userId, headers) {
    const { fileId, fileName, fileSize, fileType, s3Key, folder = '' } = body;

    if (!fileId || !fileName || !s3Key) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing required fields' })
        };
    }

    try {
        // Store file metadata in DynamoDB
        await dynamodb.put({
            TableName: TABLE_NAME,
            Item: {
                pk: `FILE#${fileId}`,
                sk: 'METADATA',
                gsi1pk: `USER#${userId}`,
                gsi1sk: `FILE#${new Date().toISOString()}`,
                gsi2pk: folder || 'ROOT',
                gsi2sk: fileName.toLowerCase(),
                fileId,
                fileName,
                fileSize,
                fileType,
                s3Key,
                folder,
                ownerId: userId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isDeleted: false
            }
        }).promise();

        return {
            statusCode: 201,
            headers,
            body: JSON.stringify({
                message: 'File uploaded successfully',
                file: {
                    fileId,
                    fileName,
                    fileSize,
                    fileType,
                    folder,
                    createdAt: new Date().toISOString()
                }
            })
        };
    } catch (error) {
        console.error('Upload confirmation error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to confirm upload',
                message: error.message 
            })
        };
    }
}

/**
 * List user files
 */
async function handleListFiles(queryParams, userId, userRole, headers) {
    try {
        const folder = queryParams?.folder || '';
        const limit = parseInt(queryParams?.limit) || 50;

        let queryParameters;
        
        if (userRole === 'admin' || userRole === 'editor') {
            // Admins and editors can see all files
            queryParameters = {
                TableName: TABLE_NAME,
                IndexName: 'GSI2',
                KeyConditionExpression: 'gsi2pk = :folder',
                ExpressionAttributeValues: {
                    ':folder': folder || 'ROOT',
                    ':deleted': false
                },
                FilterExpression: 'isDeleted = :deleted',
                Limit: limit
            };
        } else {
            // Viewers can only see their own files
            queryParameters = {
                TableName: TABLE_NAME,
                IndexName: 'GSI1',
                KeyConditionExpression: 'gsi1pk = :userId',
                ExpressionAttributeValues: {
                    ':userId': `USER#${userId}`,
                    ':deleted': false
                },
                FilterExpression: 'isDeleted = :deleted',
                Limit: limit
            };
        }

        const result = await dynamodb.query(queryParameters).promise();

        const files = result.Items.map(item => ({
            fileId: item.fileId,
            fileName: item.fileName,
            fileSize: item.fileSize,
            fileType: item.fileType,
            folder: item.folder,
            ownerId: item.ownerId,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
        }));

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                files,
                count: files.length,
                hasMore: result.LastEvaluatedKey ? true : false
            })
        };
    } catch (error) {
        console.error('List files error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to list files',
                message: error.message 
            })
        };
    }
}

/**
 * Generate download URL for file
 */
async function handleDownloadFile(path, userId, userRole, headers) {
    try {
        const fileId = path.split('/').pop();
        
        // Get file metadata
        const result = await dynamodb.get({
            TableName: TABLE_NAME,
            Key: {
                pk: `FILE#${fileId}`,
                sk: 'METADATA'
            }
        }).promise();

        if (!result.Item || result.Item.isDeleted) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'File not found' })
            };
        }

        // Check permissions
        if (userRole !== 'admin' && userRole !== 'editor' && result.Item.ownerId !== userId) {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ error: 'Access denied' })
            };
        }

        // Generate pre-signed URL for download
        const downloadUrl = await s3.getSignedUrlPromise('getObject', {
            Bucket: S3_BUCKET,
            Key: result.Item.s3Key,
            Expires: 300 // 5 minutes
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                downloadUrl,
                fileName: result.Item.fileName,
                fileSize: result.Item.fileSize,
                fileType: result.Item.fileType
            })
        };
    } catch (error) {
        console.error('Download file error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to generate download URL',
                message: error.message 
            })
        };
    }
}

/**
 * Delete file (soft delete)
 */
async function handleDeleteFile(path, userId, userRole, headers) {
    try {
        const fileId = path.split('/').pop();
        
        // Get file metadata
        const result = await dynamodb.get({
            TableName: TABLE_NAME,
            Key: {
                pk: `FILE#${fileId}`,
                sk: 'METADATA'
            }
        }).promise();

        if (!result.Item || result.Item.isDeleted) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'File not found' })
            };
        }

        // Check permissions (only admin/editor or owner can delete)
        if (userRole !== 'admin' && userRole !== 'editor' && result.Item.ownerId !== userId) {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ error: 'Access denied' })
            };
        }

        // Viewers cannot delete files
        if (userRole === 'viewer') {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ error: 'Viewers cannot delete files' })
            };
        }

        // Soft delete - mark as deleted in DynamoDB
        await dynamodb.update({
            TableName: TABLE_NAME,
            Key: {
                pk: `FILE#${fileId}`,
                sk: 'METADATA'
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
            body: JSON.stringify({ message: 'File deleted successfully' })
        };
    } catch (error) {
        console.error('Delete file error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to delete file',
                message: error.message 
            })
        };
    }
}

/**
 * Update file metadata
 */
async function handleUpdateFile(path, body, userId, userRole, headers) {
    try {
        const fileId = path.split('/').pop();
        const { fileName, folder } = body;

        if (!fileName) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing fileName' })
            };
        }

        // Get file metadata
        const result = await dynamodb.get({
            TableName: TABLE_NAME,
            Key: {
                pk: `FILE#${fileId}`,
                sk: 'METADATA'
            }
        }).promise();

        if (!result.Item || result.Item.isDeleted) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'File not found' })
            };
        }

        // Check permissions (only admin/editor or owner can update)
        if (userRole !== 'admin' && userRole !== 'editor' && result.Item.ownerId !== userId) {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ error: 'Access denied' })
            };
        }

        // Viewers cannot edit files
        if (userRole === 'viewer') {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ error: 'Viewers cannot edit files' })
            };
        }

        // Update file metadata
        const updateParams = {
            TableName: TABLE_NAME,
            Key: {
                pk: `FILE#${fileId}`,
                sk: 'METADATA'
            },
            UpdateExpression: 'SET fileName = :fileName, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':fileName': fileName,
                ':updatedAt': new Date().toISOString()
            }
        };

        if (folder !== undefined) {
            updateParams.UpdateExpression += ', folder = :folder, gsi2pk = :gsi2pk';
            updateParams.ExpressionAttributeValues[':folder'] = folder;
            updateParams.ExpressionAttributeValues[':gsi2pk'] = folder || 'ROOT';
        }

        await dynamodb.update(updateParams).promise();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                message: 'File updated successfully',
                fileId,
                fileName,
                folder: folder || result.Item.folder
            })
        };
    } catch (error) {
        console.error('Update file error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to update file',
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
    return 'viewer';
}