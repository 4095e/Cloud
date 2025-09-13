# Usage Guide

This guide explains how to use the Google Drive-like cloud storage application.

## Getting Started

### Accessing the Application

1. Open your web browser
2. Navigate to your CloudFront domain or S3 website URL
3. You'll see the login screen

### User Registration

1. Click "Don't have an account? Sign up"
2. Fill in the registration form:
   - **Full Name**: Your display name
   - **Email**: Your email address (will be used for login)
   - **Password**: Must be at least 8 characters with uppercase, lowercase, numbers, and symbols
   - **Role**: Choose your access level:
     - **Viewer**: Can view and upload files only
     - **Editor**: Can view, upload, edit, and delete files
     - **Admin**: Full access including user management

3. Click "Sign Up"
4. Check your email for a verification link
5. Click the verification link to activate your account
6. Return to the application and sign in

### Signing In

1. Enter your email and password
2. Click "Sign In"
3. You'll be redirected to the main dashboard

## User Roles and Permissions

### Viewer Role
- **Can do**:
  - View all files
  - Upload new files
  - Download files
  - Navigate folders
- **Cannot do**:
  - Edit or rename files
  - Delete files
  - Manage users

### Editor Role
- **Can do**:
  - Everything a Viewer can do
  - Edit and rename files they own
  - Delete files they own
  - Organize files in folders
- **Cannot do**:
  - Manage other users' files (unless admin)
  - Manage users

### Admin Role
- **Can do**:
  - Everything an Editor can do
  - Manage all files (regardless of owner)
  - Delete any files
  - Manage user accounts
  - Change user roles

## File Management

### Uploading Files

#### Method 1: Upload Button
1. Click the "📤 Upload Files" button
2. Select one or multiple files from your computer
3. Files will be uploaded automatically
4. You'll see a success notification when complete

#### Method 2: Drag and Drop
1. Drag files from your computer
2. Drop them onto the drop zone area
3. Files will be uploaded automatically

#### Supported File Types
- Images: JPG, PNG, GIF, BMP, WebP, SVG
- Documents: PDF, DOC, DOCX, TXT, RTF
- Videos: MP4, AVI, MKV, MOV, WebM
- Audio: MP3, WAV, FLAC, AAC, OGG
- Archives: ZIP, RAR, 7Z, TAR, GZ
- Code: JS, HTML, CSS, Python, Java, C++
- And many more...

#### File Size Limits
- Maximum file size: 100MB per file
- No limit on total storage (within AWS account limits)

### Viewing Files

Files are displayed in a grid layout showing:
- File icon (based on file type)
- File name
- File size
- Upload date
- Available actions (based on your role)

### Downloading Files

1. Click the "Download" button on any file
2. The file will be downloaded to your computer
3. Large files may take some time to prepare

### Organizing Files

#### Folders
Currently, the application supports a flat file structure. Folder functionality can be added in future versions.

#### File Information
Hover over file names to see the full filename if it's truncated.

### File Actions

#### Renaming Files (Editor/Admin only)
1. Click the "Rename" button on the file
2. Enter the new filename
3. Click "Save"

#### Deleting Files (Editor/Admin only)
1. Click the "Delete" button on the file
2. Confirm the deletion in the popup
3. The file will be permanently deleted

**Note**: Deleted files cannot be recovered. Use caution when deleting.

## Navigation

### Breadcrumb Navigation
- Use the breadcrumb at the top to navigate between folders
- Click on any folder name to jump to that level
- "Home" takes you back to the root directory

### File Search
Use the search functionality to find files by:
- File name
- File type
- File extension

## User Interface Features

### Responsive Design
- Works on desktop, tablet, and mobile devices
- Touch-friendly interface for mobile users
- Responsive grid layout adapts to screen size

### Visual File Types
Files are color-coded and have icons based on their type:
- 🖼️ Images (red)
- 🎥 Videos (teal)
- 🎵 Audio (blue)
- 📄 Documents (green)
- 📕 PDFs (pink)
- 📦 Archives (yellow)
- 💻 Code files (purple)
- 📁 Other files (blue)

### Notifications
The application shows notifications for:
- Successful operations (green)
- Errors (red)
- Information messages (blue)

## Account Management

### Profile Information
Your profile shows:
- Full name
- Email address
- User role
- Registration date

### Changing Password
1. Go to account settings (future feature)
2. Enter current password
3. Enter new password
4. Confirm new password
5. Click "Update Password"

### Logout
Click the "Logout" button in the top right corner to sign out securely.

## Best Practices

### File Organization
- Use descriptive file names
- Include dates in file names when relevant
- Group similar files together
- Remove duplicate files regularly

### Security
- Use a strong, unique password
- Don't share your login credentials
- Log out when using shared computers
- Regularly review your uploaded files

### Performance
- Upload files during off-peak hours for better performance
- Keep file sizes reasonable when possible
- Clear browser cache if experiencing issues

## Troubleshooting

### Common Issues

#### Cannot Upload Files
- Check file size (must be under 100MB)
- Ensure you have an internet connection
- Try refreshing the page
- Check browser console for error messages

#### Files Not Loading
- Refresh the page
- Check internet connection
- Try logging out and back in
- Clear browser cache

#### Cannot Download Files
- Check internet connection
- Ensure popup blockers aren't interfering
- Try right-clicking and "Save link as"

#### Login Issues
- Verify email and password are correct
- Check if account is verified (check email)
- Try password reset if needed
- Ensure JavaScript is enabled

### Getting Help

If you encounter issues:

1. **Check browser console**: Press F12 and look for error messages
2. **Try different browser**: Test in Chrome, Firefox, or Safari
3. **Clear cache**: Clear browser cache and cookies
4. **Contact administrator**: If you're not the admin, contact your system administrator

## Advanced Features

### Batch Operations
- Select multiple files by holding Ctrl (Windows) or Cmd (Mac)
- Perform actions on multiple files at once

### Keyboard Shortcuts
- **Ctrl+A**: Select all files
- **Delete**: Delete selected files (if permitted)
- **Escape**: Cancel current operation

### Mobile Usage
- Swipe gestures for navigation
- Long-press for context menus
- Pinch to zoom on images (future feature)

## API Access

For developers wanting to integrate with the system:
- REST API available at `/api/v1/`
- JWT authentication required
- See [API Reference](api.md) for details

## Privacy and Data Protection

### Data Storage
- Files are encrypted at rest in AWS S3
- Metadata is stored in encrypted DynamoDB tables
- All data transmission is encrypted with SSL/TLS

### Access Logging
- All file access is logged for security
- Admins can review access logs
- User activity is tracked for audit purposes

### Data Retention
- Files are retained indefinitely unless deleted
- Deleted files are permanently removed
- User accounts can be deactivated by admins

### Compliance
- The system follows AWS security best practices
- Data is stored in your specified AWS region
- Backup and disaster recovery procedures are in place