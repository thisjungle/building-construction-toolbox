// Initialize global variables
window.questions = [];
window.followUpQuestions = {
    'level_3_4': [
        {
            id: 'technical_skills',
            text: 'What technical skills do you use in your role?',
            type: 'multiple_select',
            options: [
                { value: 'equipment_operation', label: 'Equipment Operation', description: 'Operating specialized construction equipment' },
                { value: 'technical_reading', label: 'Technical Reading', description: 'Reading and interpreting technical documents' },
                { value: 'measurement', label: 'Measurement', description: 'Using precision measurement tools' },
                { value: 'quality_control', label: 'Quality Control', description: 'Performing quality checks and inspections' }
            ]
        }
    ],
    'level_5_plus': [
        {
            id: 'leadership',
            text: 'What leadership responsibilities do you have?',
            type: 'multiple_select',
            options: [
                { value: 'team_supervision', label: 'Team Supervision', description: 'Supervising work teams' },
                { value: 'project_planning', label: 'Project Planning', description: 'Planning and coordinating projects' },
                { value: 'quality_management', label: 'Quality Management', description: 'Managing quality control systems' },
                { value: 'training', label: 'Training', description: 'Training and mentoring team members' }
            ]
        }
    ]
};
window.userResponses = {};
window.selectedStream = '';

// Define levelDetails globally
window.levelDetails = {
    9: {
        title: "Level 9 - Senior Technical Leader",
        description: "Strategic leadership role with high-level technical expertise",
        criteria: [
            { met: true, desc: "Senior level experience (5+ years)", importance: "Critical for strategic leadership" },
            { met: true, desc: "Advanced specialized work", importance: "Required for complex projects" },
            { met: true, desc: "Strategic planning capabilities", importance: "Essential for organizational direction" }
        ]
    },
    8: {
        title: "Level 8 - Technical Project Leader",
        description: "Project leadership with advanced technical skills",
        criteria: [
            { met: true, desc: "Extensive experience (5+ years)", importance: "Needed for project oversight" },
            { met: true, desc: "Project management skills", importance: "Critical for team leadership" },
            { met: true, desc: "Advanced technical knowledge", importance: "Required for technical direction" }
        ]
    },
    7: {
        title: "Level 7 - Senior Technical Specialist",
        description: "Advanced technical role with team leadership responsibilities",
        criteria: [
            { met: true, desc: "Significant experience (5+ years)", importance: "Essential for advanced work" },
            { met: true, desc: "Team leadership skills", importance: "Required for team coordination" },
            { met: true, desc: "Specialized technical expertise", importance: "Critical for complex tasks" }
        ]
    },
    6: {
        title: "Level 6 - Technical Specialist",
        description: "Specialized technical role with independent work capacity",
        criteria: [
            { met: true, desc: "Extensive experience (5+ years)", importance: "Required for specialized work" },
            { met: true, desc: "Independent work capability", importance: "Essential for role autonomy" },
            { met: true, desc: "Technical expertise", importance: "Needed for specialized tasks" }
        ]
    },
    5: {
        title: "Level 5 - Senior Technician",
        description: "Advanced technical role with specialized skills",
        criteria: [
            { met: true, desc: "Significant experience (5+ years)", importance: "Required for advanced work" },
            { met: true, desc: "Specialized work skills", importance: "Essential for complex tasks" },
            { met: true, desc: "Technical proficiency", importance: "Critical for role execution" }
        ]
    },
    4: {
        title: "Level 4 - Experienced Technician",
        description: "Technical role with demonstrated experience",
        criteria: [
            { met: true, desc: "Moderate experience (2-5 years)", importance: "Required for technical work" },
            { met: true, desc: "Technical work capability", importance: "Essential for role duties" },
            { met: true, desc: "Certificate qualification", importance: "Needed for technical tasks" }
        ]
    },
    3: {
        title: "Level 3 - Technician",
        description: "Technical role with basic experience",
        criteria: [
            { met: true, desc: "Basic experience (2+ years)", importance: "Required for technical tasks" },
            { met: true, desc: "Technical understanding", importance: "Essential for role duties" },
            { met: true, desc: "Basic qualification", importance: "Needed for role execution" }
        ]
    },
    2: {
        title: "Level 2 - Junior Technician",
        description: "Entry-level technical role with some experience",
        criteria: [
            { met: true, desc: "Some experience (1-2 years)", importance: "Required for basic tasks" },
            { met: true, desc: "Basic technical skills", importance: "Essential for role duties" },
            { met: true, desc: "Entry level qualification", importance: "Needed for role execution" }
        ]
    },
    1: {
        title: "Level 1 - Trainee Technician",
        description: "Entry-level role with minimal experience",
        criteria: [
            { met: true, desc: "Minimal experience (<1 year)", importance: "Basic requirement" },
            { met: true, desc: "Basic skills", importance: "Essential for training" },
            { met: true, desc: "Willingness to learn", importance: "Critical for development" }
        ]
    }
};

function determineLevel(responses) {
    // Get key response values
    const experience = responses.experience;
    const workType = responses.workType;
    const supervision = responses.supervision;
    const qualification = responses.qualification;
    const duties = responses.duties || [];
    const responsibilities = responses.responsibilities || [];

    // Level 8-9 (Senior Technical Leadership)
    if ((experience === 'more_than_5_years' && 
         workType === 'specialized_work' && 
         supervision === 'limited' &&
         qualification === 'diploma' &&
         responsibilities.includes('strategic_planning'))) {
        return 'level_8_9';
    }

    // Level 6-7 (Advanced Technical Specialist)
    if ((experience === 'more_than_5_years' && 
         workType === 'specialized_work' && 
         supervision === 'limited' &&
         qualification === 'advanced_certificate' &&
         (responsibilities.includes('project_management') || 
          responsibilities.includes('team_leadership')))) {
        return 'level_6_7';
    }

    // Level 5+ (Technical Specialist)
    if ((experience === 'more_than_5_years' && 
         workType === 'specialized_work' && 
         supervision === 'limited') ||
        (qualification === 'diploma' && 
         workType === 'specialized_work') ||
        (experience === 'more_than_5_years' && 
         qualification === 'advanced_certificate' && 
         supervision === 'limited')) {
        return 'level_5_plus';
    }

    // Level 3-4 (Qualified Tradesperson)
    if ((experience === '2_to_5_years' && 
         workType === 'technical_work') ||
        (qualification === 'certificate' && 
         supervision === 'general') ||
        (experience === 'more_than_5_years' && 
         workType === 'technical_work')) {
        return 'level_3_4';
    }

    // Level 1-2 (Entry Level)
    return 'level_1_2';
}

function determineInitialLevel(responses) {
    console.log('=== Determining Initial Level ===');
    console.log('Responses:', responses);

    // Check qualification first
    if (responses.qualification === 'diploma' || responses.qualification === 'advanced_certificate') {
        console.log('High qualification - checking for level_5_plus');
        if (responses.experience === 'more_than_5_years' && 
            (responses.workType.includes('specialized_work') || responses.workType.includes('design_work'))) {
            console.log('Criteria met for level_5_plus');
            return 'level_5_plus';
        }
    }

    // Check for level 3-4
    if (responses.qualification === 'certificate' || 
        responses.experience === '2_to_5_years' || 
        responses.experience === 'more_than_5_years') {
        
        // Additional checks for level 3-4
        if (responses.responsibilities.includes('training_others') || 
            responses.responsibilities.includes('quality_control') ||
            responses.workType.includes('technical_work')) {
            console.log('Criteria met for level_3_4');
            return 'level_3_4';
        }
    }

    // Log decision points
    console.log('Level determination factors:');
    console.log('- Qualification:', responses.qualification);
    console.log('- Experience:', responses.experience);
    console.log('- Work Type:', responses.workType);
    console.log('- Responsibilities:', responses.responsibilities);

    // Default to level 1-2 if no higher criteria met
    console.log('Defaulting to level_1_2');
    return 'level_1_2';
}

// Add helper function to validate responses
function validateResponses(responses) {
    const requiredFields = ['streams', 'duties', 'experience', 'responsibilities', 'workType', 'qualification'];
    const missing = requiredFields.filter(field => !responses[field]);
    
    if (missing.length > 0) {
        console.error('Missing required responses:', missing);
        return false;
    }
    return true;
}

// Add progress update function
function updateProgress(index) {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const totalQuestions = window.questions.length;
    
    if (progressBar && progressText) {
        const progress = ((index + 1) / totalQuestions) * 100;
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${index + 1}/${totalQuestions}`;
    }
}

// Add card click handlers function
function addCardClickHandlers() {
    const cards = document.querySelectorAll('.work-card');
    const currentQuestion = window.questions[window.currentIndex];

    cards.forEach(card => {
        // Remove any existing click listeners
        card.replaceWith(card.cloneNode(true));
    });

    // Re-query cards after replacing them
    document.querySelectorAll('.work-card').forEach(card => {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Card clicked:', this.getAttribute('data-value'));
            
            if (currentQuestion.type === 'multiple_select') {
                this.classList.toggle('selected');
            } else {
                // Single select - remove selection from other cards
                document.querySelectorAll('.work-card').forEach(c => c.classList.remove('selected'));
                this.classList.add('selected');
            }
        });
    });
}

// Update showQuestion function
window.showQuestion = function(index) {
    console.log('=== Showing Question ===');
    console.log('Question Index:', index);
    
    const container = document.getElementById('questions-container');
    const backButton = document.querySelector('.back-button');
    const nextButton = document.querySelector('.next-button');
    
    if (!container) {
        console.error('Questions container not found');
        return;
    }

    window.currentIndex = index;

    if (backButton) {
        backButton.style.display = index === 0 ? 'none' : 'block';
    }

    let questionToShow = window.questions[index];
    if (!questionToShow) {
        console.error('No question found for index:', index);
        return;
    }

    container.innerHTML = `
        <h2 class="question-text">${questionToShow.text}</h2>
        <div class="options-grid">
            ${questionToShow.options.map(option => `
                <div class="work-card" data-value="${option.value}" role="button" tabindex="0">
                    <span class="card-emoji">${option.emoji || '📋'}</span>
                    <h3 class="card-title">${option.label}</h3>
                    <p class="card-description">${option.description || ''}</p>
                </div>
            `).join('')}
        </div>
    `;

    // Add navigation buttons
    const navContainer = document.createElement('div');
    navContainer.className = 'nav-container';
    navContainer.innerHTML = `
        ${index > 0 ? `
            <button onclick="previousQuestion()" class="back-button">Back</button>
        ` : ''}
        <button onclick="nextQuestion()" class="next-button">Next</button>
    `;
    container.appendChild(navContainer);

    updateProgress(index);
    
    // Add click handlers immediately after creating the cards
    setTimeout(() => {
        addCardClickHandlers();
    }, 0);
};

// Update nextQuestion function to handle follow-ups
window.nextQuestion = function() {
    const selectedCards = document.querySelectorAll('.work-card.selected');
    const currentQuestion = window.questions[window.currentIndex];
    
    // Debug logs
    console.log('Selected cards:', selectedCards.length);
    console.log('Current question:', currentQuestion);
    console.log('Selected values:', Array.from(selectedCards).map(card => card.getAttribute('data-value')));

    // Check if any option is selected
    if (selectedCards.length === 0) {
        alert('Please select at least one option to continue');
        return;
    }

    // Store responses
    const responses = Array.from(selectedCards).map(card => card.getAttribute('data-value'));
    window.userResponses[currentQuestion.id] = 
        currentQuestion.type === 'multiple_select' ? responses : responses[0];

    console.log('Stored responses:', window.userResponses);

    // Check if this is the last question (including follow-ups)
    const isLastMainQuestion = window.currentIndex === window.questions.length - 1;
    const hasAddedFollowUps = window.hasAddedFollowUps;

    if (isLastMainQuestion && !hasAddedFollowUps) {
        const level = determineInitialLevel(window.userResponses);
        const followUps = window.followUpQuestions[level];
        
        if (followUps) {
            console.log('Adding follow-up questions for level:', level);
            // Add follow-up questions
            Object.values(followUps).forEach(question => {
                window.questions.push(question);
            });
            window.hasAddedFollowUps = true;
            showQuestion(window.currentIndex + 1);
        } else {
            // No follow-ups, proceed to results
            submitResponses();
        }
    } else if (isLastMainQuestion && hasAddedFollowUps) {
        // We've completed all questions including follow-ups
        submitResponses();
    } else {
        // Move to next question
        showQuestion(window.currentIndex + 1);
    }
};

// Add submitResponses function if not already present
window.submitResponses = function() {
    console.log('=== Submitting Final Responses ===');
    const level = determineInitialLevel(window.userResponses);
    
    // Redirect to results page with all responses
    window.location.href = `/results?responses=${encodeURIComponent(JSON.stringify({
        ...window.userResponses,
        exactLevel: determineExactLevel(window.userResponses),
        levelGroup: level
    }))}`;
};

// Update previousQuestion function
window.previousQuestion = function() {
    if (window.currentIndex > 0) {
        showQuestion(window.currentIndex - 1);
    }
};

window.handleResponse = function(question, value, index) {
    console.log('=== Handling Response ===');
    console.log('Question:', question.id);
    console.log('Value:', value);
    console.log('Index:', index);

    if (question.type === 'multiple_select') {
        window.userResponses[question.id] = window.userResponses[question.id] || [];
        const valueIndex = window.userResponses[question.id].indexOf(value);
        
        if (valueIndex === -1) {
            window.userResponses[question.id].push(value);
        } else {
            window.userResponses[question.id].splice(valueIndex, 1);
        }
    } else {
        window.userResponses[question.id] = value;
    }

    // Special handling for stream selection
    if (question.id === 'streams') {
        window.selectedStream = value;
        console.log('Stream selected in handleResponse:', window.selectedStream);
    }

    console.log('Updated Responses:', window.userResponses);
};

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== Initializing Questions ===');
    window.hasAddedFollowUps = false;
    window.userResponses = {};
    window.selectedStream = '';
    window.currentIndex = 0;
    
    fetch('/data/classification_logic.json')
        .then(response => response.json())
        .then(data => {
            console.log('Questions Data Loaded');
            window.questions = data.questions;
            window.followUpQuestions = data.followUpQuestions;
            showQuestion(0);
        })
        .catch(error => {
            console.error('Error loading questions:', error);
            const container = document.getElementById('questions-container');
            if (container) {
                container.innerHTML = `
                    <div class="error-message">
                        <p>Error loading questions. Please try again.</p>
                        <button onclick="window.location.reload()">Reload</button>
                    </div>
                `;
            }
        });
});

function calculateLevelMatch(responses, level) {
    let score = 0;
    let maxScore = 0;
    let reasons = [];
    
    // First, determine the exact level based on criteria
    let exactLevel = '';
    
    if (responses.experience === 'more_than_5_years' && 
        responses.workType === 'specialized_work' && 
        responses.supervision === 'limited' &&
        responses.qualification === 'diploma' &&
        responses.responsibilities?.includes('strategic_planning')) {
        exactLevel = 'level_8_9';
    }
    else if (responses.experience === 'more_than_5_years' && 
             responses.workType === 'specialized_work' && 
             responses.supervision === 'limited' &&
             responses.responsibilities?.some(r => ['project_management', 'team_leadership'].includes(r))) {
        exactLevel = 'level_6_7';
    }
    else if (responses.experience === 'more_than_5_years' && 
             responses.workType === 'specialized_work' && 
             responses.supervision === 'limited') {
        exactLevel = 'level_5_plus';
    }
    else if (responses.experience === '2_to_5_years' && 
             responses.workType === 'technical_work') {
        exactLevel = 'level_3_4';
    }
    else {
        exactLevel = 'level_1_2';
    }
    
    // Now calculate match percentage only for the exact level
    if (level === exactLevel) {
        switch(level) {
            case 'level_8_9':
                maxScore = 5;
                if (responses.experience === 'more_than_5_years') {
                    score++; reasons.push("✓ Senior level experience (5+ years)");
                }
                if (responses.workType === 'specialized_work') {
                    score++; reasons.push("✓ Advanced specialized work");
                }
                if (responses.supervision === 'limited') {
                    score++; reasons.push("✓ Independent work capability");
                }
                if (responses.qualification === 'diploma') {
                    score++; reasons.push("✓ Diploma qualification");
                }
                if (responses.responsibilities?.includes('strategic_planning')) {
                    score++; reasons.push("✓ Strategic planning responsibilities");
                }
                break;
                
            case 'level_6_7':
                maxScore = 4;
                if (responses.experience === 'more_than_5_years') {
                    score++; reasons.push("✓ Senior experience (5+ years)");
                }
                if (responses.workType === 'specialized_work') {
                    score++; reasons.push("✓ Specialized work capability");
                }
                if (responses.supervision === 'limited') {
                    score++; reasons.push("✓ Works independently");
                }
                if (responses.responsibilities?.some(r => ['project_management', 'team_leadership'].includes(r))) {
                    score++; reasons.push("✓ Leadership responsibilities");
                }
                break;
                
            case 'level_5_plus':
                maxScore = 3;
                if (responses.experience === 'more_than_5_years') {
                    score++; reasons.push("✓ Experienced (5+ years)");
                }
                if (responses.workType === 'specialized_work') {
                    score++; reasons.push("✓ Specialized work");
                }
                if (responses.supervision === 'limited') {
                    score++; reasons.push("✓ Independent work");
                }
                break;
                
            // ... similar for other levels ...
        }
        return {
            confidence: Math.round((score / maxScore) * 100),
            reasons: reasons,
            isExactMatch: true
        };
    }
    
    return {
        confidence: 0,
        reasons: [],
        isExactMatch: false
    };
}

window.showResults = function(responses) {
    console.log('=== Showing Results ===');
    console.log('Responses:', responses);

    const container = document.getElementById('results-container');
    if (!container) {
        console.error('Results container not found');
        return;
    }

    // Determine level based on responses
    let level = responses.exactLevel || 1;
    
    // Override level if no qualification
    if (responses.qualification === 'none') {
        level = 1;
    }

    // Get adjacent levels (but don't go below 1 or above 9)
    const levels = [level];
    if (level < 9) levels.push(level + 1);
    if (level > 1) levels.push(level - 1);
    levels.sort((a, b) => b - a);

    container.innerHTML = `
        <div class="max-w-4xl mx-auto px-4 py-8">
            <h1 class="text-3xl font-bold mb-8">Your Classification Results</h1>
            
            <button onclick="window.location.href='/'" class="mb-8 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                Start Over
            </button>

            <h2 class="text-2xl font-semibold mb-6">Top 3 Potential Classifications</h2>
            
            <div class="space-y-6 mb-8">
                ${levels.map((level, index) => `
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 
                              ${index === 0 ? 'border-indigo-500 ring-1 ring-indigo-500' : ''}">
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center gap-3">
                                <h3 class="text-xl font-semibold">${window.levelDetails[level].title}</h3>
                                <button onclick="showAwardDetails(${level})" 
                                        class="text-gray-500 hover:text-indigo-600 transition-colors cursor-pointer"
                                        title="See Award Classification">
                                    📄
                                </button>
                            </div>
                            <span class="text-sm font-medium ${index === 0 ? 'text-indigo-600' : 'text-gray-500'}">
                                ${index === 0 ? 'Best Match' : `${90 - (index * 10)}% Match`}
                            </span>
                        </div>
                        
                        <p class="text-gray-600 mb-6">${window.levelDetails[level].description}</p>
                        
                        <div class="space-y-4">
                            <h4 class="font-medium">Classification Criteria:</h4>
                            ${window.levelDetails[level].criteria.map(c => `
                                <div class="flex items-start space-x-3">
                                    <span class="${c.met ? 'text-green-500' : 'text-red-500'} mt-0.5">
                                        ${c.met ? '✓' : '×'}
                                    </span>
                                    <div>
                                        <p class="font-medium">${c.desc}</p>
                                        <p class="text-sm text-gray-500">${c.importance}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="flex space-x-4">
                <button onclick="window.print()" 
                        class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
                    Print Results
                </button>
            </div>
        </div>
    `;
};

function formatLevelName(level) {
    switch(level) {
        case 'level_8_9': return 'Level 8-9';
        case 'level_6_7': return 'Level 6-7';
        case 'level_5_plus': return 'Level 5+';
        case 'level_3_4': return 'Level 3-4';
        case 'level_1_2': return 'Level 1-2';
        default: return level;
    }
}

function getFollowUpQuestions(level) {
    const followUps = window.followUpQuestions[level] || [];
    console.log(`Getting follow-up questions for ${level}: ${followUps.length} questions found`);
    return followUps;
}

function determineExactLevel(responses) {
    console.log('=== Determining Exact Level ===');
    console.log('Responses:', responses);

    // Get initial level group
    const levelGroup = determineInitialLevel(responses);
    
    // Check follow-up responses for more precise level
    if (levelGroup === 'level_5_plus') {
        if (responses.advanced_responsibilities?.includes('systems_design') && 
            responses.supervision === 'technical_supervision') {
            return 6;
        }
        return 5;
    }
    
    if (levelGroup === 'level_3_4') {
        if (responses.technical_skills?.includes('quality_control') && 
            responses.technical_skills?.includes('team_guidance')) {
            return 4;
        }
        return 3;
    }
    
    // Level 1-2 determination
    if (responses.basic_skills?.includes('following_instructions')) {
        return 2;
    }
    return 1;
}

// Update the initialization code to properly handle results page
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const responsesParam = urlParams.get('responses');
    
    if (responsesParam) {
        try {
            const responses = JSON.parse(decodeURIComponent(responsesParam));
            console.log('Parsed responses:', responses);
            
            // Initialize questions data first
            fetch('/data/classification_logic.json')
                .then(response => response.json())
                .then(data => {
                    console.log('Questions Data Loaded');
                    window.questions = data.questions;
                    window.followUpQuestions = data.followUpQuestions;
                    
                    // Now show results
                    window.showResults(responses);
                })
                .catch(error => {
                    console.error('Error loading questions:', error);
                });
        } catch (error) {
            console.error('Error parsing responses:', error);
        }
    } else {
        // Normal question flow
        window.userResponses = {};
        window.selectedStream = '';
        
        fetch('/data/classification_logic.json')
            .then(response => response.json())
            .then(data => {
                console.log('Questions Data Loaded');
                window.questions = data.questions;
                window.followUpQuestions = data.followUpQuestions;
                showQuestion(0);
            })
            .catch(error => {
                console.error('Error loading questions:', error);
            });
    }
});

// Add print styles
const style = document.createElement('style');
style.textContent = `
    @media print {
        body { background: white; }
        .no-print { display: none; }
        button { display: none; }
        .shadow-sm { box-shadow: none; }
        .border { border: 1px solid #e5e7eb; }
    }
`;
document.head.appendChild(style);

// Add showAwardDetails function
window.showAwardDetails = async function(level) {
    try {
        const response = await fetch('/data/award_details.json');
        const data = await response.json();
        
        // Find the matching classification in the classifications array
        const details = data.classifications.find(c => c.level === `CW${level}`);

        if (!details) {
            console.error('Award details not found for level:', `CW${level}`);
            return;
        }

        // Create and show modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                <div class="flex justify-between items-start mb-4">
                    <h2 class="text-2xl font-bold">${details.level} - ${details.description}</h2>
                    <button class="text-gray-500 hover:text-gray-700 text-2xl" onclick="this.closest('.fixed').remove()">×</button>
                </div>

                <div class="space-y-6">
                    <div>
                        <h3 class="font-semibold text-lg mb-2">Requirements</h3>
                        <p class="text-gray-600">${details.requirements}</p>
                    </div>

                    <div>
                        <h3 class="font-semibold text-lg mb-2">Supervision Level</h3>
                        <p class="text-gray-600">Works under ${details.supervision} supervision</p>
                    </div>

                    <div>
                        <h3 class="font-semibold text-lg mb-2">Qualification Requirements</h3>
                        <ul class="list-disc pl-5 text-gray-600 space-y-1">
                            ${details.qualification_requirements.map(req => `
                                <li>${req}</li>
                            `).join('')}
                        </ul>
                    </div>

                    <div>
                        <h3 class="font-semibold text-lg mb-2">Duties and Skills</h3>
                        <div class="space-y-4">
                            <div>
                                <h4 class="font-medium mb-1">General Duties</h4>
                                <ul class="list-disc pl-5 text-gray-600 space-y-1">
                                    ${details.duties_and_skills.general_duties.map(duty => `
                                        <li>${duty}</li>
                                    `).join('')}
                                </ul>
                            </div>
                            <div>
                                <h4 class="font-medium mb-1">Specific Tasks</h4>
                                <ul class="list-disc pl-5 text-gray-600 space-y-1">
                                    ${details.duties_and_skills.specific_tasks.map(task => `
                                        <li>${task}</li>
                                    `).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>

                    ${details.technical_stream ? `
                        <div>
                            <h3 class="font-semibold text-lg mb-2">Technical Stream</h3>
                            <p class="font-medium">${details.technical_stream.title}</p>
                            <p class="text-gray-600">${details.technical_stream.description}</p>
                        </div>
                    ` : ''}

                    ${details.roles ? `
                        <div>
                            <h3 class="font-semibold text-lg mb-2">Example Roles</h3>
                            <ul class="list-disc pl-5 text-gray-600 columns-2 space-y-1">
                                ${details.roles.map(role => `
                                    <li>${role}</li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

    } catch (error) {
        console.error('Error loading award details:', error);
    }
};
