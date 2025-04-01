/**
 * Embedded Levels Module
 * Handles loading and displaying levels functionality directly in employee details page
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Embedded levels module loaded');

    // Find the Award Levels tab button
    const awardLevelsTab = document.querySelector('button[data-tab="levels"]');
    if (awardLevelsTab) {
        // Attach click handler to load questions when the tab is clicked
        awardLevelsTab.addEventListener('click', loadLevelsContent);
        console.log('Award levels tab click handler attached');
    }

    // Also load content if the levels tab is already active on page load
    if (document.querySelector('.tab-content#levels-content.active')) {
        loadLevelsContent();
    }
});

/**
 * Load levels content when the tab is clicked
 */
function loadLevelsContent() {
    console.log('Loading levels content');
    const formElement = document.getElementById('classificationForm');
    
    if (!formElement) {
        console.error('Classification form not found');
        return;
    }
    
    const employeeId = formElement.getAttribute('data-employee-id');
    if (!employeeId) {
        console.error('Employee ID not found');
        return;
    }
    
    console.log(`Loading classification data for employee: ${employeeId}`);
    
    // Load questions and employee classification data
    loadQuestionsAndData(employeeId);
}

/**
 * Load questions and employee data
 */
function loadQuestionsAndData(employeeId) {
    // First get the questions
    fetch('/levels/get_questions')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load questions');
            }
            return response.json();
        })
        .then(questionsData => {
            // Now get employee classification data
            return fetch(`/levels/get_employee_data/${employeeId}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to load employee classification data');
                    }
                    return response.json();
                })
                .then(employeeData => {
                    // Combine both data sets
                    return {
                        questions: questionsData.questions,
                        classification: employeeData.classification,
                        responses: employeeData.responses
                    };
                });
        })
        .then(data => {
            // Render questions and classification data
            renderQuestionsForm(data.questions, data.responses);
            
            // If there's existing classification, show it
            if (data.classification) {
                renderClassificationResult(data.classification);
            }
            
            // Initialize the LevelsCore module 
            setTimeout(() => {
                const levelsModule = new LevelsCore();
                levelsModule.init();
                console.log('Levels module initialized for embedded view');
            }, 100);
        })
        .catch(error => {
            console.error('Error loading levels data:', error);
            showLoadError();
        });
}

/**
 * Render the questions form with the provided questions and responses
 */
function renderQuestionsForm(questions, responses) {
    if (!questions || questions.length === 0) {
        showLoadError();
        return;
    }
    
    const questionsContainer = document.getElementById('questionsContainer');
    if (!questionsContainer) {
        console.error('Questions container not found');
        return;
    }
    
    // Generate HTML for each question
    const questionsHtml = questions.map((question, index) => {
        return generateQuestionHtml(question, index + 1, responses);
    }).join('');
    
    // Update container
    questionsContainer.innerHTML = questionsHtml;
    
    // Show form actions
    document.querySelector('.form-actions').style.display = 'block';
    
    // Add radio selection styling
    styleRadioOptions();
}

/**
 * Generate HTML for a single question
 */
function generateQuestionHtml(question, index, responses) {
    const emojiMap = {
        'qualification': '🎓',
        'experience': '⏱️',
        'supervision': '👥',
        'modules_completed': '📚'
    };
    
    const emoji = emojiMap[question.name] || '📊';
    
    let optionsHtml = '';
    
    if (question.type === 'radio' && question.options) {
        optionsHtml = question.options.map(option => {
            const isChecked = responses && responses[question.name] === option.value;
            
            return `
                <div class="option-content radio-option-container ${isChecked ? 'selected' : ''}">
                    <div class="option-row-1">
                        <input type="radio" 
                            class="radio-input"
                            id="${question.name}_${option.value}" 
                            name="${question.name}" 
                            value="${option.value}"
                            ${isChecked ? 'checked' : ''}>
                        <div class="option-title">${option.label}</div>
                        ${option.value ? `
                        <div class="option-amount">
                            <span class="amount">${option.value}</span>
                        </div>` : ''}
                    </div>
                    ${option.description ? `
                    <div class="option-row-2">
                        <span class="option-emoji">💡</span>
                        <span class="option-hint">${option.description}</span>
                    </div>` : ''}
                </div>
            `;
        }).join('');
    } else if (question.type === 'number') {
        const value = responses && responses[question.name] !== undefined ? responses[question.name] : 0;
        
        optionsHtml = `
            <div class="option-content">
                <div class="option-row-1">
                    <input type="number" 
                        class="number-input"
                        id="${question.name}" 
                        name="${question.name}" 
                        min="${question.min || 0}" 
                        max="${question.max || 100}" 
                        value="${value}">
                </div>
            </div>
        `;
    }
    
    return `
        <div class="level-question">
            <h4 class="question-title">
                <span class="question-number">${index}.</span>
                <span class="section-emoji">${emoji}</span>
                <span class="section-title">${question.label}</span>
            </h4>
            
            ${optionsHtml}
            
            ${question.help_text ? `
            <div class="option-row-2">
                <span class="option-emoji">💡</span>
                <span class="option-hint">${question.help_text}</span>
            </div>` : ''}
        </div>
    `;
}

/**
 * Apply styling to radio options
 */
function styleRadioOptions() {
    const radioOptions = document.querySelectorAll('.radio-option-container');
    radioOptions.forEach(option => {
        const radio = option.querySelector('input[type="radio"]');
        if (radio) {
            radio.addEventListener('change', () => {
                // Remove selected class from all options in this group
                const name = radio.getAttribute('name');
                document.querySelectorAll(`.radio-option-container input[name="${name}"]`).forEach(input => {
                    input.closest('.radio-option-container').classList.remove('selected');
                });
                
                // Add selected class to this option
                if (radio.checked) {
                    option.classList.add('selected');
                }
            });
        }
    });
}

/**
 * Show error when loading fails
 */
function showLoadError() {
    const questionsContainer = document.getElementById('questionsContainer');
    const errorMessage = document.querySelector('#classificationForm .error-message');
    
    if (questionsContainer) {
        questionsContainer.style.display = 'none';
    }
    
    if (errorMessage) {
        errorMessage.style.display = 'block';
    }
    
    // Set up load default questions button
    const loadDefaultBtn = document.getElementById('loadDefaultQuestionsBtn');
    if (loadDefaultBtn) {
        loadDefaultBtn.addEventListener('click', () => {
            // Import the loadDefaultQuestions function from levels-ui.js module
            import('./modules/levels-ui.js').then(module => {
                module.loadDefaultQuestions();
                
                // Re-initialize the module
                setTimeout(() => {
                    const levelsModule = new LevelsCore();
                    levelsModule.init();
                    console.log('Levels module initialized after loading default questions');
                    
                    // Hide error message and show form actions
                    errorMessage.style.display = 'none';
                    document.querySelector('.form-actions').style.display = 'block';
                }, 100);
            });
        });
    }
}

/**
 * Render an existing classification result
 */
function renderClassificationResult(classification) {
    if (!classification) return;
    
    const currentLevel = document.getElementById('currentLevel');
    const confidenceValue = document.querySelector('.confidence-value');
    const confidencePercentage = document.querySelector('.confidence-percentage');
    const levelReasoning = document.getElementById('levelReasoning');
    const printResultBtn = document.getElementById('printResultBtn');
    const saveResultBtn = document.getElementById('saveResultBtn');
    
    // Update level badge
    if (currentLevel) {
        const levelText = classification.level.replace('CW/ECW ', '').replace('CW ', '').replace('ECW ', '');
        currentLevel.textContent = levelText;
        currentLevel.setAttribute('title', classification.level);
    }
    
    // Update confidence meter
    if (confidenceValue) {
        confidenceValue.style.width = `${classification.confidence_score}%`;
        confidenceValue.setAttribute('data-confidence', classification.confidence_score);
    }
    
    if (confidencePercentage) {
        confidencePercentage.textContent = `${classification.confidence_score}%`;
    }
    
    // Update reasoning
    if (levelReasoning && classification.explanation) {
        if (classification.explanation.length > 0) {
            const explanationHtml = `
                <ul>
                    ${classification.explanation.map(reason => `<li>${reason}</li>`).join('')}
                </ul>
            `;
            levelReasoning.innerHTML = explanationHtml;
        }
    }
    
    // Enable result buttons
    if (printResultBtn) {
        printResultBtn.disabled = false;
    }
    
    if (saveResultBtn) {
        saveResultBtn.disabled = false;
    }
} 