import logging

def calculate_meal_allowances(employee, allowances_config, meal_breaks_config):
    """
    Calculate meal allowances for an employee based on consumed meals and allowance configurations.

    Parameters:
        employee (dict): A dictionary containing employee data.
        allowances_config (dict): The allowances configuration loaded from allowances.json.
        meal_breaks_config (dict): The meal breaks configuration loaded from mealBreaks.json.

    Returns:
        float: Total meal allowance for the employee.
    """
    logger = logging.getLogger(__name__)
    meal_allowance = 0.0
    meals_consumed = employee.get('mealsConsumed', 0)

    if meals_consumed <= 0:
        logger.info(f"No meals consumed for employee ID {employee.get('employeeID', 'Unknown')}. No meal allowance applied.")
        return meal_allowance

    # Iterate through applicable allowances
    applicable_allowances = employee.get("allowancesApplicable", [])
    
    for allowance_name in applicable_allowances:
        # Normalize allowance name for comparison
        normalized_allowance_name = allowance_name.strip().lower()
        
        # Traverse through sections and sub_sections to find matching meal allowances
        for section in allowances_config.get("sections", []):
            for sub_section in section.get("sub_sections", []):
                for allowance_category in sub_section.get("allowances", []):
                    for allowance_detail in allowance_category.get("allowance_details", []):
                        current_allowance_name = allowance_detail.get("allowance_name", "").strip().lower()
                        
                        if normalized_allowance_name == current_allowance_name:
                            if "meal allowance" in current_allowance_name:
                                amount = allowance_detail.get("amount", 0.0)
                                payable = allowance_detail.get("payable", "").lower()
                                
                                if "per meal" in payable or "per meals" in payable:
                                    total_allowance = meals_consumed * amount
                                    meal_allowance += total_allowance
                                    logger.info(f"Applied meal allowance '{allowance_detail.get('allowance_name')}' for employee ID {employee.get('employeeID', 'Unknown')}: {meals_consumed} meals * ${amount} = ${total_allowance}")
                                
                                elif "per day" in payable:
                                    # Assuming each day has at least one meal consumed
                                    days_worked = employee.get("daysWorked", 0)
                                    total_allowance = days_worked * amount
                                    meal_allowance += total_allowance
                                    logger.info(f"Applied daily meal allowance '{allowance_detail.get('allowance_name')}' for employee ID {employee.get('employeeID', 'Unknown')}: {days_worked} days * ${amount} = ${total_allowance}")
                                
                                elif "per journey" in payable:
                                    journeys = employee.get("journeys", 0)
                                    total_allowance = journeys * amount
                                    meal_allowance += total_allowance
                                    logger.info(f"Applied meal allowance per journey '{allowance_detail.get('allowance_name')}' for employee ID {employee.get('employeeID', 'Unknown')}: {journeys} journeys * ${amount} = ${total_allowance}")
                                
                                elif "per occasion" in payable:
                                    occasions = employee.get("occasions", 0)
                                    total_allowance = occasions * amount
                                    meal_allowance += total_allowance
                                    logger.info(f"Applied meal allowance per occasion '{allowance_detail.get('allowance_name')}' for employee ID {employee.get('employeeID', 'Unknown')}: {occasions} occasions * ${amount} = ${total_allowance}")
                                
                                elif "per meal" not in payable and "per day" not in payable and "per journey" not in payable and "per occasion" not in payable:
                                    # Default to per meal if 'payable' is not specified clearly
                                    total_allowance = meals_consumed * amount
                                    meal_allowance += total_allowance
                                    logger.warning(f"Payable type '{payable}' for meal allowance '{allowance_detail.get('allowance_name')}' is unclear. Defaulted to per meal calculation: {meals_consumed} meals * ${amount} = ${total_allowance}")
                                
                                break  # Exit once the allowance is found and applied
                    else:
                        continue
                    break
                else:
                    continue
                break
            else:
                continue
            break
        else:
            # No matching allowance found for the current allowance name
            logger.warning(f"Meal allowance '{allowance_name}' not found in allowances.json for employee ID {employee.get('employeeID', 'Unknown')}.")
    
    logger.info(f"Total meal allowance for employee ID {employee.get('employeeID', 'Unknown')}: ${meal_allowance:.2f}")
    return meal_allowance
