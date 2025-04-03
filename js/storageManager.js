// Storage Manager for SSI Income Tracker
// Provides a unified interface for different storage options

// Storage types
const STORAGE_TYPES = {
    LOCAL_STORAGE: 'localStorage',
    INDEXED_DB: 'indexedDB',
    FIRESTORE: 'firestore',
    REALTIME_DB: 'realtimeDB'
};

// Default storage type
let currentStorageType = STORAGE_TYPES.REALTIME_DB;

// Current user ID (for user-specific data storage)
let currentUserId = null;

// Initialize storage manager
function initStorageManager() {
    // Check if user has a preferred storage type saved
    const savedStorageType = localStorage.getItem('preferredStorageType');
    if (savedStorageType && Object.values(STORAGE_TYPES).includes(savedStorageType)) {
        currentStorageType = savedStorageType;
    }

    // Update UI to reflect current storage type
    updateStorageTypeUI();

    // Note: We don't load data here anymore - it will be loaded after authentication
}

// Set storage type
function setStorageType(storageType) {
    if (Object.values(STORAGE_TYPES).includes(storageType)) {
        currentStorageType = storageType;
        localStorage.setItem('preferredStorageType', storageType);
        updateStorageTypeUI();

        // Load data from the newly selected storage
        loadIncomeDataFromStorage();

        return true;
    }
    return false;
}

// Get current storage type
function getStorageType() {
    return currentStorageType;
}

// Update UI to reflect current storage type
function updateStorageTypeUI() {
    const storageTypeRadios = document.querySelectorAll('input[name="storage-type"]');
    storageTypeRadios.forEach(radio => {
        if (radio.value === currentStorageType) {
            radio.checked = true;
        }
    });
}

// Set current user ID for user-specific data storage
function setCurrentUserId(userId) {
    console.log('Setting current user ID:', userId);
    currentUserId = userId;
    return currentUserId;
}

// Get current user ID
function getCurrentUserId() {
    return currentUserId;
}

// Get storage key with user ID prefix
function getUserStorageKey(baseKey) {
    if (currentUserId) {
        return `user_${currentUserId}_${baseKey}`;
    }
    return baseKey;
}

// Load income data from the selected storage
async function loadIncomeDataFromStorage() {
    let success = false;

    switch (currentStorageType) {
        case STORAGE_TYPES.LOCAL_STORAGE:
            // Use user-specific key for localStorage
            const userKey = getUserStorageKey('ssiIncomeData');
            const savedData = localStorage.getItem(userKey);
            if (savedData) {
                incomeData = JSON.parse(savedData);
                updateIncomeTable();
                updateSummary();
                updateVisualization();
                success = true;
            } else {
                incomeData = [];
                success = true;
            }
            break;
        case STORAGE_TYPES.INDEXED_DB:
            // Pass user ID to IndexedDB functions
            success = await window.indexedDB.loadIncomeDataFromIDB(currentUserId);
            break;
        case STORAGE_TYPES.FIRESTORE:
            // Pass user ID to Firestore functions
            success = await window.firestore.loadIncomeDataFromFirestore(currentUserId);
            break;
        case STORAGE_TYPES.REALTIME_DB:
            // Pass user ID to Realtime Database functions
            success = await window.realtimeDB.loadIncomeDataFromRealtimeDB(currentUserId);
            break;
        default:
            // Fallback to localStorage with user-specific key
            const fallbackKey = getUserStorageKey('ssiIncomeData');
            const fallbackData = localStorage.getItem(fallbackKey);
            if (fallbackData) {
                incomeData = JSON.parse(fallbackData);
                updateIncomeTable();
                updateSummary();
                updateVisualization();
                success = true;
            } else {
                incomeData = [];
                success = true;
            }
    }

    if (success) {
        showNotification(`Data loaded successfully from ${currentStorageType}`);
    } else {
        showNotification(`Failed to load data from ${currentStorageType}`, 'error');
    }

    return success;
}

// Save income data to the selected storage
async function saveIncomeDataToStorage() {
    let success = false;

    switch (currentStorageType) {
        case STORAGE_TYPES.LOCAL_STORAGE:
            // Use user-specific key for localStorage
            try {
                const userKey = getUserStorageKey('ssiIncomeData');
                localStorage.setItem(userKey, JSON.stringify(incomeData));
                success = true;
            } catch (error) {
                console.error('Error saving income data to localStorage:', error);
                success = false;
            }
            break;
        case STORAGE_TYPES.INDEXED_DB:
            // Pass user ID to IndexedDB functions
            success = await window.indexedDB.saveIncomeDataToIDB(currentUserId);
            break;
        case STORAGE_TYPES.FIRESTORE:
            // Pass user ID to Firestore functions
            success = await window.firestore.saveIncomeDataToFirestore(currentUserId);
            break;
        case STORAGE_TYPES.REALTIME_DB:
            // Pass user ID to Realtime Database functions
            success = await window.realtimeDB.saveIncomeDataToRealtimeDB(currentUserId);
            break;
        default:
            // Fallback to localStorage with user-specific key
            try {
                const fallbackKey = getUserStorageKey('ssiIncomeData');
                localStorage.setItem(fallbackKey, JSON.stringify(incomeData));
                success = true;
            } catch (error) {
                console.error('Error saving income data to localStorage:', error);
                success = false;
            }
    }

    if (success) {
        showNotification(`Data saved successfully to ${currentStorageType}`);
    } else {
        showNotification(`Failed to save data to ${currentStorageType}`, 'error');
    }

    return success;
}

// Add a single income entry to the selected storage
async function addIncomeEntryToStorage(entry) {
    // Add to the in-memory array first
    incomeData.push(entry);

    // Then save to the selected storage
    return await saveIncomeDataToStorage();
}

// Clear income data from the selected storage
async function clearIncomeDataFromStorage() {
    let success = false;

    switch (currentStorageType) {
        case STORAGE_TYPES.LOCAL_STORAGE:
            // Use user-specific key for localStorage
            try {
                const userKey = getUserStorageKey('ssiIncomeData');
                localStorage.removeItem(userKey);
                incomeData = [];
                updateIncomeTable();
                updateSummary();
                updateVisualization();
                success = true;
            } catch (error) {
                console.error('Error clearing income data from localStorage:', error);
                success = false;
            }
            break;
        case STORAGE_TYPES.INDEXED_DB:
            // Pass user ID to IndexedDB functions
            success = await window.indexedDB.clearIncomeDataFromIDB(currentUserId);
            break;
        case STORAGE_TYPES.FIRESTORE:
            // Pass user ID to Firestore functions
            success = await window.firestore.clearIncomeDataFromFirestore(currentUserId);
            break;
        case STORAGE_TYPES.REALTIME_DB:
            // Pass user ID to Realtime Database functions
            success = await window.realtimeDB.clearIncomeDataFromRealtimeDB(currentUserId);
            break;
        default:
            // Fallback to localStorage with user-specific key
            try {
                const fallbackKey = getUserStorageKey('ssiIncomeData');
                localStorage.removeItem(fallbackKey);
                incomeData = [];
                updateIncomeTable();
                updateSummary();
                updateVisualization();
                success = true;
            } catch (error) {
                console.error('Error clearing income data from localStorage:', error);
                success = false;
            }
    }

    if (success) {
        showNotification(`Data cleared successfully from ${currentStorageType}`);
    } else {
        showNotification(`Failed to clear data from ${currentStorageType}`, 'error');
    }

    return success;
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');

    notificationMessage.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';

    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Export functions to window object for global access
window.storageManager = {
    STORAGE_TYPES,
    initStorageManager,
    setStorageType,
    getStorageType,
    setCurrentUserId,
    getCurrentUserId,
    loadIncomeDataFromStorage,
    saveIncomeDataToStorage,
    addIncomeEntryToStorage,
    clearIncomeDataFromStorage
};
