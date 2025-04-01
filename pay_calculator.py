from flask import Blueprint, render_template, jsonify
import json
import os
from datetime import datetime, time

pay_calc_bp = Blueprint('pay_calc', __name__)

def load_config():
    """Load MA00020 configuration file for the pay calculator"""
    try:
        config_path = os.path.join('data', 'ma00020_config.json')
        with open(config_path, 'r', encoding='utf-8') as f:
            award_config = json.load(f)
        return award_config
    except Exception as e:
        print(f"Error loading MA00020 configuration: {str(e)}")
        return None

def get_classification_rate(classification, level=None):
    """Get the hourly rate for a classification and level"""
    config = load_config()
    if not config:
        return None
    
    if classification == "CW/ECW 1" and level:
        return config['classifications']['CW/ECW 1']['levels'][level]['hourly_rate']
    else:
        return config['classifications'][classification]['hourly_rate']

def calculate_overtime_pay(base_rate, hours, overtime_type):
    """Calculate overtime pay based on type and hours"""
    config = load_config()
    if not config:
        return 0
    
    if overtime_type == 'weekday':
        first_two = min(hours, 2)
        remaining = max(0, hours - 2)
        rates = config['overtime']['weekday']
        return (first_two * base_rate * rates['first_two_hours']['rate_multiplier'] +
                remaining * base_rate * rates['after_two_hours']['rate_multiplier'])
    else:
        multiplier = config['overtime'][overtime_type]['rate_multiplier']
        return hours * base_rate * multiplier

def calculate_allowances(allowance_type, conditions=None):
    """Calculate applicable allowances"""
    config = load_config()
    if not config:
        return 0
    
    allowances = config['allowances']
    if allowance_type == 'industry':
        return allowances['industry']['general_building']['amount']
    elif allowance_type == 'tools':
        # Default to carpenter rate if not specified
        return allowances['tools']['carpenter_joiner_stonemason_tilelayer']['amount']
    elif allowance_type == 'meal':
        if conditions and 'overtime_required' in conditions:
            return allowances['meal']['overtime']['amount']
    elif allowance_type == 'travel':
        if conditions and 'distance' in conditions:
            distance = conditions['distance']
            if distance >= allowances['travel']['min_distance']:
                return distance * allowances['travel']['rate_per_km']
    return 0

@pay_calc_bp.route('/pay_calculator')
def index():
    """Render the pay calculator page"""
    try:
        # Load MA00020 configuration
        award_config = load_config()
        
        if not award_config:
            return render_template('error.html', 
                                 error="Failed to load MA00020 configuration",
                                 details="Please check if the configuration file exists and is valid.")
        
        return render_template('pay_calculator.html',
                             award_config=award_config)
                             
    except Exception as e:
        print(f"Error in pay calculator route: {str(e)}")
        return render_template('error.html',
                             error="An error occurred while loading the pay calculator",
                             details=str(e))

@pay_calc_bp.route('/calculate', methods=['POST'])
def calculate():
    """Calculate pay based on form submission"""
    try:
        data = request.get_json()
        
        # Get base rate
        classification = data.get('classification')
        level = data.get('level') if classification == "CW/ECW 1" else None
        base_rate = get_classification_rate(classification, level)
        
        if not base_rate:
            return jsonify({"error": "Invalid classification"}), 400
        
        # Get employment type and apply loading
        employment_type = data.get('employmentType')
        config = load_config()
        loading = config['employment_types'][employment_type]['loading']
        base_rate *= (1 + loading)
        
        # Calculate base pay
        ordinary_hours = float(data.get('ordinaryHours', 0))
        base_pay = base_rate * ordinary_hours
        
        # Calculate overtime
        overtime_hours = float(data.get('overtimeHours', 0))
        weekend_hours = float(data.get('weekendHours', 0))
        public_holiday_hours = float(data.get('publicHolidayHours', 0))
        
        overtime_pay = calculate_overtime_pay(base_rate, overtime_hours, 'weekday')
        weekend_pay = calculate_overtime_pay(base_rate, weekend_hours, 'weekend')
        public_holiday_pay = calculate_overtime_pay(base_rate, public_holiday_hours, 'public_holiday')
        
        # Calculate allowances
        tool_allowance = calculate_allowances('tools')
        industry_allowance = calculate_allowances('industry')
        meal_allowance = calculate_allowances('meal', {'overtime_required': overtime_hours > 0})
        travel_distance = float(data.get('travelDistance', 0))
        travel_allowance = calculate_allowances('travel', {'distance': travel_distance})
        
        # Calculate total
        total_pay = (base_pay + overtime_pay + weekend_pay + public_holiday_pay +
                    tool_allowance + industry_allowance + meal_allowance + travel_allowance)
        
        return jsonify({
            "success": True,
            "data": {
                "base_pay": round(base_pay, 2),
                "overtime_pay": round(overtime_pay, 2),
                "weekend_pay": round(weekend_pay, 2),
                "public_holiday_pay": round(public_holiday_pay, 2),
                "tool_allowance": round(tool_allowance, 2),
                "industry_allowance": round(industry_allowance, 2),
                "meal_allowance": round(meal_allowance, 2),
                "travel_allowance": round(travel_allowance, 2),
                "total_pay": round(total_pay, 2)
            }
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500 