import { Amplify } from 'aws-amplify';
import {
    signUp,
    confirmSignUp,
    signIn,
    signOut,
    getCurrentUser,
    fetchAuthSession,
    fetchUserAttributes,
    updateUserAttributes,
    updatePassword,
    resetPassword,
    confirmResetPassword
} from 'aws-amplify/auth';

/**
 * Authentication Service
 * Handles user authentication, registration, and session management using AWS Cognito
 */
export class AuthService {
    constructor() {
        this.currentUser = null;
        this.initialized = false;
    }

    /**
     * Initialize the service with AWS configuration
     */
    async init(config) {
        try {
            // Configure Amplify with Cognito settings
            Amplify.configure({
                Auth: {
                    region: config.region,
                    userPoolId: config.cognitoUserPoolId,
                    userPoolWebClientId: config.cognitoUserPoolClientId,
                    identityPoolId: config.cognitoIdentityPoolId,
                    authenticationFlowType: 'USER_SRP_AUTH'
                }
            });

            this.initialized = true;
            console.log('AuthService initialized successfully');
        } catch (error) {
            console.error('Failed to initialize AuthService:', error);
            throw error;
        }
    }

    /**
     * Check if service is initialized
     */
    checkInitialized() {
        if (!this.initialized) {
            throw new Error('AuthService not initialized. Call init() first.');
        }
    }

    /**
     * Register a new user
     */
    async signUp(email, password, name, role = 'viewer') {
        this.checkInitialized();

        try {
            const result = await signUp({
                username: email,
                password: password,
                options: {
                    userAttributes: {
                        email: email,
                        name: name,
                        'custom:role': role
                    }
                }
            });

            console.log('User registration successful:', result);
            return result;
        } catch (error) {
            console.error('Registration failed:', error);
            throw this.handleAuthError(error);
        }
    }

    /**
     * Confirm user registration with verification code
     */
    async confirmSignUp(email, code) {
        this.checkInitialized();

        try {
            const result = await confirmSignUp({
                username: email,
                confirmationCode: code
            });
            console.log('User confirmation successful:', result);
            return result;
        } catch (error) {
            console.error('Confirmation failed:', error);
            throw this.handleAuthError(error);
        }
    }

    /**
     * Sign in user
     */
    async signIn(email, password) {
        this.checkInitialized();

        try {
            const result = await signIn({
                username: email,
                password: password
            });
            this.currentUser = result;
            
            // Dispatch login success event
            document.dispatchEvent(new CustomEvent('login-success', {
                detail: { user: result }
            }));

            console.log('User sign in successful:', result);
            return result;
        } catch (error) {
            console.error('Sign in failed:', error);
            throw this.handleAuthError(error);
        }
    }

    /**
     * Sign out user
     */
    async signOut() {
        this.checkInitialized();

        try {
            await signOut();
            this.currentUser = null;
            console.log('User signed out successfully');
        } catch (error) {
            console.error('Sign out failed:', error);
            throw this.handleAuthError(error);
        }
    }

    /**
     * Get current authenticated user
     */
    async getCurrentUser() {
        this.checkInitialized();

        try {
            const user = await getCurrentUser();
            this.currentUser = user;
            return user;
        } catch (error) {
            // User not authenticated
            this.currentUser = null;
            return null;
        }
    }

    /**
     * Get current user session
     */
    async getCurrentSession() {
        this.checkInitialized();

        try {
            const session = await fetchAuthSession();
            return session;
        } catch (error) {
            console.error('Failed to get current session:', error);
            return null;
        }
    }

    /**
     * Get JWT token for API requests
     */
    async getJwtToken() {
        try {
            const session = await this.getCurrentSession();
            if (session && session.tokens) {
                return session.tokens.idToken.toString();
            }
            return null;
        } catch (error) {
            console.error('Failed to get JWT token:', error);
            return null;
        }
    }

    /**
     * Get user attributes
     */
    async getUserAttributes() {
        this.checkInitialized();

        try {
            const user = await this.getCurrentUser();
            if (user) {
                const attributes = await fetchUserAttributes();
                return attributes;
            }
            return null;
        } catch (error) {
            console.error('Failed to get user attributes:', error);
            return null;
        }
    }

    /**
     * Update user attributes
     */
    async updateUserAttributes(attributes) {
        this.checkInitialized();

        try {
            const result = await updateUserAttributes({
                userAttributes: attributes
            });
            console.log('User attributes updated:', result);
            return result;
        } catch (error) {
            console.error('Failed to update user attributes:', error);
            throw this.handleAuthError(error);
        }
    }

    /**
     * Change user password
     */
    async changePassword(oldPassword, newPassword) {
        this.checkInitialized();

        try {
            const result = await updatePassword({
                oldPassword: oldPassword,
                newPassword: newPassword
            });
            console.log('Password changed successfully');
            return result;
        } catch (error) {
            console.error('Failed to change password:', error);
            throw this.handleAuthError(error);
        }
    }

    /**
     * Request password reset
     */
    async forgotPassword(email) {
        this.checkInitialized();

        try {
            const result = await resetPassword({
                username: email
            });
            console.log('Password reset requested:', result);
            return result;
        } catch (error) {
            console.error('Failed to request password reset:', error);
            throw this.handleAuthError(error);
        }
    }

    /**
     * Confirm password reset with code
     */
    async forgotPasswordSubmit(email, code, newPassword) {
        this.checkInitialized();

        try {
            const result = await confirmResetPassword({
                username: email,
                confirmationCode: code,
                newPassword: newPassword
            });
            console.log('Password reset confirmed:', result);
            return result;
        } catch (error) {
            console.error('Failed to confirm password reset:', error);
            throw this.handleAuthError(error);
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * Get current user role
     */
    getUserRole() {
        if (this.currentUser && this.currentUser.signInUserSession) {
            const idToken = this.currentUser.signInUserSession.idToken;
            if (idToken && idToken.payload && idToken.payload['custom:role']) {
                return idToken.payload['custom:role'];
            }
        }
        return 'viewer'; // Default role
    }

    /**
     * Check if user has admin role
     */
    isAdmin() {
        return this.getUserRole() === 'admin';
    }

    /**
     * Check if user has editor role
     */
    isEditor() {
        const role = this.getUserRole();
        return role === 'admin' || role === 'editor';
    }

    /**
     * Check if user has viewer role
     */
    isViewer() {
        const role = this.getUserRole();
        return role === 'viewer' || role === 'editor' || role === 'admin';
    }

    /**
     * Handle authentication errors with user-friendly messages
     */
    handleAuthError(error) {
        const errorMessages = {
            'UserNotFoundException': 'User not found. Please check your email address.',
            'NotAuthorizedException': 'Invalid email or password.',
            'UserNotConfirmedException': 'Please confirm your email address before signing in.',
            'UsernameExistsException': 'An account with this email already exists.',
            'InvalidParameterException': 'Invalid parameters provided.',
            'InvalidPasswordException': 'Password does not meet requirements.',
            'CodeMismatchException': 'Invalid verification code.',
            'ExpiredCodeException': 'Verification code has expired.',
            'LimitExceededException': 'Too many attempts. Please try again later.',
            'TooManyRequestsException': 'Too many requests. Please try again later.',
            'NetworkError': 'Network error. Please check your connection.'
        };

        const errorCode = error.code || error.name || 'UnknownError';
        const friendlyMessage = errorMessages[errorCode] || error.message || 'An unexpected error occurred.';

        return new Error(friendlyMessage);
    }
}