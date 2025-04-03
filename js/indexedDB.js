// IndexedDB storage implementation for SSI Income Tracker

// Open the database
let dbPromise;

try {
    dbPromise = idb.openDB('ssi-income-tracker', 1, {
        upgrade(db) {
            // Create an object store for income data if it doesn't exist
            if (!db.objectStoreNames.contains('income-data')) {
                const store = db.createObjectStore('income-data', {
                    keyPath: 'id',
                    autoIncrement: true
                });

                // Create indexes for easier querying
                store.createIndex('date', 'date');
                store.createIndex('source', 'source');
                store.createIndex('userId', 'userId');
            }
        }
    });
} catch (error) {
    console.error('Error opening IndexedDB:', error);
}

// Load income data from IndexedDB
async function loadIncomeDataFromIDB(userId) {
    try {
        const db = await dbPromise;
        let data;

        if (userId) {
            // Get user-specific data using the userId index
            const index = db.transaction('income-data').store.index('userId');
            data = await index.getAll(userId);
        } else {
            // Get all data if no userId is provided
            data = await db.getAll('income-data');
        }

        if (data && data.length > 0) {
            incomeData = data;
            updateIncomeTable();
            updateSummary();
            updateVisualization();
            return true;
        } else {
            incomeData = [];
            return true;
        }
    } catch (error) {
        console.error('Error loading income data from IndexedDB:', error);
        return false;
    }
}

// Save income data to IndexedDB
async function saveIncomeDataToIDB(userId) {
    try {
        const db = await dbPromise;
        const tx = db.transaction('income-data', 'readwrite');
        const store = tx.objectStore('income-data');

        // Clear existing data for this user
        if (userId) {
            // Get all keys for this user
            const index = store.index('userId');
            const keys = await index.getAllKeys(userId);

            // Delete each entry
            for (const key of keys) {
                await store.delete(key);
            }
        } else {
            // Clear all data if no userId is provided
            await store.clear();
        }

        // Add all income data entries with userId
        for (const entry of incomeData) {
            // Add userId to each entry if provided
            if (userId) {
                entry.userId = userId;
            }
            await store.add(entry);
        }

        await tx.done;
        return true;
    } catch (error) {
        console.error('Error saving income data to IndexedDB:', error);
        return false;
    }
}

// Add a single income entry to IndexedDB
async function addIncomeEntryToIDB(entry, userId) {
    try {
        const db = await dbPromise;

        // Add userId to the entry if provided
        if (userId) {
            entry.userId = userId;
        }

        await db.add('income-data', entry);
        return true;
    } catch (error) {
        console.error('Error adding income entry to IndexedDB:', error);
        return false;
    }
}

// Clear income data from IndexedDB
async function clearIncomeDataFromIDB(userId) {
    try {
        const db = await dbPromise;

        if (userId) {
            // Clear only user-specific data
            const tx = db.transaction('income-data', 'readwrite');
            const store = tx.objectStore('income-data');
            const index = store.index('userId');
            const keys = await index.getAllKeys(userId);

            // Delete each entry for this user
            for (const key of keys) {
                await store.delete(key);
            }

            await tx.done;
        } else {
            // Clear all data if no userId is provided
            await db.clear('income-data');
        }

        incomeData = [];
        updateIncomeTable();
        updateSummary();
        updateVisualization();
        return true;
    } catch (error) {
        console.error('Error clearing income data from IndexedDB:', error);
        return false;
    }
}

// Export functions to window object for global access
window.indexedDB = {
    loadIncomeDataFromIDB,
    saveIncomeDataToIDB,
    addIncomeEntryToIDB,
    clearIncomeDataFromIDB
};
