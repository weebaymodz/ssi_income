// Authentication functionality for SSI Income Tracker

// DOM Elements
const authContainer = document.getElementById('auth-container');
const authForm = document.getElementById('auth-form');
const authToggle = document.getElementById('auth-toggle');
const signInButton = document.getElementById('sign-in-button');
const signUpButton = document.getElementById('sign-up-button');
const signOutButton = document.getElementById('sign-out-button');
const authStatus = document.getElementById('auth-status');
const authError = document.getElementById('auth-error');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const appContent = document.querySelectorAll('.app-content');

// Authentication state
let isSignInMode = true;
let currentUser = null;

// Initialize authentication
function initAuth() {
    // Set up event listeners
    setupAuthListeners();

    // Check if Firebase Auth is available
    if (firebase && firebase.auth) {
        console.log('Firebase Auth is available, checking authentication state');
        // Check if user is already signed in
        firebase.auth().onAuthStateChanged(handleAuthStateChanged);
    } else {
        console.error('Firebase Auth is not available');
        showAuthError('Authentication service is not available. Please check your internet connection and try again.');
    }
}

// Set up authentication event listeners
function setupAuthListeners() {
    // Toggle between sign in and sign up
    authToggle.addEventListener('click', toggleAuthMode);

    // Form submission
    authForm.addEventListener('submit', handleAuthFormSubmit);

    // Sign out
    signOutButton.addEventListener('click', handleSignOut);
}

// Toggle between sign in and sign up modes
function toggleAuthMode() {
    isSignInMode = !isSignInMode;

    if (isSignInMode) {
        // Switch to sign in mode
        authForm.classList.remove('sign-up-mode');
        authForm.classList.add('sign-in-mode');
        signInButton.style.display = 'block';
        signUpButton.style.display = 'none';
        authToggle.textContent = 'Need an account? Sign up';
    } else {
        // Switch to sign up mode
        authForm.classList.remove('sign-in-mode');
        authForm.classList.add('sign-up-mode');
        signInButton.style.display = 'none';
        signUpButton.style.display = 'block';
        authToggle.textContent = 'Already have an account? Sign in';
    }

    // Clear any error messages
    hideAuthError();
}

// Handle authentication form submission
function handleAuthFormSubmit(event) {
    event.preventDefault();

    // Get form values
    const email = authEmail.value.trim();
    const password = authPassword.value.trim();

    // Validate inputs
    if (!email || !password) {
        showAuthError('Please enter both email and password.');
        return;
    }

    // Disable form while processing
    setAuthFormLoading(true);

    if (isSignInMode) {
        // Sign in with email and password
        signInWithEmailPassword(email, password);
    } else {
        // Sign up with email and password
        signUpWithEmailPassword(email, password);
    }
}

// Sign in with email and password
function signInWithEmailPassword(email, password) {
    // Check if Firebase Auth is available
    if (!firebase.auth) {
        console.error('Firebase Auth is not available');
        showAuthError('Authentication service is not available. Please try again later.');
        setAuthFormLoading(false);
        return;
    }

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed in successfully
            currentUser = userCredential.user;
            hideAuthError();
            authForm.reset();
        })
        .catch((error) => {
            // Handle errors
            console.error('Sign in error:', error);
            let errorMessage = 'Failed to sign in. Please check your credentials.';

            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = 'Invalid email or password.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed attempts. Please try again later.';
            } else if (error.code === 'auth/configuration-not-found') {
                errorMessage = 'Authentication is not properly configured. Please enable Email/Password authentication in Firebase console.';
            } else if (error.code === 'auth/operation-not-allowed') {
                errorMessage = 'Email/Password authentication is not enabled in Firebase console.';
            }

            showAuthError(errorMessage);
        })
        .finally(() => {
            setAuthFormLoading(false);
        });
}

// Sign up with email and password
function signUpWithEmailPassword(email, password) {
    // Check if Firebase Auth is available
    if (!firebase.auth) {
        console.error('Firebase Auth is not available');
        showAuthError('Authentication service is not available. Please try again later.');
        setAuthFormLoading(false);
        return;
    }

    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed up successfully
            currentUser = userCredential.user;
            hideAuthError();
            authForm.reset();

            // Show success message
            window.app.showNotification('Account created successfully!', 'success');
        })
        .catch((error) => {
            // Handle errors
            console.error('Sign up error:', error);
            let errorMessage = 'Failed to create account.';

            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Email is already in use.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak. Please use at least 6 characters.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address.';
            } else if (error.code === 'auth/configuration-not-found') {
                errorMessage = 'Authentication is not properly configured. Please enable Email/Password authentication in Firebase console.';
            } else if (error.code === 'auth/operation-not-allowed') {
                errorMessage = 'Email/Password authentication is not enabled in Firebase console.';
            }

            showAuthError(errorMessage);
        })
        .finally(() => {
            setAuthFormLoading(false);
        });
}

// Handle sign out
function handleSignOut() {
    // Clean up any active database listeners before signing out
    if (window.realtimeDB && typeof window.realtimeDB.removeDataListeners === 'function') {
        window.realtimeDB.removeDataListeners();
    }

    firebase.auth().signOut()
        .then(() => {
            // Sign out successful
            window.app.showNotification('Signed out successfully');

            // Reset initial load flag
            if (window.realtimeDBInitialLoadComplete !== undefined) {
                window.realtimeDBInitialLoadComplete = false;
            }
        })
        .catch((error) => {
            // An error happened
            console.error('Sign out error:', error);
            window.app.showNotification('Error signing out', 'error');
        });
}

// Handle authentication state changes
function handleAuthStateChanged(user) {
    if (user) {
        // User is signed in
        console.log('User is signed in:', user.email);
        currentUser = user;
        updateUIForAuthenticatedUser(user);

        // Load user-specific data
        loadUserData(user.uid);
    } else {
        // User is signed out
        console.log('User is signed out');
        currentUser = null;
        updateUIForUnauthenticatedUser();
    }
}

// Update UI for authenticated user
function updateUIForAuthenticatedUser(user) {
    // Update auth status
    authStatus.textContent = user.email;
    signOutButton.style.display = 'block';

    // Hide auth form
    authContainer.style.display = 'none';

    // Show app content
    appContent.forEach(element => {
        element.classList.add('authenticated');
    });
}

// Update UI for unauthenticated user
function updateUIForUnauthenticatedUser() {
    // Update auth status
    authStatus.textContent = 'Not signed in';
    signOutButton.style.display = 'none';

    // Show auth form
    authContainer.style.display = 'block';

    // Hide app content
    appContent.forEach(element => {
        element.classList.remove('authenticated');
    });

    // Reset to sign in mode
    if (!isSignInMode) {
        toggleAuthMode();
    }
}

// Load user-specific data
function loadUserData(userId) {
    console.log('Loading user data for user ID:', userId);

    // Set the user ID in the storage manager
    if (window.storageManager && typeof window.storageManager.setCurrentUserId === 'function') {
        window.storageManager.setCurrentUserId(userId);

        // Reset initial load flag before loading data
        if (window.realtimeDBInitialLoadComplete !== undefined) {
            window.realtimeDBInitialLoadComplete = false;
        }

        // Load data for this user
        console.log('Calling loadIncomeDataFromStorage for user:', userId);
        window.storageManager.loadIncomeDataFromStorage()
            .then(success => {
                if (success) {
                    console.log('Successfully loaded data for user:', userId);
                    // Update UI with the loaded data
                    updateIncomeTable();
                    updateSummary();
                    updateVisualization();

                    // Show welcome message
                    window.app.showNotification(`Welcome back! Your data is synced across all your devices.`, 'success');
                } else {
                    console.error('Failed to load data for user:', userId);
                }
            })
            .catch(error => {
                console.error('Error loading data for user:', userId, error);
            });
    } else {
        console.error('Storage manager not available or missing setCurrentUserId function');
    }
}

// Show authentication error
function showAuthError(message) {
    authError.textContent = message;
    authError.style.display = 'block';
}

// Hide authentication error
function hideAuthError() {
    authError.textContent = '';
    authError.style.display = 'none';
}

// Set loading state for auth form
function setAuthFormLoading(isLoading) {
    const buttons = [signInButton, signUpButton, authToggle];

    if (isLoading) {
        // Disable all buttons and add loading indicator
        buttons.forEach(button => {
            if (button.style.display !== 'none') {
                button.disabled = true;
                button.innerHTML = '<span class="spinner"></span> Loading...';
            }
        });
    } else {
        // Re-enable buttons and restore text
        signInButton.disabled = false;
        signInButton.textContent = 'Sign In';

        signUpButton.disabled = false;
        signUpButton.textContent = 'Sign Up';

        authToggle.disabled = false;
        authToggle.textContent = isSignInMode ? 'Need an account? Sign up' : 'Already have an account? Sign in';
    }
}

// Initialize authentication when the DOM is loaded
document.addEventListener('DOMContentLoaded', initAuth);

// Export auth functions
window.auth = {
    getCurrentUser: () => currentUser,
    signOut: handleSignOut
};
