// Activity and Task Management Logic

// Function to update activities section
function updateActivities() {
    const state = window.positionData.getState();
    const selectedActivities = state.selectedActivities;
    
    document.querySelectorAll('.activity-checkbox').forEach(checkbox => {
        const activityId = checkbox.getAttribute('data-activity-id');
        checkbox.checked = selectedActivities.has(activityId);
    });
    
    updateSpecificTasks();
}

// Function to update specific tasks section
function updateSpecificTasks() {
    console.log('=== Updating Specific Tasks ===');
    const tasksList = document.getElementById('tasksList');
    const tasksSection = document.querySelector('.tasks-section');
    
    if (!tasksList || !tasksSection) {
        console.error('Tasks section elements not found');
        return;
    }
    
    // Clear existing content
    tasksList.innerHTML = '';

    const state = window.positionData.getState();
    const selectedActivities = state.selectedActivities;
    
    console.log('Selected Activities:', Array.from(selectedActivities));
    
    // If no activities selected, show placeholder
    if (selectedActivities.size === 0) {
        console.log('No activities selected, showing placeholder');
        tasksList.innerHTML = '<p class="placeholder-text">Select job duties to see available specific tasks</p>';
        return;
    }

    // Create sections for each selected stream
    state.selectedStreams.forEach(streamValue => {
        console.log(`Processing stream: ${streamValue}`);
        const streamData = streamTasksData[streamValue];
        if (!streamData) {
            console.warn(`No data found for stream: ${streamValue}`);
            return;
        }

        // Create stream section
        const streamSection = document.createElement('div');
        streamSection.className = 'stream-section';
        streamSection.innerHTML = `
            <h3 class="stream-title">${streamValue} Tasks</h3>
            <div class="tasks-grid"></div>
        `;

        const tasksGrid = streamSection.querySelector('.tasks-grid');

        // Add tasks for each selected activity
        selectedActivities.forEach(activityId => {
            console.log(`Processing activity: ${activityId}`);
            const activityData = streamData.activities[activityId];
            if (!activityData) {
                console.warn(`No data found for activity: ${activityId}`);
                return;
            }

            // Create activity section
            const activitySection = document.createElement('div');
            activitySection.className = 'activity-section';
            activitySection.innerHTML = `
                <h4 class="activity-title">${activityData.name}</h4>
                <div class="tasks-list"></div>
            `;

            const tasksList = activitySection.querySelector('.tasks-list');

            // Add ALL tasks for this activity (no filtering)
            activityData.tasks.forEach(task => {
                console.log(`Adding task: ${task.name}`);
                const taskItem = document.createElement('div');
                taskItem.className = 'task-item';
                taskItem.innerHTML = `
                    <input type="checkbox" 
                           class="task-checkbox"
                           id="task_${task.id}" 
                           data-task-id="${task.id}"
                           value="${task.id}">
                    <label for="task_${task.id}">
                        <div class="task-content">
                            <div class="task-title">${task.name}</div>
                            <div class="task-description">${task.description}</div>
                        </div>
                    </label>
                `;

                // Add event listener to checkbox
                const checkbox = taskItem.querySelector('input[type="checkbox"]');
                checkbox.addEventListener('change', (e) => {
                    const taskId = e.target.getAttribute('data-task-id');
                    const state = window.positionData.getState();
                    const newTasks = new Set(state.selectedTasks);
                    
                    if (e.target.checked) {
                        newTasks.add(taskId);
                    } else {
                        newTasks.delete(taskId);
                    }
                    
                    window.positionData.updateSelectedTasks(Array.from(newTasks));
                });

                tasksList.appendChild(taskItem);
            });

            tasksGrid.appendChild(activitySection);
        });

        tasksList.appendChild(streamSection);
    });
}

// Function to load stream tasks data
async function loadStreamTasksData() {
    const state = window.positionData.getState();
    const selectedStreams = state.selectedStreams;
    
    console.log('=== Loading Stream Tasks Data ===');
    console.log('Selected Streams:', Array.from(selectedStreams));
    
    if (!selectedStreams.size) {
        console.warn('No streams selected');
        return;
    }

    try {
        // Load tasks for each selected stream
        for (const streamValue of selectedStreams) {
            console.log(`Loading tasks for stream: ${streamValue}`);
            const response = await fetch(`/data/work_streams_tasks_${streamValue.toLowerCase()}.json`);
            if (!response.ok) {
                console.error(`Failed to load tasks for stream: ${streamValue}`);
                continue;
            }
            streamTasksData[streamValue] = await response.json();
            console.log(`Loaded tasks for ${streamValue}`);
        }

        // Update tasks display
        updateSpecificTasks();
    } catch (error) {
        console.error('Error loading stream tasks:', error);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== Initializing Position Activities ===');
    // Register state change handler
    window.positionData.addStateChangeHandler(() => {
        console.log('State changed, updating activities and tasks');
        updateActivities();
        updateSpecificTasks();
    });
    
    // Activity checkbox event handlers
    document.querySelectorAll('.activity-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', async (e) => {
            console.log('Activity checkbox changed:', e.target.value);
            const activityId = e.target.getAttribute('data-activity-id');
            const state = window.positionData.getState();
            const newActivities = new Set(state.selectedActivities);
            
            if (e.target.checked) {
                newActivities.add(activityId);
            } else {
                newActivities.delete(activityId);
            }
            
            window.positionData.updateSelectedActivities(Array.from(newActivities));
            await loadStreamTasksData();
        });
    });
}); 