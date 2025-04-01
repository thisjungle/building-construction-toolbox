// Search functionality
document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM elements
    const searchInput = document.getElementById('searchInput');
    const rolesList = document.getElementById('rolesList');
    const totalRolesSpan = document.getElementById('totalRoles');
    
    /**
     * Highlights matching text in the given element
     * @param {Element} card - The card element to highlight text in
     * @param {string} searchText - The text to highlight
     */
    function highlightMatches(card, searchText) {
        if (searchText.length < 4) return;
        
        // Get all elements that might contain matching text
        const elements = [
            ...card.querySelectorAll('h2'),
            ...card.querySelectorAll('.task-pill'),
            ...card.querySelectorAll('.task-item')
        ];

        elements.forEach(element => {
            const text = element.textContent;
            const regex = new RegExp(`(${searchText})`, 'gi');
            element.innerHTML = text.replace(regex, '<span class="highlight">$1</span>');
        });
    }

    /**
     * Removes highlights from a card
     * @param {Element} card - The card to remove highlights from
     */
    function removeHighlights(card) {
        const highlights = card.querySelectorAll('.highlight');
        highlights.forEach(highlight => {
            const parent = highlight.parentNode;
            parent.textContent = parent.textContent;
        });
    }
    
    /**
     * Filters and displays roles based on search text and selected streams
     */
    function filterRoles() {
        if (!totalRolesSpan) return;
        
        const searchText = searchInput.value.toLowerCase();
        const selectedStreams = JSON.parse(localStorage.getItem('selectedStreams')) || ['all'];
        const cards = document.querySelectorAll('.role-card');
        let visibleCount = 0;

        cards.forEach(card => {
            const cardStream = card.getAttribute('data-stream');
            const cardText = card.textContent.toLowerCase();
            const streamMatch = selectedStreams.includes('all') || selectedStreams.includes(cardStream);
            const searchMatch = searchText.length < 4 || cardText.includes(searchText);

            // Remove existing highlights
            removeHighlights(card);

            if (streamMatch && searchMatch) {
                card.style.display = 'block';
                // Add highlights if search term is present
                if (searchText.length >= 4) {
                    highlightMatches(card, searchText);
                }
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        totalRolesSpan.textContent = visibleCount;
    }

    // Initial filter on page load
    filterRoles();

    // Event listeners
    if (searchInput) {
        searchInput.addEventListener('input', filterRoles);
    }

    // Listen for stream selection changes from settings
    document.addEventListener('streamsUpdated', function(e) {
        filterRoles();
    });

    // Card expansion
    document.addEventListener('click', function(e) {
        const card = e.target.closest('.role-card');
        if (card && !e.target.classList.contains('close-card')) {
            const details = card.querySelector('.card-details');
            const emojiIcons = card.querySelector('.emoji-icons');
            const closeBtn = card.querySelector('.close-card');
            
            if (details) {
                const isExpanding = details.classList.contains('hidden');
                details.classList.toggle('hidden');
                if (emojiIcons) {
                    emojiIcons.classList.toggle('hidden');
                }
                if (closeBtn) {
                    closeBtn.classList.toggle('hidden', !isExpanding);
                }
            }
        }
    });

    // Close button handler
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('close-card')) {
            const card = e.target.closest('.role-card');
            if (card) {
                const details = card.querySelector('.card-details');
                const emojiIcons = card.querySelector('.emoji-icons');
                const closeBtn = card.querySelector('.close-card');
                
                if (details) {
                    details.classList.add('hidden');
                    if (emojiIcons) {
                        emojiIcons.classList.add('hidden');
                    }
                    if (closeBtn) {
                        closeBtn.classList.add('hidden');
                    }
                }
            }
        }
    });
});

async function loadAllRoles() {
    try {
        const [rolesResponse, tasksResponse, skillsResponse, qualsResponse, ratesResponse] = await Promise.all([
            fetch('/data/broadband.json'),
            fetch('/data/indicative_tasks.json'),
            fetch('/data/skills_and_duties.json'),
            fetch('/data/qualifications.json'),
            fetch('/data/minimum_rates.json')
        ]);

        const rolesData = await rolesResponse.json();
        const tasks = await tasksResponse.json();
        const skills = await skillsResponse.json();
        const quals = await qualsResponse.json();
        const rates = await ratesResponse.json();

        // Store data globally
        window.minimum_rates = rates.minimum_rates;
        window.indicative_tasks = tasks;
        window.skills_and_duties = skills;
        window.qualifications = quals;

        // Transform roles and combine with other data
        const roles = transformRolesData(rolesData);
        const results = roles.map(role => ({
            ...role,
            tasks: tasks.Indicative_Tasks[role.stream][role.title] || [],
            skills: skills.Skills_and_Duties[role.stream][role.title] || [],
            qualifications: quals.Qualifications[role.stream][role.title] || []
        }));

        displaySearchResults(results);
    } catch (error) {
        console.error('Error loading roles:', error);
        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            searchResults.innerHTML = '<div class="error">Error loading roles</div>';
        }
    }
}

function transformRolesData(rolesData) {
    const roles = [];
    const classifications = rolesData.Broadbanded_Classifications;
    
    Object.entries(classifications).forEach(([stream, streamData]) => {
        if (stream === 'Engineering Construction') {
            Object.entries(streamData).forEach(([subStream, subStreamData]) => {
                Object.entries(subStreamData).forEach(([level, titles]) => {
                    titles.forEach(title => {
                        roles.push({
                            title,
                            stream,
                            sub_stream: subStream,
                            level: parseInt(level.split('_')[1])
                        });
                    });
                });
            });
        } else {
            Object.entries(streamData).forEach(([level, titles]) => {
                titles.forEach(title => {
                    roles.push({
                        title,
                        stream,
                        level: parseInt(level.split('_')[1])
                    });
                });
            });
        }
    });
    return roles;
}

function displaySearchResults(results) {
    const searchResults = document.getElementById('searchResults');
    if (!searchResults) return;

    const searchInput = document.querySelector('.search-input');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const displayResults = results.map(role => {
        // Get pay rates
        const payKey = `CW/ECW ${role.level}`;
        const payRate = window.minimum_rates ? window.minimum_rates[payKey] : null;
        const weeklyRate = payRate ? payRate.weekly_rate : 'N/A';
        const hourlyRate = payRate ? payRate.hourly_rate : 'N/A';

        // Get stream emoji
        const streamEmoji = getStreamEmoji(role.stream, role.sub_stream);

        return `
            <div class="card">
                <h2>${role.title}</h2>
                <div class="level-info">Level ${role.level} - Construction Worker • $${weeklyRate} per week ($${hourlyRate}/hr)</div>
                <div class="stream-info">${streamEmoji} ${getStreamName(role.stream, role.sub_stream)}</div>
                <div class="task-pills">
                    ${role.tasks.map(task => `<span class="task-pill">${highlightText(task, searchTerm)}</span>`).join('')}
                </div>
                <div class="card-actions hidden">
                    <button class="action-btn">📋</button>
                    <button class="action-btn">💼</button>
                    <button class="action-btn expand-btn">▼</button>
                </div>
                <div class="expandable-content hidden">
                    <div class="section">
                        <h3>Skills & Duties</h3>
                        <ul class="bullet-list">
                            ${role.skills.map(skill => `<li>${highlightText(skill, searchTerm)}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="section">
                        <h3>Qualifications</h3>
                        <ul class="bullet-list">
                            ${role.qualifications.map(qual => `<li>${highlightText(qual, searchTerm)}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    searchResults.innerHTML = displayResults;

    // Add click handlers for cards
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => {
            const content = card.querySelector('.expandable-content');
            const actions = card.querySelector('.card-actions');
            content.classList.toggle('hidden');
            actions.classList.toggle('hidden');
        });
    });

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .card {
            cursor: pointer;
            padding: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            margin-bottom: 16px;
            background: white;
        }
        .level-info {
            color: #666;
            margin: 12px 0;
        }
        .stream-info {
            margin: 12px 0;
            color: #666;
        }
        .task-pills {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 12px;
        }
        .task-pill {
            background: #f5f5f5;
            padding: 6px 12px;
            border-radius: 16px;
            font-size: 14px;
            color: #666;
        }
        .card-actions {
            display: flex;
            gap: 8px;
            margin: 12px 0;
        }
        .action-btn {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1.2em;
            padding: 4px;
        }
        .expandable-content {
            margin-top: 16px;
        }
        .hidden {
            display: none;
        }
        .bullet-list {
            list-style-type: disc;
            padding-left: 20px;
            color: #666;
        }
        .bullet-list li {
            margin: 4px 0;
        }
    `;
    document.head.appendChild(style);
}

function getStreamEmoji(stream, subStream) {
    const streamEmojis = {
        'general_construction': '🏢',
        'civil_construction': '🏗️',
        'engineering_construction': {
            'electrical_electronic': '⚡',
            'mechanical': '⚙️',
            'fabrication': '🔧'
        }
    };
    
    if (subStream && streamEmojis[stream] && typeof streamEmojis[stream] === 'object') {
        return streamEmojis[stream][subStream] || '🏗️';
    }
    return streamEmojis[stream] || '🏗️';
}

function getStreamName(stream, subStream) {
    const streamNames = {
        'general_construction': 'General Construction',
        'civil_construction': 'Civil Construction',
        'engineering_construction': {
            'electrical_electronic': 'Electrical/Electronic',
            'mechanical': 'Mechanical',
            'fabrication': 'Fabrication'
        }
    };
    
    if (subStream && streamNames[stream] && typeof streamNames[stream] === 'object') {
        return streamNames[stream][subStream] || stream;
    }
    return streamNames[stream] || stream;
}

function highlightText(text, searchTerm) {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    const cards = document.querySelectorAll('.role-card.searchable');
    
    if (searchInput) {
        searchInput.value = '';
        
        // Remove all highlights and collapse cards
        cards.forEach(card => {
            // First, remove all highlight spans
            const highlights = card.querySelectorAll('.text-highlight');
            highlights.forEach(highlight => {
                const text = highlight.textContent;
                const textNode = document.createTextNode(text);
                highlight.parentNode.replaceChild(textNode, highlight);
            });
            
            // Then restore original text for each element
            const titleElement = card.querySelector('.role-title');
            if (titleElement) {
                titleElement.textContent = titleElement.textContent;
            }
            
            const taskElements = card.querySelectorAll('.searchable-task');
            taskElements.forEach(task => {
                task.textContent = task.textContent;
            });
            
            const qualElements = card.querySelectorAll('.section ul li');
            qualElements.forEach(qual => {
                qual.textContent = qual.textContent;
            });
            
            // Collapse card
            const details = card.querySelector('.card-details');
            if (details) {
                details.classList.add('hidden');
                card.classList.remove('expanded');
            }
            
            // Show the card
            card.style.display = '';
        });
        
        // Hide no results message
        const noResultsMessage = document.getElementById('noResults');
        if (noResultsMessage) {
            noResultsMessage.style.display = 'none';
        }
    }
}

function updateTotalCount(visibleCount) {
    const totalRoles = document.getElementById('totalRoles');
    if (totalRoles) {
        totalRoles.textContent = `Total roles: ${visibleCount}`;
    }
} 
 