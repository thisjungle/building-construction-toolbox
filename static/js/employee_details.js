/**
 * Employee Details Page JavaScript
 * Handles tab switching and navigation
 */

class EmployeeDetails {
    constructor() {
        this.tabButtons = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
        
        this.init();
    }
    
    init() {
        // Set up tab switching
        this.setupTabNavigation();
        
        // Set up edit profile button
        const editProfileBtn = document.getElementById('editProfileBtn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', this.handleEditProfile.bind(this));
        }
        
        // Check URL for tab parameter
        this.checkUrlForTab();
    }
    
    setupTabNavigation() {
        this.tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                this.switchToTab(tabId);
                
                // Update URL with tab parameter
                const url = new URL(window.location);
                url.searchParams.set('tab', tabId);
                window.history.pushState({}, '', url);
            });
        });
    }
    
    switchToTab(tabId) {
        // Remove active class from all tabs
        this.tabButtons.forEach(btn => btn.classList.remove('active'));
        this.tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked tab
        const button = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        const content = document.querySelector(`.tab-content[data-tab="${tabId}"]`);
        
        if (button && content) {
            button.classList.add('active');
            content.classList.add('active');
        }
    }
    
    checkUrlForTab() {
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');
        
        if (tabParam && document.querySelector(`.tab-btn[data-tab="${tabParam}"]`)) {
            this.switchToTab(tabParam);
        }
    }
    
    getEmployeeId() {
        // Try to get employee ID from URL
        const path = window.location.pathname;
        const matches = path.match(/\/employees\/([a-zA-Z0-9-]+)/);
        if (matches && matches[1]) {
            return matches[1];
        }
        
        return null;
    }
    
    handleEditProfile(event) {
        const employeeId = this.getEmployeeId();
        if (employeeId) {
            window.location.href = `/employees/edit/${employeeId}`;
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Employee details page initialized');
    new EmployeeDetails();
}); 