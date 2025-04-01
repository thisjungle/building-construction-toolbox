import logging

def get_employee_classification(employee, classification_config):
    """
    Retrieve classification details for the employee.
    """
    logger = logging.getLogger(__name__)
    classification_key = employee.get('classification', '').lower()
    classification_details = classification_config.get(classification_key, {})
    
    if not classification_details:
        logger.warning(f"Classification '{classification_key}' not found in employeeClassifications.json")
    
    return classification_details
