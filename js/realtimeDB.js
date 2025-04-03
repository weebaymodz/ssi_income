// Firebase Realtime Database implementation for SSI Income Tracker

// Database reference
let realtimeDB = null;
let activeDataListener = null;
let currentUserPath = null;

// Initialize Realtime Database
function initializeRealtimeDB() {
    console.log('Initializing Realtime Database...');

    try {
        // Check if Firebase is already initialized
        if (!firebase || !firebase.database) {
            console.error('Firebase Database SDK not available');
            return false;
        }

        // Get database reference
        realtimeDB = firebase.database();
        console.log('Realtime Database initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing Realtime Database:', error);
        return false;
    }
}

// Get database reference for the current user
function getUserDataRef(userId) {
    if (!realtimeDB) {
        if (!initializeRealtimeDB()) {
            return null;
        }
    }

    if (!userId) {
        console.warn('No user ID provided for database reference');
        return realtimeDB.ref('public-data');
    }

    currentUserPath = `users/${userId}/income-data`;
    console.log('User data path:', currentUserPath);
    return realtimeDB.ref(currentUserPath);
}

// Load income data from Realtime Database
async function loadIncomeDataFromRealtimeDB(userId) {
    console.log('Loading data from Realtime Database for user:', userId);

    try {
        // Remove any existing listeners
        removeDataListeners();

        // Get reference to user data
        const dataRef = getUserDataRef(userId);
        if (!dataRef) {
            console.error('Failed to get database reference');
            return false;
        }

        // First, get the initial data
        console.log('Fetching initial data...');
        const snapshot = await dataRef.once('value');
        const initialData = snapshot.val();

        if (initialData) {
            console.log('Initial data loaded:', Object.keys(initialData).length, 'entries');
            processIncomingData(initialData);
        } else {
            console.log('No initial data found');
            incomeData = [];
            updateIncomeTable();
            updateSummary();
            updateVisualization();
        }

        // Then set up the real-time listener
        console.log('Setting up real-time listener...');
        activeDataListener = dataRef.on('value', (snapshot) => {
            console.log('Real-time update received');
            const data = snapshot.val();

            if (data) {
                console.log('Data update contains', Object.keys(data).length, 'entries');
                processIncomingData(data);

                // Show notification only if this is not the initial load
                if (window.realtimeDBInitialLoadComplete) {
                    window.app.showNotification('Data updated from another device', 'info');
                }
            } else {
                console.log('No data in update');
                incomeData = [];
                updateIncomeTable();
                updateSummary();
                updateVisualization();
            }

            // Mark initial load as complete
            window.realtimeDBInitialLoadComplete = true;
        }, (error) => {
            console.error('Error in Realtime Database listener:', error);
        });

        return true;
    } catch (error) {
        console.error('Error loading income data from Realtime Database:', error);
        return false;
    }
}

// Process incoming data from Realtime Database
function processIncomingData(data) {
    // Convert object to array
    incomeData = Object.values(data);

    // Convert date strings to Date objects if needed
    incomeData.forEach(entry => {
        if (entry.date && typeof entry.date === 'string') {
            // Keep as string for now, but ensure it's in the right format
            if (!entry.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                try {
                    const date = new Date(entry.date);
                    entry.date = date.toISOString().split('T')[0];
                } catch (e) {
                    console.warn('Invalid date format:', entry.date);
                }
            }
        }
    });

    // Sort by date (newest first)
    incomeData.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
    });

    // Update UI
    updateIncomeTable();
    updateSummary();
    updateVisualization();
}

// Remove active data listeners
function removeDataListeners() {
    if (activeDataListener && realtimeDB && currentUserPath) {
        console.log('Removing data listener from path:', currentUserPath);
        realtimeDB.ref(currentUserPath).off('value', activeDataListener);
        activeDataListener = null;
    }
}

// Save income data to Realtime Database
async function saveIncomeDataToRealtimeDB(userId) {
    console.log('Saving data to Realtime Database for user:', userId);

    try {
        // Get reference to user data
        const dataRef = getUserDataRef(userId);
        if (!dataRef) {
            console.error('Failed to get database reference');
            return false;
        }

        // Create an object with IDs as keys
        const dataObject = {};

        // Process each income entry
        for (let i = 0; i < incomeData.length; i++) {
            const entry = { ...incomeData[i] }; // Clone to avoid modifying original

            // Add userId to each entry
            if (userId) {
                entry.userId = userId;
            }

            // Ensure each entry has an ID
            const entryId = entry.id || `entry_${Date.now()}_${i}`;

            // Store in the object
            dataObject[entryId] = entry;
        }

        console.log('Saving', Object.keys(dataObject).length, 'entries to database');

        // Save to database
        await dataRef.set(dataObject);
        console.log('Data saved successfully');

        return true;
    } catch (error) {
        console.error('Error saving income data to Realtime Database:', error);
        return false;
    }
}

// Add a single income entry to Realtime Database
async function addIncomeEntryToRealtimeDB(entry, userId) {
    console.log('Adding entry to Realtime Database for user:', userId);

    try {
        // Get reference to user data
        const dataRef = getUserDataRef(userId);
        if (!dataRef) {
            console.error('Failed to get database reference');
            return false;
        }

        // Clone the entry to avoid modifying the original
        const newEntry = { ...entry };

        // Add userId to the entry
        if (userId) {
            newEntry.userId = userId;
        }

        // Generate a unique ID for the entry
        const entryId = `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        console.log('Adding entry with ID:', entryId);

        // Save to database
        await dataRef.child(entryId).set(newEntry);
        console.log('Entry added successfully');

        return true;
    } catch (error) {
        console.error('Error adding entry to Realtime Database:', error);
        return false;
    }
}

// Clear income data from Realtime Database
async function clearIncomeDataFromRealtimeDB(userId) {
    console.log('Clearing data from Realtime Database for user:', userId);

    try {
        // Get reference to user data
        const dataRef = getUserDataRef(userId);
        if (!dataRef) {
            console.error('Failed to get database reference');
            return false;
        }

        // Remove all data
        await dataRef.remove();
        console.log('Data cleared successfully');

        // Clear local data
        incomeData = [];
        updateIncomeTable();
        updateSummary();
        updateVisualization();

        return true;
    } catch (error) {
        console.error('Error clearing data from Realtime Database:', error);
        return false;
    }
}

// Export functions to window object for global access
window.realtimeDB = {
    initializeRealtimeDB,
    loadIncomeDataFromRealtimeDB,
    saveIncomeDataToRealtimeDB,
    addIncomeEntryToRealtimeDB,
    clearIncomeDataFromRealtimeDB,
    removeDataListeners
};

// Initialize flag for tracking initial load
window.realtimeDBInitialLoadComplete = false;

// Initialize database when script loads
initializeRealtimeDB();
