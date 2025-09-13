/**
 * File Service
 * Handles file operations including upload, download, delete, and metadata management
 */
export class FileService {
    constructor() {
        this.config = null;
        this.authService = null;
    }

    /**
     * Initialize the service with configuration and auth service
     */
    init(config, authService = null) {
        this.config = config;
        this.authService = authService;
        console.log('FileService initialized');
    }

    /**
     * Get authorization headers for API requests
     */
    async getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        // Get JWT token if auth service is available
        if (this.authService) {
            const token = await this.authService.getJwtToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return headers;
    }

    /**
     * Make authenticated API request
     */
    async makeApiRequest(endpoint, options = {}) {
        const url = `${this.config.apiUrl}${endpoint}`;
        const headers = await this.getAuthHeaders();

        const requestOptions = {
            headers: {
                ...headers,
                ...options.headers
            },
            ...options
        };

        const response = await fetch(url, requestOptions);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * List files in a specific folder
     */
    async listFiles(folder = '', limit = 50) {
        try {
            const queryParams = new URLSearchParams({
                limit: limit.toString()
            });

            if (folder) {
                queryParams.append('folder', folder);
            }

            const data = await this.makeApiRequest(`/files?${queryParams}`);
            return data.files || [];
        } catch (error) {
            console.error('Failed to list files:', error);
            throw error;
        }
    }

    /**
     * Upload a file
     */
    async uploadFile(file, folder = '') {
        try {
            // Step 1: Get pre-signed upload URL
            const uploadData = await this.makeApiRequest('/files/upload', {
                method: 'POST',
                body: JSON.stringify({
                    fileName: file.name,
                    fileSize: file.size,
                    fileType: file.type,
                    folder: folder
                })
            });

            // Step 2: Upload file directly to S3 using pre-signed URL
            const uploadResponse = await fetch(uploadData.uploadUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': file.type
                },
                body: file
            });

            if (!uploadResponse.ok) {
                throw new Error(`Upload failed: ${uploadResponse.statusText}`);
            }

            // Step 3: Confirm upload and store metadata
            const confirmData = await this.makeApiRequest('/files/confirm', {
                method: 'POST',
                body: JSON.stringify({
                    fileId: uploadData.fileId,
                    fileName: file.name,
                    fileSize: file.size,
                    fileType: file.type,
                    s3Key: uploadData.s3Key,
                    folder: folder
                })
            });

            return confirmData.file;
        } catch (error) {
            console.error('Failed to upload file:', error);
            throw error;
        }
    }

    /**
     * Get download URL for a file
     */
    async getDownloadUrl(fileId) {
        try {
            const data = await this.makeApiRequest(`/files/${fileId}`);
            return data.downloadUrl;
        } catch (error) {
            console.error('Failed to get download URL:', error);
            throw error;
        }
    }

    /**
     * Delete a file
     */
    async deleteFile(fileId) {
        try {
            await this.makeApiRequest(`/files/${fileId}`, {
                method: 'DELETE'
            });
            return true;
        } catch (error) {
            console.error('Failed to delete file:', error);
            throw error;
        }
    }

    /**
     * Update file metadata (rename, move to folder, etc.)
     */
    async updateFile(fileId, updates) {
        try {
            const data = await this.makeApiRequest(`/files/${fileId}`, {
                method: 'PUT',
                body: JSON.stringify(updates)
            });
            return data;
        } catch (error) {
            console.error('Failed to update file:', error);
            throw error;
        }
    }

    /**
     * Get file type category for icon display
     */
    getFileTypeCategory(fileName, mimeType = '') {
        const extension = fileName.toLowerCase().split('.').pop();
        const type = mimeType.toLowerCase();

        // Image files
        if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension)) {
            return 'image';
        }

        // Video files
        if (type.startsWith('video/') || ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'].includes(extension)) {
            return 'video';
        }

        // Audio files
        if (type.startsWith('audio/') || ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'].includes(extension)) {
            return 'audio';
        }

        // Document files
        if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(extension)) {
            return 'document';
        }

        // PDF files
        if (extension === 'pdf') {
            return 'pdf';
        }

        // Archive files
        if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(extension)) {
            return 'archive';
        }

        // Code files
        if (['js', 'html', 'css', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs'].includes(extension)) {
            return 'code';
        }

        return 'default';
    }

    /**
     * Get file icon based on type
     */
    getFileIcon(fileName, mimeType = '') {
        const category = this.getFileTypeCategory(fileName, mimeType);
        
        const icons = {
            image: '🖼️',
            video: '🎥',
            audio: '🎵',
            document: '📄',
            pdf: '📕',
            archive: '📦',
            code: '💻',
            default: '📁'
        };

        return icons[category] || icons.default;
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    /**
     * Validate file before upload
     */
    validateFile(file, maxSize = 100 * 1024 * 1024) { // 100MB default
        const errors = [];

        if (!file) {
            errors.push('No file selected');
            return errors;
        }

        if (file.size > maxSize) {
            errors.push(`File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(maxSize)})`);
        }

        if (file.size === 0) {
            errors.push('File is empty');
        }

        // Check for potentially dangerous file types
        const dangerousExtensions = ['exe', 'bat', 'cmd', 'scr', 'pif', 'com'];
        const extension = file.name.toLowerCase().split('.').pop();
        if (dangerousExtensions.includes(extension)) {
            errors.push('File type not allowed for security reasons');
        }

        return errors;
    }

    /**
     * Bulk upload multiple files
     */
    async uploadMultipleFiles(files, folder = '', onProgress = null) {
        const results = [];
        const total = files.length;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            try {
                // Validate file
                const errors = this.validateFile(file);
                if (errors.length > 0) {
                    results.push({
                        file: file.name,
                        success: false,
                        error: errors.join(', ')
                    });
                    continue;
                }

                // Upload file
                const result = await this.uploadFile(file, folder);
                results.push({
                    file: file.name,
                    success: true,
                    data: result
                });

                // Report progress
                if (onProgress) {
                    onProgress(i + 1, total, file.name);
                }
            } catch (error) {
                results.push({
                    file: file.name,
                    success: false,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Search files by name or type
     */
    async searchFiles(query, folder = '') {
        try {
            const allFiles = await this.listFiles(folder);
            
            if (!query) {
                return allFiles;
            }

            const searchTerm = query.toLowerCase();
            return allFiles.filter(file => 
                file.fileName.toLowerCase().includes(searchTerm) ||
                file.fileType.toLowerCase().includes(searchTerm) ||
                this.getFileTypeCategory(file.fileName, file.fileType).includes(searchTerm)
            );
        } catch (error) {
            console.error('Failed to search files:', error);
            throw error;
        }
    }

    /**
     * Get folder breadcrumb navigation
     */
    getFolderBreadcrumb(currentFolder) {
        if (!currentFolder) {
            return [{ name: 'Home', path: '' }];
        }

        const parts = currentFolder.split('/').filter(part => part.length > 0);
        const breadcrumb = [{ name: 'Home', path: '' }];

        let currentPath = '';
        for (const part of parts) {
            currentPath += (currentPath ? '/' : '') + part;
            breadcrumb.push({
                name: part,
                path: currentPath
            });
        }

        return breadcrumb;
    }
}