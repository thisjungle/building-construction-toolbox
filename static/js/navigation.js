// Navigation functionality
document.addEventListener('DOMContentLoaded', () => {
    const navTrigger = document.getElementById('navTrigger');
    const navMenu = document.querySelector('.nav-menu');
    const homeLink = document.querySelector('.home-link');

    // Set current page in navigation
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-menu a').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('current');
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        // Close menu on Escape key
        if (e.key === 'Escape' && navMenu.classList.contains('visible')) {
            navMenu.classList.remove('visible');
            navTrigger.focus();
        }
    });

    // Ensure menu closes when clicking outside
    document.addEventListener('click', (e) => {
        if (!homeLink.contains(e.target) && navMenu.classList.contains('visible')) {
            navMenu.classList.remove('visible');
        }
    });

    // Handle touch devices
    if ('ontouchstart' in window) {
        navTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            navMenu.classList.toggle('visible');
        });

        // Prevent menu from staying open on touch devices after link click
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('visible');
            });
        });
    }

    // No initialization needed for hover-only functionality
    // The CSS handles showing/hiding the menu on hover
}); 