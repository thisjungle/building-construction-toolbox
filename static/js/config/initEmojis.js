// Global emoji initialization
function initEmojis() {
    // Initialize all elements with data-emoji attribute
    document.querySelectorAll('[data-emoji]').forEach(element => {
        const emojiKey = element.getAttribute('data-emoji');
        if (window.APP_EMOJIS && window.APP_EMOJIS[emojiKey]) {
            element.textContent = window.APP_EMOJIS[emojiKey];
        }
    });
}

// Initialize emojis when DOM is loaded
document.addEventListener('DOMContentLoaded', initEmojis);

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initEmojis };
} 