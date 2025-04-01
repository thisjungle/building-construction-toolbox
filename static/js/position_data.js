// Position Data Loading and Initialization Logic

// Function to load employment types data
async function loadEmploymentTypesData() {
    try {
        const response = await fetch('/data/employment_types.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        this.employmentTypesData = await response.json();
        return true;
    } catch (error) {
        console.error('Error loading employment types:', error);
        return false;
    }
}

// Function to load streams data
async function loadStreamsData() {
    try {
        const response = await fetch('/data/activity_streams.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        this.streamsData = await response.json();
        return true;
    } catch (error) {
        console.error('Error loading streams data:', error);
        return false;
    }
}

// Function to load supervision data
async function fetchSupervisionData() {
    try {
        const response = await fetch('/data/supervision_levels.json');
        if (!response.ok) throw new Error('Failed to load supervision data');
        supervisionData = await response.json();
        return true;
    } catch (error) {
        console.error('Error loading supervision data:', error);
        return false;
    }
}

// Function to load autonomy data
async function fetchAutonomyData() {
    try {
        const response = await fetch('/data/autonomy_levels.json');
        if (!response.ok) throw new Error('Failed to load autonomy data');
        autonomyData = await response.json();
        return true;
    } catch (error) {
        console.error('Error loading autonomy data:', error);
        return false;
    }
}

// Function to load experience data
async function fetchExperienceData() {
    try {
        const response = await fetch('/data/experience_levels.json');
        if (!response.ok) throw new Error('Failed to load experience data');
        experienceData = await response.json();
        return true;
    } catch (error) {
        console.error('Error loading experience data:', error);
        return false;
    }
}

// Function to create radio option
function createRadioOption(level, type) {
    const option = document.createElement('div');
    option.className = 'radio-option';
    
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = type;
    radio.value = level.id;
    radio.id = `${type}_${level.id}`;
    
    const label = document.createElement('label');
    label.htmlFor = `${type}_${level.id}`;
    label.innerHTML = `
        <div class="option-content">
            <div class="option-title">${level.name}${level.years_of_experience ? ` (${level.years_of_experience})` : ''}</div>
            <div class="option-description">${level.description}</div>
        </div>
    `;
    
    radio.addEventListener('change', () => {
        if (type === 'experience') {
            selectedExperienceLevel = {
                id: level.id,
                name: level.name,
                description: level.description,
                years_of_experience: level.years_of_experience,
                points: level.points,
                details: {
                    suitable_levels: getSuitableLevels(level.id),
                    characteristics: level.details?.characteristics || [],
                    examples: level.details?.examples || []
                }
            };
            updateActivities();
        } else if (type === 'supervision') {
            selectedSupervisionLevel = level;
        } else {
            selectedAutonomyLevel = level;
        }
        updateResults();
    });
    
    option.appendChild(radio);
    option.appendChild(label);
    return option;
}

// Function to initialize employment types section
function initializeEmploymentTypesSection() {
    const employmentTypesList = document.getElementById('employmentTypesList');
    if (!employmentTypesList) return;

    employmentTypesData.employment_types.forEach(type => {
        const option = createRadioOption(type, 'employment');
        employmentTypesList.appendChild(option);
    });
}

// Function to initialize supervision section
function initializeSupervisionSection() {
    const supervisionList = document.getElementById('supervisionList');
    if (!supervisionList) return;

    supervisionData.supervision_levels.forEach(level => {
        const option = createRadioOption(level, 'supervision');
        supervisionList.appendChild(option);
    });
}

// Function to initialize autonomy section
function initializeAutonomySection() {
    const autonomyList = document.getElementById('autonomyList');
    if (!autonomyList) return;

    autonomyData.autonomy_levels.forEach(level => {
        const option = createRadioOption(level, 'autonomy');
        autonomyList.appendChild(option);
    });
}

// Function to initialize experience section
function initializeExperienceSection() {
    const experienceList = document.getElementById('experienceList');
    if (!experienceList) return;

    experienceData.experience_levels.forEach(level => {
        const option = createRadioOption(level, 'experience');
        experienceList.appendChild(option);
    });
}

// Function to initialize all data
async function initializeData() {
    try {
        // Load all required data
        const [employmentLoaded, streamsLoaded, supervisionLoaded, autonomyLoaded, experienceLoaded] = await Promise.all([
            loadEmploymentTypesData(),
            loadStreamsData(),
            fetchSupervisionData(),
            fetchAutonomyData(),
            fetchExperienceData()
        ]);

        if (!employmentLoaded || !streamsLoaded || !supervisionLoaded || !autonomyLoaded || !experienceLoaded) {
            throw new Error('Failed to load required data');
        }

        // Initialize sections
        initializeEmploymentTypesSection();
        initializeSupervisionSection();
        initializeAutonomySection();
        initializeExperienceSection();

        return true;
    } catch (error) {
        console.error('Error initializing data:', error);
        return false;
    }
}

// Position Data Management
const positionState = {
    selectedActivities: new Set(),
    selectedStreams: new Set(),
    selectedTasks: new Set(),
    completionStatus: {},
    results: [],
    experienceLevel: null,
    employmentType: null,
    supervisionLevel: null,
    autonomyLevel: null
};

// Event handlers
const stateChangeHandlers = new Set();

function addStateChangeHandler(handler) {
    console.log('Adding state change handler');
    stateChangeHandlers.add(handler);
}

function notifyStateChange() {
    console.log('=== Notifying State Change ===');
    console.log('Number of handlers:', stateChangeHandlers.size);
    stateChangeHandlers.forEach(handler => {
        console.log('Calling state change handler');
        handler();
    });
}

// Data operations
function updateSelectedActivities(activities) {
    console.log('=== Updating Selected Activities ===');
    console.log('New activities:', activities);
    positionState.selectedActivities = new Set(activities);
    notifyStateChange();
}

function updateSelectedStreams(streams) {
    console.log('=== Updating Selected Streams ===');
    console.log('New streams:', streams);
    positionState.selectedStreams = new Set(streams);
    notifyStateChange();
}

function updateSelectedTasks(tasks) {
    console.log('=== Updating Selected Tasks ===');
    console.log('New tasks:', tasks);
    positionState.selectedTasks = new Set(tasks);
    notifyStateChange();
}

function updateCompletionStatus(status) {
    positionState.completionStatus = { ...status };
    notifyStateChange();
}

function updateExperienceLevel(level) {
    console.log('=== Updating Experience Level ===');
    console.log('New experience level:', level);
    positionState.experienceLevel = level;
    notifyStateChange();
}

function updateEmploymentType(type) {
    console.log('=== Updating Employment Type ===');
    console.log('New employment type:', type);
    positionState.employmentType = type;
    notifyStateChange();
}

function updateSupervisionLevel(level) {
    console.log('=== Updating Supervision Level ===');
    console.log('New supervision level:', level);
    positionState.supervisionLevel = level;
    notifyStateChange();
}

function updateAutonomyLevel(level) {
    console.log('=== Updating Autonomy Level ===');
    console.log('New autonomy level:', level);
    positionState.autonomyLevel = level;
    notifyStateChange();
}

function getState() {
    console.log('=== Getting Current State ===');
    console.log('Current state:', { ...positionState });
    return { ...positionState };
}

// Export functions
window.positionData = {
    addStateChangeHandler,
    updateSelectedActivities,
    updateSelectedStreams,
    updateSelectedTasks,
    updateCompletionStatus,
    updateExperienceLevel,
    updateEmploymentType,
    updateSupervisionLevel,
    updateAutonomyLevel,
    getState
}; 