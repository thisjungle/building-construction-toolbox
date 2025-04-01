// Dummy data for testing
const dummyRates = {
    "minimum_rates": {
        "CW/ECW 1": {
            "hourly_rate": 25.88,
            "weekly_rate": 983.44
        },
        "CW/ECW 2": {
            "hourly_rate": 26.76,
            "weekly_rate": 1016.88
        },
        "CW/ECW 3": {
            "hourly_rate": 27.89,
            "weekly_rate": 1059.82
        },
        "CW/ECW 4": {
            "hourly_rate": 29.04,
            "weekly_rate": 1103.52
        },
        "CW/ECW 5": {
            "hourly_rate": 29.85,
            "weekly_rate": 1134.30
        }
    },
    "allowances": {
        "heightWork": 2.93,
        "confinedSpace": 0.76,
        "tools": 32.47,
        "inclementWeather": 2.85,
        "travel": 17.43
    },
    "loadings": {
        "casual": 1.25,
        "nightShift": 1.25,
        "afternoonShift": 1.15,
        "saturday": 1.5,
        "sunday": 2.0,
        "overtime": 1.5
    }
};

// Add this to the template file
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('payRateForm');
    
    // Pre-fill some test data
    document.querySelector('#classification').value = 'CW/ECW 3';
    document.querySelector('#employmentType').value = 'casual';
    
    // Pre-fill some hours and conditions
    const timesheet = document.querySelectorAll('#timesheet tr');
    
    // Monday - regular day
    timesheet[0].querySelector('.regular-hours').value = 8;
    
    // Tuesday - overtime
    timesheet[1].querySelector('.regular-hours').value = 8;
    timesheet[1].querySelector('.overtime-hours').value = 2;
    
    // Wednesday - night shift
    timesheet[2].querySelector('.regular-hours').value = 8;
    timesheet[2].querySelector('.shift-type').value = 'nightShift';
    
    // Thursday - height work
    timesheet[3].querySelector('.regular-hours').value = 8;
    timesheet[3].querySelector('.conditions').value = 'heightWork';
    
    // Friday - regular day
    timesheet[4].querySelector('.regular-hours').value = 8;
    
    // Saturday - weekend rates
    timesheet[5].querySelector('.regular-hours').value = 4;
    
    // Check some allowances
    document.querySelector('#travelAllowance').checked = true;
    
    // Add form submit handler instead of calculating immediately
    form.addEventListener('submit', function(e) {
        e.preventDefault();  // Prevent form submission
        calculatePay();      // Only calculate when form is submitted
    });
});

function calculatePay() {
    const classification = document.querySelector('#classification').value;
    const baseRate = dummyRates.minimum_rates[classification].hourly_rate;
    const employmentType = document.querySelector('#employmentType').value;
    
    let totalPay = 0;
    const timesheet = document.querySelectorAll('#timesheet tr');
    
    timesheet.forEach((row, index) => {
        const regularHours = parseFloat(row.querySelector('.regular-hours').value) || 0;
        const overtimeHours = parseFloat(row.querySelector('.overtime-hours').value) || 0;
        const shiftType = row.querySelector('.shift-type').value;
        const conditions = row.querySelector('.conditions').value;
        
        // Calculate base pay
        let dayPay = regularHours * baseRate;
        
        // Add casual loading if applicable
        if (employmentType === 'casual') {
            dayPay *= dummyRates.loadings.casual;
        }
        
        // Add overtime
        dayPay += overtimeHours * baseRate * dummyRates.loadings.overtime;
        
        // Add shift loadings
        if (shiftType === 'nightShift') {
            dayPay *= dummyRates.loadings.nightShift;
        } else if (shiftType === 'afternoonShift') {
            dayPay *= dummyRates.loadings.afternoonShift;
        }
        
        // Add weekend rates
        if (index === 5) { // Saturday
            dayPay *= dummyRates.loadings.saturday;
        } else if (index === 6) { // Sunday
            dayPay *= dummyRates.loadings.sunday;
        }
        
        // Add condition allowances
        if (conditions !== 'none') {
            dayPay += dummyRates.allowances[conditions];
        }
        
        totalPay += dayPay;
    });
    
    // Add other allowances
    if (document.querySelector('#inclementWeather').checked) {
        totalPay += dummyRates.allowances.inclementWeather;
    }
    if (document.querySelector('#travelAllowance').checked) {
        totalPay += dummyRates.allowances.travel;
    }
    
    // Update the output display
    document.querySelector('#output').innerHTML = `
        <div class="total-section">
            <span class="total-label">Total Weekly Pay</span>
            <span class="total-amount">$${totalPay.toFixed(2)}</span>
        </div>
    `;
} 