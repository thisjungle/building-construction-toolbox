/**
 * Employee Levels Integration Script
 * 
 * This script integrates the standard levels module with employee-specific functionality.
 * It's being kept for backward compatibility and will be phased out in future versions.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Employee levels integration script loaded');
    
    // Get the employee data element
    const employeeDataElement = document.getElementById('employeeData');
    if (!employeeDataElement) {
        console.warn('Employee data element not found');
        return;
    }
    
    // Extract employee data
    const employeeId = employeeDataElement.getAttribute('data-employee-id');
    const classification = employeeDataElement.getAttribute('data-classification');
    const formResponses = employeeDataElement.getAttribute('data-form-responses');
    
    console.log(`Employee ID: ${employeeId}`);
    console.log(`Has classification: ${!!classification}`);
    console.log(`Has form responses: ${!!formResponses}`);
    
    // Functionality will gradually migrate to the modular structure
    // This file is maintained for backward compatibility only
}); 