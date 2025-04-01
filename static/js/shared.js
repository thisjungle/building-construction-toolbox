// Handle back navigation
function handleBackNavigation() {
    if (document.referrer) {
        window.history.back();
    } else {
        window.location.href = '/employees';  // Default to employees page if no history
    }
}

// Initialize header position
function initializeHeaderPosition() {
    document.documentElement.classList.add('header-scrolled');
    const pageHeader = document.querySelector('.employees-header, .allowances-header');
    if (pageHeader) {
        pageHeader.classList.add('scrolled-up');
    }
}

// Handle all cancel buttons
function initializeCancelButtons() {
    document.querySelectorAll('.btn-back, [data-action="cancel"]').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            handleBackNavigation();
        });
    });
}

// Make entire option content area clickable for radio and checkbox inputs
function makeOptionsClickable() {
    // Only apply to pages that don't have their own specific implementation
    if (document.querySelector('.employment-section') || 
        document.querySelector('.allowances-section') ||
        document.querySelector('.position-creation-section')) {
        return;
    }

    setTimeout(() => {
        document.querySelectorAll('.option-content').forEach(option => {
            option.addEventListener('click', function(e) {
                // Don't trigger if clicking on input or button
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') {
                    return;
                }

                // Find the input within this option
                const input = this.querySelector('input[type="radio"], input[type="checkbox"]');
                if (input) {
                    input.checked = !input.checked;
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
            
            // Add cursor pointer styling
            option.style.cursor = 'pointer';
        });
    }, 100); // Small timeout to ensure other scripts have initialized
}

// Custom tooltip implementation
function initializeTooltips() {
    document.querySelectorAll('[data-tooltip]').forEach(element => {
        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = element.getAttribute('data-tooltip');
        
        // Show tooltip
        element.addEventListener('mouseenter', () => {
            document.body.appendChild(tooltip);
            const rect = element.getBoundingClientRect();
            tooltip.style.top = `${rect.bottom + 5}px`;
            tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;
            setTimeout(() => tooltip.classList.add('show'), 10);
        });

        // Hide tooltip
        element.addEventListener('mouseleave', () => {
            tooltip.classList.remove('show');
            setTimeout(() => tooltip.remove(), 200);
        });
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeHeaderPosition();
    initializeCancelButtons();
    initializeTooltips();
    initializeButtonStates();
    makeOptionsClickable();
});

// Common button state handling
function handleButtonState(button, isActive) {
    if (!button) return;
    
    if (isActive) {
        button.classList.add('active');
    } else {
        button.classList.remove('active');
    }
}

function initializeButtonStates() {
    // Find all buttons that need state management
    document.querySelectorAll('[data-state-button]').forEach(button => {
        // Set initial state
        handleButtonState(button, false);
        
        // Add form change listener if specified
        const formId = button.getAttribute('data-form-id');
        if (formId) {
            const form = document.getElementById(formId);
            if (form) {
                form.addEventListener('change', () => {
                    handleButtonState(button, true);
                });
                
                // Reset state on form submit
                form.addEventListener('submit', () => {
                    handleButtonState(button, false);
                });
            }
        }
    });
} 