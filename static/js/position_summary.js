// Position Summary and Results Panel Logic

// Helper function to get suitable levels for each experience level
function getSuitableLevels(experienceId) {
    const levelMap = {
        'entry': ['CW1', 'CW2'],
        'intermediate': ['CW3', 'CW4'],
        'experienced': ['CW5', 'CW6'],
        'senior': ['CW7', 'CW8']
    };
    return levelMap[experienceId] || [];
}

// Helper function to calculate classification levels
function calculateClassificationLevels() {
    const levels = {
        'CW1-CW2': { count: 0, reasons: [], impacts: [] },
        'CW3-CW4': { count: 0, reasons: [], impacts: [] },
        'CW5-CW6': { count: 0, reasons: [], impacts: [] },
        'CW7-CW8': { count: 0, reasons: [], impacts: [] }
    };

    // Employment type impact
    if (selectedEmploymentType) {
        const employmentPoints = selectedEmploymentType.points;
        if (employmentPoints >= 3) {
            levels['CW7-CW8'].count++;
            levels['CW7-CW8'].reasons.push('Employment type indicates senior level');
            levels['CW7-CW8'].impacts.push('High points from employment type');
        } else if (employmentPoints >= 2) {
            levels['CW5-CW6'].count++;
            levels['CW5-CW6'].reasons.push('Employment type indicates experienced level');
            levels['CW5-CW6'].impacts.push('Moderate points from employment type');
        }
    }

    // Experience level impact
    if (selectedExperienceLevel) {
        const experiencePoints = selectedExperienceLevel.points;
        if (experiencePoints >= 3) {
            levels['CW7-CW8'].count++;
            levels['CW7-CW8'].reasons.push('Experience level indicates senior level');
            levels['CW7-CW8'].impacts.push('High points from experience level');
        } else if (experiencePoints >= 2) {
            levels['CW5-CW6'].count++;
            levels['CW5-CW6'].reasons.push('Experience level indicates experienced level');
            levels['CW5-CW6'].impacts.push('Moderate points from experience level');
        }
    }

    // Supervision level impact
    if (selectedSupervisionLevel) {
        const supervisionPoints = selectedSupervisionLevel.points;
        if (supervisionPoints >= 3) {
            levels['CW7-CW8'].count++;
            levels['CW7-CW8'].reasons.push('Supervision level indicates senior level');
            levels['CW7-CW8'].impacts.push('High points from supervision level');
        } else if (supervisionPoints >= 2) {
            levels['CW5-CW6'].count++;
            levels['CW5-CW6'].reasons.push('Supervision level indicates experienced level');
            levels['CW5-CW6'].impacts.push('Moderate points from supervision level');
        }
    }

    // Autonomy level impact
    if (selectedAutonomyLevel) {
        const autonomyPoints = selectedAutonomyLevel.points;
        if (autonomyPoints >= 3) {
            levels['CW7-CW8'].count++;
            levels['CW7-CW8'].reasons.push('Autonomy level indicates senior level');
            levels['CW7-CW8'].impacts.push('High points from autonomy level');
        } else if (autonomyPoints >= 2) {
            levels['CW5-CW6'].count++;
            levels['CW5-CW6'].reasons.push('Autonomy level indicates experienced level');
            levels['CW5-CW6'].impacts.push('Moderate points from autonomy level');
        }
    }

    // Work streams impact
    if (selectedStreams.size > 0) {
        levels['CW5-CW6'].count++;
        levels['CW5-CW6'].reasons.push('Multiple work streams selected');
        levels['CW5-CW6'].impacts.push('Complex role with multiple responsibilities');
    }

    // Activities impact
    if (selectedActivities.size > 0) {
        levels['CW5-CW6'].count++;
        levels['CW5-CW6'].reasons.push('Multiple activities selected');
        levels['CW5-CW6'].impacts.push('Diverse range of activities');
    }

    // Tasks impact
    if (selectedTasks.size > 0) {
        levels['CW5-CW6'].count++;
        levels['CW5-CW6'].reasons.push('Multiple specific tasks selected');
        levels['CW5-CW6'].impacts.push('Complex task requirements');
    }

    // Calculate confidence scores
    Object.keys(levels).forEach(level => {
        const levelData = levels[level];
        levelData.confidence = Math.min(100, (levelData.count / 4) * 100);
    });

    return levels;
}

// Function to update the results panel
function updateResults() {
    const resultsPanel = document.getElementById('resultsPanel');
    const levelInfo = document.getElementById('levelInfo');
    const descriptionText = document.getElementById('descriptionText');
    const selectedItems = document.getElementById('selectedItems');
    
    if (!resultsPanel || !levelInfo || !descriptionText || !selectedItems) {
        console.error('Required elements not found');
        return;
    }

    // Check if all required selections are made
    const allSelectionsComplete = selectedEmploymentType && 
                                 selectedExperienceLevel && 
                                 selectedStreams.size > 0 && 
                                 selectedActivities.size > 0 && 
                                 selectedTasks.size > 0 && 
                                 selectedSupervisionLevel && 
                                 selectedAutonomyLevel;

    // Update classification display
    if (allSelectionsComplete) {
        const classificationLevels = calculateClassificationLevels();
        const primaryLevel = Object.entries(classificationLevels)
            .sort(([, a], [, b]) => b.count - a.count)[0];
        
        const classificationHtml = `
            <div class="classification-results">
                <div class="classification-header">
                    <h3>Classification Results</h3>
                    <div class="level-badge">${primaryLevel[0]}</div>
                </div>
                <div class="confidence-indicator">
                    <div class="confidence-bar" style="width: ${primaryLevel[1].confidence}%"></div>
                    <span class="confidence-text">${Math.round(primaryLevel[1].confidence)}% Confidence</span>
                </div>
                <div class="classification-details">
                    <div class="detail-section">
                        <h4>Classification Reasons</h4>
                        <ul>
                            ${primaryLevel[1].reasons.map(reason => `<li>${reason}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="detail-section">
                        <h4>Impact on Classification</h4>
                        <ul>
                            ${primaryLevel[1].impacts.map(impact => `<li>${impact}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;
        levelInfo.innerHTML = classificationHtml;
        levelInfo.style.display = 'block';
    } else {
        levelInfo.style.display = 'none';
    }

    // Build description text
    let description = '';
    if (selectedEmploymentType) {
        description += `${selectedEmploymentType.name} position`;
    }
    if (selectedExperienceLevel) {
        description += ` requiring ${selectedExperienceLevel.name.toLowerCase()} level experience`;
    }
    if (selectedStreams.size > 0) {
        description += ` in ${Array.from(selectedStreams).join(', ')}`;
    }
    if (selectedActivities.size > 0) {
        description += ` with responsibilities in ${Array.from(selectedActivities).join(', ')}`;
    }
    if (selectedTasks.size > 0) {
        description += ` including ${Array.from(selectedTasks).join(', ')}`;
    }
    if (selectedSupervisionLevel) {
        description += ` under ${selectedSupervisionLevel.name.toLowerCase()} supervision`;
    }
    if (selectedAutonomyLevel) {
        description += ` with ${selectedAutonomyLevel.name.toLowerCase()} autonomy`;
    }
    descriptionText.textContent = description;

    // Update selected items display
    let selectedItemsHtml = '';
    
    // Employment and Experience
    if (selectedEmploymentType && selectedExperienceLevel) {
        selectedItemsHtml += `
            <div class="pill-section">
                <div class="badge-item employment">${selectedEmploymentType.name}</div>
                <div class="badge-item experience">${selectedExperienceLevel.name}</div>
            </div>
        `;
    }

    // Work Streams
    if (selectedStreams.size > 0) {
        selectedItemsHtml += `
            <div class="pill-section">
                ${Array.from(selectedStreams).map(stream => 
                    `<div class="badge-item stream">${stream}</div>`
                ).join('')}
            </div>
        `;
    }

    // Activities
    if (selectedActivities.size > 0) {
        selectedItemsHtml += `
            <div class="pill-section">
                ${Array.from(selectedActivities).map(activity => 
                    `<div class="badge-item activity">${activity}</div>`
                ).join('')}
            </div>
        `;
    }

    // Tasks
    if (selectedTasks.size > 0) {
        selectedItemsHtml += `
            <div class="pill-section">
                ${Array.from(selectedTasks).sort().map(task => 
                    `<div class="badge-item task">${task}</div>`
                ).join('')}
            </div>
        `;
    }

    // Supervision and Autonomy
    if (selectedSupervisionLevel && selectedAutonomyLevel) {
        selectedItemsHtml += `
            <div class="pill-section">
                <div class="badge-item supervision">${selectedSupervisionLevel.name}</div>
                <div class="badge-item autonomy">${selectedAutonomyLevel.name}</div>
            </div>
        `;
    }

    selectedItems.innerHTML = selectedItemsHtml;
}

// Function to update completion status
function updateCompletionStatus() {
    const completionStatus = document.getElementById('completionStatus');
    if (!completionStatus) return;

    const requiredSelections = [
        { name: 'Employment Type', selected: !!selectedEmploymentType },
        { name: 'Experience Level', selected: !!selectedExperienceLevel },
        { name: 'Work Streams', selected: selectedStreams.size > 0 },
        { name: 'Job Duties', selected: selectedActivities.size > 0 },
        { name: 'Specific Tasks', selected: selectedTasks.size > 0 },
        { name: 'Supervision Level', selected: !!selectedSupervisionLevel },
        { name: 'Autonomy Level', selected: !!selectedAutonomyLevel }
    ];

    const completedSelections = requiredSelections.filter(s => s.selected).length;
    const totalSelections = requiredSelections.length;
    const percentage = Math.round((completedSelections / totalSelections) * 100);

    completionStatus.innerHTML = `
        <div class="completion-header">
            <h3>Position Details Progress</h3>
            <div class="completion-percentage">${percentage}% Complete</div>
        </div>
        <div class="completion-bar">
            <div class="completion-progress" style="width: ${percentage}%"></div>
        </div>
        <div class="completion-details">
            <div class="completed-items">
                <h4>Completed</h4>
                <ul>
                    ${requiredSelections.filter(s => s.selected)
                        .map(s => `<li>${s.name}</li>`)
                        .join('')}
                </ul>
            </div>
            <div class="remaining-items">
                <h4>Remaining</h4>
                <ul>
                    ${requiredSelections.filter(s => !s.selected)
                        .map(s => `<li>${s.name}</li>`)
                        .join('')}
                </ul>
            </div>
        </div>
    `;
} 