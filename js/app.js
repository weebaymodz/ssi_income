// Main application logic

// Global variables
let incomeData = [];
const SSI_LIMIT = 1600; // Maximum allowed income limit
const FIXED_SSI_INCOME = 1798; // Fixed monthly SSI income amount

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Set up event listeners
    setupEventListeners();

    // Firebase will load data when user is authenticated
    // If not using Firebase auth yet, this will fall back to localStorage
    if (window.db && window.db.initializeFirebase) {
        // Firebase initialization is handled in index.html
        // The loadIncomeData function will be called after authentication
    } else {
        // Fall back to localStorage if Firebase is not available
        loadIncomeData();

        // Update the UI
        updateSummary();
        updateVisualization();
    }
});

// Set up event listeners
function setupEventListeners() {
    // Income form submission
    const incomeForm = document.getElementById('income-form');
    incomeForm.addEventListener('submit', handleIncomeFormSubmit);

    // Income type change event to handle fixed SSI amount
    const incomeTypeSelect = document.getElementById('income-type');
    const incomeAmountInput = document.getElementById('income-amount');
    const fixedAmountMessage = document.getElementById('fixed-amount-message');

    incomeTypeSelect.addEventListener('change', function() {
        if (this.value === 'ssi') {
            // For SSI income, set the fixed amount and disable the input
            incomeAmountInput.value = FIXED_SSI_INCOME.toFixed(2);
            incomeAmountInput.disabled = true;
            fixedAmountMessage.style.display = 'block';
        } else {
            // For job income, enable the input and clear the value
            incomeAmountInput.value = '';
            incomeAmountInput.disabled = false;
            fixedAmountMessage.style.display = 'none';
        }
    });

    // Trigger the change event initially to set the correct state
    incomeTypeSelect.dispatchEvent(new Event('change'));

    // Notification close button
    const notificationClose = document.getElementById('notification-close');
    notificationClose.addEventListener('click', hideNotification);

    // Storage type selection
    const storageTypeRadios = document.querySelectorAll('input[name="storage-type"]');
    storageTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                window.storageManager.setStorageType(this.value);
            }
        });
    });
}

// Handle income form submission
function handleIncomeFormSubmit(event) {
    event.preventDefault();

    // Get form values
    const incomeType = document.getElementById('income-type').value;
    let incomeAmount = parseFloat(document.getElementById('income-amount').value);

    // Use fixed SSI income amount if SSI type is selected
    if (incomeType === 'ssi') {
        incomeAmount = FIXED_SSI_INCOME;
    }

    const incomeDate = document.getElementById('income-date').value;
    const incomeDescription = document.getElementById('income-description').value || 'No description';

    // Create income entry
    const incomeEntry = {
        id: generateId(),
        type: incomeType,
        amount: incomeAmount,
        date: incomeDate,
        description: incomeDescription,
        timestamp: new Date().getTime()
    };

    // Add to income data and save using storage manager
    window.storageManager.addIncomeEntryToStorage(incomeEntry)
        .then(success => {
            if (success) {
                // Update UI
                updateIncomeTable();
                updateSummary();
                updateVisualization();
            }
        });

    // Reset form
    document.getElementById('income-form').reset();

    // Show notification
    showNotification('Income added successfully!');
}

// Generate a unique ID
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// Delete income entry
function deleteIncomeEntry(id) {
    // Filter out the entry with the given ID
    incomeData = incomeData.filter(entry => entry.id !== id);

    // Save income data using storage manager
    window.storageManager.saveIncomeDataToStorage()
        .then(success => {
            if (success) {
                // Update UI
                updateIncomeTable();
                updateSummary();
                updateVisualization();
            }
        });

    // Show notification
    showNotification('Income entry deleted!');
}

// Update income summary
function updateSummary() {
    // Use fixed SSI income amount
    const ssiTotal = FIXED_SSI_INCOME;

    // Calculate total job income
    const jobTotal = incomeData
        .filter(entry => entry.type === 'job')
        .reduce((total, entry) => total + entry.amount, 0);

    // Calculate remaining allowed income
    const remainingAllowed = Math.max(0, SSI_LIMIT - jobTotal);

    // Update UI elements
    document.getElementById('ssi-amount').textContent = formatCurrency(ssiTotal);
    document.getElementById('job-amount').textContent = formatCurrency(jobTotal);
    document.getElementById('remaining-amount').textContent = formatCurrency(remainingAllowed);
}

// Update income visualization
function updateVisualization() {
    // Use fixed SSI income amount
    const ssiTotal = FIXED_SSI_INCOME;

    // Calculate job income from entries
    const jobTotal = incomeData
        .filter(entry => entry.type === 'job')
        .reduce((total, entry) => total + entry.amount, 0);

    // Only count job income against the limit
    const totalIncome = jobTotal;

    // Update progress bar
    const progressPercentage = Math.min(100, (totalIncome / SSI_LIMIT) * 100);
    const progressBar = document.getElementById('limit-progress-bar');
    const progressText = document.getElementById('limit-progress-text');

    progressBar.style.width = `${progressPercentage}%`;
    progressText.textContent = `${progressPercentage.toFixed(1)}%`;

    // Change color based on percentage
    if (progressPercentage >= 90) {
        progressBar.style.backgroundColor = '#e53935'; // Red
    } else if (progressPercentage >= 75) {
        progressBar.style.backgroundColor = '#ff9800'; // Orange
    } else {
        progressBar.style.backgroundColor = '#4285f4'; // Blue
    }

    // Update chart
    updateIncomeChart(ssiTotal, jobTotal);
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
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
        hideNotification();
    }, 3000);
}

// Hide notification
function hideNotification() {
    const notification = document.getElementById('notification');
    notification.style.display = 'none';
}

// Export functions for use in other modules
window.app = {
    deleteIncomeEntry,
    formatCurrency,
    showNotification,
    hideNotification
};