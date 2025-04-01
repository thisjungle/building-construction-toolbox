/**
 * Employee Detail View
 * Handles the detailed view of employees with tabs for basic info, award levels, and allowances
 */

// Detail View Controller
class EmployeeDetailController {
    constructor() {
        // DOM Elements
        this.detailView = document.getElementById('employeeDetailView');
        this.backButton = document.getElementById('detailBackBtn');
        this.employeeName = document.getElementById('detailEmployeeName');
        this.tabs = document.querySelectorAll('.detail-tab');
        this.panels = document.querySelectorAll('.detail-panel');
        
        // Basic info elements
        this.fullName = document.getElementById('detailFullName');
        this.employmentType = document.getElementById('detailEmploymentType');
        this.industrySector = document.getElementById('detailIndustrySector');
        this.classification = document.getElementById('detailClassification');
        this.allowancesTotal = document.getElementById('detailAllowancesTotal');
        
        // Content containers
        this.awardLevelsContent = document.getElementById('awardLevelsContent');
        this.allowancesContent = document.getElementById('allowancesContent');
        
        // Current employee data
        this.currentEmployee = null;
        
        // Bind event handlers
        this.bindEvents();
    }
    
    // Initialize event listeners
    bindEvents() {
        // Back button event
        if (this.backButton) {
            this.backButton.addEventListener('click', () => this.close());
        }
        
        // Tab click events
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.activateTab(tabName);
            });
        });
    }
    
    // Open the detail view for a specific employee
    open(employeeId) {
        console.log("Opening employee detail view for ID:", employeeId);
        
        if (!employeeId) {
            console.error("No employee ID provided");
            return;
        }
        
        // Show loading state
        this.showLoading(true);
        
        // Fetch employee data
        this.fetchEmployeeData(employeeId)
            .then(employee => {
                // Store employee data
                this.currentEmployee = employee;
                
                // Update basic info
                this.updateBasicInfo(employee);
                
                // Show the detail view right away
                this.detailView.style.display = 'block';
                this.detailView.classList.add('active');
                
                // Default to basic info tab
                this.activateTab('basic');
                
                // Hide loading spinner
                this.showLoading(false);
            })
            .catch(error => {
                console.error('Error loading employee data:', error);
                this.showError(`Failed to load employee data: ${error.message}`);
                this.showLoading(false);
            });
    }
    
    // Close the detail view
    close() {
        this.detailView.classList.remove('active');
        
        // Short delay before hiding completely
        setTimeout(() => {
            if (!this.detailView.classList.contains('active')) {
                this.detailView.style.display = 'none';
            }
        }, 300);
        
        this.currentEmployee = null;
    }
    
    // Activate a specific tab
    activateTab(tabName) {
        console.log("Activating tab:", tabName);
        
        // Update active tab
        this.tabs.forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Update active panel
        this.panels.forEach(panel => {
            if (panel.dataset.panel === tabName) {
                panel.classList.add('active');
                
                // Load content for award levels and allowances tabs
                if (tabName === 'award-levels' && this.currentEmployee) {
                    this.loadAwardLevels(this.currentEmployee.id);
                } else if (tabName === 'allowances' && this.currentEmployee) {
                    this.loadAllowances(this.currentEmployee.id);
                }
            } else {
                panel.classList.remove('active');
            }
        });
        
        // Ensure we're at the top of the view
        window.scrollTo(0, 0);
        this.detailView.scrollTo(0, 0);
    }
    
    // Update basic info in the UI
    updateBasicInfo(employee) {
        // Update employee name in header
        if (this.employeeName) {
            this.employeeName.textContent = employee.name || 'Employee';
        }
        
        // Update detail fields
        if (this.fullName) this.fullName.textContent = employee.name || 'Not provided';
        if (this.employmentType) this.employmentType.textContent = employee.employment_type || 'Not provided';
        if (this.industrySector) this.industrySector.textContent = employee.industry_sector || 'Not provided';
        if (this.classification) {
            this.classification.textContent = employee.current_classification || 'Not classified';
        }
        if (this.allowancesTotal) {
            const amount = parseFloat(employee.allowances_total) || 0;
            this.allowancesTotal.textContent = `$${amount.toFixed(2)}`;
        }
    }
    
    // Fetch employee data from the server
    fetchEmployeeData(employeeId) {
        return new Promise((resolve, reject) => {
            // Fixed URL to match the correct route in the Flask app
            fetch(`/employees/get/${employeeId}`, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(result => {
                // Extract the employee data from the response structure
                if (result.success && result.data) {
                    resolve(result.data);
                } else {
                    throw new Error(result.error || 'Failed to load employee data');
                }
            })
            .catch(error => reject(error));
        });
    }
    
    // Load award levels content
    loadAwardLevels(employeeId) {
        console.log('Loading award levels for employee:', employeeId);
        
        if (!this.awardLevelsContent) {
            console.error('Award levels content container not found!', this.awardLevelsContent);
            return;
        }
        
        console.log('Setting loading placeholder');
        this.awardLevelsContent.innerHTML = '<div class="loading-placeholder">Loading award levels...</div>';
        
        // Use the correct endpoint to load the levels content
        console.log('Fetching from:', `/levels/embedded/${employeeId}`);
        fetch(`/levels/embedded/${employeeId}`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            console.log('Received HTML length:', html ? html.length : 0);
            if (html && html.trim().length > 10) {
                console.log('Setting HTML content');
                this.awardLevelsContent.innerHTML = html;
                
                // Initialize the levels module if loaded
                console.log('Initializing levels module');
                this.initLevelsModule(employeeId);
            } else {
                console.log('HTML content too short, showing fallback');
                this.displayFallbackAwardLevels(employeeId);
            }
        })
        .catch(error => {
            console.error('Error loading award levels:', error);
            this.displayFallbackAwardLevels(employeeId);
        });
    }
    
    // Initialize the levels module with save functionality
    initLevelsModule(employeeId) {
        console.log('Initializing levels module for employee:', employeeId);
        
        // Load the module script dynamically if not already loaded
        if (!window.levelsModule) {
            const moduleScript = document.createElement('script');
            moduleScript.src = `/static/js/modules/levels-module.js?t=${new Date().getTime()}`;
            document.body.appendChild(moduleScript);
            
            // Load the main levels script if not already loaded
            const mainScript = document.createElement('script');
            mainScript.src = `/static/js/levels.js?t=${new Date().getTime()}`;
            document.body.appendChild(mainScript);
            
            // Give time for scripts to load, then initialize
            setTimeout(() => {
                this.initializeFormInteractions();
            }, 500);
        } else {
            // Scripts already loaded, initialize directly
            this.initializeFormInteractions();
        }
        
        // Wait for the module to be ready
        document.addEventListener('levels-module-ready', event => {
            console.log('Levels module ready in employee context');
            
            // Get the module instance from the event
            const levelsModule = event.detail;
            
            // Store in global space for debugging
            window.employeeLevelsModule = levelsModule;
            
            // Add a save button if not present
            this.addSaveButton(employeeId, levelsModule);
            
            // Set click handler for name field to clear it
            const nameInput = document.getElementById('employeeName');
            if (nameInput) {
                nameInput.addEventListener('click', function() {
                    this.value = '';
                    this.focus();
                });
            }
        });
    }
    
    // Initialize form interactions for the levels module
    initializeFormInteractions() {
        console.log('Setting up form interactions for levels module');
        
        // Select all radio inputs in the award levels panel
        const radioInputs = this.awardLevelsContent.querySelectorAll('input[type="radio"]');
        
        // Add change event listeners to each radio input
        radioInputs.forEach(input => {
            input.addEventListener('change', () => {
                console.log('Radio input changed:', input.name, input.value);
                
                // Collect all form data
                const formData = this.collectFormData();
                
                // Call the classify endpoint
                this.classifyEmployee(formData);
            });
        });
        
        console.log(`Set up ${radioInputs.length} radio input listeners`);
    }
    
    // Collect form data from all inputs
    collectFormData() {
        const formData = {};
        const radioInputs = this.awardLevelsContent.querySelectorAll('input[type="radio"]:checked');
        
        radioInputs.forEach(input => {
            formData[input.name] = input.value;
        });
        
        console.log('Collected form data:', formData);
        return formData;
    }
    
    // Call the classify endpoint with form data
    classifyEmployee(formData) {
        console.log('Calling classify endpoint with data:', formData);
        
        fetch('/levels_classification/classify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(result => {
            console.log('Classification result:', result);
            
            // Update the UI with the result
            this.updateClassificationResult(result);
        })
        .catch(error => {
            console.error('Error classifying employee:', error);
        });
    }
    
    // Update the classification result in the UI
    updateClassificationResult(result) {
        if (!result || !result.classification) return;
        
        const classification = result.classification;
        
        // Find the result elements
        const levelElement = this.awardLevelsContent.querySelector('.classification-level');
        const confidenceElement = this.awardLevelsContent.querySelector('.confidence-value');
        const explanationElement = this.awardLevelsContent.querySelector('.classification-explanation');
        
        // Update the level display
        if (levelElement) {
            levelElement.textContent = classification.level || 'Not Classified';
        }
        
        // Update the confidence score
        if (confidenceElement) {
            confidenceElement.textContent = `${classification.confidence_score || 0}%`;
            
            // Update progress bar if it exists
            const progressBar = this.awardLevelsContent.querySelector('.confidence-bar-fill');
            if (progressBar) {
                progressBar.style.width = `${classification.confidence_score || 0}%`;
            }
        }
        
        // Update explanation list
        if (explanationElement && classification.explanation) {
            // Clear existing items
            explanationElement.innerHTML = '';
            
            // Add each explanation as a list item
            classification.explanation.forEach(text => {
                const item = document.createElement('li');
                item.textContent = text;
                explanationElement.appendChild(item);
            });
        }
    }
    
    // Add save button to the classification form
    addSaveButton(employeeId, levelsModule) {
        // Look for the form actions container
        const formActions = this.awardLevelsContent.querySelector('.form-actions');
        if (!formActions) return;
        
        // Create save button if not already present
        if (!formActions.querySelector('#saveClassificationBtn')) {
            const saveBtn = document.createElement('button');
            saveBtn.id = 'saveClassificationBtn';
            saveBtn.className = 'btn-primary';
            saveBtn.innerHTML = '<span class="btn-icon">💾</span><span class="btn-text">Save Classification</span>';
            
            // Add click event to save classification
            saveBtn.addEventListener('click', () => {
                this.saveClassification(employeeId, levelsModule);
            });
            
            // Add the button to the form actions
            formActions.appendChild(saveBtn);
        }
    }
    
    // Save classification data to the employee record
    saveClassification(employeeId, levelsModule) {
        if (!levelsModule) {
            console.error('Levels module not available for saving');
            return;
        }
        
        // Show loading indicator
        this.showLoading(true);
        
        // Get data from the module
        const data = levelsModule.getData();
        
        // Send data to the server
        fetch(`/employees/${employeeId}/save_classification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(result => {
            if (result.success) {
                // Show success message
                this.showNotification('Classification saved successfully', 'success');
                
                // Update the UI
                if (data.classification && data.classification.level) {
                    // Update the classification in the detail view
                    if (this.classification) {
                        this.classification.textContent = data.classification.level;
                    }
                    
                    // Mark as saved in the module
                    if (levelsModule.markAsSaved) {
                        levelsModule.markAsSaved();
                    }
                }
            } else {
                this.showError('Failed to save classification');
            }
            
            this.showLoading(false);
        })
        .catch(error => {
            console.error('Error saving classification:', error);
            this.showError('Failed to save classification: ' + error.message);
            this.showLoading(false);
        });
    }
    
    // Show notification message
    showNotification(message, type = 'info') {
        // Create notification element if it doesn't exist
        let notification = document.querySelector('.detail-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'detail-notification';
            document.body.appendChild(notification);
        }
        
        // Set message and type
        notification.textContent = message;
        notification.className = `detail-notification ${type}`;
        
        // Show notification
        notification.style.display = 'block';
        notification.style.opacity = '1';
        
        // Hide after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.style.display = 'none';
            }, 300);
        }, 3000);
    }
    
    // Display fallback award levels content
    displayFallbackAwardLevels(employeeId) {
        this.awardLevelsContent.innerHTML = `
            <div class="detail-panel-content">
                <h3>Award Levels</h3>
                <p>This employee does not have any award levels configured yet.</p>
                <div class="detail-panel-actions">
                    <a href="/levels/employee/${employeeId}" class="btn-primary">
                        Configure Award Levels
                    </a>
                </div>
            </div>
        `;
    }
    
    // Load allowances content
    loadAllowances(employeeId) {
        if (!this.allowancesContent) return;
        
        this.allowancesContent.innerHTML = '<div class="loading-placeholder">Loading allowances...</div>';
        
        fetch(`/allowances/employee/${employeeId}?format=ajax`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            if (html && html.trim().length > 10) {
                this.allowancesContent.innerHTML = html;
                
                // Force any loaded content to be static positioned
                const elements = this.allowancesContent.querySelectorAll('*');
                elements.forEach(el => {
                    if (el.style.position === 'fixed' || el.style.position === 'sticky') {
                        el.style.position = 'static';
                    }
                });
            } else {
                this.displayFallbackAllowances(employeeId);
            }
        })
        .catch(error => {
            console.error('Error loading allowances:', error);
            this.displayFallbackAllowances(employeeId);
        });
    }
    
    // Display fallback allowances content
    displayFallbackAllowances(employeeId) {
        this.allowancesContent.innerHTML = `
            <div class="detail-panel-content">
                <h3>Allowances</h3>
                <p>This employee does not have any allowances configured yet.</p>
                <div class="detail-panel-actions">
                    <a href="/allowances/employee/${employeeId}" class="btn-primary">
                        Configure Allowances
                    </a>
                </div>
            </div>
        `;
    }
    
    // Show/hide loading state
    showLoading(isLoading) {
        const loadingSpinner = document.getElementById('loadingSpinner');
        if (loadingSpinner) {
            if (isLoading) {
                loadingSpinner.classList.add('active');
            } else {
                loadingSpinner.classList.remove('active');
            }
        }
    }
    
    // Show error message
    showError(message) {
        // Use existing toast notification if available
        if (typeof showToast === 'function') {
            showToast(message, 'error');
        } else {
            alert(message);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create controller instance
    window.detailController = new EmployeeDetailController();
    
    // Add click event to employee names in the table
    document.querySelectorAll('#employeesTable tbody tr').forEach(row => {
        const nameCell = row.querySelector('td:first-child');
        const employeeId = row.dataset.employeeId;
        
        if (nameCell && employeeId) {
            nameCell.style.cursor = 'pointer';
            nameCell.addEventListener('click', (e) => {
                e.preventDefault();
                window.detailController.open(employeeId);
            });
        }
    });
    
    // For DataTables support (if present)
    if (typeof $.fn.DataTable !== 'undefined') {
        $('#employeesTable').on('draw.dt', function() {
            const dataTable = $(this).DataTable();
            
            $(this).find('tbody tr').each(function() {
                const row = $(this);
                const nameCell = row.find('td:first-child');
                
                if (nameCell.length) {
                    // Get the data for this row from DataTables
                    const rowData = dataTable.row(this).data();
                    
                    if (rowData && rowData.id) {
                        nameCell.css('cursor', 'pointer');
                        nameCell.off('click').on('click', function(e) {
                            e.preventDefault();
                            console.log("Opening employee detail for ID:", rowData.id);
                            window.detailController.open(rowData.id);
                        });
                    }
                }
            });
        });
    }
}); 