// State management
const state = {
    positionId: null,
    positionData: null,
    selectedDocuments: new Set(),
    selectedInduction: new Set(),
    selectedEquipment: new Set()
};

// DOM Elements
const elements = {
    positionInfo: document.getElementById('positionInfo'),
    previewPanel: document.getElementById('previewPanel'),
    previewContent: document.getElementById('previewContent'),
    saveButton: document.getElementById('saveOnboarding'),
    generateButton: document.getElementById('generatePack'),
    closePreview: document.getElementById('closePreview'),
    printButton: document.getElementById('printPack'),
    downloadButton: document.getElementById('downloadPDF')
};

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Get position ID from URL
    const path = window.location.pathname;
    const match = path.match(/\/(\d+)$/);
    if (match) {
        state.positionId = match[1];
        loadPositionData();
    }

    // Initialize event listeners
    initializeEventListeners();
});

// Initialize event listeners
function initializeEventListeners() {
    // Document checkboxes
    document.querySelectorAll('input[name="documents"]').forEach(checkbox => {
        checkbox.addEventListener('change', handleDocumentChange);
    });

    // Induction checkboxes
    document.querySelectorAll('input[name="induction"]').forEach(checkbox => {
        checkbox.addEventListener('change', handleInductionChange);
    });

    // Equipment checkboxes
    document.querySelectorAll('input[name="equipment"]').forEach(checkbox => {
        checkbox.addEventListener('change', handleEquipmentChange);
    });

    // Buttons
    if (elements.saveButton) {
        elements.saveButton.addEventListener('click', saveOnboarding);
    }
    if (elements.generateButton) {
        elements.generateButton.addEventListener('click', generatePack);
    }
    if (elements.closePreview) {
        elements.closePreview.addEventListener('click', () => {
            elements.previewPanel.classList.add('hidden');
        });
    }
    if (elements.printButton) {
        elements.printButton.addEventListener('click', () => window.print());
    }
    if (elements.downloadButton) {
        elements.downloadButton.addEventListener('click', downloadPDF);
    }
}

// Load position data
async function loadPositionData() {
    try {
        const response = await fetch(`/api/onboarding_data/${state.positionId}`);
        const data = await response.json();
        state.positionData = data;
        updatePositionInfo();
    } catch (error) {
        console.error('Error loading position data:', error);
        showNotification('Error loading position data', 'error');
    }
}

// Update position information display
function updatePositionInfo() {
    if (!elements.positionInfo || !state.positionData) return;

    const { employmentType, experienceLevel, workStreams, classification } = state.positionData;
    
    elements.positionInfo.innerHTML = `
        <div class="info-grid">
            <div class="info-item">
                <strong>Employment Type:</strong>
                <span>${employmentType}</span>
            </div>
            <div class="info-item">
                <strong>Experience Level:</strong>
                <span>${experienceLevel}</span>
            </div>
            <div class="info-item">
                <strong>Work Streams:</strong>
                <span>${workStreams.join(', ')}</span>
            </div>
            <div class="info-item">
                <strong>Classification:</strong>
                <span>${classification}</span>
            </div>
        </div>
    `;
}

// Handle document selection
function handleDocumentChange(event) {
    const value = event.target.value;
    if (event.target.checked) {
        state.selectedDocuments.add(value);
    } else {
        state.selectedDocuments.delete(value);
    }
    updatePreview();
}

// Handle induction selection
function handleInductionChange(event) {
    const value = event.target.value;
    if (event.target.checked) {
        state.selectedInduction.add(value);
    } else {
        state.selectedInduction.delete(value);
    }
    updatePreview();
}

// Handle equipment selection
function handleEquipmentChange(event) {
    const value = event.target.value;
    if (event.target.checked) {
        state.selectedEquipment.add(value);
    } else {
        state.selectedEquipment.delete(value);
    }
    updatePreview();
}

// Save onboarding data
async function saveOnboarding() {
    try {
        const response = await fetch('/api/save_onboarding', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                positionId: state.positionId,
                documents: Array.from(state.selectedDocuments),
                induction: Array.from(state.selectedInduction),
                equipment: Array.from(state.selectedEquipment)
            })
        });

        const result = await response.json();
        if (result.success) {
            showNotification('Onboarding data saved successfully', 'success');
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error saving onboarding data:', error);
        showNotification('Error saving onboarding data', 'error');
    }
}

// Generate onboarding pack
function generatePack() {
    // Update preview content
    updatePreview();
    // Show preview panel
    elements.previewPanel.classList.remove('hidden');
}

// Update preview content
function updatePreview() {
    if (!elements.previewContent) return;

    const content = `
        <div class="preview-section">
            <h3>Required Documents</h3>
            <ul>
                ${Array.from(state.selectedDocuments).map(doc => `<li>${doc}</li>`).join('')}
            </ul>
        </div>
        <div class="preview-section">
            <h3>Induction Requirements</h3>
            <ul>
                ${Array.from(state.selectedInduction).map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>
        <div class="preview-section">
            <h3>Equipment Requirements</h3>
            <ul>
                ${Array.from(state.selectedEquipment).map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>
    `;

    elements.previewContent.innerHTML = content;
}

// Download PDF
function downloadPDF() {
    // This would typically use a PDF generation library
    // For now, we'll just show a notification
    showNotification('PDF download functionality coming soon', 'info');
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Add to page
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
} 