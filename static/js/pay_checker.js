// State management
let currentQuestionIndex = 0;
let questions = [];
let answers = {};
let optionSources = {};

// Load all necessary data
async function initializePayChecker() {
    try {
        // Load questions and option sources
        const [questionsResponse, optionsResponse] = await Promise.all([
            fetch('/api/questions'),
            fetch('/api/option-sources')
        ]);
        
        questions = (await questionsResponse.json()).steps;
        optionSources = await optionsResponse.json();
        
        showCurrentQuestion();
        updateProgressBar();
    } catch (error) {
        console.error('Failed to initialize pay checker:', error);
        showError('Failed to load questions. Please try again.');
    }
}

// Determine if a question should be shown based on conditions
function shouldShowQuestion(question) {
    if (!question.conditional_on_category && !question.conditional_on_yesno) {
        return true;
    }

    if (question.conditional_on_category) {
        return answers.category === question.conditional_on_category;
    }

    if (question.conditional_on_yesno) {
        return answers[question.conditional_on_yesno] === 'yes';
    }

    return true;
}

// Get next valid question index
function getNextQuestionIndex(currentIndex) {
    let nextIndex = currentIndex + 1;
    while (nextIndex < questions.length) {
        if (shouldShowQuestion(questions[nextIndex])) {
            return nextIndex;
        }
        nextIndex++;
    }
    return -1; // No more questions
}

// Render current question
function showCurrentQuestion() {
    const question = questions[currentQuestionIndex];
    const container = document.getElementById('questionFlow');
    
    const optionsHtml = generateOptionsHtml(question);
    
    container.innerHTML = `
        <div class="question" data-question-id="${question.id}">
            <div class="question-prompt">${question.prompt}</div>
            <div class="options-container">
                ${optionsHtml}
            </div>
            <div class="navigation-buttons">
                ${currentQuestionIndex > 0 ? 
                    '<button class="nav-button back" onclick="previousQuestion()">Back</button>' : ''}
                <button class="nav-button next" onclick="nextQuestion()" disabled>Next</button>
            </div>
        </div>
    `;

    // Restore any previous answers
    if (answers[question.target_session_key]) {
        restorePreviousAnswer(question);
    }
}

// Generate options based on question type
function generateOptionsHtml(question) {
    switch (question.type) {
        case 'options_dict':
            const options = optionSources[question.option_source];
            return Object.entries(options).map(([key, value]) => `
                <button class="option-button" data-value="${key}" onclick="selectOption('${key}')">
                    ${value}
                </button>
            `).join('');
            
        case 'yesno':
            return `
                <button class="option-button" data-value="yes" onclick="selectOption('yes')">Yes</button>
                <button class="option-button" data-value="no" onclick="selectOption('no')">No</button>
            `;
            
        case 'options_classification':
            return Array.from({length: 9}, (_, i) => i + 1).map(level => `
                <button class="option-button" data-value="${level}" onclick="selectOption(${level})">
                    Level ${level}
                </button>
            `).join('');
            
        case 'multi_special':
            return optionSources.special_allowances.map(allowance => `
                <label class="checkbox-option">
                    <input type="checkbox" value="${allowance.id}" 
                           onchange="handleMultiSelect(this)">
                    ${allowance.name} - $${allowance.rate}/week
                </label>
            `).join('');
            
        default:
            return '<p>Unknown question type</p>';
    }
} 

document.addEventListener('DOMContentLoaded', function() {
    initializePayChecker().catch(error => {
        console.error('Failed to initialize:', error);
        document.getElementById('questionFlow').innerHTML = `
            <div class="error-message">
                Failed to load questions. Please try again.
                <button onclick="initializePayChecker()">Retry</button>
            </div>
        `;
    });
}); 