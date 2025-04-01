// Global stream filter functionality
document.addEventListener('DOMContentLoaded', function() {
    const streamFilter = document.getElementById('globalStreamFilter');
    
    // Load saved selection
    const savedStream = localStorage.getItem('selectedStream');
    if (savedStream) {
        streamFilter.value = savedStream;
        // Trigger the appropriate filtering based on current page
        handleStreamFilter(savedStream);
    }
    
    // Save selection on change
    streamFilter.addEventListener('change', function() {
        const selectedStream = this.value;
        localStorage.setItem('selectedStream', selectedStream);
        handleStreamFilter(selectedStream);
    });
});

function handleStreamFilter(stream) {
    // Check current page and apply appropriate filtering
    if (window.location.pathname === '/search') {
        // Search page filtering
        handleSearch();
    } else if (window.location.pathname === '/progression2') {
        // Progression page filtering
        filterRolesByStream(stream);
        updateRoleCounts();
    }
}

// Make these functions available globally
window.filterRolesByStream = function(stream) {
    const roleCards = document.querySelectorAll('.role-card');
    roleCards.forEach(card => {
        if (stream === 'all' || card.dataset.stream === stream) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

window.updateRoleCounts = function() {
    const levelContents = document.querySelectorAll('.level-content');
    if (levelContents.length) { // Only on progression page
        levelContents.forEach((content, levelIndex) => {
            const visibleRoles = content.querySelectorAll('.role-card[style="display: block"]').length;
            const levelItem = document.querySelector(`.level-item[data-level="${levelIndex}"] .role-count`);
            if (levelItem) {
                levelItem.textContent = `${visibleRoles} roles`;
            }
        });
    }
} 