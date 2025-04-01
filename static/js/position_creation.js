// Global state
let state = {
    employmentType: null,
    employerName: null,
    experienceLevel: null,
    selectedStreams: new Set(),
    selectedActivities: new Set(),
    selectedTasks: new Set(),
    supervisionLevel: null,
    autonomyLevel: null,
    personalDetails: {
        name: 'John Smith',
        startDate: '01/01/2024',
        email: 'john.smith@example.com',
        phone: '0400 000 000'
    }
};

// Cache for activities data
let activitiesCache = new Map();

// Minimum rates data
let minimumRates = null;

// Broadband classifications data
let broadbandClassifications = null;

// DOM Elements
const elements = {
    employmentOptions: document.getElementById('employmentOptions'),
    employerField: document.getElementById('employer-field'),
    employerInput: document.getElementById('employer-name'),
    experienceOptions: document.getElementById('experienceOptions'),
    sectorsOptions: document.getElementById('sectorsOptions'),
    activitiesList: document.getElementById('activitiesList'),
    specificTasksContainer: document.querySelector('.specific-tasks-container'),
    supervisionOptions: document.getElementById('supervisionOptions'),
    autonomyOptions: document.getElementById('autonomyOptions'),
    resultsPanel: document.querySelector('.results-panel'),
    noSelections: document.querySelector('.no-selections'),
    descriptionText: document.querySelector('.description-text')
};

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load all required data
        await Promise.all([
            loadEmploymentTypes(),
            loadExperienceLevels(),
            loadStreams(),
            loadSupervisionLevels(),
            loadAutonomyLevels(),
            loadMinimumRates(),
            loadBroadbandClassifications()
        ]);

        // Initialize all sections
        initializeEmploymentSection();
        initializeExperienceSection();
        initializeStreamsSection();
        initializeSupervisionSection();
        initializeAutonomySection();

        // Set up event listeners
        setupEventListeners();

        // Populate test data
        await populateTestData();

        // Initialize job posting button
        initializeJobPostingButton();

        // Add state change handler for results panel
        positionData.addStateChangeHandler(updateResultsPanel);
    } catch (error) {
        console.error('Error initializing application:', error);
        showError('Failed to initialize application. Please refresh the page.');
    }
});

// Function to populate test data
async function populateTestData() {
    // Set employment type
    const employmentRadio = document.querySelector('input[name="employment_type"][value="full-time"]');
    if (employmentRadio) {
        employmentRadio.checked = true;
        state.employmentType = 'full-time';
    }

    // Set personal details
    state.personalDetails = {
        name: 'John Smith',
        startDate: '01/01/2024',
        email: 'john.smith@example.com',
        phone: '0400 000 000'
    };

    // Set experience level
    const experienceRadio = document.querySelector('input[name="experience_level"][value="senior"]');
    if (experienceRadio) {
        experienceRadio.checked = true;
        state.experienceLevel = 'senior';
    }

    // Set work stream
    const streamCheckbox = document.querySelector('input[name="stream"][value="civil"]');
    if (streamCheckbox) {
        streamCheckbox.checked = true;
        state.selectedStreams.add('civil');
    }

    // Update activities first
    await updateActivities();

    // Wait a bit for activities to load
    await new Promise(resolve => setTimeout(resolve, 500));

    // Select first 2 activities
    const activityCheckboxes = document.querySelectorAll('input[name="activity"]');
    for (let i = 0; i < Math.min(2, activityCheckboxes.length); i++) {
        activityCheckboxes[i].checked = true;
        state.selectedActivities.add(activityCheckboxes[i].value);
    }

    // Update tasks
    await updateSpecificTasks();

    // Wait a bit for tasks to load
    await new Promise(resolve => setTimeout(resolve, 500));

    // Select first 4 tasks
    const taskCheckboxes = document.querySelectorAll('input[name="task"]');
    for (let i = 0; i < Math.min(4, taskCheckboxes.length); i++) {
        taskCheckboxes[i].checked = true;
        state.selectedTasks.add(taskCheckboxes[i].value);
    }

    // Set supervision level
    const supervisionRadio = document.querySelector('input[name="supervision_level"][value="limited"]');
    if (supervisionRadio) {
        supervisionRadio.checked = true;
        state.supervisionLevel = 'limited';
    }

    // Set autonomy level
    const autonomyRadio = document.querySelector('input[name="autonomy_level"][value="moderate"]');
    if (autonomyRadio) {
        autonomyRadio.checked = true;
        state.autonomyLevel = 'moderate';
    }

    // Update results
    updateResults();
}

// Data loading functions
async function loadEmploymentTypes() {
    try {
        const response = await fetch('/data/employment_types.json');
        if (!response.ok) throw new Error('Failed to load employment types');
        return await response.json();
    } catch (error) {
        console.error('Error loading employment types:', error);
        throw error;
    }
}

async function loadExperienceLevels() {
    try {
        const response = await fetch('/data/experience_levels.json');
        if (!response.ok) throw new Error('Failed to load experience levels');
        return await response.json();
    } catch (error) {
        console.error('Error loading experience levels:', error);
        throw error;
    }
}

async function loadStreams() {
    try {
        const response = await fetch('/data/activity_streams.json');
        if (!response.ok) throw new Error('Failed to load streams');
        return await response.json();
    } catch (error) {
        console.error('Error loading streams:', error);
        throw error;
    }
}

async function loadSupervisionLevels() {
    try {
        const response = await fetch('/data/supervision_levels.json');
        if (!response.ok) throw new Error('Failed to load supervision levels');
        return await response.json();
    } catch (error) {
        console.error('Error loading supervision levels:', error);
        throw error;
    }
}

async function loadAutonomyLevels() {
    try {
        const response = await fetch('/data/autonomy_levels.json');
        if (!response.ok) throw new Error('Failed to load autonomy levels');
        return await response.json();
    } catch (error) {
        console.error('Error loading autonomy levels:', error);
        throw error;
    }
}

// Add function to load minimum rates
async function loadMinimumRates() {
    try {
        const response = await fetch('/data/minimum_rates.json');
        if (!response.ok) throw new Error('Failed to load minimum rates');
        minimumRates = await response.json();
        console.log('Loaded minimum rates:', minimumRates); // Debug log
    } catch (error) {
        console.error('Error loading minimum rates:', error);
        throw error;
    }
}

// Add function to load broadband classifications
async function loadBroadbandClassifications() {
    try {
        const response = await fetch('/data/broadband_classifications.json');
        if (!response.ok) throw new Error('Failed to load broadband classifications');
        broadbandClassifications = await response.json();
        console.log('Loaded broadband classifications:', broadbandClassifications);
    } catch (error) {
        console.error('Error loading broadband classifications:', error);
        throw error;
    }
}

// Section initialization functions
function initializeEmploymentSection() {
    if (!elements.employmentOptions) return;

    const employmentTypes = [
        { value: 'full-time', title: 'Full-time', description: 'Standard full-time employment' },
        { value: 'part-time', title: 'Part-time', description: 'Regular but reduced hours' },
        { value: 'casual', title: 'Casual', description: 'Flexible work arrangement' }
    ];

    elements.employmentOptions.innerHTML = employmentTypes.map(type => `
        <div class="option-content">
            <input type="radio" name="employment_type" value="${type.value}" id="employment_${type.value}">
            <div class="option-content-wrapper">
                <div class="option-title">${type.title}</div>
                <div class="option-description">${type.description}</div>
            </div>
        </div>
    `).join('');
}

function initializeExperienceSection() {
    if (!elements.experienceOptions) return;

    const experienceLevels = [
        { value: 'entry', title: 'Entry Level', description: '0-3 years experience' },
        { value: 'mid', title: 'Mid Level', description: '3-8 years experience' },
        { value: 'senior', title: 'Senior Level', description: '8+ years experience' }
    ];

    elements.experienceOptions.innerHTML = experienceLevels.map(level => `
        <div class="option-content">
            <input type="radio" name="experience_level" value="${level.value}" id="experience_${level.value}">
            <div class="option-content-wrapper">
                <div class="option-title">${level.title}</div>
                <div class="option-description">${level.description}</div>
            </div>
        </div>
    `).join('');
}

function initializeStreamsSection() {
    if (!elements.sectorsOptions) return;

    const streams = [
        { value: 'civil', title: 'Civil Construction', description: 'Civil engineering and infrastructure' },
        { value: 'electrical', title: 'Electrical/Electronic', description: 'Electrical and electronic systems' },
        { value: 'fabrication', title: 'Fabrication', description: 'Metal fabrication and structural work' },
        { value: 'general', title: 'General Construction', description: 'General building and construction' },
        { value: 'mechanical', title: 'Mechanical', description: 'Mechanical systems and equipment' }
    ];

    elements.sectorsOptions.innerHTML = streams.map(stream => `
        <div class="option-content">
            <input type="checkbox" name="stream" value="${stream.value}" id="stream_${stream.value}">
            <div class="option-content-wrapper">
                <div class="option-title">${stream.title}</div>
                <div class="option-description">${stream.description}</div>
            </div>
        </div>
    `).join('');
}

function initializeSupervisionSection() {
    if (!elements.supervisionOptions) return;

    const supervisionLevels = [
        { value: 'direct', title: 'Direct Supervision', description: 'Constant guidance required' },
        { value: 'routine', title: 'Routine Supervision', description: 'Regular check-ins needed' },
        { value: 'general', title: 'General Supervision', description: 'Occasional guidance' },
        { value: 'limited', title: 'Limited Supervision', description: 'Minimal guidance needed' }
    ];

    elements.supervisionOptions.innerHTML = supervisionLevels.map(level => `
        <div class="option-content">
            <input type="radio" name="supervision_level" value="${level.value}" id="supervision_${level.value}">
            <div class="option-content-wrapper">
                <div class="option-title">${level.title}</div>
                <div class="option-description">${level.description}</div>
            </div>
        </div>
    `).join('');
}

function initializeAutonomySection() {
    if (!elements.autonomyOptions) return;

    const autonomyLevels = [
        { value: 'basic', title: 'Basic Autonomy', description: 'Limited decision-making' },
        { value: 'moderate', title: 'Moderate Autonomy', description: 'Some independent decisions' },
        { value: 'high', title: 'High Autonomy', description: 'Mostly independent' },
        { value: 'full', title: 'Full Autonomy', description: 'Complete independence' }
    ];

    elements.autonomyOptions.innerHTML = autonomyLevels.map(level => `
        <div class="option-content">
            <input type="radio" name="autonomy_level" value="${level.value}" id="autonomy_${level.value}">
            <div class="option-content-wrapper">
                <div class="option-title">${level.title}</div>
                <div class="option-description">${level.description}</div>
            </div>
        </div>
    `).join('');
}

// Event listeners setup
function setupEventListeners() {
    // Employment type selection
    document.querySelectorAll('input[name="employment_type"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            state.employmentType = e.target.value;
            elements.employerField.style.display = state.employmentType === 'casual' ? 'block' : 'none';
            updateResults();
        });
    });

    // Experience level selection
    document.querySelectorAll('input[name="experience_level"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            state.experienceLevel = e.target.value;
            updateActivities();
            updateSpecificTasks();
            updateResults();
        });
    });

    // Stream selection
    document.querySelectorAll('input[name="stream"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const value = e.target.value;
            const isChecked = e.target.checked;
            
            if (isChecked) {
                state.selectedStreams.add(value);
            } else {
                state.selectedStreams.delete(value);
            }
            
            updateActivities();
            updateSpecificTasks();
            updateResults();
        });
    });

    // Supervision level selection
    document.querySelectorAll('input[name="supervision_level"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            state.supervisionLevel = e.target.value;
            updateResults();
        });
    });

    // Autonomy level selection
    document.querySelectorAll('input[name="autonomy_level"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            state.autonomyLevel = e.target.value;
            updateResults();
        });
    });
}

// Update functions
async function updateActivities() {
    if (!elements.activitiesList) return;

    if (!state.experienceLevel || state.selectedStreams.size === 0) {
        elements.activitiesList.innerHTML = '<p class="placeholder-text">Select experience level and work streams to see available job duties</p>';
        return;
    }
    
    try {
        const response = await fetch('/data/activity_streams.json');
        if (!response.ok) throw new Error('Failed to load activities');
        const data = await response.json();

        // Clear the cache
        activitiesCache.clear();

        const activities = [];
        state.selectedStreams.forEach(stream => {
            const streamData = data.streams[stream];
            if (streamData && streamData.levels) {
                Object.values(streamData.levels).forEach(level => {
                    if (level.activities) {
                        // Cache each activity
                        level.activities.forEach(activity => {
                            activitiesCache.set(activity.id, activity);
                        });
                        activities.push(...level.activities);
                    }
                });
            }
        });

        elements.activitiesList.innerHTML = activities.map(activity => `
            <div class="activity-card">
                <input type="checkbox" 
                       name="activity" 
                       value="${activity.id}" 
                       id="activity_${activity.id}"
                       ${state.selectedActivities.has(activity.id) ? 'checked' : ''}>
                <div class="activity-content">
                    <div class="activity-title">${activity.name}</div>
                    <div class="activity-description">${activity.description}</div>
                </div>
            </div>
        `).join('');

        // Add event listeners to new checkboxes
        document.querySelectorAll('input[name="activity"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    state.selectedActivities.add(e.target.value);
                } else {
                    state.selectedActivities.delete(e.target.value);
                }
                updateSpecificTasks();
                updateResults();
            });
        });
    } catch (error) {
        console.error('Error updating activities:', error);
        elements.activitiesList.innerHTML = '<p class="error-text">Error loading job duties. Please try again.</p>';
    }
}

async function updateSpecificTasks() {
    if (!elements.specificTasksContainer) return;
    
    if (state.selectedActivities.size === 0) {
        elements.specificTasksContainer.innerHTML = '<p class="placeholder-text">Select job duties to see specific daily tasks</p>';
        return;
    }

    try {
        const response = await fetch('/data/activity_streams.json');
        if (!response.ok) throw new Error('Failed to load specific tasks');
        const data = await response.json();

        const tasks = new Set();
        state.selectedStreams.forEach(stream => {
            const streamData = data.streams[stream];
            if (streamData && streamData.levels) {
                Object.values(streamData.levels).forEach(level => {
                    if (level.activities) {
                        level.activities.forEach(activity => {
                            if (state.selectedActivities.has(activity.id) && activity.indicative_tasks) {
                                activity.indicative_tasks.forEach(task => tasks.add(task));
                            }
                        });
                    }
                });
            }
        });

        if (tasks.size === 0) {
            elements.specificTasksContainer.innerHTML = '<p class="placeholder-text">No specific tasks available for selected job duties</p>';
        return;
    }
    
        elements.specificTasksContainer.innerHTML = Array.from(tasks).map(task => `
            <div class="task-item">
                <input type="checkbox" 
                       name="task" 
                       value="${task}" 
                       id="task_${task.replace(/\s+/g, '_')}"
                       ${state.selectedTasks.has(task) ? 'checked' : ''}>
                <label for="task_${task.replace(/\s+/g, '_')}">${task}</label>
            </div>
        `).join('');

        // Add event listeners to new checkboxes
        document.querySelectorAll('input[name="task"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    state.selectedTasks.add(e.target.value);
                } else {
                    state.selectedTasks.delete(e.target.value);
                }
                updateResults();
            });
        });
    } catch (error) {
        console.error('Error updating specific tasks:', error);
        elements.specificTasksContainer.innerHTML = '<p class="error-text">Error loading specific tasks. Please try again.</p>';
    }
}

function updateResults() {
    const resultsPanel = document.querySelector('.results-panel');
    const descriptionText = document.querySelector('.description-text');
    const noSelections = document.querySelector('.no-selections');
    
    if (!state.employmentType || !state.experienceLevel || state.selectedStreams.size === 0) {
        resultsPanel.style.display = 'none';
        noSelections.style.display = 'block';
        return;
    }
    
    resultsPanel.style.display = 'block';
    noSelections.style.display = 'none';

    // Get selected items
    const selectedDuties = Array.from(state.selectedActivities).map(id => {
        const activity = findActivityById(id);
        return activity ? activity.name : id;
    }).filter(name => name);
    const selectedTasks = Array.from(state.selectedTasks).filter(task => task);

    // Calculate classification
    const classification = calculateClassification();
    const details = classification.details.map(detail => 
        `${detail.factor}:\n${detail.reason}\nImpact: ${detail.impact}`
    ).join('\n\n');

    // Get minimum rates for the classification level
    const baseKey = `CW/ECW ${classification.level.replace('CW', '')}`;
    const rateKey = classification.level === 'CW1' ? `${baseKey} - Level d` : baseKey;
    const rates = minimumRates?.minimum_rates[rateKey];

    // Get associated broadband classifications for the current level and streams
    let roleSelectHTML = '';
    if (broadbandClassifications && broadbandClassifications[baseKey]) {
        const relevantBroadbands = [];
        state.selectedStreams.forEach(stream => {
            const streamBroadbands = broadbandClassifications[baseKey][stream];
            if (streamBroadbands) {
                relevantBroadbands.push(...streamBroadbands);
            }
        });

        if (relevantBroadbands.length > 0) {
            roleSelectHTML = `
            <div class="role-title-section">
                <p>
                    <strong>Role Title:</strong>
                    <div class="role-input-group">
                        <div class="autocomplete-wrapper">
                            <input type="text" 
                                id="roleInput" 
                                class="role-autocomplete" 
                                placeholder="Search or enter role title..."
                                autocomplete="off">
                            <div class="search-icon">🔍</div>
                            <div id="autocompleteDropdown" class="autocomplete-dropdown" style="display: none;"></div>
                        </div>
                    </div>
                </p>
            </div>`;
        }
    }
    
    // Create results HTML with plain text
    let resultsHTML = `
        <p>
            <strong>Employment Type:</strong> ${state.employmentType}
        </p>
        <p>
            <strong>Experience Level:</strong> ${state.experienceLevel}
        </p>
        <p>
            <strong>Work Streams:</strong> ${Array.from(state.selectedStreams).join(', ')}
        </p>
        <p>
            <strong>Job Duties:</strong>
            <span class="selection-info" title="${selectedDuties.join('\n')}">${selectedDuties.length} selected</span>
        </p>
        <p>
            <strong>Specific Tasks:</strong>
            <span class="selection-info" title="${selectedTasks.join('\n')}">${selectedTasks.length} selected</span>
        </p>
        <p>
            <strong>Classification Level:</strong>
            <span class="selection-info" title="${details}">${classification.level} - ${classification.confidenceText}</span>
        </p>`;

    // Add pay information if rates are available
    if (rates) {
        resultsHTML += `
        <p>
            <strong>Base Pay (Minimum):</strong> $${rates.weekly_rate.toFixed(2)} per week ($${rates.hourly_rate.toFixed(2)}/hour)
        </p>`;
    }

    // Add role selection
    resultsHTML += roleSelectHTML;

    // Add Required Qualifications and Licenses section with placeholder
    resultsHTML += `
    <div class="qualifications-section">
        <p>
            <strong>Required Qualifications and Licenses:</strong>
            <div class="qualifications-placeholder">
                Required qualifications to be determined based on role and work streams
            </div>
        </p>
    </div>`;

    // Add Shift Work Required section with placeholder
    resultsHTML += `
    <div class="shift-work-section">
        <p>
            <strong>Shift Work Required:</strong>
            <div class="shift-work-placeholder">
                Shift work requirements to be determined based on role and work streams
            </div>
        </p>
    </div>`;

    // Add Allowances section with placeholder
    resultsHTML += `
    <div class="allowances-section">
        <p>
            <strong>Allowances:</strong>
            <div class="allowances-placeholder">
                Applicable allowances to be determined based on role and work streams
            </div>
        </p>
    </div>`;

    // Add Work Location/Site Type section with placeholder
    resultsHTML += `
    <div class="work-location-section">
        <p>
            <strong>Work Location/Site Type:</strong>
            <div class="work-location-placeholder">
                Site-specific requirements and inductions to be determined based on work location and type
            </div>
        </p>
    </div>`;

    // Add Personal and Admin Details section
    resultsHTML += `
    <div class="personal-details-section">
        <p>
            <strong>Personal and Admin Details:</strong>
            <div class="personal-details-content">
                <div class="detail-row">
                    <span class="detail-label">Name:</span>
                    <input type="text" 
                           class="detail-input" 
                           value="${state.personalDetails?.name || 'John Smith'}"
                           placeholder="Enter name">
                </div>
                <div class="detail-row">
                    <span class="detail-label">Start Date:</span>
                    <input type="text" 
                           class="detail-input" 
                           value="${state.personalDetails?.startDate || '01/01/2024'}"
                           placeholder="DD/MM/YYYY">
                </div>
                <div class="detail-row">
                    <span class="detail-label">Email:</span>
                    <input type="email" 
                           class="detail-input" 
                           value="${state.personalDetails?.email || 'john.smith@example.com'}"
                           placeholder="Enter email">
                </div>
                <div class="detail-row">
                    <span class="detail-label">Contact Number:</span>
                    <input type="tel" 
                           class="detail-input" 
                           value="${state.personalDetails?.phone || '0400 000 000'}"
                           placeholder="Enter contact number">
                </div>
            </div>
        </p>
    </div>`;

    // Add Create Onboarding Pack button
    resultsHTML += `
    <div class="onboarding-button-section">
        <button class="btn btn-primary" id="createOnboardingPack">
            Create Onboarding Pack
        </button>
    </div>`;

    descriptionText.innerHTML = resultsHTML;
    initializeRoleAutocomplete();

    // Add event listeners for all input fields
    const inputs = document.querySelectorAll('.detail-input');
    inputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const field = e.target.closest('.detail-row').querySelector('.detail-label').textContent.replace(':', '').toLowerCase();
            state.personalDetails[field] = e.target.value;
        });
    });
}

// Add autocomplete functionality
function initializeRoleAutocomplete() {
    const input = document.getElementById('roleInput');
    const dropdown = document.getElementById('autocompleteDropdown');
    let currentFocus = -1;

    if (!input) return;

    // Get available roles based on current classification and streams
    function getAvailableRoles() {
        const roles = [];
        
        if (broadbandClassifications) {
            // Loop through all classification levels
            Object.keys(broadbandClassifications).forEach(classLevel => {
                // For each selected stream
                state.selectedStreams.forEach(stream => {
                    const streamRoles = broadbandClassifications[classLevel][stream];
                    if (streamRoles) {
                        // Add classification level prefix to each role
                        const prefixedRoles = streamRoles.map(role => ({
                            role: role,
                            level: classLevel,
                            display: `${role} (${classLevel})`
                        }));
                        roles.push(...prefixedRoles);
                    }
                });
            });
        }

        // Sort roles alphabetically and remove duplicates
        return [...new Set(roles.map(r => JSON.stringify(r)))]
            .map(r => JSON.parse(r))
            .sort((a, b) => a.role.localeCompare(b.role));
    }

    function showAutocompleteDropdown(filteredRoles) {
        const val = input.value.toLowerCase();
        dropdown.innerHTML = '';
        dropdown.style.display = 'none';

        // Only show dropdown if 3 or more characters are entered, or if input is focused with no value
        if ((!val && document.activeElement === input) || (val && val.length >= 3)) {
            currentFocus = -1;
            
            // Create a div for each matching item
            filteredRoles.forEach((roleObj, index) => {
                const item = document.createElement('div');
                item.className = 'autocomplete-item';
                
                // Split the role name into words
                const role = roleObj.role;
                const words = role.split(/\b/); // Split on word boundaries
                
                // Create the display text with whole-word highlighting
                let displayHtml = '';
                words.forEach(word => {
                    if (word.toLowerCase().includes(val)) {
                        displayHtml += `<strong>${word}</strong>`;
                    } else {
                        displayHtml += word;
                    }
                });
                
                item.innerHTML = displayHtml;
                
                // Store the full role object as a data attribute
                item.dataset.roleData = JSON.stringify(roleObj);
                
                item.addEventListener('click', function(e) {
                    input.value = role;
                    // Store the selected role's data
                    input.dataset.selectedRole = this.dataset.roleData;
                    dropdown.style.display = 'none';
                });
                
                dropdown.appendChild(item);
            });

            if (filteredRoles.length > 0) {
                dropdown.style.display = 'block';
            }
        }
    }

    input.addEventListener('input', function(e) {
        const val = this.value.toLowerCase();
        const availableRoles = getAvailableRoles();
        
        // Filter roles that match the input
        const filteredRoles = val.length >= 3 ? availableRoles.filter(roleObj => 
            roleObj.role.toLowerCase().includes(val)
        ) : [];
        
        showAutocompleteDropdown(filteredRoles);
    });

    // Show all options when focusing on empty input
    input.addEventListener('focus', function() {
        if (!this.value) {
            const availableRoles = getAvailableRoles();
            showAutocompleteDropdown(availableRoles);
        }
    });
}

// Helper function to calculate classification
function calculateClassification() {
    let level = 'CW1';
    let confidence = 'confidence-high';
    let confidenceText = 'High Confidence';
    let details = [];

    // Updated classification logic based on new experience levels
    if (state.experienceLevel === 'senior' && state.autonomyLevel === 'full') {
        level = 'CW4';
        details.push({
            level: 'CW4',
            factor: 'Experience & Autonomy',
            reason: 'Senior level (8+ years) with full autonomy',
            impact: 'High level of responsibility and decision-making'
        });
    } else if (state.experienceLevel === 'mid' && state.autonomyLevel === 'high') {
        level = 'CW3';
        details.push({
            level: 'CW3',
            factor: 'Experience & Autonomy',
            reason: 'Mid level (3-8 years) with high autonomy',
            impact: 'Significant responsibility and independent decision-making'
        });
    } else if (state.experienceLevel === 'mid' && state.autonomyLevel === 'moderate') {
        level = 'CW2';
        details.push({
            level: 'CW2',
            factor: 'Experience & Autonomy',
            reason: 'Mid level (3-8 years) with moderate autonomy',
            impact: 'Balanced responsibility and supervision'
        });
    } else {
        details.push({
            level: 'CW1',
            factor: 'Experience & Autonomy',
            reason: 'Entry level (0-3 years) or supervised work',
            impact: 'Direct supervision and guidance'
        });
    }

    // Add supervision level details
    details.push({
        level: level,
        factor: 'Supervision',
        reason: state.supervisionLevel,
        impact: 'Determines level of guidance required'
    });

    // Add work streams impact
    if (state.selectedStreams.size > 0) {
        details.push({
            level: level,
            factor: 'Work Streams',
            reason: Array.from(state.selectedStreams).join(', '),
            impact: 'Influences complexity and scope of work'
        });
    }

    return {
        level,
        confidence,
        confidenceText,
        details
    };
}

// Helper function to find activity by ID
function findActivityById(id) {
    return activitiesCache.get(id);
}

// Utility functions
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.querySelector('.form-container').prepend(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}

// Show job posting button when position is complete
function updateResultsPanel(state) {
    const resultsPanel = document.querySelector('.results-panel');
    const noSelections = resultsPanel.querySelector('.no-selections');
    const descriptionText = resultsPanel.querySelector('.description-text');
    const employmentSummary = resultsPanel.querySelector('.employment-summary');
    const jobPostingActions = resultsPanel.querySelector('.job-posting-actions');
    
    if (!state.employmentType) {
        noSelections.style.display = 'block';
        descriptionText.style.display = 'none';
        employmentSummary.style.display = 'none';
        jobPostingActions.style.display = 'none';
        return;
    }
    
    noSelections.style.display = 'none';
    descriptionText.style.display = 'block';
    employmentSummary.style.display = 'block';
    
    // Show job posting button when all required selections are made
    const isComplete = state.employmentType && 
                      state.selectedStreams.size > 0 && 
                      state.selectedActivities.size > 0 &&
                      state.experienceLevel &&
                      state.supervisionLevel &&
                      state.autonomyLevel;
    
    jobPostingActions.style.display = isComplete ? 'block' : 'none';
}

// Initialize job posting button
function initializeJobPostingButton() {
    const createJobPostingBtn = document.getElementById('createOnboardingPack');
    
    createJobPostingBtn.addEventListener('click', () => {
        // Create a new window with the job posting
        const jobPostingWindow = window.open('', '_blank');
        jobPostingWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Job Posting</title>
                <link rel="stylesheet" href="/static/styles/job_posting.css">
            </head>
            <body>
                <div class="job-posting-container">
                    ${generateJobPostingContent()}
                </div>
            </body>
            </html>
        `);
        jobPostingWindow.document.close();
    });
}

function generateJobPostingContent() {
    // Get selected items
    const selectedDuties = Array.from(state.selectedActivities).map(id => {
        const activity = findActivityById(id);
        return activity ? activity.name : id;
    }).filter(name => name);
    
    const selectedTasks = Array.from(state.selectedTasks).filter(task => task);
    
    // Calculate classification
    const classification = calculateClassification();
    
    // Get minimum rates for the classification level
    const baseKey = `CW/ECW ${classification.level.replace('CW', '')}`;
    const rateKey = classification.level === 'CW1' ? `${baseKey} - Level d` : baseKey;
    const rates = minimumRates?.minimum_rates[rateKey];

    return `
        <div class="job-posting">
            <h1>${state.employmentType} Position</h1>
            
            <section class="company-info">
                <h2>Company Information</h2>
                <p>Location: ${state.workLocation || '[Location]'}</p>
                <p>Site Type: ${state.siteType || '[Site Type]'}</p>
                <p>Employment Type: ${state.employmentType}</p>
            </section>
            
            <section class="responsibilities">
                <h2>Key Responsibilities</h2>
                <h3>Job Duties:</h3>
                <ul>
                    ${selectedDuties.map(duty => `<li>${duty}</li>`).join('')}
                </ul>
                
                <h3>Specific Tasks:</h3>
                <ul>
                    ${selectedTasks.map(task => `<li>${task}</li>`).join('')}
                </ul>
            </section>
            
            <section class="requirements">
                <h2>Essential Requirements</h2>
                <h3>Qualifications:</h3>
                <ul>
                    <li>Relevant qualifications for ${Array.from(state.selectedStreams).join(', ')} work</li>
                    <li>Experience Level: ${state.experienceLevel}</li>
                    <li>Classification Level: ${classification.level}</li>
                </ul>
            </section>
            
            <section class="desirable">
                <h2>Desirable Requirements</h2>
                <ul>
                    <li>Previous experience in ${Array.from(state.selectedStreams).join(', ')}</li>
                    <li>Strong communication and interpersonal skills</li>
                    <li>Ability to work effectively in a team environment</li>
                    <li>Commitment to workplace safety and quality standards</li>
                </ul>
            </section>
            
            <section class="salary">
                <h2>Salary & Benefits</h2>
                ${rates ? `
                    <p>Base Pay: $${rates.hourly_rate.toFixed(2)} per hour ($${rates.weekly_rate.toFixed(2)} per week)</p>
                ` : '<p>Base Pay: To be determined based on experience and classification</p>'}
            </section>
            
            <section class="project">
                <h2>Project Details</h2>
                <p>Work Streams: ${Array.from(state.selectedStreams).join(', ')}</p>
                <p>Classification Level: ${classification.level}</p>
                <p>Supervision Level: ${state.supervisionLevel}</p>
                <p>Autonomy Level: ${state.autonomyLevel}</p>
            </section>
            
            <section class="application">
                <h2>Application Instructions</h2>
                <p>To apply for this position, please submit your resume and a cover letter addressing the essential requirements to [email address].</p>
                <p>For any questions about this position, please contact [contact person] at [phone number] or [email address].</p>
                <p><strong>Note:</strong> This position is subject to the Building and Construction General On-site Award 2020 (MA000020).</p>
            </section>
        </div>
    `;
}

// Save position and return position ID
async function savePosition(state) {
    try {
        const response = await fetch('/api/positions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(state)
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to save position');
        }
        
        return data.positionId;
    } catch (error) {
        console.error('Error saving position:', error);
        throw error;
    }
}

// Activity change handler
function handleActivityChange(event) {
    const value = event.target.value;
    const isChecked = event.target.checked;
    
    // Update state
    if (isChecked) {
        state.selectedActivities.add(value);
    } else {
        state.selectedActivities.delete(value);
    }
    
    // Reset dependent section
    state.selectedTasks.clear();
    
    // Update UI
    updateSpecificTasks();
    updateResultsPanel();
}

// Initialize activity checkboxes
function initializeActivityCheckboxes() {
    if (!elements.activitiesList) return;
    
    elements.activitiesList.addEventListener('change', (e) => {
        if (e.target.name === 'activity') {
            handleActivityChange(e);
        }
    });
} 