from datetime import datetime, timedelta, time
import json
from pathlib import Path

class PayCalculator:
    # Standard hours definitions
    STANDARD_START_TIME = time(7, 0)  # 7:00 AM
    STANDARD_END_TIME = time(18, 0)   # 6:00 PM
    STANDARD_HOURS_PER_WEEK = 38
    
    # Shift Definitions (Clause 17.2(a))
    SHIFT_DEFINITIONS = {
        "Day": (time(6, 0), time(10, 0)),       # 6:00 AM to 10:00 AM
        "Afternoon": (time(10, 0), time(20, 0)), # 10:00 AM to 8:00 PM
        "Night": (time(20, 0), time(6, 0)),      # 8:00 PM to 6:00 AM (next day)
    }
    
    def __init__(self):
        self.load_data()
        
    def load_data(self):
        """Load award rates and allowances from JSON files"""
        data_dir = Path("data")
        try:
            with open(data_dir / "award_rates.json", "r") as f:
                self.award_rates = json.load(f)
            with open(data_dir / "allowancescheck.json", "r") as f:
                self.allowances = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError) as e:
            print(f"Error loading JSON data: {e}")
            raise

    def is_outside_ordinary_hours(self, start_time, end_time):
        """Check if work hours are outside ordinary hours (7am-6pm)"""
        return (start_time < self.STANDARD_START_TIME or 
                end_time > self.STANDARD_END_TIME)

    def calculate_daily_hours(self, timesheet_entry):
        """
        Calculates hours worked in a timesheet entry, handling overnight shifts
        Returns tuple of (ordinary_hours, overtime_hours)
        """
        try:
            start_time = datetime.strptime(timesheet_entry["StartTime"], "%H:%M").time()
            end_time = datetime.strptime(timesheet_entry["EndTime"], "%H:%M").time()
            
            # Convert times to datetime for calculation
            start_dt = datetime.combine(datetime.min, start_time)
            end_dt = datetime.combine(datetime.min, end_time)
            
            # Handle overnight shifts
            if end_dt < start_dt:
                end_dt += timedelta(days=1)
            
            # Calculate total duration
            duration = end_dt - start_dt
            total_hours = duration.total_seconds() / 3600
            
            # Determine if these are overtime hours
            is_overtime = (
                timesheet_entry["IsOvertime"] == "yes" or
                timesheet_entry["IsRDO"] == "yes" or
                self.is_outside_ordinary_hours(start_time, end_time)
            )
            
            if is_overtime:
                return (0, total_hours)
            else:
                return (total_hours, 0)
                
        except Exception as e:
            print(f"Error calculating hours: {e}")
            return (0, 0)

    def calculate_allowance_base(self, employee, base_rate, weekly_rate):
        """Calculate base rate including 'all purposes' allowances"""
        all_purposes_total = 0
        
        for allowance in self.allowances:
            if allowance.get("all_purposes", False):
                amount = self.calculate_allowance(
                    allowance, employee, [], weekly_rate, self.STANDARD_HOURS_PER_WEEK
                )
                if amount > 0:
                    if allowance["type"] == "weekly":
                        all_purposes_total += amount / self.STANDARD_HOURS_PER_WEEK
                    elif allowance["type"] == "percentage":
                        all_purposes_total += (weekly_rate * allowance["amount"] / 100.0) / self.STANDARD_HOURS_PER_WEEK
        
        return base_rate + all_purposes_total

    def calculate_shift_penalties(self, timesheet_entries, employee_id, base_rate):
        """Calculate shift penalties with proper overtime interaction"""
        total_penalties = 0
        
        for entry in timesheet_entries:
            if entry["EmployeeID"] != employee_id:
                continue
            
            hours = self.calculate_daily_hours(entry)
            shift_type = self.determine_shift_type(entry["StartTime"], entry["EndTime"])
            
            # Apply appropriate penalty rate before overtime
            penalty_rate = 0
            if shift_type == "Night":
                penalty_rate = 0.5  # 150%
            elif shift_type == "Afternoon":
                penalty_rate = 0.5  # 150%
            elif shift_type == "Early Morning":
                penalty_rate = 0.5  # 150%
            elif shift_type in ["Morning", "Early Afternoon"]:
                penalty_rate = 0.25  # 125%
            
            if penalty_rate > 0:
                total_penalties += hours * base_rate * penalty_rate
            
        return total_penalties

    def calculate_weekly_wage(self, employee, timesheet_entries):
        """Calculates weekly wage including allowances"""
        try:
            # Get base rate and validate classification
            classification = employee["CurrentClassification"]
            if not classification or classification not in self.award_rates:
                return {
                    "success": False,
                    "error": f"Invalid classification: {classification}"
                }

            # Get base rates
            base_rate = self.award_rates[classification]["hourly_rate"]
            weekly_rate = self.award_rates[classification]["weekly_rate"]

            # Apply daily hire loading if applicable
            if employee["EmploymentType"] == "Daily Hire":
                base_rate = base_rate * (52 / 50.4)  # Apply daily hire loading

            # Calculate base rate including 'all purposes' allowances
            effective_base_rate = self.calculate_allowance_base(employee, base_rate, weekly_rate)

            # Initialize all counters
            ordinary_hours = 0
            overtime_hours = 0
            shift_penalties = 0
            saturday_hours = 0
            sunday_hours = 0
            allowance_breakdown = {}

            # Process timesheet entries
            for entry in timesheet_entries:
                if entry["EmployeeID"] != employee["EmployeeID"]:
                    continue

                # Get date and day of week
                try:
                    date_obj = datetime.strptime(entry["Date"], "%Y-%m-%d").date()
                    day_of_week = date_obj.weekday()  # 0 = Monday, 6 = Sunday
                except ValueError:
                    return {
                        "success": False,
                        "error": f"Invalid date format in entry {entry.get('TimesheetID')}"
                    }

                hours = self.calculate_daily_hours(entry)
                
                # Categorize hours based on day and type
                if day_of_week == 5:  # Saturday
                    saturday_hours += hours
                elif day_of_week == 6:  # Sunday
                    sunday_hours += hours
                elif entry["IsOvertime"] == "yes":
                    overtime_hours += hours
                elif entry["IsOrdinaryHours"] == "yes":
                    ordinary_hours += hours

                # Calculate shift penalties with full Clause 17 rules
                shift_penalties += self.calculate_shift_penalties(
                    timesheet_entries,
                    employee["EmployeeID"],
                    effective_base_rate
                )

            # Calculate different pay components
            base_pay = ordinary_hours * effective_base_rate
            
            # Overtime calculation
            overtime_pay = self.calculate_overtime_pay(overtime_hours, effective_base_rate)
            
            # Weekend rates
            saturday_pay = self.calculate_saturday_pay(saturday_hours, effective_base_rate)
            sunday_pay = sunday_hours * effective_base_rate * 2.0  # Sunday always double time

            # Calculate allowances
            total_allowances = 0
            for allowance in self.allowances:
                amount = self.calculate_allowance(
                    allowance, employee, timesheet_entries, weekly_rate, ordinary_hours
                )
                if amount > 0:
                    total_allowances += amount
                    allowance_breakdown[allowance["description"]] = round(amount, 2)

            # Calculate multistorey allowance
            multistorey_allowance = self.calculate_multistorey_allowance(
                timesheet_entries, 
                employee["EmployeeID"],
                effective_base_rate
            )
            if multistorey_allowance > 0:
                allowance_breakdown["Multistorey Allowance"] = round(multistorey_allowance, 2)
                total_allowances += multistorey_allowance

            # Calculate total
            total_pay = (
                base_pay + 
                overtime_pay + 
                shift_penalties + 
                saturday_pay + 
                sunday_pay + 
                total_allowances
            )

            return {
                "success": True,
                "data": {
                    "employee_name": employee["Name"],
                    "classification": classification,
                    "employment_type": employee["EmploymentType"],
                    "base_rate": round(effective_base_rate, 2),
                    "ordinary_hours": round(ordinary_hours, 2),
                    "overtime_hours": round(overtime_hours, 2),
                    "saturday_hours": round(saturday_hours, 2),
                    "sunday_hours": round(sunday_hours, 2),
                    "base_pay": round(base_pay, 2),
                    "overtime_pay": round(overtime_pay, 2),
                    "saturday_pay": round(saturday_pay, 2),
                    "sunday_pay": round(sunday_pay, 2),
                    "shift_penalties": round(shift_penalties, 2),
                    "allowances": allowance_breakdown,
                    "total_pay": round(total_pay, 2)
                }
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def calculate_allowance(self, allowance, employee, timesheet_entries, weekly_rate, ordinary_hours, base_rate=None):
        """Calculates a single allowance amount"""
        # Handle special cases first
        if allowance["code"] == "MULTISTOREY_TOWER":
            return self.calculate_multistorey_tower(allowance, employee, timesheet_entries)
        
        if allowance["code"] == "INCLEMENT_WEATHER":
            if not base_rate:
                return 0
            return self.calculate_inclement_weather(allowance, employee, timesheet_entries, base_rate)
        
        # Check if all conditions are met
        if "conditions" in allowance:
            for condition in allowance["conditions"]:
                # For weekly/percentage allowances, check against employee only
                if allowance["type"] in ["weekly", "percentage"]:
                    if not self.evaluate_condition(employee, None, condition):
                        return 0
                # For other types, need to check each timesheet entry
                else:
                    applicable = False
                    for entry in timesheet_entries:
                        if entry["EmployeeID"] == employee["EmployeeID"]:
                            if self.evaluate_condition(employee, entry, condition):
                                applicable = True
                                break
                    if not applicable:
                        return 0

        # Calculate amount based on allowance type
        if allowance["type"] == "weekly":
            if employee["EmploymentType"] == "Part-Time Weekly":
                return allowance["amount"] * (ordinary_hours / 38.0)
            return allowance["amount"]

        elif allowance["type"] == "percentage":
            return weekly_rate * (allowance["amount"] / 100.0)

        elif allowance["type"] == "daily":
            # Count unique days where conditions are met
            applicable_days = set()
            for entry in timesheet_entries:
                if entry["EmployeeID"] == employee["EmployeeID"]:
                    all_conditions_met = True
                    for condition in allowance.get("conditions", []):
                        if not self.evaluate_condition(employee, entry, condition):
                            all_conditions_met = False
                            break
                    if all_conditions_met:
                        applicable_days.add(entry["Date"])
            return allowance["amount"] * len(applicable_days)

        elif allowance["type"] == "hourly":
            # Sum hours where conditions are met
            applicable_hours = 0
            for entry in timesheet_entries:
                if entry["EmployeeID"] == employee["EmployeeID"]:
                    all_conditions_met = True
                    for condition in allowance.get("conditions", []):
                        if not self.evaluate_condition(employee, entry, condition):
                            all_conditions_met = False
                            break
                    if all_conditions_met:
                        applicable_hours += self.calculate_daily_hours(entry)[0]
            return allowance["amount"] * applicable_hours

        elif allowance["type"] == "per_km":
            # This would need additional logic to calculate distance
            # For now, assuming distance is provided in employee data
            if "DistanceFromResidence" in employee:
                return allowance["amount"] * employee["DistanceFromResidence"]
            return 0

        return 0

    def evaluate_condition(self, employee, timesheet_entry, condition):
        """Evaluates a single allowance condition"""
        field = condition["field"]
        operator = condition["operator"]
        
        # Get the actual value from employee or timesheet data
        if field in employee:
            actual_value = employee[field]
        elif timesheet_entry and field in timesheet_entry:
            actual_value = timesheet_entry[field]
        else:
            print(f"Warning: Field '{field}' not found in employee or timesheet data")
            return False

        # Handle different operator types
        if "values" in condition:  # For 'in' and 'not in' operators
            required_values = condition["values"]
        else:
            required_value = condition["value"]

        # Evaluate the condition
        if operator == "==":
            return actual_value == required_value
        elif operator == "!=":
            return actual_value != required_value
        elif operator == ">":
            return actual_value > required_value
        elif operator == "<":
            return actual_value < required_value
        elif operator == ">=":
            return actual_value >= required_value
        elif operator == "<=":
            return actual_value <= required_value
        elif operator == "in":
            return actual_value in required_values
        elif operator == "not in":
            return actual_value not in required_values
        else:
            print(f"Warning: Unknown operator '{operator}'")
            return False

    def calculate_rdo_accrual(self, timesheet_entries, employee_id):
        """Calculate RDO accrual for the week"""
        RDO_ACCRUAL_RATE = 0.4  # 0.4 hours per 8 hour day
        
        accrued_hours = 0
        for entry in timesheet_entries:
            if (entry["EmployeeID"] == employee_id and 
                entry["IsRDO"] == "no" and 
                entry["IsOrdinaryHours"] == "yes"):
                
                ord_hrs, _ = self.calculate_daily_hours(entry)
                if ord_hrs >= 8:  # Only accrue RDO for full days
                    accrued_hours += RDO_ACCRUAL_RATE
        
        return accrued_hours

    def calculate_multistorey_tower(self, allowance, employee, timesheet_entries):
        """Calculate multistorey allowance for tower construction"""
        if not any(self.evaluate_condition(employee, None, c) for c in allowance["conditions"]):
            return 0
        
        height = employee.get("Height", 0)
        if height <= 15:
            return 0
        
        # Calculate increments above 15m
        increment = allowance.get("increment", 15)
        num_increments = ((height - 15) // increment) + 1
        
        # Calculate hours worked on tower
        tower_hours = 0
        for entry in timesheet_entries:
            if (entry["EmployeeID"] == employee["EmployeeID"] and 
                entry["BuildingType"] == "tower"):
                ord_hrs, ot_hrs = self.calculate_daily_hours(entry)
                tower_hours += ord_hrs + ot_hrs
        
        return allowance["amount"] * num_increments * tower_hours

    def calculate_inclement_weather(self, allowance, employee, timesheet_entries, base_rate):
        """Calculate inclement weather allowance using base rate"""
        total_amount = 0
        for entry in timesheet_entries:
            if (entry["EmployeeID"] == employee["EmployeeID"] and 
                entry["WasInclementWeather"] == "yes"):
                
                # Use base rate for calculation
                hours = sum(self.calculate_daily_hours(entry))
                total_amount += hours * base_rate
        
        return total_amount

    def calculate_overtime_pay(self, overtime_hours, base_rate):
        """Calculate overtime pay with proper rates"""
        if overtime_hours <= 0:
            return 0
        
        first_two = min(overtime_hours, 2)
        remaining = max(overtime_hours - 2, 0)
        return (first_two * base_rate * 1.5) + (remaining * base_rate * 2.0)

    def calculate_saturday_pay(self, saturday_hours, base_rate):
        """Calculate Saturday pay with proper rates"""
        if saturday_hours <= 0:
            return 0
        
        first_two = min(saturday_hours, 2)
        remaining = max(saturday_hours - 2, 0)
        return (first_two * base_rate * 1.5) + (remaining * base_rate * 2.0)

    def determine_shift_type(self, start_time, end_time):
        """Determines shift type based on start and end times"""
        start = datetime.strptime(start_time, "%H:%M").time()
        end = datetime.strptime(end_time, "%H:%M").time()
        
        for shift_type, (shift_start, shift_end) in self.SHIFT_DEFINITIONS.items():
            if start >= shift_start and (end <= shift_end or shift_type == "Night"):
                return shift_type
        return "Day"  # Default to day shift if no match 

    def calculate_multistorey_allowance(self, timesheet_entries, employee_id, base_rate):
        """Calculate multistorey allowance based on building type and level"""
        total_allowance = 0
        
        for entry in timesheet_entries:
            if entry["EmployeeID"] != employee_id:
                continue
            
            hours = self.calculate_daily_hours(entry)
            building_type = entry.get("BuildingType")
            
            if building_type == "tower":
                # Handle tower construction (per 15m increment above 15m)
                height = entry.get("Height", 0)
                if height > 15:
                    increments = ((height - 15) // 15) + 1
                    total_allowance += 0.87 * increments * hours
                
            elif building_type == "multistorey":
                # Handle regular multistorey building
                level = entry.get("StoreyLevel", 0)
                rate = 0
                
                if level >= 61:
                    rate = 2.06
                elif level >= 46:
                    rate = 1.68
                elif level >= 31:
                    rate = 1.30
                elif level >= 16:
                    rate = 0.84
                elif level >= 5:
                    rate = 0.71
                
                total_allowance += rate * hours
                
        return total_allowance 