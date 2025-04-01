/**
 * Debug levels - A comprehensive debugging tool for levels module integration
 */
console.log('✅ Debug levels script loaded');

// Helper function to inspect DOM elements
function inspectElement(element) {
    if (!element) return 'Element not found';
    
    return {
        tagName: element.tagName,
        id: element.id,
        className: element.className,
        display: getComputedStyle(element).display,
        visibility: getComputedStyle(element).visibility,
        position: getComputedStyle(element).position,
        width: getComputedStyle(element).width,
        height: getComputedStyle(element).height,
        children: element.children.length
    };
}

// Function to create a debug panel
function createDebugPanel() {
    const panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 300px;
        background: rgba(0, 0, 0, 0.8);
        color: #fff;
        font-family: monospace;
        padding: 10px;
        border-radius: 5px;
        z-index: 9999;
        font-size: 12px;
        max-height: 400px;
        overflow-y: auto;
    `;
    
    const title = document.createElement('h3');
    title.textContent = '🐛 Debug Panel';
    title.style.margin = '0 0 10px 0';
    
    const content = document.createElement('div');
    content.id = 'debug-content';
    
    const actions = document.createElement('div');
    actions.style.marginTop = '10px';
    
    const reloadBtn = document.createElement('button');
    reloadBtn.textContent = '🔄 Reload Form';
    reloadBtn.style.marginRight = '5px';
    reloadBtn.style.padding = '5px';
    
    const initBtn = document.createElement('button');
    initBtn.textContent = '🚀 Init Module';
    initBtn.style.padding = '5px';
    
    const toggleTabsBtn = document.createElement('button');
    toggleTabsBtn.textContent = '📋 Show Tabs';
    toggleTabsBtn.style.padding = '5px';
    toggleTabsBtn.style.marginLeft = '5px';
    
    actions.appendChild(reloadBtn);
    actions.appendChild(initBtn);
    actions.appendChild(toggleTabsBtn);
    
    panel.appendChild(title);
    panel.appendChild(content);
    panel.appendChild(actions);
    
    document.body.appendChild(panel);
    
    // Button event listeners
    reloadBtn.addEventListener('click', () => {
        updateDebugInfo('Reloading form...');
        if (typeof loadDefaultQuestions === 'function') {
            loadDefaultQuestions();
            updateDebugInfo('Loaded default questions');
        } else {
            updateDebugInfo('ERROR: loadDefaultQuestions not found');
        }
    });
    
    initBtn.addEventListener('click', () => {
        updateDebugInfo('Initializing module...');
        if (typeof initLevelsModule === 'function') {
            initLevelsModule();
            updateDebugInfo('Module initialized');
        } else {
            updateDebugInfo('ERROR: initLevelsModule not found');
        }
    });
    
    toggleTabsBtn.addEventListener('click', () => {
        debugTabs();
    });
    
    return {
        panel,
        content
    };
}

// Function to update debug panel content
function updateDebugInfo(message) {
    const content = document.getElementById('debug-content');
    if (!content) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.textContent = `[${timestamp}] ${message}`;
    content.appendChild(entry);
    
    // Auto-scroll to bottom
    content.scrollTop = content.scrollHeight;
}

// Function to debug tabs
function debugTabs() {
    const tabs = document.querySelectorAll('.tab-heading, .tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    updateDebugInfo(`Found ${tabs.length} tabs and ${tabContents.length} content panels`);
    
    tabs.forEach((tab, i) => {
        const tabName = tab.textContent.trim();
        const tabId = tab.getAttribute('data-tab') || tab.getAttribute('data-panel');
        const isActive = tab.classList.contains('active');
        updateDebugInfo(`Tab ${i+1}: "${tabName}" (${tabId}) - ${isActive ? 'ACTIVE' : 'inactive'}`);
        
        // Force activate tab on click for testing
        tab.addEventListener('click', function() {
            updateDebugInfo(`Clicked tab: ${tabName}`);
            
            // Force specific styles for levels tab
            if (tabId === 'levels') {
                const levelsContent = document.querySelector('.tab-content[data-panel="levels"]');
                if (levelsContent) {
                    levelsContent.style.display = 'block';
                    updateDebugInfo('Forced display of levels tab content');
                    
                    // Also force display of internal content
                    const levelsContainer = levelsContent.querySelector('.levels-container');
                    if (levelsContainer) {
                        levelsContainer.style.display = 'block';
                        updateDebugInfo('Forced display of levels container');
                    }
                    
                    const classificationForm = document.getElementById('classificationForm');
                    if (classificationForm) {
                        classificationForm.style.display = 'block';
                        updateDebugInfo('Forced display of classification form');
                    }
                }
            }
        });
    });
    
    tabContents.forEach((content, i) => {
        const panelId = content.getAttribute('data-panel');
        const isVisible = getComputedStyle(content).display !== 'none';
        const height = content.offsetHeight;
        updateDebugInfo(`Content ${i+1}: ${panelId} - ${isVisible ? 'VISIBLE' : 'hidden'} (height: ${height}px)`);
    });
}

// Initialize debug when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Debug DOM content loaded');
    
    // Create debug panel
    const { panel, content } = createDebugPanel();
    updateDebugInfo('Debug panel initialized');
    
    // Log module initialization status
    if (typeof initLevelsModule === 'function') {
        updateDebugInfo('✅ initLevelsModule function exists');
    } else {
        updateDebugInfo('❌ initLevelsModule function not found');
    }
    
    // Check employee data
    const employeeData = document.getElementById('employeeData');
    if (employeeData) {
        updateDebugInfo('✅ employeeData element found');
        updateDebugInfo(`Employee ID: ${employeeData.getAttribute('data-employee-id')}`);
        updateDebugInfo(`Is employee context: ${employeeData.getAttribute('data-is-employee-context')}`);
    } else {
        updateDebugInfo('❌ employeeData element not found');
    }
    
    // Check classification form
    const classificationForm = document.getElementById('classificationForm');
    if (classificationForm) {
        updateDebugInfo('✅ classificationForm found');
        const inputs = classificationForm.querySelectorAll('input');
        updateDebugInfo(`Form has ${inputs.length} inputs`);
    } else {
        updateDebugInfo('❌ classificationForm not found');
    }
    
    // Debug tab setup
    debugTabs();
    
    // Check if levels module is initialized after a short delay
    setTimeout(() => {
        const levelsContainer = document.querySelector('.levels-container');
        if (levelsContainer) {
            updateDebugInfo(`Levels container display: ${getComputedStyle(levelsContainer).display}`);
        }
        
        const resultsPanel = document.querySelector('.results-panel');
        if (resultsPanel) {
            updateDebugInfo(`Results panel display: ${getComputedStyle(resultsPanel).display}`);
        }
    }, 1000);
});

// Additional global debugging
window.debugLevels = {
    forceDisplayTab: function(tabId) {
        const tab = document.querySelector(`.tab-heading[data-panel="${tabId}"], .tab-btn[data-tab="${tabId}"]`);
        if (tab) {
            tab.click();
            updateDebugInfo(`Forced click on tab: ${tabId}`);
        } else {
            updateDebugInfo(`Tab not found: ${tabId}`);
        }
    },
    
    inspectElement: function(selector) {
        const element = document.querySelector(selector);
        const info = inspectElement(element);
        console.log('Element inspection:', info);
        updateDebugInfo(`Inspected ${selector}`);
        return info;
    },
    
    fixStyles: function() {
        // Force display of tab content
        const levelsContent = document.querySelector('.tab-content[data-panel="levels"]');
        if (levelsContent) {
            levelsContent.style.display = 'block';
            levelsContent.classList.add('active');
            updateDebugInfo('Fixed styles on levels content');
        }
        
        // Force display of tab
        const levelsTab = document.querySelector('.tab-heading[data-panel="levels"], .tab-btn[data-tab="levels"]');
        if (levelsTab) {
            levelsTab.classList.add('active');
            updateDebugInfo('Fixed styles on levels tab');
        }
        
        // Force display of content
        const levelsContainer = document.querySelector('.levels-container');
        if (levelsContainer) {
            levelsContainer.style.display = 'block';
            updateDebugInfo('Fixed styles on levels container');
        }
        
        const classificationForm = document.getElementById('classificationForm');
        if (classificationForm) {
            classificationForm.style.display = 'block';
            updateDebugInfo('Fixed styles on classification form');
        }
        
        return 'Styles fixed';
    }
};

console.log('✅ Debug levels script fully loaded and initialized'); 