# API Reference

This document describes the REST API endpoints for the cloud storage application.

## Base URL

```
https://your-api-gateway-id.execute-api.region.amazonaws.com/v1
```

## Authentication

All API requests (except authentication endpoints) require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <jwt-token>
```

JWT tokens are obtained through the Cognito authentication flow or by calling the auth endpoints.

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

Common HTTP status codes:
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

## Authentication Endpoints

### Register User

Create a new user account.

```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "role": "viewer"
}
```

**Parameters:**
- `email` (string, required) - User's email address
- `password` (string, required) - Password (min 8 chars, must include uppercase, lowercase, numbers, symbols)
- `name` (string, required) - User's display name
- `role` (string, optional) - User role: "viewer", "editor", or "admin" (default: "viewer")

**Response:**
```json
{
  "message": "User registered successfully",
  "userId": "user-id"
}
```

### Verify Token

Verify if a JWT token is valid.

```http
GET /auth/verify
```

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "valid": true,
  "message": "Token is valid"
}
```

### Get Profile

Get the current user's profile information.

```http
GET /auth/profile
```

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "viewer",
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
}
```

## File Management Endpoints

### List Files

Get a list of files in a specific folder.

```http
GET /files?folder=path/to/folder&limit=50
```

**Query Parameters:**
- `folder` (string, optional) - Folder path (empty for root)
- `limit` (integer, optional) - Maximum number of files to return (default: 50, max: 100)

**Response:**
```json
{
  "files": [
    {
      "fileId": "file-id",
      "fileName": "document.pdf",
      "fileSize": 1048576,
      "fileType": "application/pdf",
      "folder": "",
      "ownerId": "user-id",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "count": 1,
  "hasMore": false
}
```

### Get Upload URL

Get a pre-signed URL for uploading a file to S3.

```http
POST /files/upload
```

**Request Body:**
```json
{
  "fileName": "document.pdf",
  "fileSize": 1048576,
  "fileType": "application/pdf",
  "folder": "documents"
}
```

**Parameters:**
- `fileName` (string, required) - Name of the file
- `fileSize` (integer, required) - Size of the file in bytes
- `fileType` (string, required) - MIME type of the file
- `folder` (string, optional) - Folder path (empty for root)

**Response:**
```json
{
  "uploadUrl": "https://s3.amazonaws.com/bucket/key?signature=...",
  "fileId": "generated-file-id",
  "s3Key": "user-id/folder/file-id-document.pdf"
}
```

### Confirm Upload

Confirm that a file has been uploaded and store its metadata.

```http
POST /files/confirm
```

**Request Body:**
```json
{
  "fileId": "file-id",
  "fileName": "document.pdf",
  "fileSize": 1048576,
  "fileType": "application/pdf",
  "s3Key": "user-id/folder/file-id-document.pdf",
  "folder": "documents"
}
```

**Response:**
```json
{
  "message": "File uploaded successfully",
  "file": {
    "fileId": "file-id",
    "fileName": "document.pdf",
    "fileSize": 1048576,
    "fileType": "application/pdf",
    "folder": "documents",
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### Get Download URL

Get a pre-signed URL for downloading a file.

```http
GET /files/{fileId}
```

**Path Parameters:**
- `fileId` (string, required) - ID of the file to download

**Response:**
```json
{
  "downloadUrl": "https://s3.amazonaws.com/bucket/key?signature=...",
  "fileName": "document.pdf",
  "fileSize": 1048576,
  "fileType": "application/pdf"
}
```

### Update File

Update file metadata (rename, move to folder).

```http
PUT /files/{fileId}
```

**Path Parameters:**
- `fileId` (string, required) - ID of the file to update

**Request Body:**
```json
{
  "fileName": "new-document-name.pdf",
  "folder": "new-folder"
}
```

**Parameters:**
- `fileName` (string, optional) - New file name
- `folder` (string, optional) - New folder path

**Response:**
```json
{
  "message": "File updated successfully",
  "fileId": "file-id",
  "fileName": "new-document-name.pdf",
  "folder": "new-folder"
}
```

### Delete File

Delete a file (soft delete).

```http
DELETE /files/{fileId}
```

**Path Parameters:**
- `fileId` (string, required) - ID of the file to delete

**Response:**
```json
{
  "message": "File deleted successfully"
}
```

## User Management Endpoints

### Get User Profile

Get the current user's profile.

```http
GET /users/profile
```

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "viewer",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### Update User Profile

Update the current user's profile.

```http
PUT /users/profile
```

**Request Body:**
```json
{
  "name": "Jane Doe"
}
```

**Response:**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "user-id",
    "name": "Jane Doe",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### List Users (Admin Only)

Get a list of all users.

```http
GET /users?limit=50&nextToken=token
```

**Query Parameters:**
- `limit` (integer, optional) - Maximum number of users to return (default: 50, max: 100)
- `nextToken` (string, optional) - Pagination token for the next page

**Response:**
```json
{
  "users": [
    {
      "id": "user-id",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "viewer",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "count": 1,
  "nextToken": "next-page-token"
}
```

### Update User Role (Admin Only)

Update another user's role.

```http
PUT /users/{userId}/role
```

**Path Parameters:**
- `userId` (string, required) - ID of the user to update

**Request Body:**
```json
{
  "role": "editor"
}
```

**Parameters:**
- `role` (string, required) - New role: "viewer", "editor", or "admin"

**Response:**
```json
{
  "message": "User role updated successfully",
  "user": {
    "id": "user-id",
    "role": "editor",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### Delete User (Admin Only)

Delete a user account.

```http
DELETE /users/{userId}
```

**Path Parameters:**
- `userId` (string, required) - ID of the user to delete

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

## File Upload Flow

The complete file upload process involves multiple steps:

1. **Get Upload URL**: Call `POST /files/upload` to get a pre-signed S3 URL
2. **Upload to S3**: Use the pre-signed URL to upload the file directly to S3
3. **Confirm Upload**: Call `POST /files/confirm` to store file metadata

### Example Upload Flow

```javascript
// Step 1: Get upload URL
const uploadResponse = await fetch('/api/files/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    folder: 'documents'
  })
});

const uploadData = await uploadResponse.json();

// Step 2: Upload to S3
const s3Response = await fetch(uploadData.uploadUrl, {
  method: 'PUT',
  headers: {
    'Content-Type': file.type
  },
  body: file
});

// Step 3: Confirm upload
const confirmResponse = await fetch('/api/files/confirm', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fileId: uploadData.fileId,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    s3Key: uploadData.s3Key,
    folder: 'documents'
  })
});
```

## Rate Limiting

API requests are subject to rate limiting:

- **Authentication endpoints**: 10 requests per minute per IP
- **File operations**: 100 requests per minute per user
- **User management**: 50 requests per minute per user

When rate limits are exceeded, the API returns HTTP 429 (Too Many Requests).

## Data Models

### User Object

```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "role": "viewer|editor|admin",
  "createdAt": "ISO 8601 date string",
  "updatedAt": "ISO 8601 date string"
}
```

### File Object

```json
{
  "fileId": "string",
  "fileName": "string",
  "fileSize": "integer (bytes)",
  "fileType": "string (MIME type)",
  "folder": "string",
  "ownerId": "string",
  "createdAt": "ISO 8601 date string",
  "updatedAt": "ISO 8601 date string"
}
```

## SDK Examples

### JavaScript/Node.js

```javascript
class CloudStorageAPI {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async listFiles(folder = '', limit = 50) {
    const query = new URLSearchParams({ folder, limit });
    return this.request(`/files?${query}`);
  }

  async uploadFile(file, folder = '') {
    // Implementation following the upload flow above
  }

  async deleteFile(fileId) {
    return this.request(`/files/${fileId}`, { method: 'DELETE' });
  }
}
```

### Python

```python
import requests

class CloudStorageAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.token = token
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

    def list_files(self, folder='', limit=50):
        params = {'folder': folder, 'limit': limit}
        response = requests.get(f'{self.base_url}/files', 
                              headers=self.headers, params=params)
        response.raise_for_status()
        return response.json()

    def delete_file(self, file_id):
        response = requests.delete(f'{self.base_url}/files/{file_id}',
                                 headers=self.headers)
        response.raise_for_status()
        return response.json()
```

## Webhooks (Future Feature)

The API will support webhooks for real-time notifications:

- File uploaded
- File deleted
- User registered
- User role changed

Webhook payloads will include event type and relevant data.

## API Versioning

The API uses URL path versioning (`/v1/`). When breaking changes are introduced, a new version will be released (`/v2/`, etc.) with backward compatibility maintained for previous versions.