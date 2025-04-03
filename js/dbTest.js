// Database connection test functions

// Test Realtime Database connection
async function testRealtimeDBConnection() {
    console.log('Testing Realtime Database connection...');
    
    try {
        // Check if Firebase is initialized
        if (!firebase || !firebase.database) {
            console.error('Firebase Database SDK not available');
            return false;
        }
        
        // Get database reference
        const db = firebase.database();
        
        // Try to write to a test location
        const testRef = db.ref('connection-test');
        await testRef.set({
            timestamp: Date.now(),
            message: 'Connection test successful'
        });
        
        // Try to read from the test location
        const snapshot = await testRef.once('value');
        const data = snapshot.val();
        
        if (data && data.message === 'Connection test successful') {
            console.log('Realtime Database connection test successful!');
            console.log('Test data:', data);
            return true;
        } else {
            console.error('Realtime Database connection test failed: Unexpected data');
            return false;
        }
    } catch (error) {
        console.error('Realtime Database connection test failed:', error);
        return false;
    }
}

// Test user-specific data path
async function testUserDataPath(userId) {
    console.log('Testing user data path for user:', userId);
    
    if (!userId) {
        console.error('No user ID provided for test');
        return false;
    }
    
    try {
        // Check if Firebase is initialized
        if (!firebase || !firebase.database) {
            console.error('Firebase Database SDK not available');
            return false;
        }
        
        // Get database reference
        const db = firebase.database();
        
        // Try to write to the user's test location
        const testRef = db.ref(`users/${userId}/test`);
        await testRef.set({
            timestamp: Date.now(),
            message: 'User path test successful'
        });
        
        // Try to read from the user's test location
        const snapshot = await testRef.once('value');
        const data = snapshot.val();
        
        if (data && data.message === 'User path test successful') {
            console.log('User data path test successful!');
            console.log('Test data:', data);
            return true;
        } else {
            console.error('User data path test failed: Unexpected data');
            return false;
        }
    } catch (error) {
        console.error('User data path test failed:', error);
        return false;
    }
}

// Export test functions
window.dbTest = {
    testRealtimeDBConnection,
    testUserDataPath
};
