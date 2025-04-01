document.addEventListener('DOMContentLoaded', function() {
    const levelSelect = document.getElementById('levelSelect');
    const nextLevelBtn = document.getElementById('nextLevelBtn');

    // UI Elements - Current Level
    const currentTitle = document.getElementById('currentTitle');
    const currentRole = document.getElementById('currentRole');
    const currentCost = document.getElementById('currentCost');
    const currentCapabilities = document.getElementById('currentCapabilities');
    const currentSkills = document.getElementById('currentSkills');

    // UI Elements - Next Level
    const nextTitle = document.getElementById('nextTitle');
    const nextRole = document.getElementById('nextRole');
    const costDifference = document.getElementById('costDifference');
    const newCapabilities = document.getElementById('newCapabilities');
    const requiredDevelopment = document.getElementById('requiredDevelopment');

    function updateLevelDisplay(currentLevelIndex) {
        const currentLevelData = CLASSIFICATIONS.levels[currentLevelIndex];
        const nextLevelData = CLASSIFICATIONS.levels[currentLevelIndex + 1];
        const hasNextLevel = currentLevelIndex < CLASSIFICATIONS.levels.length - 1;

        // Update Current Level
        currentTitle.textContent = currentLevelData.level;
        currentRole.textContent = currentLevelData.business_title;
        currentCost.textContent = `$${currentLevelData.pay.weekly_rate}`;

        // Update Current Capabilities
        currentCapabilities.innerHTML = currentLevelData.summary_tags.map(tag => `
            <div class="flex items-center space-x-2 text-gray-700">
                <span class="text-xl">${tag.icon}</span>
                <span>${tag.text}</span>
            </div>
        `).join('');

        // Update Current Skills
        currentSkills.innerHTML = currentLevelData.skills.map(skill => `
            <div class="bg-gray-50 rounded px-3 py-2 text-sm text-gray-700">
                ${skill}
            </div>
        `).join('');

        // Update Next Level (if available)
        if (hasNextLevel) {
            nextLevelBtn.style.display = 'block';
            const costDiff = (parseFloat(nextLevelData.pay.weekly_rate) - parseFloat(currentLevelData.pay.weekly_rate)).toFixed(2);
            
            nextTitle.textContent = nextLevelData.level;
            nextRole.textContent = nextLevelData.business_title;
            costDifference.textContent = `+$${costDiff}`;

            // Update New Capabilities
            newCapabilities.innerHTML = nextLevelData.summary_tags.map(tag => `
                <div class="flex items-center space-x-2 text-gray-700">
                    <span class="text-xl">${tag.icon}</span>
                    <span>${tag.text}</span>
                </div>
            `).join('');

            // Update Required Development
            requiredDevelopment.innerHTML = nextLevelData.qualifications.map(qual => `
                <div class="flex items-center space-x-2 text-gray-700">
                    <span class="text-green-500">✓</span>
                    <span>${qual}</span>
                </div>
            `).join('');

            // Show comparison panel
            document.querySelector('.grid.grid-cols-2').classList.remove('grid-cols-1');
            document.querySelector('.grid.grid-cols-2').classList.add('grid-cols-2');
        } else {
            nextLevelBtn.style.display = 'none';
            // Hide comparison panel
            document.querySelector('.grid.grid-cols-2').classList.remove('grid-cols-2');
            document.querySelector('.grid.grid-cols-2').classList.add('grid-cols-1');
        }
    }

    // Event Listeners
    levelSelect.addEventListener('change', function() {
        updateLevelDisplay(parseInt(this.value));
    });

    nextLevelBtn.addEventListener('click', function() {
        const currentIndex = parseInt(levelSelect.value);
        if (currentIndex < CLASSIFICATIONS.levels.length - 1) {
            levelSelect.value = currentIndex + 1;
            updateLevelDisplay(currentIndex + 1);
        }
    });

    // Initialize with first level
    updateLevelDisplay(0);
}); 