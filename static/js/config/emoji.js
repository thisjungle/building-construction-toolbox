// Centralized emoji configuration
if (typeof window.APP_EMOJIS === 'undefined') {
    window.APP_EMOJIS = {
        // Navigation
        HOME: '🏠',
        NAV_MENU: '☰',
        HELP: '❓',
        LOGO: '🧰',
        AWARD: '📑',
        DOWNLOAD: '📄',
        AWARD_DUMMIES: '🧠',
        PAY_LEVELS: '💵',
        ALLOWANCES: '💰',
        CREATE_POSITION: '👷‍♂️',
        PAY_CALCULATOR: '🧮',
        
        // Award Guide Sections
        COVERAGE: '👷‍♂️',
        PAY: '💵',
        HOURS: '⏰',
        LEAVE: '🌴',
        UPDATES: '🔄',
        SUMMARY: '📝',
        CALENDAR: '📅',
        CLIPBOARD: '📋',
        // Indicators
        HINT: '👓',
        WARNING: '⚠️',
        INFO: 'ℹ️',
        SEARCH: '🔍',
        
        // Features
        EMPLOYEES: '👷‍♀️',
        LEVELS: '📊',
        FEATURES: '⭐',
        TOOLS: '🔧',
        SETTINGS: '⚙️',
        GETTING_STARTED: '🚀',
        INDUSTRY: '🏗️',
        TOOL_ALLOWANCE: '🛠️',
        FIRST_AID: '🚑',
        OTHER: '📌',
        
        // Employment Types
        FULL_TIME: '👥',
        PART_TIME: '⏰',
        CASUAL: '🔄',
        APPRENTICE: '🎓',
        
        // Position Creation
        ACTIVITIES: '⚒️',
        TASKS: '📋',
        CONSTRUCTION: '🏗️',
        WORK_SITE: '🚧',
        EQUIPMENT: '⚙️',
        MONEY: '💵',
        PEOPLE: '👥',
        TOOLS: '🛠️',
        FAST: '⚡',
        HOLIDAY: '🏖️',
        SICK: '🤒',
        
        // Pay Calculator
        USER: '👤',
        
        // Modal
        CLOSE: '✕',
        DESCRIPTION: '📝',
        QUALIFICATIONS: '🎓',
        SKILLS: '💪',
        TASKS: '⚒️',
        WEEKLY_RATE: '💰',
        PURPOSE: '🎯',
        HOW_TO: '📚',
        IMPORTANT: '⚠️'
    };
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.APP_EMOJIS;
} 