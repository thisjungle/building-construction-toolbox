class ActivitySelection {
    constructor() {
        this.streams = {};
        this.selectedStreams = new Set();
        this.selectedActivities = new Map();
        this.initialize();
    }

    async initialize() {
        try {
            // Load activity streams data
            const response = await fetch('/activity_streams');
            this.streams = await response.json();
            
            // Initialize UI elements
            this.streamSelection = document.getElementById('streamSelection');
            this.activitySelection = document.getElementById('activitySelection');
            this.activityGrid = document.getElementById('activityGrid');
            this.selectedActivitiesList = document.getElementById('selectedActivities');
            
            // Dynamically populate stream options
            this.populateStreamOptions();
            
            // Set up event listeners
            this.setupStreamListeners();
            this.setupFilterListeners();
            
            // Show initial state
            this.updateActivityDisplay();
        } catch (error) {
            console.error('Error initializing activity selection:', error);
        }
    }

    populateStreamOptions() {
        const streamOptions = document.querySelector('.stream-options');
        streamOptions.innerHTML = '';

        // Add "All Streams" option
        const allStreamsLabel = document.createElement('label');
        allStreamsLabel.className = 'stream-option';
        allStreamsLabel.innerHTML = `
            <input type="checkbox" name="stream" value="all">
            <span class="stream-name">All Streams</span>
            <div class="tooltip">Select activities from all available work streams</div>
        `;
        streamOptions.appendChild(allStreamsLabel);
        
        // Add individual stream options with tooltips
        Object.entries(this.streams.streams).forEach(([streamId, stream]) => {
            const label = document.createElement('label');
            label.className = 'stream-option';
            label.innerHTML = `
                <input type="checkbox" name="stream" value="${streamId}">
                <span class="stream-name">${stream.name}</span>
                <div class="tooltip">
                    <strong>${stream.name}</strong><br>
                    ${stream.description}<br>
                    <strong>Examples:</strong><br>
                    ${stream.examples ? stream.examples.join('<br>') : 'No specific examples available'}
                </div>
            `;
            streamOptions.appendChild(label);
        });
    }

    setupStreamListeners() {
        const streamOptions = document.querySelector('.stream-options');
        streamOptions.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                const value = e.target.value;
                
                // Handle "All Streams" selection
                if (value === 'all') {
                    const allStreamsCheckbox = e.target;
                    const otherCheckboxes = streamOptions.querySelectorAll('input[type="checkbox"]:not([value="all"])');
                    
                    // If "All Streams" is checked, uncheck all others
                    if (allStreamsCheckbox.checked) {
                        otherCheckboxes.forEach(checkbox => checkbox.checked = false);
                        this.selectedStreams.clear();
                        this.selectedStreams.add('all');
                    } else {
                        this.selectedStreams.delete('all');
                    }
                } else {
                    // If any other stream is checked, uncheck "All Streams"
                    const allStreamsCheckbox = streamOptions.querySelector('input[value="all"]');
                    if (allStreamsCheckbox) {
                        allStreamsCheckbox.checked = false;
                        this.selectedStreams.delete('all');
                    }
                    
                    // Handle individual stream selection
                    if (e.target.checked) {
                        this.selectedStreams.add(value);
                    } else {
                        this.selectedStreams.delete(value);
                    }
                }
                
                this.updateActivityDisplay();
            }
        });
    }

    setupFilterListeners() {
        const levelFilter = document.getElementById('levelFilter');
        const frequencyFilter = document.getElementById('frequencyFilter');

        // Dynamically populate level filter options
        const levels = this.getUniqueLevels();
        levelFilter.innerHTML = '<option value="all">All Levels</option>';
        levels.forEach(level => {
            const option = document.createElement('option');
            option.value = level.toLowerCase();
            option.textContent = `Level ${level.replace('CW', '')}`;
            levelFilter.appendChild(option);
        });

        levelFilter.addEventListener('change', () => this.updateActivityDisplay());
        frequencyFilter.addEventListener('change', () => this.updateActivityDisplay());
    }

    getUniqueLevels() {
        const levels = new Set();
        Object.values(this.streams.streams).forEach(stream => {
            Object.values(stream.levels).forEach(levelGroup => {
                levelGroup.activities.forEach(activity => {
                    levels.add(activity.level);
                });
            });
        });
        return Array.from(levels).sort((a, b) => {
            const aNum = parseInt(a.replace('CW', ''));
            const bNum = parseInt(b.replace('CW', ''));
            return aNum - bNum;
        });
    }

    updateActivityDisplay() {
        // Show/hide activity selection based on stream selection
        this.activitySelection.style.display = this.selectedStreams.size > 0 ? 'block' : 'none';
        
        // Clear current display
        this.activityGrid.innerHTML = '';
        
        // Get filtered activities
        const activities = this.getFilteredActivities();
        
        // Display activities
        activities.forEach(activity => {
            const card = this.createActivityCard(activity);
            this.activityGrid.appendChild(card);
        });
        
        // Update summary
        this.updateSummary();
    }

    getFilteredActivities() {
        const levelFilter = document.getElementById('levelFilter').value;
        const frequencyFilter = document.getElementById('frequencyFilter').value;
        
        let activities = [];
        
        // Get activities from selected streams
        if (this.selectedStreams.has('all')) {
            // If "All Streams" is selected, get activities from all streams
            Object.values(this.streams.streams).forEach(stream => {
                Object.values(stream.levels).forEach(level => {
                    activities = activities.concat(level.activities);
                });
            });
        } else {
            // Get activities from selected individual streams
            this.selectedStreams.forEach(streamId => {
                const stream = this.streams.streams[streamId];
                if (stream) {
                    Object.values(stream.levels).forEach(level => {
                        activities = activities.concat(level.activities);
                    });
                }
            });
        }
        
        // Apply filters
        if (levelFilter !== 'all') {
            activities = activities.filter(activity => {
                const level = activity.level;
                return level.toLowerCase() === levelFilter;
            });
        }
        
        return activities;
    }

    createActivityCard(activity) {
        const card = document.createElement('div');
        card.className = 'activity-card';
        if (this.selectedActivities.has(activity.id)) {
            card.classList.add('selected');
        }
        
        const frequency = this.selectedActivities.get(activity.id)?.frequency || 'none';
        
        card.innerHTML = `
            <div class="activity-title">${activity.name}</div>
            <div class="activity-description">${activity.description}</div>
            <div class="activity-tasks">
                <strong>Indicative Tasks:</strong>
                <ul>
                    ${activity.indicative_tasks.map(task => `<li>${task}</li>`).join('')}
                </ul>
            </div>
            <div class="activity-meta">
                <span class="activity-level">Level ${activity.level.replace('CW', '')}</span>
                <div class="activity-frequency">
                    <button class="frequency-btn ${frequency === 'daily' ? 'active' : ''}" data-frequency="daily">Daily</button>
                    <button class="frequency-btn ${frequency === 'weekly' ? 'active' : ''}" data-frequency="weekly">Weekly</button>
                    <button class="frequency-btn ${frequency === 'monthly' ? 'active' : ''}" data-frequency="monthly">Monthly</button>
                </div>
            </div>
        `;
        
        // Add event listeners
        const frequencyButtons = card.querySelectorAll('.frequency-btn');
        frequencyButtons.forEach(button => {
            button.addEventListener('click', () => {
                const newFrequency = button.dataset.frequency;
                this.toggleActivityFrequency(activity, newFrequency);
            });
        });
        
        return card;
    }

    toggleActivityFrequency(activity, frequency) {
        // Get the clicked button and its current state
        const clickedButton = event.target;
        const isCurrentlyActive = clickedButton.classList.contains('active');
        
        // Remove active class from all buttons in this card
        const card = clickedButton.closest('.activity-card');
        card.querySelectorAll('.frequency-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // If the button was already active, deselect it
        if (isCurrentlyActive) {
            this.selectedActivities.delete(activity.id);
        } else {
            // Add active class to clicked button
            clickedButton.classList.add('active');
            this.selectedActivities.set(activity.id, {
                ...activity,
                frequency
            });
        }
        
        // Update the selected activities list
        this.updateSelectedActivitiesList();
        // Update the activity display
        this.updateActivityDisplay();
    }

    updateSelectedActivitiesList() {
        const selectedActivitiesList = document.getElementById('selectedActivities');
        selectedActivitiesList.innerHTML = '';
        
        // Group activities by frequency
        const activitiesByFrequency = {
            daily: [],
            weekly: [],
            monthly: []
        };
        
        this.selectedActivities.forEach(activity => {
            activitiesByFrequency[activity.frequency].push(activity);
        });
        
        // Create sections for each frequency
        Object.entries(activitiesByFrequency).forEach(([frequency, activities]) => {
            if (activities.length > 0) {
                const section = document.createElement('div');
                section.className = 'frequency-section';
                section.innerHTML = `
                    <h4>${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Activities</h4>
                    <ul>
                        ${activities.map(activity => `
                            <li>
                                <span class="activity-name">${activity.name}</span>
                                <span class="activity-level">Level ${activity.level.replace('CW', '')}</span>
                            </li>
                        `).join('')}
                    </ul>
                `;
                selectedActivitiesList.appendChild(section);
            }
        });
    }

    updateSummary() {
        const totalActivities = this.selectedActivities.size;
        document.getElementById('totalActivities').textContent = totalActivities;
        
        if (totalActivities > 0) {
            const classification = this.calculateClassification();
            document.getElementById('primaryLevel').textContent = classification.primaryLevel;
            document.getElementById('confidenceScore').textContent = 
                `${Math.round(classification.confidenceScore * 100)}%`;
            
            // Update level breakdown
            const levelBreakdown = document.getElementById('levelBreakdown');
            levelBreakdown.innerHTML = classification.levelBreakdown
                .map(breakdown => `
                    <div class="level-stat">
                        <span class="level-name">${breakdown.level}</span>
                        <div class="level-bar">
                            <div class="level-fill" style="width: ${breakdown.score * 100}%"></div>
                        </div>
                        <span class="level-score">${Math.round(breakdown.score * 100)}%</span>
                    </div>
                `).join('');
        } else {
            document.getElementById('primaryLevel').textContent = '-';
            document.getElementById('confidenceScore').textContent = '0%';
            document.getElementById('levelBreakdown').innerHTML = '';
        }
    }

    calculateClassification() {
        if (this.selectedActivities.size === 0) {
            return {
                primaryLevel: '-',
                confidenceScore: 0,
                levelBreakdown: []
            };
        }
        
        // Group activities by level
        const activitiesByLevel = new Map();
        this.selectedActivities.forEach(activity => {
            const level = activity.level;
            if (!activitiesByLevel.has(level)) {
                activitiesByLevel.set(level, []);
            }
            activitiesByLevel.get(level).push(activity);
        });
        
        // Calculate weighted scores for each level
        const levelScores = new Map();
        activitiesByLevel.forEach((activities, level) => {
            let score = 0;
            activities.forEach(activity => {
                const frequencyMultiplier = this.getFrequencyMultiplier(activity.frequency);
                score += activity.points * frequencyMultiplier;
            });
            levelScores.set(level, score);
        });
        
        // Find primary level (highest score)
        let primaryLevel = 'CW1';
        let maxScore = 0;
        levelScores.forEach((score, level) => {
            if (score > maxScore) {
                maxScore = score;
                primaryLevel = level;
            }
        });
        
        // Calculate confidence score and level breakdown
        const totalScore = Array.from(levelScores.values()).reduce((a, b) => a + b, 0);
        const confidenceScore = maxScore / totalScore;
        
        // Get sorted levels from the data
        const levels = this.getUniqueLevels();
        
        const levelBreakdown = Array.from(levelScores.entries())
            .map(([level, score]) => ({
                level,
                score: score / totalScore
            }))
            .sort((a, b) => levels.indexOf(a.level) - levels.indexOf(b.level));
        
        return {
            primaryLevel,
            confidenceScore,
            levelBreakdown
        };
    }

    getFrequencyMultiplier(frequency) {
        switch (frequency) {
            case 'daily':
                return 1.0;
            case 'weekly':
                return 0.7;
            case 'monthly':
                return 0.4;
            default:
                return 0;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ActivitySelection();
}); 