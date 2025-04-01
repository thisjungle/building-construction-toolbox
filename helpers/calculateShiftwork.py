import logging
from datetime import datetime, timedelta

def calculate_shift_pay(employee, base_pay_hourly, shiftwork_config):
    """
    Calculate additional pay based on shift work conditions.
    """
    logger = logging.getLogger(__name__)
    shift_pay = 0.0

    # Extract shift details from employee data
    shifts = employee.get('shifts', [])
    
    for shift in shifts:
        shift_type = shift.get('type', '').lower().replace(" ", "")
        hours_worked = shift.get('hours', 0)
        is_special = shift.get('isSpecial', False)
        
        # Get rate multiplier from shiftDefinitions
        shift_def = shiftwork_config.get('shiftDefinitions', {}).get(shift_type, {})
        rate_multiplier = shift_def.get('rateMultiplier', 1.0)
        
        # Calculate shift pay
        pay_for_shift = base_pay_hourly * rate_multiplier * hours_worked
        shift_pay += pay_for_shift
        logger.info(f"Calculated shift pay for {shift_type}: {pay_for_shift}")
        
        # Apply penalty rates if applicable
        if shift_type in ['saturday', 'sunday', 'publicholiday']:
            if shift_type == 'saturday':
                if is_special:
                    multiplier = shiftwork_config['penaltyRates']['saturday']['specialSaturday']
                else:
                    # Determine if before or after 12pm
                    shift_start_time = datetime.strptime(shift.get('startTime', '00:00'), '%H:%M').time()
                    if shift_start_time < datetime.strptime("12:00", "%H:%M").time():
                        multiplier = shiftwork_config['penaltyRates']['saturday']['before_12pm']
                    else:
                        multiplier = shiftwork_config['penaltyRates']['saturday']['after_12pm']
            elif shift_type == 'sunday':
                multiplier = shiftwork_config['penaltyRates']['sunday']
            elif shift_type == 'publicholiday':
                multiplier = shiftwork_config['penaltyRates']['publicholiday']
            else:
                multiplier = 1.0  # Default

            shift_pay += base_pay_hourly * multiplier * hours_worked
            logger.info(f"Applied penalty rate for {shift_type}: {multiplier}")
    
    return shift_pay
