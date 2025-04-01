/**
 * Handles classification form functionality: input handling, calculations, and display
 */
class ClassificationForm {
    constructor() {
        this.form = document.getElementById('classificationForm');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.resultsDiv = document.querySelector('.classification-summary');
        this.responses = {};
        this.sectionScores = {};
        
        if (!this.form || !this.resultsDiv) {
            console.error('Required elements not found');
            return;
        }
        
        // Initialize emojis first
        this.initEmojis();
        
        // Show form, hide loading initially
        if (this.loadingSpinner) this.loadingSpinner.style.display = 'none';
        if (this.form) this.form.style.display = 'block';
        
        this.initializeForm();
        this.updateUI(); // Initial update
    }
    
    initEmojis() {
        // Apply emojis from configuration
        document.querySelectorAll('[data-emoji]').forEach(element => {
            const emojiKey = element.getAttribute('data-emoji');
            if (APP_EMOJIS[emojiKey]) {
                element.textContent = APP_EMOJIS[emojiKey];
            }
        });
    }
    
    initializeForm() {
        console.log('Initializing form...');
        
        // Initialize form sections
        const questionGroups = this.form.querySelectorAll('.question-group');
        console.log(`Found ${questionGroups.length} question groups`);
        
        questionGroups.forEach(group => {
            const sectionId = group.getAttribute('data-section');
            console.log(`Initializing section: ${sectionId}`);
            
            // Set up radio inputs
            const radioInputs = group.querySelectorAll('input[type="radio"]');
            console.log(`Found ${radioInputs.length} radio inputs in section ${sectionId}`);
            radioInputs.forEach(input => {
                input.addEventListener('change', (e) => {
                    this.handleRadioInput(sectionId, e.target);
                });
            });
            
            // Set up checkbox inputs
            const checkboxInputs = group.querySelectorAll('input[type="checkbox"]');
            console.log(`Found ${checkboxInputs.length} checkbox inputs in section ${sectionId}`);
            checkboxInputs.forEach(input => {
                input.addEventListener('change', (e) => {
                    this.handleCheckboxInput(sectionId, e.target);
                });
            });
            
            // Set up number inputs
            const numberInputs = group.querySelectorAll('input[type="number"]');
            console.log(`Found ${numberInputs.length} number inputs in section ${sectionId}`);
            numberInputs.forEach(input => {
                input.addEventListener('input', (e) => {
                    this.handleNumberInput(sectionId, e.target);
                });
            });
        });
    }
    
    handleRadioInput(sectionId, input) {
        const value = input.value;
        const points = parseInt(input.dataset.points) || 0;
        
        this.responses[sectionId] = this.responses[sectionId] || {};
        this.responses[sectionId][input.name] = value;
        this.sectionScores[sectionId] = points;
        
        this.updateUI();
    }
    
    handleCheckboxInput(sectionId, input) {
        this.responses[sectionId] = this.responses[sectionId] || {};
        if (!this.responses[sectionId][input.name]) {
            this.responses[sectionId][input.name] = [];
        }
        
        const points = parseInt(input.dataset.points) || 0;
        
        if (input.checked) {
            this.responses[sectionId][input.name].push(input.value);
            this.sectionScores[sectionId] = (this.sectionScores[sectionId] || 0) + points;
        } else {
            this.responses[sectionId][input.name] = this.responses[sectionId][input.name].filter(v => v !== input.value);
            this.sectionScores[sectionId] = (this.sectionScores[sectionId] || 0) - points;
        }
        
        this.updateUI();
    }
    
    handleNumberInput(sectionId, input) {
        this.responses[sectionId] = this.responses[sectionId] || {};
        const value = parseInt(input.value) || 0;
        const pointsPerUnit = parseInt(input.dataset.pointsPerUnit) || 0;
        
        this.responses[sectionId][input.name] = value;
        this.sectionScores[sectionId] = value * pointsPerUnit;
        
        this.updateUI();
    }
    
    updateUI() {
        // Calculate total points
        const totalPoints = Object.values(this.sectionScores).reduce((sum, score) => sum + score, 0);
        
        // Calculate confidence score
        const totalSections = this.form.querySelectorAll('.question-group').length;
        const answeredSections = Object.keys(this.sectionScores).length;
        const confidenceScore = (answeredSections / totalSections) * 100;
        
        // Determine level
        const level = this.determineClassification(totalPoints);
        
        // Update the UI
        this.updateResults({
            level: level,
            confidence_score: confidenceScore / 100, // Convert to decimal for existing UI
            section_scores: this.sectionScores,
            total_points: totalPoints
        });
        
        // Save to server in background
        this.saveToServer({
            responses: this.responses,
            total_points: totalPoints,
            confidence_score: confidenceScore
        });
    }
    
    async saveToServer(data) {
        try {
            const response = await fetch('/levels_classification/classify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                console.error(`Server error: ${response.status}`);
            }
        } catch (error) {
            console.error('Error saving to server:', error);
        }
    }
    
    determineClassification(points) {
        if (points < 50) return 'CW1';
        if (points < 100) return 'CW2';
        if (points < 150) return 'CW3';
        if (points < 200) return 'CW4';
        if (points < 250) return 'CW5';
        return 'CW6';
    }
    
    updateResults(data) {
        console.log('Updating results with data:', data);
        
        if (!data) {
            console.error('No data provided to updateResults');
            return;
        }

        if (!this.resultsDiv) {
            console.error('Results div not found');
            return;
        }

        // Update header level display
        const headerLevel = document.getElementById('headerTotalAmount');
        if (headerLevel) {
            headerLevel.textContent = data.level;
        }

        // Update level badge
        const levelBadge = document.querySelector('.level-badge');
        if (levelBadge) {
            levelBadge.innerHTML = `<span class="level-number">${data.level}</span>`;
        }

        // Update confidence percentage
        const confidencePercentage = document.querySelector('.confidence-percentage');
        if (confidencePercentage) {
            confidencePercentage.textContent = `${(data.confidence_score * 100).toFixed(1)}%`;
        }

        // Update confidence bar
        const confidenceValue = document.querySelector('.confidence-value');
        if (confidenceValue) {
            confidenceValue.style.width = `${(data.confidence_score * 100).toFixed(1)}%`;
        }

        // Update level reasoning
        const levelReasoning = document.querySelector('.level-reasoning');
        if (levelReasoning) {
            let reasoningHtml = '<p>Classification based on:</p><ul>';
            Object.entries(data.section_scores).forEach(([section, score]) => {
                reasoningHtml += `<li>${section.charAt(0).toUpperCase() + section.slice(1)}: ${score} points</li>`;
            });
            reasoningHtml += '</ul>';
            levelReasoning.innerHTML = reasoningHtml;
        }
    }
}

// Global function to get level details
async function getLevelDetails(level) {
    try {
        const response = await fetch(`/levels_classification/get_level_details?level=${level}`);
        if (!response.ok) {
            throw new Error('Failed to get level details');
        }
        
        const details = await response.json();
        displayLevelDetails(details);
    } catch (error) {
        console.error('Error getting level details:', error);
        alert('Failed to load level details');
    }
}

function displayLevelDetails(details) {
    const modal = document.getElementById('levelDetailsModal');
    if (!modal) return;
    
    // Update modal content
    document.getElementById('levelDescription').textContent = details.description;
    
    const qualList = document.getElementById('levelQualifications');
    qualList.innerHTML = details.qualifications.map(q => `<li>${q}</li>`).join('');
    
    const skillsList = document.getElementById('levelSkills');
    skillsList.innerHTML = details.skills.map(s => `<li>${s}</li>`).join('');
    
    const tasksList = document.getElementById('levelTasks');
    tasksList.innerHTML = details.indicative_tasks.map(t => `<li>${t}</li>`).join('');
    
    const rateElem = document.getElementById('levelRate');
    rateElem.textContent = `$${details.weekly_rate}`;
    
    // Show modal
    modal.style.display = 'block';
}

function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => modal.style.display = 'none');
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        closeModal();
    }
}

// Initialize form when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ClassificationForm();
});