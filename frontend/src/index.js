import './styles/main.css';
import { AuthService } from './services/auth.service.js';
import { FileService } from './services/file.service.js';
import { UIService } from './services/ui.service.js';
import { ConfigService } from './services/config.service.js';

/**
 * Main Application Class
 * Orchestrates the entire cloud storage application
 */
class App {
    constructor() {
        this.authService = new AuthService();
        this.fileService = new FileService();
        this.uiService = new UIService();
        this.configService = new ConfigService();
        
        this.currentUser = null;
        this.currentFiles = [];
        this.currentFolder = '';
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('Initializing Cloud Storage Application...');
            
            // Initialize configuration
            await this.configService.init();
            
            // Initialize services
            await this.authService.init(this.configService.getConfig());
            this.fileService.init(this.configService.getConfig());
            this.uiService.init();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Check if user is already authenticated
            const user = await this.authService.getCurrentUser();
            if (user) {
                await this.handleUserLogin(user);
            } else {
                this.showLoginScreen();
            }
            
            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.uiService.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    /**
     * Setup event listeners for UI interactions
     */
    setupEventListeners() {
        // Authentication events
        document.addEventListener('login-success', (event) => {
            this.handleUserLogin(event.detail.user);
        });

        document.addEventListener('logout', () => {
            this.handleUserLogout();
        });

        // File operations events
        document.addEventListener('file-upload', (event) => {
            this.handleFileUpload(event.detail.files);
        });

        document.addEventListener('file-delete', (event) => {
            this.handleFileDelete(event.detail.fileId);
        });

        document.addEventListener('file-download', (event) => {
            this.handleFileDownload(event.detail.fileId);
        });

        document.addEventListener('folder-navigate', (event) => {
            this.handleFolderNavigate(event.detail.folder);
        });

        // UI events
        document.addEventListener('refresh-files', () => {
            this.loadFiles();
        });
    }

    /**
     * Handle successful user login
     */
    async handleUserLogin(user) {
        console.log('User logged in:', user.username);
        this.currentUser = user;
        
        try {
            // Show main application interface
            this.uiService.showMainInterface(user);
            
            // Load initial files
            await this.loadFiles();
            
            this.uiService.showSuccess(`Welcome back, ${user.attributes?.name || user.username}!`);
        } catch (error) {
            console.error('Error after login:', error);
            this.uiService.showError('Failed to load application data');
        }
    }

    /**
     * Handle user logout
     */
    async handleUserLogout() {
        try {
            await this.authService.signOut();
            this.currentUser = null;
            this.currentFiles = [];
            this.currentFolder = '';
            
            this.showLoginScreen();
            this.uiService.showSuccess('Logged out successfully');
        } catch (error) {
            console.error('Logout error:', error);
            this.uiService.showError('Failed to logout properly');
        }
    }

    /**
     * Show login screen
     */
    showLoginScreen() {
        this.uiService.showLoginScreen();
    }

    /**
     * Load files for current folder
     */
    async loadFiles() {
        try {
            this.uiService.showLoading('Loading files...');
            
            const files = await this.fileService.listFiles(this.currentFolder);
            this.currentFiles = files;
            
            this.uiService.displayFiles(files, this.currentFolder, this.currentUser);
            this.uiService.hideLoading();
        } catch (error) {
            console.error('Failed to load files:', error);
            this.uiService.hideLoading();
            this.uiService.showError('Failed to load files');
        }
    }

    /**
     * Handle file upload
     */
    async handleFileUpload(files) {
        const fileArray = Array.from(files);
        let successCount = 0;
        let errorCount = 0;

        this.uiService.showLoading(`Uploading ${fileArray.length} file(s)...`);

        for (const file of fileArray) {
            try {
                await this.fileService.uploadFile(file, this.currentFolder);
                successCount++;
            } catch (error) {
                console.error(`Failed to upload ${file.name}:`, error);
                errorCount++;
            }
        }

        this.uiService.hideLoading();

        if (successCount > 0) {
            this.uiService.showSuccess(`Successfully uploaded ${successCount} file(s)`);
            await this.loadFiles(); // Refresh file list
        }

        if (errorCount > 0) {
            this.uiService.showError(`Failed to upload ${errorCount} file(s)`);
        }
    }

    /**
     * Handle file deletion
     */
    async handleFileDelete(fileId) {
        if (!confirm('Are you sure you want to delete this file?')) {
            return;
        }

        try {
            this.uiService.showLoading('Deleting file...');
            await this.fileService.deleteFile(fileId);
            this.uiService.hideLoading();
            this.uiService.showSuccess('File deleted successfully');
            await this.loadFiles(); // Refresh file list
        } catch (error) {
            console.error('Failed to delete file:', error);
            this.uiService.hideLoading();
            this.uiService.showError('Failed to delete file');
        }
    }

    /**
     * Handle file download
     */
    async handleFileDownload(fileId) {
        try {
            this.uiService.showLoading('Preparing download...');
            const downloadUrl = await this.fileService.getDownloadUrl(fileId);
            
            // Trigger download
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = ''; // Browser will use filename from Content-Disposition header
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.uiService.hideLoading();
        } catch (error) {
            console.error('Failed to download file:', error);
            this.uiService.hideLoading();
            this.uiService.showError('Failed to download file');
        }
    }

    /**
     * Handle folder navigation
     */
    async handleFolderNavigate(folder) {
        this.currentFolder = folder;
        await this.loadFiles();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cloudStorageApp = new App();
});

// Handle service worker for caching (if needed in the future)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Service worker registration can be added here for PWA features
    });
}