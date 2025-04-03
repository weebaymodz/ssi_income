// UI functionality

// Update income table with current data
function updateIncomeTable() {
    const incomeEntries = document.getElementById('income-entries');
    const noIncomeMessage = document.getElementById('no-income-message');
    
    // Clear existing entries
    incomeEntries.innerHTML = '';
    
    // Check if there are any income entries
    if (incomeData.length === 0) {
        noIncomeMessage.style.display = 'flex';
        return;
    }
    
    // Hide the no income message
    noIncomeMessage.style.display = 'none';
    
    // Sort income data by date (newest first)
    const sortedData = [...incomeData].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Add each income entry to the table
    sortedData.forEach(entry => {
        const row = document.createElement('tr');
        
        // Format the date
        const date = new Date(entry.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        // Create row content
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${entry.type === 'ssi' ? 'SSI Income' : 'Job Income'}</td>
            <td>${entry.description}</td>
            <td>${app.formatCurrency(entry.amount)}</td>
            <td>
                <button class="delete-btn" data-id="${entry.id}">
                    <span class="material-icons">delete</span>
                </button>
            </td>
        `;
        
        // Add row to table
        incomeEntries.appendChild(row);
    });
    
    // Add event listeners to delete buttons
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const id = button.getAttribute('data-id');
            app.deleteIncomeEntry(id);
        });
    });
}

// Update income chart
function updateIncomeChart(ssiTotal, jobTotal) {
    const chartCanvas = document.getElementById('income-chart');
    
    // Check if chart already exists
    if (window.incomeChart) {
        window.incomeChart.destroy();
    }
    
    // Create new chart
    window.incomeChart = new Chart(chartCanvas, {
        type: 'doughnut',
        data: {
            labels: ['SSI Income', 'Job Income', 'Remaining Allowed'],
            datasets: [{
                data: [ssiTotal, jobTotal, Math.max(0, SSI_LIMIT - ssiTotal - jobTotal)],
                backgroundColor: ['#4285f4', '#34a853', '#f1f1f1'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${app.formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Export UI functions
window.ui = {
    updateIncomeTable,
    updateIncomeChart
};