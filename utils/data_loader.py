import json
from pathlib import Path

def load_json_file(filename: str) -> dict:
    """
    Load a JSON file from the data directory
    Args:
        filename: Name of the JSON file to load
    Returns:
        dict: Loaded JSON data
    """
    data_dir = Path("data")
    with open(data_dir / filename, 'r', encoding='utf-8') as f:
        return json.load(f)

# Load all data once when module is imported
#broadband_data = load_json_file('broadband.json')
#quals_data = load_json_file('qualifications.json')
#min_rates_data = load_json_file('minimum_rates.json')
#skills_data = load_json_file('skills_and_duties.json')
#work_data = load_json_file('work_categories_and_allowances.json')
#classifications = load_json_file('classifications.json') 
#questions_flow = load_json_file('questions_flow.json')