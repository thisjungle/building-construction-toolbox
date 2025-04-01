from flask import Blueprint, render_template, jsonify, request
import json

paychecker_bp = Blueprint('paychecker', __name__)

@paychecker_bp.route('/paychecker')
def paychecker():
    """Render the pay checker page"""
    return render_template('paychecker.html')

@paychecker_bp.route('/api/calculate-pay', methods=['POST'])
def calculate_pay():
    """API endpoint to calculate pay based on timesheet data"""
    try:
        data = request.get_json()
        
        # Load rates and allowances from JSON files
        with open('data/minimum_rates.json', 'r') as f:
            rates_data = json.load(f)
        
        # Extract form data
        classification = data.get('classification')
        employment_type = data.get('employmentType')
        timesheet = data.get('timesheet', [])
        conditions = data.get('conditions', {})
        
        # Get base rate for classification
        base_rate = get_base_rate(classification, rates_data)
        
        # Initialize totals
        total_pay = 0
        daily_breakdown = []
        
        # Calculate for each day
        for day_data in timesheet:
            day = day_data.get('day')
            regular_hours = float(day_data.get('regularHours', 0))
            overtime_hours = float(day_data.get('overtimeHours', 0))
            shift_type = day_data.get('shiftType')
            day_conditions = day_data.get('conditions')
            
            # Calculate daily pay
            day_pay = calculate_daily_pay(
                base_rate=base_rate,
                regular_hours=regular_hours,
                overtime_hours=overtime_hours,
                shift_type=shift_type,
                conditions=day_conditions,
                employment_type=employment_type,
                day_of_week=day
            )
            
            daily_breakdown.append({
                'day': day,
                'total': day_pay,
                'details': {
                    'regular': regular_hours * base_rate,
                    'overtime': overtime_hours * base_rate * 1.5,
                    'shift_loading': calculate_shift_loading(shift_type, base_rate, regular_hours),
                    'conditions': calculate_conditions_allowance(day_conditions)
                }
            })
            
            total_pay += day_pay
        
        # Add other allowances
        if conditions.get('inclementWeather'):
            total_pay += 2.85  # Example rate, adjust as needed
        if conditions.get('travelAllowance'):
            total_pay += 17.43  # Example rate, adjust as needed
        
        return jsonify({
            'success': True,
            'total_pay': round(total_pay, 2),
            'daily_breakdown': daily_breakdown
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

def get_base_rate(classification, rates_data):
    """Get base hourly rate for classification"""
    # Extract classification level (e.g., "CW/ECW 1" -> "1")
    level = classification.split()[1]
    
    # Find matching rate in rates_data
    classification_key = f"CW/ECW {level}"
    if level == "1":
        classification_key += " - Level a"
    
    if classification_key in rates_data['minimum_rates']:
        weekly_rate = rates_data['minimum_rates'][classification_key]['weekly_rate']
        return weekly_rate / 38  # Convert weekly to hourly
    
    raise ValueError(f"Rate not found for classification: {classification}")

def calculate_daily_pay(base_rate, regular_hours, overtime_hours, shift_type, 
                       conditions, employment_type, day_of_week):
    """Calculate total pay for one day"""
    total = 0
    
    # Regular hours
    if employment_type == 'casual':
        total += regular_hours * base_rate * 1.25  # 25% casual loading
    else:
        total += regular_hours * base_rate
    
    # Overtime
    total += overtime_hours * base_rate * 1.5  # Time and a half
    
    # Shift loadings
    if shift_type == 'nightShift':
        total += regular_hours * base_rate * 0.25  # 25% loading
    elif shift_type == 'afternoonShift':
        total += regular_hours * base_rate * 0.15  # 15% loading
    
    # Weekend rates
    if day_of_week == 'Saturday':
        total *= 1.5  # Time and a half
    elif day_of_week == 'Sunday':
        total *= 2.0  # Double time
    
    return total

def calculate_shift_loading(shift_type, base_rate, hours):
    """Calculate shift loading amount"""
    if shift_type == 'nightShift':
        return hours * base_rate * 0.25
    elif shift_type == 'afternoonShift':
        return hours * base_rate * 0.15
    return 0

def calculate_conditions_allowance(conditions):
    """Calculate conditions allowance amount"""
    allowances = {
        'heightWork': 2.93,
        'confinedSpace': 0.76,
        'tools': 32.47
    }
    return allowances.get(conditions, 0) 