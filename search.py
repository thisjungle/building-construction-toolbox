from flask import Blueprint, render_template, jsonify, request
from utils.data_loader import (
    broadband_data, 
    quals_data, 
    min_rates_data, 
    skills_data,
    classifications
)

# Create Blueprint for search routes
search_bp = Blueprint('search', __name__)

@search_bp.route('/search')
def search_page():
    """
    Main search page route
    Loads all role data and renders the search template
    Returns: Rendered search.html template with roles data
    """
    from_employee = request.args.get('from_employee')
    employee_id = request.args.get('employee_id')
    
    # Create roles list
    roles = []
    # Iterate through each stream and level in the broadband classifications
    for stream, levels in broadband_data['Broadbanded_Classifications'].items():
        for level, titles in levels.items():
            level_num = level.split('_')[1]
            
            # Get rates from minimum_rates.json
            try:
                # Format the level key to match minimum_rates.json format
                if level_num == '1':
                    rate_key = f"CW/ECW 1 - Level a"  # Default to level a
                else:
                    rate_key = f"CW/ECW {level_num}"
                
                weekly_rate = min_rates_data['minimum_rates'][rate_key]['weekly_rate']
                hourly_rate = min_rates_data['minimum_rates'][rate_key]['hourly_rate']
            except KeyError:
                weekly_rate = 'N/A'
                hourly_rate = 'N/A'
            
            # Create a role entry for each title
            for title in titles:
                try:
                    # Get tasks from classifications.json
                    tasks = []
                    for classification in classifications['classifications']:
                        if classification['level'] == f"CW/ECW {level_num}":
                            tasks = classification.get('tasks', [])
                            break
                    
                    role = {
                        'title': title,
                        'level': f"Level {level_num} - {stream}",
                        'stream': stream,
                        'skills': skills_data['Skills_and_Duties'][stream].get(level, []),
                        'tasks': tasks,
                        'qualifications': quals_data['Qualifications'][stream].get(level, []),
                        'weekly_rate': weekly_rate,
                        'hourly_rate': hourly_rate
                    }
                    roles.append(role)
                except KeyError as e:
                    print(f"Error processing {stream} {level}: {e}")
                    continue
    
    return render_template('search.html', 
                         from_employee=from_employee,
                         employee_id=employee_id,
                         roles=roles) 