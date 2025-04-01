// Job Posting State Management
const jobPostingState = {
    selectedTemplate: null,
    sections: {},
    positionId: null,
    positionData: null
};

// Initialize the job posting editor
document.addEventListener('DOMContentLoaded', () => {
    // Get position ID from URL
    const pathParts = window.location.pathname.split('/');
    jobPostingState.positionId = pathParts[pathParts.length - 1];
    
    // Get position data from window object
    jobPostingState.positionData = window.positionData;
    
    // Initialize template selection
    initializeTemplateSelection();
    
    // Initialize section editors
    initializeSectionEditors();
    
    // Initialize preview functionality
    initializePreviewButton();
    
    // Initialize save functionality
    initializeSaveButton();
});

// Template Selection
function initializeTemplateSelection() {
    const templateOptions = document.querySelectorAll('.template-option');
    
    templateOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove selected class from all options
            templateOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            option.classList.add('selected');
            
            // Store selected template
            jobPostingState.selectedTemplate = option.dataset.templateId;
            
            // Load template sections
            loadTemplateSections(jobPostingState.selectedTemplate);
        });
    });
}

// Section Editors
function initializeSectionEditors() {
    const editors = document.querySelectorAll('.section-editor');
    
    editors.forEach(editor => {
        const sectionId = editor.closest('.editor-section').dataset.sectionId;
        
        // Pre-populate with position data if available
        if (jobPostingState.positionData) {
            const content = generateSectionContent(sectionId, jobPostingState.positionData);
            editor.value = content;
        } else {
            editor.value = editor.dataset.template;
        }
        
        jobPostingState.sections[sectionId] = editor.value;
        
        editor.addEventListener('input', (e) => {
            jobPostingState.sections[sectionId] = e.target.value;
        });
    });
}

// Generate section content based on position data
function generateSectionContent(sectionId, positionData) {
    switch(sectionId) {
        case 'company_info':
            return generateCompanyInfo(positionData);
        case 'responsibilities':
            return generateResponsibilities(positionData);
        case 'essential_requirements':
            return generateEssentialRequirements(positionData);
        case 'desirable_requirements':
            return generateDesirableRequirements(positionData);
        case 'salary_benefits':
            return generateSalaryBenefits(positionData);
        case 'project_details':
            return generateProjectDetails(positionData);
        case 'application_instructions':
            return generateApplicationInstructions(positionData);
        default:
            return '';
    }
}

// Generate company information section
function generateCompanyInfo(positionData) {
    return `[Company Name]
${positionData.work_location}

About Us:
[Add your company description here]

Location: ${positionData.work_location}
Site Type: ${positionData.site_type}
Employment Type: ${positionData.employment_type}`;
}

// Generate responsibilities section
function generateResponsibilities(positionData) {
    let content = 'Key Responsibilities:\n\n';
    
    // Add job duties
    if (positionData.job_duties && positionData.job_duties.length > 0) {
        content += 'Job Duties:\n';
        positionData.job_duties.forEach(duty => {
            content += `• ${duty}\n`;
        });
        content += '\n';
    }
    
    // Add specific tasks
    if (positionData.specific_tasks && positionData.specific_tasks.length > 0) {
        content += 'Specific Tasks:\n';
        positionData.specific_tasks.forEach(task => {
            content += `• ${task}\n`;
        });
    }
    
    return content;
}

// Generate essential requirements section
function generateEssentialRequirements(positionData) {
    let content = 'Essential Requirements:\n\n';
    
    // Add required qualifications
    if (positionData.required_qualifications && positionData.required_qualifications.length > 0) {
        content += 'Qualifications:\n';
        positionData.required_qualifications.forEach(qual => {
            content += `• ${qual}\n`;
        });
        content += '\n';
    }
    
    // Add experience level
    content += `Experience Level: ${positionData.experience_level}\n`;
    
    // Add classification level
    content += `Classification Level: ${positionData.classification_level}\n`;
    
    return content;
}

// Generate desirable requirements section
function generateDesirableRequirements(positionData) {
    return `Desirable Requirements:

• Previous experience in ${positionData.work_streams.join(', ')}
• Strong communication and interpersonal skills
• Ability to work effectively in a team environment
• Commitment to workplace safety and quality standards`;
}

// Generate salary and benefits section
function generateSalaryBenefits(positionData) {
    let content = 'Salary & Benefits:\n\n';
    
    // Add base pay
    content += `Base Pay: $${positionData.base_pay.toFixed(2)} per hour\n\n`;
    
    // Add allowances
    if (positionData.allowances && Object.keys(positionData.allowances).length > 0) {
        content += 'Allowances:\n';
        Object.entries(positionData.allowances).forEach(([key, value]) => {
            content += `• ${key}: ${value}\n`;
        });
    }
    
    // Add shift work information
    if (positionData.shift_work) {
        content += '\nShift Work: Required\n';
    }
    
    return content;
}

// Generate project details section
function generateProjectDetails(positionData) {
    return `Project Details:

Location: ${positionData.work_location}
Site Type: ${positionData.site_type}
Work Streams: ${positionData.work_streams.join(', ')}
Classification Level: ${positionData.classification_level}`;
}

// Generate application instructions section
function generateApplicationInstructions(positionData) {
    return `Application Instructions:

To apply for this position, please submit your resume and a cover letter addressing the essential requirements to [email address].

For any questions about this position, please contact [contact person] at [phone number] or [email address].

Note: This position is subject to the Building and Construction General On-site Award 2020 (MA000020).`;
}

// Load Template Sections
function loadTemplateSections(templateId) {
    const sections = document.querySelectorAll('.editor-section');
    
    sections.forEach(section => {
        const sectionId = section.dataset.sectionId;
        const editor = section.querySelector('.section-editor');
        
        // Get template content for this section
        const templateContent = getTemplateContent(templateId, sectionId);
        
        // Update editor with template content
        editor.value = templateContent;
        jobPostingState.sections[sectionId] = templateContent;
    });
}

// Get template content for a section
function getTemplateContent(templateId, sectionId) {
    // Find the template in the templates array
    const template = window.templates.find(t => t.id === templateId);
    if (!template) return '';
    
    // Get the section content
    const section = template.sections.find(s => s.id === sectionId);
    return section ? section.template : '';
}

// Preview Functionality
function initializePreviewButton() {
    const previewBtn = document.getElementById('previewBtn');
    const previewPanel = document.getElementById('previewPanel');
    
    previewBtn.addEventListener('click', () => {
        // Generate preview content
        const previewContent = generatePreviewContent();
        
        // Update preview panel
        previewPanel.innerHTML = previewContent;
        
        // Show preview panel
        previewPanel.classList.remove('hidden');
    });
}

// Generate preview content
function generatePreviewContent() {
    let content = '';
    
    // Add each section to the preview
    Object.entries(jobPostingState.sections).forEach(([sectionId, sectionContent]) => {
        content += `<div class="preview-section">
            <h3>${getSectionTitle(sectionId)}</h3>
            <div class="preview-content">${formatPreviewContent(sectionContent)}</div>
        </div>`;
    });
    
    return content;
}

// Get section title
function getSectionTitle(sectionId) {
    const titles = {
        'company_info': 'Company Information',
        'responsibilities': 'Key Responsibilities',
        'essential_requirements': 'Essential Requirements',
        'desirable_requirements': 'Desirable Requirements',
        'salary_benefits': 'Salary & Benefits',
        'project_details': 'Project Details',
        'application_instructions': 'Application Instructions'
    };
    
    return titles[sectionId] || sectionId;
}

// Format preview content
function formatPreviewContent(content) {
    // Convert newlines to <br> tags
    return content.replace(/\n/g, '<br>');
}

// Save Functionality
function initializeSaveButton() {
    const saveBtn = document.getElementById('saveBtn');
    
    saveBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/job_posting/api/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    position_id: jobPostingState.positionId,
                    content: jobPostingState.sections
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Show success message
                showNotification('Job posting saved successfully', 'success');
                
                // Redirect back to position page
                setTimeout(() => {
                    window.location.href = `/position/${jobPostingState.positionId}`;
                }, 1500);
            } else {
                throw new Error(data.error || 'Failed to save job posting');
            }
        } catch (error) {
            console.error('Error saving job posting:', error);
            showNotification('Failed to save job posting', 'error');
        }
    });
}

// Notification System
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
} 