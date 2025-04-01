// Home page specific JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize components
    initEmojis();
    initModals();
    initNavigation();
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

function initModals() {
    // Help modal
    const helpBtn = document.getElementById('showHelpBtn');
    const helpModal = document.getElementById('helpModal');
    const helpModalClose = helpModal?.querySelector('.modal-close');

    // Coming Soon Modal
    const comingSoonModal = document.getElementById('comingSoonModal');
    const showHumanBtn = document.getElementById('showHumanBtn');
    const closeComingSoonBtn = comingSoonModal?.querySelector('.modal-close');

    // Help modal handlers
    if (helpBtn && helpModal) {
        helpBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(helpModal);
        });
    }

    if (helpModalClose) {
        helpModalClose.addEventListener('click', () => closeModal(helpModal));
    }

    // Coming Soon modal handlers
    if (showHumanBtn && comingSoonModal) {
        showHumanBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(comingSoonModal);
        });
    }

    if (closeComingSoonBtn) {
        closeComingSoonBtn.addEventListener('click', () => closeModal(comingSoonModal));
    }

    // Close modals on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (helpModal) closeModal(helpModal);
            if (comingSoonModal) closeModal(comingSoonModal);
        }
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === helpModal) closeModal(helpModal);
        if (e.target === comingSoonModal) closeModal(comingSoonModal);
    });
}

function openModal(modal) {
    if (!modal) return;
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

function initNavigation() {
    // Handle back button navigation
    const backBtn = document.getElementById('homeBackBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = '/';
        });
    }
} 