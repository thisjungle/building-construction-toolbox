/**
 * Handles allowance form functionality: input handling, calculations, and display
 */
class AllowanceForm {
    constructor() {
        // Form elements
        this.form = document.getElementById('allowancesForm');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        
        // Display elements
        this.headerTotal = document.getElementById('headerTotalAmount');
        this.summaryList = document.getElementById('allowancesList');
        this.summaryTotal = document.getElementById('resultsTotalAmount');
        
        // Track selected allowances
        this.selectedAllowances = {
            industry: null,
            tools: null,
            first_aid: null,
            other: []
        };

        // Show form, hide loading
        if (this.loadingSpinner) this.loadingSpinner.style.display = 'none';
        if (this.form) this.form.style.display = 'block';
        
        this.setupInputListeners();
        this.updateUI(); // Initial update
    }

    setupInputListeners() {
        // Radio input handlers
        ['industry', 'tools', 'first_aid'].forEach(group => {
            const radios = document.querySelectorAll(`input[name="${group}"]`);
            radios.forEach(radio => {
                radio.addEventListener('change', () => {
                    if (radio.checked) {
                        this.handleAllowanceChange(group, radio);
                    }
                });
            });
        });

        // Checkbox handlers
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.handleOtherAllowanceChange(checkbox);
            });
        });
    }

    handleAllowanceChange(group, input) {
        const option = this.getOptionData(input);
        this.selectedAllowances[group] = option;
        this.updateUI();
    }

    handleOtherAllowanceChange(checkbox) {
        const option = this.getOptionData(checkbox);
        
        if (checkbox.checked) {
            this.selectedAllowances.other.push(option);
        } else {
            this.selectedAllowances.other = this.selectedAllowances.other.filter(
                item => item.title !== option.title
            );
        }

        this.updateUI();
    }

    getOptionData(input) {
        const container = input.closest('.option-content');
        const value = parseFloat(input.value) || 0;
        const period = container.dataset.period.toLowerCase();
        
        // Convert non-weekly amounts to weekly
        let weeklyValue = value;
        if (period.includes('hour')) {
            weeklyValue = Math.round(value * 38 * 100) / 100;
        } else if (period.includes('day')) {
            weeklyValue = value * 5;
        }
        
        return {
            title: container.querySelector('.option-title').textContent,
            value: weeklyValue,
            originalValue: value,
            period: period,
            emoji: this.getGroupEmoji(input.name.split('_')[0])
        };
    }

    getGroupEmoji(group) {
        const emojiMap = {
            industry: '🏗️',
            tools: '🛠️',
            first_aid: '🩺',
            other: '📌'
        };
        return emojiMap[group] || '📌';
    }

    calculateTotal() {
        let total = 0;
        
        // Add radio selections
        ['industry', 'tools', 'first_aid'].forEach(group => {
            if (this.selectedAllowances[group]) {
                total += this.selectedAllowances[group].value;
            }
        });
        
        // Add checkbox selections with period conversion
        this.selectedAllowances.other.forEach(item => {
            let value = item.value;
            // Convert non-weekly amounts to weekly
            if (item.period.toLowerCase() === 'hour') {
                value = Math.round(value * 38 * 100) / 100; // Convert hourly to weekly
            } else if (item.period.toLowerCase() === 'day') {
                value = value * 5; // Convert daily to weekly
            }
            total += value;
        });
        
        return total;
    }

    formatCurrency(amount) {
        return `$${amount.toFixed(2)}`;
    }

    updateUI() {
        this.updateSummaryList();
        this.updateTotals();
    }

    updateSummaryList() {
        const items = [];
        
        // Add radio selections
        ['industry', 'tools', 'first_aid'].forEach(group => {
            if (this.selectedAllowances[group]) {
                items.push(this.selectedAllowances[group]);
            }
        });
        
        // Add checkbox selections
        this.selectedAllowances.other.forEach(item => {
            items.push(item);
        });
        
        if (items.length === 0) {
            this.summaryList.innerHTML = '<p class="no-allowances">No allowances selected</p>';
            return;
        }
        
        // Create HTML for allowance items only
        this.summaryList.innerHTML = items.map(item => {
            let periodInfo = '';
            
            // Add period calculation for non-weekly rates
            if (item.period.toLowerCase().includes('hour')) {
                periodInfo = `(${this.formatCurrency(item.originalValue)} per hour)`;
            } else if (item.period.toLowerCase().includes('day')) {
                periodInfo = `(${this.formatCurrency(item.originalValue)} per day)`;
            }
            
            return `
                <div class="allowance-item">
                    <div class="allowance-title">${item.emoji} ${item.title}</div>
                    <div class="allowance-amount">${this.formatCurrency(item.value)} per week</div>
                    ${periodInfo ? `<div class="allowance-period">${periodInfo}</div>` : ''}
                </div>
            `;
        }).join('');
        
        // Update the total amount
        const totalAmount = document.getElementById('resultsTotalAmount');
        if (totalAmount) {
            totalAmount.textContent = this.formatCurrency(this.calculateTotal());
        }
    }

    updateTotals() {
        const total = this.calculateTotal();
        const formattedTotal = this.formatCurrency(total);
        
        if (this.headerTotal) this.headerTotal.textContent = formattedTotal;
        if (this.summaryTotal) this.summaryTotal.textContent = formattedTotal;
    }
}

// Initialize the form when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new AllowanceForm();
}); 