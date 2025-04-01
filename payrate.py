from flask import Blueprint, render_template, redirect, url_for, session, jsonify, request
import json
from utils.data_loader import min_rates_data

# Create Blueprint for pay rate routes
payrate_bp = Blueprint('payrate', __name__)

def load_json_data():
    """Load all required JSON data files"""
    try:
        # Load classifications
        with open('data/classifications.json', 'r') as f:
            classifications_data = json.load(f)
        
        # Load minimum rates
        with open('data/minimum_rates.json', 'r') as f:
            minimum_rates = json.load(f)
        
        # Load work categories and allowances
        with open('data/work_categories_and_allowances.json', 'r') as f:
            work_data = json.load(f)
            print("\nLoaded work_categories_and_allowances.json contents:", work_data.keys())
            
        return classifications_data, minimum_rates, work_data
    except Exception as e:
        print(f"Error loading JSON data: {str(e)}")
        raise

def get_category_allowance(work_type, work_data):
    """Get the category allowance amount based on work type"""
    print(f"Looking up allowance for work type: {work_type}")
    print("Available work categories:", work_data.keys())
    
    if work_type == 'None':
        return 0
    
    categories = work_data.get("work_categories", {})
    
    # Direct category matches
    if work_type in categories:
        return categories[work_type]["allowance"]["amount"]
    
    # Engineering construction streams
    if work_type in ["electrical_electronic", "mechanical", "fabrication"]:
        return categories["engineering_construction"]["streams"][work_type]["allowance"]["amount"]
    
    return 0

@payrate_bp.route('/payrate')
def payrate_page():
    """
    Main pay rate page route - redirects to first question
    """
    # Clear any existing session data for a fresh start
    session.pop('workType', None)
    session.pop('roleLevel', None)
    session.pop('taskLevel', None)
    session.pop('qualificationLevel', None)
    return redirect(url_for('payrate.question_1'))

@payrate_bp.route('/payrate/q1')
def question_1():
    """Question 1: Work Type"""
    return render_template('payrate/question1.html')

@payrate_bp.route('/payrate/q2')
def question_2():
    """Question 2: Role Level"""
    return render_template('payrate/question2.html')

@payrate_bp.route('/payrate/q3')
def question_3():
    """Question 3: Employment Type"""
    return render_template('payrate/question3.html')

@payrate_bp.route('/payrate/q4')
def question_4():
    """Question 4: Tool Allowance"""
    return render_template('payrate/question4.html')

@payrate_bp.route('/payrate/q5')
def question_5():
    """Question 5: Tool Allowance Category"""
    return render_template('payrate/question5.html')

@payrate_bp.route('/payrate/q6')
def question_6():
    """Question 6: First Aid Allowance"""
    return render_template('payrate/question6.html')

@payrate_bp.route('/payrate/q7')
def question_7():
    """Question 7: Special Allowances"""
    return render_template('payrate/question7.html')

@payrate_bp.route('/payrate/results')
def results():
    """Results page showing detailed pay calculation"""
    # Load all data
    classifications_data, minimum_rates, work_data = load_json_data()
    
    # Get selections from session with detailed logging
    work_type = session.get('workType', 'None')
    role_level = session.get('roleLevel', 'None')
    employment_type = session.get('employmentType', 'None')
    tool_allowance = session.get('toolAllowance', 'no')
    tool_category = session.get('toolAllowanceCategory', None)
    first_aid = session.get('firstAidAllowance', 'no')
    special_allowance_type = session.get('specialAllowances', 'none')
    
    # Calculate tool allowance
    tool_allowance_amount = 0
    if tool_allowance == 'yes' and tool_category:
        tool_allowance_map = {
            'Specialized-Bricklaying': 23.37,
            'Construction-Sector': 32.47,
            'Plumbing-Services': 32.47,
            'Painting-Services': 7.82,
            'Plastering-Work': 7.82,
            'Mid-Level': 32.47
        }
        tool_allowance_amount = tool_allowance_map.get(tool_category, 0)
    
    # Calculate first aid allowance
    first_aid_allowance = 0
    if first_aid == 'minimum':
        first_aid_allowance = 3.72
    elif first_aid == 'higher':
        first_aid_allowance = 5.72
    
    # Calculate special allowance
    special_allowance = 0
    if special_allowance_type == 'electrician_licence':
        special_allowance = 33.03
    elif special_allowance_type == 'in_charge_of_plant':
        special_allowance = 48.52
    
    # Calculate base rates and allowances
    base_weekly_rate = 0
    casual_loading = 0
    category_allowance = get_category_allowance(work_type, work_data)
    
    # Calculate base pay and casual loading
    if role_level != 'None':
        level_number = role_level.split('_')[1]
        classification = f"CW/ECW {level_number}"
        if level_number == "1":
            classification_key = "CW/ECW 1 - Level a"
        else:
            classification_key = classification
    else:
        classification = 'None'
        classification_key = None

    if classification_key and classification_key in minimum_rates["minimum_rates"]:
        rate_info = minimum_rates["minimum_rates"][classification_key]
        base_weekly_rate = rate_info["weekly_rate"]
        base_weekly_rate += category_allowance
        
        if employment_type == 'Casual':
            casual_loading = base_weekly_rate * 0.25
            base_weekly_rate += casual_loading

    # Calculate total (including all allowances)
    total_weekly = (base_weekly_rate - casual_loading) + casual_loading + tool_allowance_amount + (first_aid_allowance * 5) + special_allowance
    
    print("\n=== Final Calculations ===")
    print(f"Base Weekly Rate: ${base_weekly_rate - casual_loading}")
    print(f"Casual Loading: ${casual_loading}")
    print(f"Tool Allowance: ${tool_allowance_amount}")
    print(f"First Aid Allowance (daily): ${first_aid_allowance}")
    print(f"Special Allowance: ${special_allowance}")
    print(f"Total Weekly Pay: ${total_weekly}")
    
    return render_template('payrate/results.html',
                         category=work_type.replace('_', ' ').title() if work_type != 'None' else work_type,
                         classification=classification,
                         is_casual=(employment_type == 'Casual'),
                         base_weekly_rate=base_weekly_rate - casual_loading,
                         casual_loading=casual_loading,
                         category_allowance=category_allowance,
                         tool_allowance=tool_allowance_amount,
                         first_aid_allowance=first_aid_allowance,
                         special_allowance=special_allowance,
                         special_allowance_type=special_allowance_type,
                         total_weekly_pay=total_weekly)

@payrate_bp.route('/payrate/store_selection', methods=['POST'])
def store_selection():
    """Store user selection in session"""
    data = request.get_json()
    key = data.get('key')
    value = data.get('value')
    
    if key and value:
        session[key] = value
        print(f"Stored in session - {key}: {value}")
        print("Current session:", dict(session))
        return jsonify({"success": True, "message": f"Stored {key}: {value}"})
    
    return jsonify({"success": False, "message": "Invalid data"}), 400

@payrate_bp.route('/pay-calculator')
def pay_calculator():
    return render_template('payrate/pay_calculator.html') 