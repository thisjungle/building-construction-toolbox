import logging

def calculate_overtime_pay(employee, base_pay_hourly, overtime_rates_config):
    logger = logging.getLogger(__name__)
    overtime_pay = 0.0
    overtime = employee.get('overtime', {})
    day_type = overtime.get('dayType', '').lower()
    hours = overtime.get('hours', 0)
    is_special_saturday = overtime.get('isSpecialSaturday', False)
    
    if hours <= 0:
        return overtime_pay

    try:
        # Access the relevant clauses
        clauses = overtime_rates_config.get("clauses", [])
        for clause in clauses:
            if clause.get("clause_number") == "29":
                sub_clauses = clause.get("sub_clauses", [])
                for sub_clause in sub_clauses:
                    sc = sub_clause.get("sub_clause", "").lower()
                    if sc == "29.4":
                        # Payment for working overtime
                        if day_type == "weekday":
                            first_2 = 1.5
                            after_2 = 2.0
                            if hours <= 2:
                                overtime_pay += base_pay_hourly * first_2 * hours
                            else:
                                overtime_pay += base_pay_hourly * first_2 * 2
                                overtime_pay += base_pay_hourly * after_2 * (hours - 2)
                        elif day_type == "holiday":
                            # Clause 29.9: 250%
                            overtime_pay += base_pay_hourly * 2.5 * hours
                        # Add more day types as per clauses
            elif clause.get("clause_number") == "30":
                # Penalty Rates
                sub_clauses = clause.get("sub_clauses", [])
                for sub_clause in sub_clauses:
                    sc = sub_clause.get("sub_clause", "").lower()
                    if sc == "30.1":
                        if day_type == "saturday":
                            if is_special_saturday:
                                # Clause 30.1(c): 250%
                                overtime_pay += base_pay_hourly * 2.5 * hours
                            else:
                                if hours > 2:
                                    overtime_pay += base_pay_hourly * 2.0 * hours
                                else:
                                    overtime_pay += base_pay_hourly * 1.5 * hours
                        elif day_type == "sunday":
                            # Clause 30.1(d): 200%
                            overtime_pay += base_pay_hourly * 2.0 * hours
                        elif day_type == "publicholiday":
                            # Clause 30.1(e): 250%
                            overtime_pay += base_pay_hourly * 2.5 * hours
            # Handle other clauses as necessary
        logger.info(f"Calculated overtime pay: {overtime_pay} for day type: {day_type}, hours: {hours}")
    except Exception as e:
        logger.error(f"Error calculating overtime pay: {e}")
        raise

    return overtime_pay
