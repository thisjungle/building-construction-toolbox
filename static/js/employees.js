// Constants for reusability and maintainability
const CONSTANTS = {
    EMPLOYMENT_TYPES: ['Full-Time Weekly', 'Part-Time Weekly', 'Casual'],
    CLASSIFICATIONS: ['CW/ECW 1', 'CW/ECW 2', 'CW/ECW 3', 'CW/ECW 4', 'CW/ECW 5'],
    SECTORS: ['General Building', 'Civil Construction', 'Metal Engineering'],
    ANIMATION_DURATION: 300,
    TOAST_DURATION: 5000
};

// Show toast notifications
function showToast(message, type = 'success') {
    // Remove any existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());

    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${type === 'success' ? '✓' : '!'}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Return a promise that resolves when the toast animation is complete
    return new Promise((resolve) => {
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
                resolve();
            }, CONSTANTS.ANIMATION_DURATION);
        }, CONSTANTS.TOAST_DURATION);
    });
}

/**
 * EmployeeState class - Manages the state of employees
 */
class EmployeeState {
    constructor() {
        this.employees = [];
        this.currentEmployee = null;
        this.isEditing = false;
        this.hasUnsavedChanges = false;
    }
    
    setEmployees(employees) {
        this.employees = employees;
    }
    
    getCurrentEmployee() {
        return this.currentEmployee;
    }
    
    setCurrentEmployee(employee) {
        this.currentEmployee = employee;
    }
    
    setIsEditing(isEditing) {
        this.isEditing = isEditing;
    }
    
    setHasUnsavedChanges(hasChanges) {
        this.hasUnsavedChanges = hasChanges;
    }
}

/**
 * EmployeeUI class - Manages the UI for employees
 */
class EmployeeUI {
    constructor(state) {
        this.state = state;
        this.dataTable = null;
        this.elements = {
            employeeTable: document.getElementById('employeesTable'),
            employeeSearch: document.getElementById('employeeSearch'),
            addEmployeeBtn: document.getElementById('addEmployeeBtn'),
            addFirstEmployeeBtn: document.getElementById('addFirstEmployeeBtn'),
            employeeForm: document.getElementById('employeeForm'),
            submitEmployeeBtn: document.getElementById('submitEmployeeBtn'),
            cancelEmployeeBtn: document.getElementById('cancelEmployeeBtn'),
            modalTitle: document.getElementById('modalTitle'),
            employeeModal: document.getElementById('employeeModal'),
            deleteModal: document.getElementById('deleteModal'),
            deleteEmployeeName: document.getElementById('deleteEmployeeName'),
            confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
            cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
            loadingSpinner: document.getElementById('loadingSpinner'),
            unsavedChangesModal: document.getElementById('unsavedChangesModal'),
            saveChangesBtn: document.getElementById('saveChangesBtn'),
            discardChangesBtn: document.getElementById('discardChangesBtn'),
            cancelNavBtn: document.getElementById('cancelNavBtn'),
            searchClearBtn: document.getElementById('searchClearBtn')
        };
    }
    
    // Initialize the UI
    initialize() {
        this.hideLoadingSpinner();
        this.initializeDataTable();
        this.bindEventListeners();
        
        // Setup the modal handlers
        setupUnsavedChangesHandling(this.state.hasUnsavedChanges);
        initializeCancelButtons();
        
        // Save reference for global access (for navigation handling)
        window._employeeUI = this;
    }
    
    // Hide the loading spinner
    hideLoadingSpinner() {
        if (this.elements.loadingSpinner) {
            this.elements.loadingSpinner.style.display = 'none';
        }
    }
    
    // Show/hide loading spinner
    showLoading(show = true) {
        const spinner = this.elements.loadingSpinner;
        if (spinner) {
            if (show) {
                spinner.classList.add('active');
            } else {
                spinner.classList.remove('active');
            }
        }
    }
    
    // Initialize the DataTable
    initializeDataTable() {
        if (!this.elements.employeeTable) return;
        
        this.dataTable = $(this.elements.employeeTable).DataTable({
            processing: true,
            ordering: true,
            order: [[0, 'asc']],
            pageLength: 10,
            lengthChange: false,
            searching: true,
            info: false,
            dom: '<"top">rt<"bottom"p><"clear">',
            ajax: {
                url: '/employees',
                type: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                error: (xhr, error, thrown) => {
                    console.error('Error loading employees:', error);
                    showToast('Failed to load employees', 'error');
                }
            },
            language: {
                search: "",
                searchPlaceholder: "Search employees...",
                processing: "Loading...",
                emptyTable: "No employees found"
            },
            columns: [
                { data: 'name' },
                { data: 'employment_type' },
                { data: 'industry_sector' },
                { 
                    data: 'current_classification',
                    render: (data, type, row) => {
                        if (data && data !== '' && data !== 'Not Classified') {
                            return `<a href="/levels/employee/${row.id}" class="level-link">${data}</a>`;
                        }
                        return `<button class="btn-configure" onclick="window.location.href='/levels/employee/${row.id}'">Configure</button>`;
                    }
                },
                { 
                    data: 'allowances_total',
                    render: (data, type, row) => {
                        const amount = parseFloat(data) || 0;
                        if (amount > 0) {
                            return `<a href="/allowances/employee/${row.id}" class="allowance-link">$${amount.toFixed(2)}</a>`;
                        }
                        return `<button class="btn-configure" onclick="window.location.href='/allowances/employee/${row.id}'">Configure</button>`;
                    }
                },
                {
                    data: 'id',
                    render: (data, type, row) => {
                        return `
                            <div class="btn-action-container">
                                <button class="btn-action btn-edit" data-id="${data}">✏️</button>
                                <button class="btn-action btn-delete" data-id="${data}" data-name="${row.name}">🗑️</button>
                            </div>
                        `;
                    }
                }
            ],
            drawCallback: () => {
                this.attachActionButtonListeners();
            }
        });
        
        // Use our custom search input
        if (this.elements.employeeSearch) {
            this.elements.employeeSearch.addEventListener('keyup', (e) => {
                this.dataTable.search(e.target.value).draw();
                this.toggleSearchClearButton();
            });
        }
        
        // Initialize search clear button
        this.initializeSearchClearButton();
    }
    
    // Initialize search clear button
    initializeSearchClearButton() {
        // Remove any existing clear buttons to avoid duplicates
        const existingBtn = document.getElementById('searchClearBtn');
        if (existingBtn) {
            existingBtn.remove();
        }
        
        // Create clear button for search
        const searchWrapper = this.elements.employeeSearch.parentElement;
        const clearBtn = document.createElement('button');
        clearBtn.id = 'searchClearBtn';
        clearBtn.className = 'search-clear-btn';
        clearBtn.innerHTML = '×';
        clearBtn.title = 'Clear search';
        clearBtn.style.display = 'none';
        
        searchWrapper.appendChild(clearBtn);
        this.elements.searchClearBtn = clearBtn;
        
        // Add click event listener to clear search
        clearBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent any default action
            e.stopPropagation(); // Prevent event bubbling
            this.elements.employeeSearch.value = '';
            this.dataTable.search('').draw();
            clearBtn.style.display = 'none';
            this.elements.employeeSearch.focus(); // Optional: focus back on the search input
        });
        
        // Also check for input events to handle paste, autocomplete, etc.
        this.elements.employeeSearch.addEventListener('input', () => {
            this.toggleSearchClearButton();
        });
        
        // Handle focus/blur to ensure proper state
        this.elements.employeeSearch.addEventListener('focus', () => {
            this.toggleSearchClearButton();
        });
        
        // Initialize button state
        this.toggleSearchClearButton();
    }
    
    // Toggle search clear button visibility
    toggleSearchClearButton() {
        const clearBtn = this.elements.searchClearBtn;
        if (clearBtn) {
            if (this.elements.employeeSearch && this.elements.employeeSearch.value.trim() !== '') {
                clearBtn.style.display = 'block';
            } else {
                clearBtn.style.display = 'none';
            }
        }
    }
    
    // Attach event listeners to action buttons (edit/delete)
    attachActionButtonListeners() {
        // Edit buttons
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const employeeId = btn.getAttribute('data-id');
                this.editEmployee(employeeId);
            });
        });
        
        // Delete buttons
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const employeeId = btn.getAttribute('data-id');
                const employeeName = btn.getAttribute('data-name');
                this.openDeleteModal(employeeId, employeeName);
            });
        });
        
        // Employee name cells for detail view
        document.querySelectorAll('#employeesTable tbody tr td:first-child').forEach(cell => {
            cell.style.cursor = 'pointer';
            
            // Find the employee ID from the closest action button
            const row = cell.closest('tr');
            const editButton = row.querySelector('.btn-edit');
            
            if (editButton) {
                const employeeId = editButton.getAttribute('data-id');
                
                // Add click event
                cell.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log("Name cell clicked, employee ID:", employeeId);
                    
                    // If detailController exists, open the detail view
                    if (window.detailController) {
                        window.detailController.open(employeeId);
                    } else {
                        console.error("detailController not found");
                    }
                });
            }
        });
    }
    
    // Bind all event listeners
    bindEventListeners() {
        // Add employee button
        if (this.elements.addEmployeeBtn) {
            this.elements.addEmployeeBtn.addEventListener('click', () => {
                this.openModal();
            });
        }
        
        // Add first employee button (in empty state)
        if (this.elements.addFirstEmployeeBtn) {
            this.elements.addFirstEmployeeBtn.addEventListener('click', () => {
                this.openModal();
            });
        }
        
        // Employee form submission
        if (this.elements.employeeForm) {
            this.elements.employeeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (this.validateEmployeeForm()) {
                    if (this.state.isEditing) {
                        this.updateEmployee();
                    } else {
                        this.submitEmployee();
                    }
                }
            });
        }
        
        // Cancel button in employee modal
        if (this.elements.cancelEmployeeBtn) {
            this.elements.cancelEmployeeBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }
        
        // Delete confirmation
        if (this.elements.confirmDeleteBtn) {
            this.elements.confirmDeleteBtn.addEventListener('click', () => {
                this.confirmDeleteEmployee();
            });
        }
        
        // Cancel delete
        if (this.elements.cancelDeleteBtn) {
            this.elements.cancelDeleteBtn.addEventListener('click', () => {
                this.closeDeleteModal();
            });
        }
    }

    // Validate the employee form
    validateEmployeeForm() {
        const form = this.elements.employeeForm;
        const name = form.querySelector('#name');
        const employmentType = form.querySelector('#employmentType');
        const industrySector = form.querySelector('#industrySector');
        
        let isValid = true;
        
        // Validate name
        if (!name.value.trim()) {
            name.classList.add('is-invalid');
            isValid = false;
        } else {
            name.classList.remove('is-invalid');
        }
        
        // Validate employment type
        if (!employmentType.value) {
            employmentType.classList.add('is-invalid');
            isValid = false;
        } else {
            employmentType.classList.remove('is-invalid');
        }
        
        // Validate industry sector
        if (!industrySector.value) {
            industrySector.classList.add('is-invalid');
            isValid = false;
        } else {
            industrySector.classList.remove('is-invalid');
        }
        
        return isValid;
    }
    
    // Open the employee modal
    openModal(isEdit = false) {
        if (this.elements.employeeModal) {
            // Reset form if not editing
            if (!isEdit) {
                this.elements.employeeForm.reset();
                this.elements.modalTitle.textContent = 'Add New Employee';
                this.elements.submitEmployeeBtn.textContent = 'Add Employee';
                this.state.setIsEditing(false);
                this.state.setCurrentEmployee(null);
            } else {
                this.elements.modalTitle.textContent = 'Edit Employee';
                this.elements.submitEmployeeBtn.textContent = 'Update Employee';
                this.state.setIsEditing(true);
            }
            
            // Clear any validation errors
            const invalidInputs = this.elements.employeeForm.querySelectorAll('.is-invalid');
            invalidInputs.forEach(input => input.classList.remove('is-invalid'));
            
            this.elements.employeeModal.classList.add('show');
        }
    }
    
    // Close the employee modal
    closeModal() {
        if (this.elements.employeeModal) {
            this.elements.employeeModal.classList.remove('show');
        }
    }
    
    // Get form data
    getFormData() {
        const form = this.elements.employeeForm;
        return {
            Name: form.querySelector('#name').value.trim(),
            EmploymentType: form.querySelector('#employmentType').value,
            IndustrySector: form.querySelector('#industrySector').value
        };
    }
    
    // Submit a new employee
    async submitEmployee() {
        this.showLoading();
        const employeeData = this.getFormData();
        
        try {
            const response = await fetch('/employees/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(employeeData)
            });
            
            const result = await response.json();
        
            if (!response.ok) {
                throw new Error(result.error || 'Failed to add employee');
            }
            
            // Close modal and reload data
            this.closeModal();
            this.dataTable.ajax.reload();
            showToast('Employee added successfully');
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    // Edit employee
    async editEmployee(employeeId) {
        this.showLoading();
        
        try {
            const response = await fetch(`/employees/${employeeId}`, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            const employee = await response.json();
        
            if (!response.ok) {
                throw new Error(employee.error || 'Failed to fetch employee details');
            }
            
            // Set current employee and populate form
            this.state.setCurrentEmployee(employee);
            
            // Fill form
            const form = this.elements.employeeForm;
            form.querySelector('#name').value = employee.name || '';
            form.querySelector('#employmentType').value = employee.employment_type || '';
            form.querySelector('#industrySector').value = employee.industry_sector || '';
            
            // Open modal in edit mode
            this.openModal(true);
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    // Update employee
    async updateEmployee() {
        const currentEmployee = this.state.getCurrentEmployee();
        if (!currentEmployee) return;
        
        this.showLoading();
        const employeeData = this.getFormData();
        
        try {
            const response = await fetch(`/employees/${currentEmployee.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(employeeData)
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to update employee');
            }
            
            // Close modal and reload data
            this.closeModal();
            this.dataTable.ajax.reload();
            showToast('Employee updated successfully');
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    // Open delete confirmation modal
    openDeleteModal(employeeId, employeeName) {
        if (this.elements.deleteModal && this.elements.deleteEmployeeName) {
            this.state.setCurrentEmployee({ id: employeeId, name: employeeName });
            this.elements.deleteEmployeeName.textContent = employeeName;
            this.elements.deleteModal.classList.add('show');
        }
    }
    
    // Close delete modal
    closeDeleteModal() {
        if (this.elements.deleteModal) {
            this.elements.deleteModal.classList.remove('show');
        }
    }
    
    // Confirm and delete employee
    async confirmDeleteEmployee() {
        const currentEmployee = this.state.getCurrentEmployee();
        if (!currentEmployee) return;
        
        this.showLoading();
        
        try {
            const response = await fetch(`/employees/delete/${currentEmployee.id}`, {
                method: 'DELETE',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete employee');
            }
            
            // Close modal and reload data
            this.closeDeleteModal();
            this.dataTable.ajax.reload();
            showToast('Employee deleted successfully');
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }
}

// Add this near the top of the file, with other utility functions
function handleBackNavigation() {
    // Check if we can go back in history
    if (document.referrer.includes('/')) {
        window.history.back();
    } else {
        // If no history or not from home page, redirect to home
        window.location.href = '/';
    }
}

// Make it available globally
window.handleBackNavigation = handleBackNavigation;

function initializeCancelButtons() {
    document.querySelectorAll('.btn-back, [data-action="cancel"]').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            handleBackNavigation();
        });
    });
}

// Handle unsaved changes modal
function setupUnsavedChangesHandling(hasUnsavedChanges) {
    const modal = document.getElementById('unsavedChangesModal');
    const saveChangesBtn = document.getElementById('saveChangesBtn');
    const discardChangesBtn = document.getElementById('discardChangesBtn');
    const cancelNavBtn = document.getElementById('cancelNavBtn');
    
    // Save Changes button
    if (saveChangesBtn) {
        saveChangesBtn.addEventListener('click', () => {
            modal.classList.remove('show');
            // Trigger save action
            const submitButton = document.getElementById('submitEmployeeBtn');
            if (submitButton) submitButton.click();
        });
    }
    
    // Discard Changes button
    if (discardChangesBtn) {
        discardChangesBtn.addEventListener('click', () => {
            modal.classList.remove('show');
            // Clear the unsaved changes flag and continue with navigation
            hasUnsavedChanges = false;
            handleBackNavigation();
        });
    }
    
    // Cancel Navigation button
    if (cancelNavBtn) {
        cancelNavBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });
    }

    // Override the default back behavior to check for unsaved changes
    window.addEventListener('beforeunload', (e) => {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            return e.returnValue;
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const state = new EmployeeState();
    const ui = new EmployeeUI(state);
    ui.initialize();
});

// Edit employee
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('edit-btn') || e.target.closest('.edit-btn')) {
        const button = e.target.classList.contains('edit-btn') ? e.target : e.target.closest('.edit-btn');
        const employeeId = button.getAttribute('data-id');
        showEditEmployeeModal(employeeId);
    }
});

// Delete employee
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
        const button = e.target.classList.contains('delete-btn') ? e.target : e.target.closest('.delete-btn');
        const employeeId = button.getAttribute('data-id');
        showDeleteConfirmationModal(employeeId);
    }
}); 