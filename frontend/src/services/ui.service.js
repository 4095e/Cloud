/**
 * UI Service
 * Handles user interface rendering, interactions, and state management
 */
export class UIService {
    constructor() {
        this.currentView = null;
        this.notifications = [];
        this.loadingState = false;
    }

    /**
     * Initialize the UI service
     */
    init() {
        this.setupGlobalEventListeners();
        console.log('UIService initialized');
    }

    /**
     * Setup global event listeners
     */
    setupGlobalEventListeners() {
        // Handle drag and drop for file uploads
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
        });
    }

    /**
     * Show login screen
     */
    showLoginScreen() {
        const root = document.getElementById('root');
        root.innerHTML = this.getLoginHTML();
        this.setupLoginEventListeners();
        this.currentView = 'login';
    }

    /**
     * Show main application interface
     */
    showMainInterface(user) {
        const root = document.getElementById('root');
        root.innerHTML = this.getMainInterfaceHTML(user);
        this.setupMainInterfaceEventListeners();
        this.currentView = 'main';
    }

    /**
     * Display files in the interface
     */
    displayFiles(files, currentFolder, user) {
        const filesContainer = document.getElementById('files-container');
        if (!filesContainer) return;

        // Update breadcrumb
        this.updateBreadcrumb(currentFolder);

        // Display files
        if (files.length === 0) {
            filesContainer.innerHTML = this.getEmptyStateHTML();
        } else {
            filesContainer.innerHTML = this.getFilesGridHTML(files, user);
            this.setupFileEventListeners();
        }
    }

    /**
     * Update breadcrumb navigation
     */
    updateBreadcrumb(currentFolder) {
        const breadcrumbContainer = document.getElementById('breadcrumb');
        if (!breadcrumbContainer) return;

        const breadcrumb = this.getFolderBreadcrumb(currentFolder);
        breadcrumbContainer.innerHTML = breadcrumb.map((item, index) => {
            const isLast = index === breadcrumb.length - 1;
            return `
                <span class="breadcrumb-item ${isLast ? 'current' : ''}" 
                      ${!isLast ? `data-folder="${item.path}"` : ''}>
                    ${item.name}
                </span>
                ${!isLast ? '<span>/</span>' : ''}
            `;
        }).join('');

        // Add click handlers for breadcrumb navigation
        breadcrumbContainer.addEventListener('click', (e) => {
            const folderElement = e.target.closest('[data-folder]');
            if (folderElement) {
                const folder = folderElement.dataset.folder;
                document.dispatchEvent(new CustomEvent('folder-navigate', {
                    detail: { folder }
                }));
            }
        });
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Auto remove notification
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, duration);

        // Add to notifications array
        this.notifications.push({
            message,
            type,
            timestamp: new Date()
        });
    }

    /**
     * Show success notification
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    /**
     * Show error notification
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Show info notification
     */
    showInfo(message) {
        this.showNotification(message, 'info');
    }

    /**
     * Show loading overlay
     */
    showLoading(message = 'Loading...') {
        this.loadingState = true;
        
        let overlay = document.getElementById('loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loading-overlay';
            overlay.className = 'loading-overlay';
            document.body.appendChild(overlay);
        }

        overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-text">${message}</div>
            </div>
        `;
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        this.loadingState = false;
        
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    /**
     * Get login HTML template
     */
    getLoginHTML() {
        return `
            <div class="login-container">
                <div class="login-form">
                    <h1>☁️ Cloud Storage</h1>
                    
                    <div id="login-tab" class="tab-content">
                        <form id="login-form">
                            <div class="form-group">
                                <label for="login-email">Email</label>
                                <input type="email" id="login-email" required>
                            </div>
                            <div class="form-group">
                                <label for="login-password">Password</label>
                                <input type="password" id="login-password" required>
                            </div>
                            <button type="submit" class="btn">Sign In</button>
                        </form>
                        <div class="form-toggle">
                            <a href="#" id="show-register">Don't have an account? Sign up</a>
                        </div>
                    </div>

                    <div id="register-tab" class="tab-content hidden">
                        <form id="register-form">
                            <div class="form-group">
                                <label for="register-name">Full Name</label>
                                <input type="text" id="register-name" required>
                            </div>
                            <div class="form-group">
                                <label for="register-email">Email</label>
                                <input type="email" id="register-email" required>
                            </div>
                            <div class="form-group">
                                <label for="register-password">Password</label>
                                <input type="password" id="register-password" required minlength="8">
                            </div>
                            <div class="form-group">
                                <label for="register-role">Role</label>
                                <select id="register-role">
                                    <option value="viewer">Viewer</option>
                                    <option value="editor">Editor</option>
                                </select>
                            </div>
                            <button type="submit" class="btn">Sign Up</button>
                        </form>
                        <div class="form-toggle">
                            <a href="#" id="show-login">Already have an account? Sign in</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get main interface HTML template
     */
    getMainInterfaceHTML(user) {
        const role = user.attributes?.['custom:role'] || 'viewer';
        const name = user.attributes?.name || user.username;

        return `
            <div class="app-container">
                <header class="header">
                    <div class="header-content">
                        <div class="logo">
                            <span class="logo-icon">☁️</span>
                            Cloud Storage
                        </div>
                        <div class="user-info">
                            <span class="user-name">${name}</span>
                            <span class="user-role">${role}</span>
                            <button class="logout-btn" id="logout-btn">Logout</button>
                        </div>
                    </div>
                </header>

                <main class="main-content">
                    <div class="file-operations">
                        <div class="breadcrumb" id="breadcrumb">
                            <span class="breadcrumb-item current">Home</span>
                        </div>
                        
                        <div class="upload-area">
                            <input type="file" id="file-input" multiple style="display: none;">
                            <button class="upload-btn" id="upload-btn">
                                📤 Upload Files
                            </button>
                        </div>
                    </div>

                    <div class="drop-zone" id="drop-zone">
                        <div class="upload-icon">📁</div>
                        <p><strong>Drop files here to upload</strong></p>
                        <p>or click the upload button above</p>
                    </div>

                    <div id="files-container">
                        <!-- Files will be loaded here -->
                    </div>
                </main>
            </div>
        `;
    }

    /**
     * Get files grid HTML
     */
    getFilesGridHTML(files, user) {
        const userRole = user.attributes?.['custom:role'] || 'viewer';
        const canEdit = userRole === 'admin' || userRole === 'editor';
        const canDelete = userRole === 'admin' || userRole === 'editor';

        return `
            <div class="files-grid">
                ${files.map(file => {
                    const icon = this.getFileIcon(file.fileName, file.fileType);
                    const size = this.formatFileSize(file.fileSize);
                    const date = this.formatDate(file.createdAt);
                    const isOwner = file.ownerId === user.username;

                    return `
                        <div class="file-card" data-file-id="${file.fileId}">
                            <div class="file-icon ${this.getFileTypeCategory(file.fileName, file.fileType)}">
                                ${icon}
                            </div>
                            <div class="file-info">
                                <h3 title="${file.fileName}">${file.fileName}</h3>
                                <div class="file-meta">
                                    <span>${size}</span>
                                    <span>${date}</span>
                                </div>
                                <div class="file-actions">
                                    <button class="action-btn download-btn" data-file-id="${file.fileId}">
                                        Download
                                    </button>
                                    ${(canEdit && (isOwner || userRole === 'admin')) ? 
                                        `<button class="action-btn edit-btn" data-file-id="${file.fileId}">
                                            Rename
                                        </button>` : ''
                                    }
                                    ${(canDelete && (isOwner || userRole === 'admin')) ? 
                                        `<button class="action-btn danger delete-btn" data-file-id="${file.fileId}">
                                            Delete
                                        </button>` : ''
                                    }
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * Get empty state HTML
     */
    getEmptyStateHTML() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">📁</div>
                <h3>No files yet</h3>
                <p>Upload your first file to get started</p>
            </div>
        `;
    }

    /**
     * Setup login event listeners
     */
    setupLoginEventListeners() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const showRegister = document.getElementById('show-register');
        const showLogin = document.getElementById('show-login');

        // Toggle between login and register forms
        showRegister?.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-tab').classList.add('hidden');
            document.getElementById('register-tab').classList.remove('hidden');
        });

        showLogin?.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('register-tab').classList.add('hidden');
            document.getElementById('login-tab').classList.remove('hidden');
        });

        // Handle login form submission
        loginForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                this.showLoading('Signing in...');
                const authService = window.cloudStorageApp?.authService;
                if (authService) {
                    await authService.signIn(email, password);
                }
            } catch (error) {
                this.hideLoading();
                this.showError(error.message);
            }
        });

        // Handle register form submission
        registerForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const role = document.getElementById('register-role').value;

            try {
                this.showLoading('Creating account...');
                const authService = window.cloudStorageApp?.authService;
                if (authService) {
                    await authService.signUp(email, password, name, role);
                    this.hideLoading();
                    this.showSuccess('Account created! Please check your email for verification.');
                    // Switch back to login tab
                    document.getElementById('register-tab').classList.add('hidden');
                    document.getElementById('login-tab').classList.remove('hidden');
                }
            } catch (error) {
                this.hideLoading();
                this.showError(error.message);
            }
        });
    }

    /**
     * Setup main interface event listeners
     */
    setupMainInterfaceEventListeners() {
        const logoutBtn = document.getElementById('logout-btn');
        const uploadBtn = document.getElementById('upload-btn');
        const fileInput = document.getElementById('file-input');
        const dropZone = document.getElementById('drop-zone');

        // Logout
        logoutBtn?.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('logout'));
        });

        // File upload
        uploadBtn?.addEventListener('click', () => {
            fileInput?.click();
        });

        fileInput?.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                document.dispatchEvent(new CustomEvent('file-upload', {
                    detail: { files: e.target.files }
                }));
            }
        });

        // Drag and drop
        dropZone?.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone?.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
        });

        dropZone?.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            
            if (e.dataTransfer.files.length > 0) {
                document.dispatchEvent(new CustomEvent('file-upload', {
                    detail: { files: e.dataTransfer.files }
                }));
            }
        });

        // Click to upload
        dropZone?.addEventListener('click', () => {
            fileInput?.click();
        });
    }

    /**
     * Setup file event listeners
     */
    setupFileEventListeners() {
        // Download buttons
        document.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const fileId = btn.dataset.fileId;
                document.dispatchEvent(new CustomEvent('file-download', {
                    detail: { fileId }
                }));
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const fileId = btn.dataset.fileId;
                document.dispatchEvent(new CustomEvent('file-delete', {
                    detail: { fileId }
                }));
            });
        });
    }

    /**
     * Get file type category for styling
     */
    getFileTypeCategory(fileName, mimeType = '') {
        const extension = fileName.toLowerCase().split('.').pop();
        const type = mimeType.toLowerCase();

        if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension)) {
            return 'image';
        }
        if (type.startsWith('video/') || ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'].includes(extension)) {
            return 'video';
        }
        if (type.startsWith('audio/') || ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'].includes(extension)) {
            return 'audio';
        }
        if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(extension)) {
            return 'document';
        }
        if (extension === 'pdf') {
            return 'pdf';
        }
        if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(extension)) {
            return 'archive';
        }
        if (['js', 'html', 'css', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs'].includes(extension)) {
            return 'code';
        }
        return 'default';
    }

    /**
     * Get file icon
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
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Format date
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    }

    /**
     * Get folder breadcrumb
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