// Firebase Firestore storage implementation for SSI Income Tracker

// Note: Firebase config is already defined in index.html

// Initialize Firebase app
let db;

// Initialize Firebase when this script loads
function initializeFirebase() {
    try {
        // Check if Firebase is already initialized
        if (firebase.apps.length === 0) {
            firebase.initializeApp(firebaseConfig);
            console.log('Firebase initialized successfully');
        } else {
            console.log('Firebase already initialized');
        }

        // Initialize Firestore
        if (firebase.firestore) {
            db = firebase.firestore();
            console.log('Firestore initialized successfully');
            return true;
        } else {
            console.error('Firestore is not available');
            return false;
        }
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        return false;
    }
}

// Load income data from Firestore
async function loadIncomeDataFromFirestore(userId) {
    try {
        if (!db) {
            if (!initializeFirebase()) {
                return false;
            }
        }

        let query = db.collection('income-data');

        // Filter by userId if provided
        if (userId) {
            query = query.where('userId', '==', userId);
        }

        // Order by date
        query = query.orderBy('date', 'desc');

        const snapshot = await query.get();

        if (!snapshot.empty) {
            incomeData = snapshot.docs.map(doc => {
                const data = doc.data();
                // Convert Firestore Timestamp to JavaScript Date
                if (data.date && data.date.toDate) {
                    data.date = data.date.toDate();
                }
                return { ...data, firestoreId: doc.id };
            });

            updateIncomeTable();
            updateSummary();
            updateVisualization();
            return true;
        } else {
            incomeData = [];
            return true;
        }
    } catch (error) {
        console.error('Error loading income data from Firestore:', error);
        return false;
    }
}

// Save income data to Firestore
async function saveIncomeDataToFirestore(userId) {
    try {
        if (!db) {
            if (!initializeFirebase()) {
                return false;
            }
        }

        // Create a batch to perform multiple operations
        const batch = db.batch();

        // Delete existing documents for this user
        let query = db.collection('income-data');

        // Filter by userId if provided
        if (userId) {
            query = query.where('userId', '==', userId);
        }

        const snapshot = await query.get();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Add all income data entries
        for (const entry of incomeData) {
            const docRef = db.collection('income-data').doc();
            // Remove firestoreId if it exists
            const { firestoreId, ...entryData } = entry;

            // Add userId to each entry if provided
            if (userId) {
                entryData.userId = userId;
            }

            batch.set(docRef, entryData);
        }

        await batch.commit();
        return true;
    } catch (error) {
        console.error('Error saving income data to Firestore:', error);
        return false;
    }
}

// Add a single income entry to Firestore
async function addIncomeEntryToFirestore(entry, userId) {
    try {
        if (!db) {
            if (!initializeFirebase()) {
                return false;
            }
        }

        // Add userId to the entry if provided
        if (userId) {
            entry.userId = userId;
        }

        await db.collection('income-data').add(entry);
        return true;
    } catch (error) {
        console.error('Error adding income entry to Firestore:', error);
        return false;
    }
}

// Clear income data from Firestore
async function clearIncomeDataFromFirestore(userId) {
    try {
        if (!db) {
            if (!initializeFirebase()) {
                return false;
            }
        }

        let query = db.collection('income-data');

        // Filter by userId if provided
        if (userId) {
            query = query.where('userId', '==', userId);
        }

        const snapshot = await query.get();

        // Create a batch to perform multiple operations
        const batch = db.batch();

        // Delete documents
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();

        incomeData = [];
        updateIncomeTable();
        updateSummary();
        updateVisualization();
        return true;
    } catch (error) {
        console.error('Error clearing income data from Firestore:', error);
        return false;
    }
}

// Export functions to window object for global access
window.firestore = {
    initializeFirebase,
    loadIncomeDataFromFirestore,
    saveIncomeDataToFirestore,
    addIncomeEntryToFirestore,
    clearIncomeDataFromFirestore
};
