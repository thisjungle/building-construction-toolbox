async function exportResults() {
    // Using html2pdf.js
    const element = document.querySelector('.results-container');
    const opt = {
        margin:       1,
        filename:     'classification-results.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    try {
        await html2pdf().set(opt).from(element).save();
    } catch (error) {
        console.error('Error exporting PDF:', error);
        showError('Failed to export results');
    }
} 