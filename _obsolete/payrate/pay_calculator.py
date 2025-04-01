from flask import Blueprint, render_template, request, jsonify
from .models.calculator import PayCalculator
from datetime import datetime, timedelta
import uuid

pay_calculator_bp = Blueprint('pay_calculator', __name__)
calculator = PayCalculator()

def validate_employee_data(employee):
    """Validate employee data against required fields and formats"""
    required_fields = {
        'EmployeeID': str,
        'Name': str,
        'DateOfBirth': str,
        'StartDate': str,
        'EmploymentType': str,
        'IsApprentice': bool,
        'ApprenticeshipStartDate': (str, type(None)),
        'ApprenticeshipYears': int,
        'ApprenticeshipType': (str, type(None)),
        'ApprenticeshipYear12': str,
        'IndustrySector': str,
        'ToolAllowanceType': (str, type(None)),
        'HasElectricianLicense': bool,
        'FirstAidCertificateType': str,
        'IsEligibleEmployeeRepresentative': bool,
        'UsualPlaceOfResidence': str,
        'HasSeparateResidence': bool,
        'SeparateResidenceAddress': (str, type(None)),
        'IsOnDistantWork': bool,
        'DistantWorkLocation': (str, type(None)),
        'IsLeadingHand': bool,
        'LeadingHandPersons': int,
        'CurrentClassification': str,
        'Residential': bool,
        'WorkLocation': (str, type(None)),
        'PartTimeHours': (float, type(None)),
        'TravelCoveredByEmployer': bool,
        'BuildingType': (str, type(None)),
        'StoreyLevel': (int, type(None)),
        'Height': (float, type(None))
    }
    
    errors = []
    
    for field, field_type in required_fields.items():
        if field not in employee:
            errors.append(f"Missing required field: {field}")
            continue
            
        if isinstance(field_type, tuple):
            if not any(isinstance(employee[field], t) for t in field_type):
                errors.append(f"Invalid type for {field}. Expected one of {field_type}")
        elif not isinstance(employee[field], field_type):
            errors.append(f"Invalid type for {field}. Expected {field_type}")
    
    # Additional validation for specific fields
    if employee.get('EmploymentType') not in ["Daily Hire", "Full-Time Weekly", "Part-Time Weekly", "Casual"]:
        errors.append("Invalid EmploymentType")
        
    if employee.get('IndustrySector') not in ["General Building", "Civil Construction", "Metal and Engineering"]:
        errors.append("Invalid IndustrySector")
        
    if employee.get('FirstAidCertificateType') not in ["Basic", "Higher", "None"]:
        errors.append("Invalid FirstAidCertificateType")
    
    # Validate date formats
    date_fields = ['DateOfBirth', 'StartDate']
    if employee.get('ApprenticeshipStartDate'):
        date_fields.append('ApprenticeshipStartDate')
        
    for date_field in date_fields:
        if date_field in employee:
            try:
                datetime.strptime(employee[date_field], '%Y-%m-%d')
            except ValueError:
                errors.append(f"Invalid date format for {date_field}. Use YYYY-MM-DD")
    
    return errors

def validate_timesheet_entry(entry):
    """Validate timesheet entry data against required fields and formats"""
    required_fields = {
        'TimesheetID': int,
        'EmployeeID': str,
        'Date': str,
        'StartTime': str,
        'EndTime': str,
        'IsOrdinaryHours': str,
        'IsOvertime': str,
        'IsRDO': str,
        'WasInclementWeather': str,
        'WorkedWithToxicMaterials': str,
        'ShiftType': str,
        'WorkLocation': str,
        'BuildingType': str,
        'StoreyLevel': int
    }
    
    errors = []
    
    for field, field_type in required_fields.items():
        if field not in entry:
            errors.append(f"Missing required field: {field}")
            continue
            
        if not isinstance(entry[field], field_type):
            errors.append(f"Invalid type for {field}. Expected {field_type}")
    
    # Validate yes/no fields
    yes_no_fields = ['IsOrdinaryHours', 'IsOvertime', 'IsRDO', 
                     'WasInclementWeather', 'WorkedWithToxicMaterials']
    for field in yes_no_fields:
        if entry.get(field) not in ['yes', 'no']:
            errors.append(f"Invalid value for {field}. Must be 'yes' or 'no'")
    
    # Validate time formats
    time_fields = ['StartTime', 'EndTime']
    for time_field in time_fields:
        if time_field in entry:
            try:
                datetime.strptime(entry[time_field], '%H:%M')
            except ValueError:
                errors.append(f"Invalid time format for {time_field}. Use HH:MM")
    
    # Validate date format
    try:
        datetime.strptime(entry['Date'], '%Y-%m-%d')
    except ValueError:
        errors.append("Invalid date format for Date. Use YYYY-MM-DD")
    
    return errors

@pay_calculator_bp.route('/calculator')
def calculator_page():
    """Render the pay calculator page"""
    return render_template('pay_calculator.html')

@pay_calculator_bp.route('/calculate', methods=['POST'])
def calculate_pay():
    try:
        employee_id = request.form.get('employee')
        week_starting = request.form.get('week_starting')
        
        if not employee_id or not week_starting:
            return jsonify({
                "success": False,
                "error": "Missing required fields"
            }), 400
            
        # Get employee data
        employee = next(
            (emp for emp in calculator.employees if emp["EmployeeID"] == employee_id),
            None
        )
        if not employee:
            return jsonify({
                "success": False,
                "error": "Employee not found"
            }), 404
            
        # Get timesheet entries for the week
        week_end = (
            datetime.strptime(week_starting, '%Y-%m-%d') + 
            timedelta(days=6)
        ).strftime('%Y-%m-%d')
        
        timesheet_entries = [
            entry for entry in calculator.timesheets
            if entry["EmployeeID"] == employee_id
            and week_starting <= entry["Date"] <= week_end
        ]
        
        # Calculate pay
        result = calculator.calculate_weekly_wage(employee, timesheet_entries)
        
        if result["success"]:
            return jsonify(result)
        else:
            return jsonify({
                "success": False,
                "error": result["error"]
            }), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500 

@pay_calculator_bp.route('/add-employee', methods=['POST'])
def add_employee():
    try:
        # Get form data
        employee_data = {
            'EmployeeID': str(uuid.uuid4()),  # Generate unique ID
            'Name': request.form.get('Name'),
            'DateOfBirth': request.form.get('DateOfBirth'),
            'StartDate': request.form.get('StartDate'),
            'EmploymentType': request.form.get('EmploymentType'),
            'CurrentClassification': request.form.get('CurrentClassification'),
            'IsApprentice': request.form.get('IsApprentice') == 'on',
            'HasElectricianLicense': request.form.get('HasElectricianLicense') == 'on',
            # Add other required fields with defaults
            'ApprenticeshipStartDate': None,
            'ApprenticeshipYears': 0,
            'ApprenticeshipType': None,
            'ApprenticeshipYear12': 'no',
            'IndustrySector': 'General Building',
            'ToolAllowanceType': None,
            'FirstAidCertificateType': 'None',
            'IsEligibleEmployeeRepresentative': False,
            'UsualPlaceOfResidence': '',
            'HasSeparateResidence': False,
            'SeparateResidenceAddress': None,
            'IsOnDistantWork': False,
            'DistantWorkLocation': None,
            'IsLeadingHand': False,
            'LeadingHandPersons': 0,
            'Residential': False,
            'WorkLocation': None,
            'PartTimeHours': None,
            'TravelCoveredByEmployer': False,
            'BuildingType': None,
            'StoreyLevel': None,
            'Height': None
        }
        
        # Validate employee data
        errors = validate_employee_data(employee_data)
        if errors:
            return jsonify({
                'success': False,
                'error': 'Validation errors: ' + ', '.join(errors)
            }), 400

        # Add to calculator's employees list
        calculator.employees.append(employee_data)
        
        return jsonify({
            'success': True,
            'data': employee_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500 