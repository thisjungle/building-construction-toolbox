// Award Primer JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initEmojis();
    initAwardPrimer();
});

function initEmojis() {
    // Apply emojis from configuration
    document.querySelectorAll('[class^="emoji-"]').forEach(element => {
        const emojiKey = element.className.replace('emoji-', '').toUpperCase();
        if (APP_EMOJIS[emojiKey]) {
            element.textContent = APP_EMOJIS[emojiKey];
        }
    });
}

function initAwardPrimer() {
    // Initialize quick links smooth scrolling
    document.querySelectorAll('.quick-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Initialize level details buttons
    document.querySelectorAll('.btn-level-details').forEach(button => {
        button.addEventListener('click', () => {
            const level = button.closest('.level-card').dataset.level;
            showLevelDetails(level);
        });
    });
}

function showLevelDetails(level) {
    const modal = document.getElementById('detailsModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    
    modalTitle.innerHTML = `<span class="section-emoji">📊</span> CW${level} Classification Details`;
    
    // Get the content from the classifications case in showDetails
    const content = document.querySelector(`#classifications .modal-content`).innerHTML;
    const sections = content.split('<div class="modal-section">');
    const levelSection = sections[level];
    
    if (levelSection) {
        modalContent.innerHTML = `<div class="modal-section">${levelSection}`;
    } else {
        modalContent.innerHTML = '<p>Details not available for this level.</p>';
    }
    
    openModal('detailsModal');
}

// Add highlight animation to CSS
const style = document.createElement('style');
style.textContent = `
@keyframes highlight {
    0% { background-color: var(--gray-100); }
    100% { background-color: white; }
}
`;
document.head.appendChild(style); 