"""
Allowance calculation module with improved error handling, validation, and logging.
"""
import logging
from typing import Dict, List, Any, TypedDict, Optional
from decimal import Decimal, ROUND_HALF_UP

logger = logging.getLogger(__name__)

class AllowanceError(Exception):
    """Custom exception for allowance calculation errors"""
    pass

class AllowanceResult(TypedDict):
    """Type definition for allowance calculation result"""
    wageAllowances: float
    expenseAllowances: float
    otherAllowances: float

class AllowanceConfig(TypedDict):
    """Type definition for allowance configuration"""
    sections: List[Dict[str, Any]]
    metadata: Dict[str, Any]

def validate_allowance_amount(amount: Any) -> float:
    """Validate and sanitize allowance amount"""
    try:
        # Convert to Decimal for precise handling
        amount = Decimal(str(amount))
        # Round to 2 decimal places
        return float(amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
    except (ValueError, TypeError) as e:
        logger.error(f"Invalid allowance amount: {amount}")
        raise AllowanceError(f"Invalid allowance amount: {amount}") from e

def validate_allowance_conditions(conditions: List[Dict[str, Any]]) -> None:
    """Validate allowance conditions"""
    required_fields = {'field', 'operator', 'value'}
    for condition in conditions:
        missing_fields = required_fields - set(condition.keys())
        if missing_fields:
            logger.error(f"Missing required fields in condition: {missing_fields}")
            raise AllowanceError(f"Missing required fields in condition: {missing_fields}")

def calculate_allowances(employee: Dict[str, Any], allowances_config: AllowanceConfig) -> AllowanceResult:
    """
    Calculate allowances for an employee based on their conditions and the allowances configuration.
    
    Args:
        employee: Dictionary containing employee information and applicable allowances
        allowances_config: Dictionary containing the allowances configuration
        
    Returns:
        Dictionary containing calculated allowances by category
        
    Raises:
        AllowanceError: If there's an error in allowance calculation
    """
    logger.info(f"Calculating allowances for employee: {employee.get('EmployeeID', 'Unknown')}")
    
    wage_allowances = Decimal('0.0')
    expense_allowances = Decimal('0.0')
    other_allowances = Decimal('0.0')

    applicable_allowances = employee.get("allowancesApplicable", [])
    if not applicable_allowances:
        logger.info("No applicable allowances found")
        return {
            "wageAllowances": 0.0,
            "expenseAllowances": 0.0,
            "otherAllowances": 0.0
        }
    
    for allowance_name in applicable_allowances:
        found = False
        try:
            # Traverse through sections and sub_sections
            for section in allowances_config.get("sections", []):
                for sub_section in section.get("sub_sections", []):
                    for allowance_category in sub_section.get("allowances", []):
                        category = allowance_category.get("category", "")
                        for detail in allowance_category.get("allowance_details", []):
                            if detail.get("allowance_name", "").lower() == allowance_name.lower():
                                # Validate amount and conditions
                                amount = validate_allowance_amount(detail.get("amount", 0.0))
                                conditions = detail.get("conditions", [])
                                validate_allowance_conditions(conditions)
                                
                                category_type = category.lower()
                                if "industry allowances" in category_type:
                                    wage_allowances += Decimal(str(amount))
                                elif "expense allowances" in category_type:
                                    expense_allowances += Decimal(str(amount))
                                elif "other allowances" in category_type:
                                    other_allowances += Decimal(str(amount))
                                    
                                logger.info(
                                    f"Applied allowance: {detail.get('allowance_name')}, "
                                    f"Amount: {amount}, Category: {category}"
                                )
                                found = True
                                break
                        if found:
                            break
                    if found:
                        break
                if found:
                    break
                    
            if not found:
                logger.warning(f"Allowance '{allowance_name}' not found in allowances.json")
                
        except Exception as e:
            logger.error(f"Error processing allowance {allowance_name}: {str(e)}")
            raise AllowanceError(f"Error processing allowance {allowance_name}: {str(e)}") from e
    
    # Convert Decimal to float and round to 2 decimal places
    result = {
        "wageAllowances": float(wage_allowances.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
        "expenseAllowances": float(expense_allowances.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
        "otherAllowances": float(other_allowances.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
    }
    
    logger.info(f"Final allowance calculation: {result}")
    return result
