// Classification logic functions
function getClassificationGroup(responses) {
    // Entry Level Group (CW1_A to CW1_D)
    if (responses.experience === 'less_than_1_year' || 
        responses.qualifications === 'none') {
        return {
            group: 'entry_level',
            potentialLevels: ['CW1_A', 'CW1_B', 'CW1_C', 'CW1_D']
        };
    }

    // Intermediate Group (CW2-CW3)
    if (responses.experience === '1_to_2_years' || 
        responses.qualifications === 'cert_3') {
        return {
            group: 'intermediate',
            potentialLevels: ['CW2', 'CW3']
        };
    }

    // Advanced Group (CW4-CW5)
    if (responses.experience === '2_to_5_years' && 
        responses.workType === 'technical_work') {
        return {
            group: 'advanced',
            potentialLevels: ['CW4', 'CW5']
        };
    }

    // Senior Group (CW6-ECW9)
    if (responses.experience === 'over_5_years' && 
        responses.workType === 'specialized_work' &&
        responses.qualifications === 'advanced_cert') {
        return {
            group: 'senior',
            potentialLevels: ['CW6', 'CW7', 'CW8', 'ECW9']
        };
    }

    return null;
}

// Helper functions to get follow-up questions based on stream
function getStreamSpecificQuestions(stream) {
    const questions = {
        electrical_electronic: [
            {
                id: "technical_skills",
                text: "Which technical skills do you possess?",
                type: "multiple_select",
                options: [
                    {
                        value: "circuit_design",
                        label: "Circuit Design",
                        description: "Design and modify electrical circuits"
                    },
                    {
                        value: "plc_programming",
                        label: "PLC Programming",
                        description: "Program and configure PLCs"
                    },
                    // ... more options
                ]
            }
        ],
        mechanical: [
            // ... mechanical specific questions
        ],
        civil_construction: [
            // ... civil specific questions
        ]
    };

    return questions[stream] || [];
}

// Get level-specific follow-up questions
function getEntryLevelQuestions(responses) {
    const streamQuestions = getStreamSpecificQuestions(responses.streams);
    return [
        {
            id: "basic_skills",
            text: "Which basic skills have you developed?",
            type: "multiple_select",
            options: [
                {
                    value: "safety_procedures",
                    label: "Safety Procedures",
                    description: "Understanding and following safety protocols"
                },
                // ... more options
            ]
        },
        ...streamQuestions
    ];
}

// ... similar functions for other levels ...

// Classification level determination functions
function determineEntryLevel(responses, followUpResponses, streamDetails) {
    // CW1_A to CW1_D determination
    if (responses.experience === 'less_than_1_year') {
        if (responses.supervision === 'direct') {
            return {
                level: 'CW1_A',
                description: 'Entry level position requiring direct supervision'
            };
        } else if (responses.supervision === 'general') {
            return {
                level: 'CW1_B',
                description: 'Entry level with basic skill development'
            };
        }
    }

    return {
        level: 'CW1_C',
        description: 'Entry level with demonstrated competency'
    };
}

function determineIntermediateLevel(responses, followUpResponses, streamDetails) {
    // CW2-CW3 determination
    if (responses.experience === '1_to_2_years' && 
        responses.qualifications === 'cert_3') {
        if (responses.supervision === 'limited') {
            return {
                level: 'CW3',
                description: 'Intermediate level with independent work capability'
            };
        }
    }

    return {
        level: 'CW2',
        description: 'Intermediate level with developing technical skills'
    };
}

function determineAdvancedLevel(responses, followUpResponses, streamDetails) {
    // CW4-CW5 determination
    if (responses.experience === '2_to_5_years' && 
        responses.workType === 'technical_work') {
        if (responses.supervision === 'limited' && 
            responses.qualifications === 'advanced_cert') {
            return {
                level: 'CW5',
                description: 'Advanced level with specialized technical expertise'
            };
        }
    }

    return {
        level: 'CW4',
        description: 'Advanced level technical worker'
    };
}

function determineSeniorLevel(responses, followUpResponses, streamDetails) {
    // CW6-ECW9 determination
    if (responses.experience === 'over_5_years' && 
        responses.workType === 'specialized_work' &&
        responses.qualifications === 'advanced_cert') {
        
        if (responses.supervision === 'limited') {
            if (followUpResponses && followUpResponses.leadership_level) {
                switch(followUpResponses.leadership_level) {
                    case 'technical_director':
                        return {
                            level: 'ECW9',
                            description: 'Expert level with strategic technical leadership'
                        };
                    case 'project_director':
                        return {
                            level: 'CW8',
                            description: 'Senior level with project direction responsibilities'
                        };
                    case 'department_lead':
                        return {
                            level: 'CW7',
                            description: 'Senior level with departmental leadership'
                        };
                }
            }
        }
    }

    return {
        level: 'CW6',
        description: 'Senior technical specialist'
    };
}

function calculateInitialClassification(responses) {
    // Default classification if no specific group is determined
    return {
        level: 'CW1_A',
        description: 'Initial classification pending further assessment'
    };
}

function handleMultiSelectResponses(responses) {
    // Convert single values to arrays for multi-select questions
    const multiSelectFields = ['duties', 'qualifications', 'workType', 'supervision'];
    
    multiSelectFields.forEach(field => {
        if (responses[field] && !Array.isArray(responses[field])) {
            responses[field] = [responses[field]];
        }
    });
    
    return responses;
}

function calculateClassification(responses) {
    const group = getClassificationGroup(responses);
    if (!group) {
        return calculateInitialClassification(responses);
    }

    const streamDetails = window.ClassificationSystem.getStreamSpecificDetails(responses.streams);

    switch (group.group) {
        case 'entry_level':
            return window.ClassificationSystem.determineEntryLevel(responses, group.followUpResponses, streamDetails);
        case 'intermediate':
            return window.ClassificationSystem.determineIntermediateLevel(responses, group.followUpResponses, streamDetails);
        case 'advanced':
            return window.ClassificationSystem.determineAdvancedLevel(responses, group.followUpResponses, streamDetails);
        case 'senior':
            return window.ClassificationSystem.determineSeniorLevel(responses, group.followUpResponses, streamDetails);
        default:
            return calculateInitialClassification(responses);
    }
}

// Update the window.ClassificationSystem object
window.ClassificationSystem = {
    calculateClassification: calculateClassification,
    getClassificationGroup: getClassificationGroup
};

// Helper function to validate classification against duties
function validateClassificationWithDuties(classification, duties) {
    const dutyComplexityScores = {
        'control_systems': 3,
        'testing_commissioning': 3,
        'system_repair': 2,
        'preventive_maintenance': 2,
        'construction': 2,
        'site_preparation': 2,
        'electrical_installation': 1,
        'electronic_maintenance': 1,
        'equipment_maintenance': 1,
        'installation': 1,
        'maintenance': 1,
        'repairs': 1
    };

    // Calculate average complexity of selected duties
    const selectedDuties = duties || [];
    const complexityScore = selectedDuties.reduce((sum, duty) => {
        return sum + (dutyComplexityScores[duty] || 1);
    }, 0) / (selectedDuties.length || 1);

    // Adjust classification based on duty complexity
    if (complexityScore > 2.5 && !classification.level.startsWith('CW5')) {
        classification.level = 'CW5';
        classification.description += ' (adjusted for complex duties)';
    } else if (complexityScore > 1.5 && !classification.level.startsWith('CW3')) {
        classification.level = 'CW3';
        classification.description += ' (adjusted for technical duties)';
    }

    return classification;
}

// Export additional functions
window.validateClassificationWithDuties = validateClassificationWithDuties;

// Make functions globally available
window.ClassificationSystem = {
    determineEntryLevel: function(responses, followUpResponses, streamDetails) {
        if (responses.experience === 'less_than_1_year') {
            if (responses.supervision === 'direct') {
                return {
                    level: 'CW1_A',
                    description: 'Entry level position requiring direct supervision'
                };
            } else if (responses.supervision === 'general') {
                return {
                    level: 'CW1_B',
                    description: 'Entry level with basic skill development'
                };
            }
        }
        return {
            level: 'CW1_C',
            description: 'Entry level with demonstrated competency'
        };
    },

    determineIntermediateLevel: function(responses, followUpResponses, streamDetails) {
        if (responses.experience === '1_to_2_years' && 
            responses.qualifications === 'cert_3') {
            if (responses.supervision === 'limited') {
                return {
                    level: 'CW3',
                    description: 'Intermediate level with independent work capability'
                };
            }
        }
        return {
            level: 'CW2',
            description: 'Intermediate level with developing technical skills'
        };
    },

    determineAdvancedLevel: function(responses, followUpResponses, streamDetails) {
        if (responses.experience === '2_to_5_years' && 
            responses.workType === 'technical_work') {
            if (responses.supervision === 'limited' && 
                responses.qualifications === 'advanced_cert') {
                return {
                    level: 'CW5',
                    description: 'Advanced level with specialized technical expertise'
                };
            }
        }
        return {
            level: 'CW4',
            description: 'Advanced level technical worker'
        };
    },

    determineSeniorLevel: function(responses, followUpResponses, streamDetails) {
        if (responses.experience === 'over_5_years' && 
            responses.workType === 'specialized_work' &&
            responses.qualifications === 'advanced_cert') {
            
            if (responses.supervision === 'limited') {
                if (followUpResponses && followUpResponses.leadership_level) {
                    switch(followUpResponses.leadership_level) {
                        case 'technical_director':
                            return {
                                level: 'ECW9',
                                description: 'Expert level with strategic technical leadership'
                            };
                        case 'project_director':
                            return {
                                level: 'CW8',
                                description: 'Senior level with project direction responsibilities'
                            };
                        case 'department_lead':
                            return {
                                level: 'CW7',
                                description: 'Senior level with departmental leadership'
                            };
                    }
                }
            }
        }
        return {
            level: 'CW6',
            description: 'Senior technical specialist'
        };
    },

    calculateInitialClassification: function(responses) {
        return {
            level: 'CW1_A',
            description: 'Initial classification pending further assessment'
        };
    },

    getStreamSpecificDetails: function(stream) {
        const streamDetails = {
            'electrical_electronic': {
                duties: [
                    'Electrical system maintenance',
                    'Electronic equipment repair',
                    'Control system programming',
                    'Circuit testing and troubleshooting'
                ],
                qualifications: [
                    'Electrical license',
                    'Electronics certification',
                    'Control systems certification'
                ]
            },
            'mechanical': {
                duties: [
                    'Mechanical system maintenance',
                    'Equipment repair',
                    'Preventive maintenance',
                    'Mechanical troubleshooting'
                ],
                qualifications: [
                    'Mechanical trade certification',
                    'Equipment specific certifications',
                    'Preventive maintenance certification'
                ]
            },
            'civil_construction': {
                duties: [
                    'Construction work',
                    'Structure maintenance',
                    'Infrastructure repair',
                    'Site preparation'
                ],
                qualifications: [
                    'Construction certification',
                    'Safety certifications',
                    'Equipment operation licenses'
                ]
            }
        };

        return streamDetails[stream] || {
            duties: ['General duties'],
            qualifications: ['General qualifications']
        };
    }
};

// Export functions for use in main.js
window.getClassificationGroup = getClassificationGroup;
window.getStreamSpecificQuestions = getStreamSpecificQuestions; 