from flask import Flask, render_template, jsonify, request
import json

app = Flask(__name__, 
            template_folder='templates',
            static_folder='static')

def load_json_data():
    """Load all JSON data files."""
    try:
        with open('classifications.json', 'r') as f:
            classifications = json.load(f)
        with open('broadband.json', 'r') as f:
            roles = json.load(f)
        with open('qualifications.json', 'r') as f:
            qualifications = json.load(f)
        with open('skills_and_duties.json', 'r') as f:
            skills = json.load(f)
        with open('indicative_tasks.json', 'r') as f:
            tasks = json.load(f)
        return classifications, roles, qualifications, skills, tasks
    except FileNotFoundError as e:
        print(f"Error loading JSON files: {e}")
        return {}, {}, {}, {}, {}

def get_all_streams_data(data_dict, level_key):
    """Collect data from all streams for a specific level."""
    all_items = []
    
    # Get main streams
    for stream in ['General Construction', 'Civil Construction']:
        items = data_dict.get(stream, {}).get(level_key, [])
        all_items.extend(items)
    
    # Get engineering sub-streams
    eng_const = data_dict.get('Engineering Construction', {})
    if isinstance(eng_const, dict):
        for sub_stream in ['Electrical', 'Mechanical', 'Fabrication']:
            if sub_stream in eng_const:
                items = eng_const[sub_stream].get(level_key, [])
                all_items.extend(items)
    
    return list(set(all_items))  # Remove duplicates

def get_stream_data(stream, level):
    """Get all data for a specific stream and level."""
    _, roles, qualifications, skills, tasks = load_json_data()
    level_key = f'Level_{level}'

    # Handle 'all' streams selection
    if stream == 'all':
        return {
            'roles': get_all_streams_data(roles['Broadbanded_Classifications'], level_key),
            'qualifications': get_all_streams_data(qualifications['Qualifications'], level_key),
            'skills': get_all_streams_data(skills['Skills_and_Duties'], level_key),
            'tasks': get_all_streams_data(tasks['Indicative_Tasks'], level_key)
        }
    
    # Handle engineering sub-streams
    if stream.startswith('Engineering.'):
        _, sub_stream = stream.split('.')
        return {
            'roles': roles['Broadbanded_Classifications']['Engineering Construction'][sub_stream].get(level_key, []),
            'qualifications': qualifications['Qualifications']['Engineering Construction'][sub_stream].get(level_key, []),
            'skills': skills['Skills_and_Duties']['Engineering Construction'][sub_stream].get(level_key, []),
            'tasks': tasks['Indicative_Tasks']['Engineering Construction'][sub_stream].get(level_key, [])
        }
    
    # Handle regular streams
    return {
        'roles': roles['Broadbanded_Classifications'].get(stream, {}).get(level_key, []),
        'qualifications': qualifications['Qualifications'].get(stream, {}).get(level_key, []),
        'skills': skills['Skills_and_Duties'].get(stream, {}).get(level_key, []),
        'tasks': tasks['Indicative_Tasks'].get(stream, {}).get(level_key, [])
    }

@app.route('/')
def index():
    """Main page route."""
    classifications, _, _, _, _ = load_json_data()
    return render_template('employer_dashboard.html',
                         classifications=classifications)

@app.route('/search')
def search():
    return render_template('search.html')

@app.route('/get_level_details', methods=['POST'])
def get_level_details():
    try:
        data = request.get_json()
        level = data.get('level')
        stream = data.get('stream')

        # Load both classification files with UTF-8 encoding
        with open('classifications.json', 'r', encoding='utf-8') as f:
            classifications = json.load(f)
        
        with open('business_classifications.json', 'r', encoding='utf-8') as f:
            business_data = json.load(f)

        # Get the technical level data
        level_data = next((l for l in classifications['ScheduleA']['Levels'] 
                          if l['Level'].startswith(f'CW/ECW {level}')), None)

        # Get the business-friendly data
        business_level_data = next((l for l in business_data['levels'] 
                                  if l['level'].startswith(f'CW/ECW {level}')), None)

        if level_data and business_level_data:
            return jsonify({
                'level': level_data['Level'],
                'business_title': business_level_data['business_title'],
                'summary_tags': business_level_data['summary_tags'],
                'business_description': business_level_data['business_description'],
                'roles': level_data.get('Broadbanded_Classifications', []),
                'qualifications': level_data.get('Qualifications', []),
                'skills': level_data.get('Skills_and_Duties', []),
                'tasks': level_data.get('Indicative_Tasks', [])
            })
        else:
            return jsonify({'error': 'Level not found'}), 404

    except Exception as e:
        print(f"Error getting level details: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/get_levels')
def get_levels():
    """Get all level information."""
    classifications, _, _, _, _ = load_json_data()
    levels = []
    
    # Assuming your classifications.json has level information
    for i in range(1, 10):  # Levels 1-9
        level_info = {
            'number': i,
            'title': f'CW/ECW {i}',
            'description': classifications.get('ScheduleA', {})
                                       .get('Levels', {})
                                       .get(f'Level_{i}', {})
                                       .get('description', '')
        }
        levels.append(level_info)
    
    return jsonify(levels)

@app.route('/search_classifications', methods=['POST'])
def search_classifications():
    try:
        data = request.get_json()
        search_term = data.get('term', '').lower()
        stream = data.get('stream', 'all')
        
        # Get all levels data
        results = []
        for level in range(1, 10):  # Levels 1-9
            level_data = get_stream_data(stream, level)
            
            # Always include roles for this level/stream
            roles = level_data.get('roles', [])
            
            # Only include matching items
            matches = {
                'level': level,
                'roles': roles,  # Include all roles regardless of search term
                'matches': []
            }
            
            # Search in qualifications
            for qual in level_data.get('qualifications', []):
                if search_term in qual.lower():
                    matches['matches'].append({
                        'category': 'Qualifications',
                        'text': qual
                    })
            
            # Search in skills
            for skill in level_data.get('skills', []):
                if search_term in skill.lower():
                    matches['matches'].append({
                        'category': 'Skills',
                        'text': skill
                    })
            
            # Search in tasks
            for task in level_data.get('tasks', []):
                if search_term in task.lower():
                    matches['matches'].append({
                        'category': 'Tasks',
                        'text': task
                    })
            
            # Include this level if it has roles or matches
            if roles or matches['matches']:
                results.append(matches)
        
        print(f"Search results for '{search_term}': {len(results)} levels with matches")
        return jsonify(results)

    except Exception as e:
        print(f"Search error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) 