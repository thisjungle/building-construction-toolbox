// Base rates for each classification level
const CLASSIFICATION_RATES = {
    'CW1': 25.41,
    'CW2': 26.64,
    'CW3': 27.87,
    'CW4': 29.10
};

// Allowance amounts
const ALLOWANCES = {
    tool: 21.71,      // per week
    industry: 1.15,   // per hour
    meal: 17.55,      // per shift
    travel: 0.78      // per km
};

// Initialize form elements
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('payCalculatorForm');
    const employeeNameInput = document.querySelector('.employee-name-input');
    const exportBtn = document.getElementById('exportBtn');
    const classificationSelect = document.getElementById('classification');
    const levelSelect = document.getElementById('level');
    const employmentTypeSelect = document.getElementById('employmentType');
    const agreedHoursGroup = document.getElementById('agreedHoursGroup');
    const shiftworkSelect = document.getElementById('shiftwork');
    const cribBreakGroup = document.getElementById('cribBreakGroup');
    const toolAllowanceSelect = document.getElementById('toolAllowance');
    const tradeGroup = document.getElementById('tradeGroup');
    const averagingArrangementSelect = document.getElementById('averagingArrangement');
    const averagingPeriodGroup = document.getElementById('averagingPeriodGroup');
    const weeklyHoursInput = document.getElementById('weeklyHours');

    // Handle classification change
    classificationSelect.addEventListener('change', function() {
        levelSelect.style.display = this.value === 'CW/ECW' ? 'block' : 'none';
    });

    // Handle employment type change
    employmentTypeSelect.addEventListener('change', function() {
        agreedHoursGroup.style.display = this.value === 'part-time' ? 'block' : 'none';
    });

    // Handle shiftwork change
    shiftworkSelect.addEventListener('change', function() {
        cribBreakGroup.style.display = this.value === 'yes' ? 'block' : 'none';
    });

    // Handle tool allowance change
    toolAllowanceSelect.addEventListener('change', function() {
        tradeGroup.style.display = this.value === 'yes' ? 'block' : 'none';
    });

    // Handle averaging arrangement change
    averagingArrangementSelect.addEventListener('change', function() {
        averagingPeriodGroup.style.display = this.value === 'yes' ? 'block' : 'none';
    });

    // Validate weekly hours
    weeklyHoursInput.addEventListener('input', function() {
        const hours = parseFloat(this.value);
        const isAveraging = averagingArrangementSelect.value === 'yes';
        const maxHours = isAveraging ? 152 : 38; // 38 hours * 4 weeks for averaging

        if (hours > maxHours) {
            this.setCustomValidity(`Maximum hours cannot exceed ${maxHours} for ${isAveraging ? 'averaging period' : 'week'}`);
        } else {
            this.setCustomValidity('');
        }
    });

    // Validate break times
    function validateBreaks() {
        const ordinaryHours = parseFloat(document.getElementById('ordinaryHours').value) || 0;
        const mealBreak = document.getElementById('mealBreak').value;
        const restBreak = document.getElementById('restBreak').value;
        const cribBreak = document.getElementById('cribBreak').value;
        const isShiftwork = shiftworkSelect.value === 'yes';

        if (ordinaryHours > 5 && mealBreak === 'no') {
            document.getElementById('mealBreak').setCustomValidity('Meal break required after 5 hours');
        } else {
            document.getElementById('mealBreak').setCustomValidity('');
        }

        if (ordinaryHours > 4 && restBreak === 'no') {
            document.getElementById('restBreak').setCustomValidity('Rest break required after 4 hours');
        } else {
            document.getElementById('restBreak').setCustomValidity('');
        }

        if (isShiftwork && cribBreak === 'no') {
            document.getElementById('cribBreak').setCustomValidity('Crib break required for shift work');
        } else {
            document.getElementById('cribBreak').setCustomValidity('');
        }
    }

    // Add break validation to form submission
    form.addEventListener('submit', function(e) {
        validateBreaks();
        if (!form.checkValidity()) {
            e.preventDefault();
        }
    });

    // Handle employee name input
    employeeNameInput.addEventListener('input', function() {
        // You can add validation or auto-save functionality here
    });

    // Handle export button
    exportBtn.addEventListener('click', function() {
        exportPaySummary();
    });
});

async function calculatePay() {
    try {
        // Get form values
        const formData = {
            classification: document.getElementById('classification').value,
            level: document.getElementById('level').value,
            employmentType: document.getElementById('employmentType').value,
            agreedHours: parseFloat(document.getElementById('agreedHours').value) || 0,
            shiftwork: document.getElementById('shiftwork').value,
            shiftType: document.getElementById('shiftType').value,
            workLocation: document.getElementById('workLocation').value,
            ordinaryHours: parseFloat(document.getElementById('ordinaryHours').value) || 0,
            overtimeHours: parseFloat(document.getElementById('overtimeHours').value) || 0,
            weekendHours: parseFloat(document.getElementById('weekendHours').value) || 0,
            publicHolidayHours: parseFloat(document.getElementById('publicHolidayHours').value) || 0,
            confinedSpace: document.getElementById('confinedSpace').value,
            workingAtHeights: document.getElementById('workingAtHeights').value,
            extremeWeather: document.getElementById('extremeWeather').value,
            toolAllowance: document.getElementById('toolAllowance').value,
            industryAllowance: document.getElementById('industryAllowance').value,
            mealAllowance: document.getElementById('mealAllowance').value,
            travelDistance: parseFloat(document.getElementById('travelDistance').value) || 0,
            overtimeAgreement: document.getElementById('overtimeAgreement').value,
            weekendAgreement: document.getElementById('weekendAgreement').value,
            publicHolidayAgreement: document.getElementById('publicHolidayAgreement').value
        };

        // Basic validation
        if (!formData.classification || !formData.employmentType) {
            alert('Please select classification and employment type');
            return;
        }

        if (formData.classification === 'CW/ECW 1' && !formData.level) {
            alert('Please select a level for CW/ECW 1 classification');
            return;
        }

        if (formData.employmentType === 'part_time' && !formData.agreedHours) {
            alert('Please enter agreed hours for part-time employment');
            return;
        }

        if (formData.shiftwork === 'yes' && !formData.shiftType) {
            alert('Please select shift type for shiftwork');
            return;
        }

        if (formData.ordinaryHours < 0 || formData.overtimeHours < 0 || 
            formData.weekendHours < 0 || formData.publicHolidayHours < 0) {
            alert('Hours cannot be negative');
            return;
        }

        // Validate agreements
        if (formData.overtimeHours > 0 && formData.overtimeAgreement === 'no') {
            alert('Written agreement required for overtime work');
            return;
        }

        if (formData.weekendHours > 0 && formData.weekendAgreement === 'no') {
            alert('Written agreement required for weekend work');
            return;
        }

        if (formData.publicHolidayHours > 0 && formData.publicHolidayAgreement === 'no') {
            alert('Written agreement required for public holiday work');
            return;
        }

        // Send data to server for calculation
        const response = await fetch('/pay_calculator/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error);
        }

        // Update displays
        updateDisplays(result.data);

    } catch (error) {
        console.error('Error calculating pay:', error);
        alert('An error occurred while calculating pay. Please try again.');
    }
}

function updateDisplays(amounts) {
    // Update header total
    document.getElementById('headerTotalAmount').textContent = formatCurrency(amounts.total_pay);

    // Update summary panel
    document.getElementById('basePay').textContent = formatCurrency(amounts.base_pay);
    document.getElementById('overtimePay').textContent = formatCurrency(amounts.overtime_pay);
    document.getElementById('weekendPay').textContent = formatCurrency(amounts.weekend_pay);
    document.getElementById('publicHolidayPay').textContent = formatCurrency(amounts.public_holiday_pay);
    document.getElementById('shiftLoading').textContent = formatCurrency(amounts.shift_loading);
    document.getElementById('industryAllowance').textContent = formatCurrency(amounts.industry_allowance);
    document.getElementById('toolAllowance').textContent = formatCurrency(amounts.tool_allowance);
    document.getElementById('mealAllowance').textContent = formatCurrency(amounts.meal_allowance);
    document.getElementById('travelAllowance').textContent = formatCurrency(amounts.travel_allowance);
    document.getElementById('specialConditions').textContent = formatCurrency(amounts.special_conditions);
    document.getElementById('totalPay').textContent = formatCurrency(amounts.total_pay);
}

function formatCurrency(amount) {
    return '$' + amount.toFixed(2);
}

function exportPaySummary() {
    const employeeName = document.querySelector('.employee-name-input').value || 'Employee';
    const classification = document.getElementById('classification').value;
    const level = document.getElementById('level').value;
    const employmentType = document.getElementById('employmentType').value;
    const shiftwork = document.getElementById('shiftwork').value;
    const shiftType = document.getElementById('shiftType').value;
    const workLocation = document.getElementById('workLocation').value;
    
    // Create CSV content
    const csvContent = [
        ['Pay Summary for ' + employeeName],
        ['Classification', classification + (level ? ` - Level ${level}` : '')],
        ['Employment Type', employmentType],
        ['Work Pattern', shiftwork === 'yes' ? `Shiftwork - ${shiftType}` : 'Standard'],
        ['Work Location', workLocation],
        [''],
        ['Component', 'Amount'],
        ['Base Pay', document.getElementById('basePay').textContent],
        ['Overtime', document.getElementById('overtimePay').textContent],
        ['Weekend Hours', document.getElementById('weekendPay').textContent],
        ['Public Holiday', document.getElementById('publicHolidayPay').textContent],
        ['Shift Loading', document.getElementById('shiftLoading').textContent],
        ['Industry Allowance', document.getElementById('industryAllowance').textContent],
        ['Tool Allowance', document.getElementById('toolAllowance').textContent],
        ['Meal Allowance', document.getElementById('mealAllowance').textContent],
        ['Travel Allowance', document.getElementById('travelAllowance').textContent],
        ['Special Conditions', document.getElementById('specialConditions').textContent],
        [''],
        ['Total Pay', document.getElementById('totalPay').textContent]
    ].map(row => row.join(',')).join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pay_summary_${employeeName.toLowerCase().replace(/\s+/g, '_')}.csv`;
    link.click();
} 