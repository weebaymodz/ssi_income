// Local storage functionality

// Load income data from localStorage
function loadIncomeData() {
    try {
        const savedData = localStorage.getItem('ssiIncomeData');
        if (savedData) {
            incomeData = JSON.parse(savedData);
            updateIncomeTable();
            updateSummary();
            updateVisualization();
        } else {
            incomeData = [];
        }
        return true;
    } catch (error) {
        console.error('Error loading income data from localStorage:', error);
        incomeData = [];
        return false;
    }
}

// Save income data to localStorage
function saveIncomeData() {
    try {
        localStorage.setItem('ssiIncomeData', JSON.stringify(incomeData));
        return true;
    } catch (error) {
        console.error('Error saving income data to localStorage:', error);
        return false;
    }
}

// Clear income data from localStorage
function clearIncomeData() {
    try {
        localStorage.removeItem('ssiIncomeData');
        incomeData = [];
        updateIncomeTable();
        updateSummary();
        updateVisualization();
        return true;
    } catch (error) {
        console.error('Error clearing income data from localStorage:', error);
        return false;
    }
}

// Export functions to window object for global access
window.db = {
    loadIncomeData,
    saveIncomeData,
    clearIncomeData
};