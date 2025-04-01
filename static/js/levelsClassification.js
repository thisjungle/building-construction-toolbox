/**
 * Handles PDF generation and download functionality
 * Completely separate from form handling
 */
class ClassificationLevelsUI {
    /**
     * Generates and downloads a PDF of the current classification level
     * Gets current form state and sends to server for PDF generation
     */
    static async downloadPDF() {
        // Get current form state
        const employeeName = document.querySelector('.employee-name-input').value || 'Employee';
        const currentLevel = document.getElementById('currentLevelSummary').textContent;
        const levelReasoning = document.querySelector('.level-reasoning').innerHTML;
        
        try {
            // Send to server for PDF generation
            const response = await fetch('/generate_classification_pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    employee_name: employeeName,
                    classification_level: currentLevel,
                    reasoning_html: levelReasoning
                })
            });
            
            if (!response.ok) throw new Error('PDF generation failed');
            
            // Handle PDF download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${employeeName.replace(/\s+/g, '_')}_Classification.pdf`;
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

// Handle form submission and classification
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('classificationForm');
    if (form) {
        const resultDiv = document.getElementById('classificationResult');
        const loadingSpinner = document.getElementById('loadingSpinner');
        
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Show loading spinner
            loadingSpinner.style.display = 'block';
            resultDiv.style.display = 'none';
            
            try {
                // Collect form data using the ClassificationForm instance
                const classificationForm = new ClassificationForm();
                const formData = classificationForm.responses;
                
                // Send classification request
                const response = await fetch('/levels_classification/classify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || 'Classification failed');
                }
                
                // Display results
                classificationForm.updateResults(data);
                
            } catch (error) {
                resultDiv.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
                resultDiv.style.display = 'block';
            } finally {
                loadingSpinner.style.display = 'none';
            }
        });
    } else {
        console.warn('Classification form not found in the DOM');
    }
});

// Search functionality
async function searchClassifications(term) {
    try {
        const response = await fetch('/levels_classification/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ term })
        });
        
        if (!response.ok) {
            throw new Error('Search failed');
        }
        
        const results = await response.json();
        displaySearchResults(results);
    } catch (error) {
        console.error('Search error:', error);
        alert('Failed to perform search');
    }
}

function displaySearchResults(results) {
    const resultsDiv = document.getElementById('searchResults');
    if (!resultsDiv) return;
    
    if (results.length === 0) {
        resultsDiv.innerHTML = '<p>No matches found</p>';
        return;
    }
    
    let html = '<div class="search-results">';
    
    results.forEach(result => {
        html += `
            <div class="result-group">
                <h3>${result.level}</h3>
                <div class="matches">
                    ${result.matches.map(match => `
                        <div class="match">
                            <strong>${match.category}:</strong>
                            <p>${match.text}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    resultsDiv.innerHTML = html;
}

// Initialize search functionality
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let debounceTimer;
        
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if (e.target.value.trim()) {
                    searchClassifications(e.target.value.trim());
                }
            }, 300);
        });
    }
});

// Dynamic form updates based on role selection
document.addEventListener('DOMContentLoaded', () => {
    const roleSelect = document.getElementById('role');
    if (roleSelect) {
        roleSelect.addEventListener('change', function(e) {
            const role = e.target.value;
            const qualPathwaySelect = document.getElementById('qualPathway');
            const qualLevelSelect = document.getElementById('qualLevel');
            
            if (!qualPathwaySelect || !qualLevelSelect) return;
            
            // Reset options
            qualPathwaySelect.innerHTML = '<option value="">Select Pathway</option>';
            qualLevelSelect.innerHTML = '<option value="">Select Level</option>';
            
            // Update qualification options based on role
            if (role) {
                // Add relevant qualification pathways
                const pathways = ['trade', 'advanced_cert', 'diploma', 'degree'];
                pathways.forEach(pathway => {
                    const option = document.createElement('option');
                    option.value = pathway;
                    option.textContent = pathway.replace('_', ' ').toUpperCase();
                    qualPathwaySelect.appendChild(option);
                });
                
                // Add qualification levels
                const levels = ['none', 'partial', 'complete', 'advanced'];
                levels.forEach(level => {
                    const option = document.createElement('option');
                    option.value = level;
                    option.textContent = level.toUpperCase();
                    qualLevelSelect.appendChild(option);
                });
            }
        });
    }
});