/**
 * Handles PDF generation and download functionality
 * Completely separate from form handling
 */
class AllowanceUI {
    /**
     * Generates and downloads a PDF of the current allowances
     * Gets current form state and sends to server for PDF generation
     */
    static async downloadPDF() {
        // Get current form state
        const employeeName = document.querySelector('.employee-name-input').value || 'Employee';
        const totalAmount = document.getElementById('currentAllowanceTotal').textContent;
        const allowancesList = document.getElementById('allowancesList').innerHTML;
        
        try {
            // Send to server for PDF generation
            const response = await fetch('/generate_allowances_pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    employee_name: employeeName,
                    total_amount: totalAmount,
                    allowances_html: allowancesList
                })
            });
            
            if (!response.ok) throw new Error('PDF generation failed');
            
            // Handle PDF download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${employeeName.replace(/\s+/g, '_')}_Allowances.pdf`;
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize emojis
    initEmojis();
    
    // Initialize the allowance form
    new AllowanceForm();
});

// Initialize emojis
function initEmojis() {
    // Handle data-emoji attributes only
    document.querySelectorAll('[data-emoji]').forEach(element => {
        const emojiKey = element.getAttribute('data-emoji');
        if (window.APP_EMOJIS && window.APP_EMOJIS[emojiKey]) {
            element.textContent = window.APP_EMOJIS[emojiKey];
        }
    });
}