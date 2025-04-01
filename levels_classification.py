from flask import Blueprint, render_template, request, jsonify, current_app
import json
import logging
import traceback
from typing import Dict, List, Optional, Any
from pathlib import Path
from datetime import datetime
from http import HTTPStatus

# Set up detailed logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

levels_classification_bp = Blueprint('levels_classification', __name__, url_prefix='/levels_classification')

# Constants for JSON files
LEVELS_CONFIG_PATH = Path('data/levels_classification_config.json')
LEVELS_QUESTIONS_PATH = Path('data/levels_classification_questions.json')
LEVELS_CLASSIFICATION_PATH = Path('data/levels_classification.json')

logger.debug(f"Loading JSON files from paths:")
logger.debug(f"Config: {LEVELS_CONFIG_PATH}")
logger.debug(f"Questions: {LEVELS_QUESTIONS_PATH}")
logger.debug(f"Classification: {LEVELS_CLASSIFICATION_PATH}")

# Load configuration files with UTF-8 encoding
try:
    with open(LEVELS_CONFIG_PATH, 'r', encoding='utf-8') as f:
        LEVELS_CONFIG = json.load(f)
    logger.debug(f"Loaded config file successfully. Keys: {list(LEVELS_CONFIG.keys())}")
except Exception as e:
    logger.error(f"Error loading config file: {str(e)}")
    raise

try:
    with open(LEVELS_QUESTIONS_PATH, 'r', encoding='utf-8') as f:
        LEVELS_QUESTIONS = json.load(f)
    logger.debug(f"Loaded questions file successfully. Sections: {len(LEVELS_QUESTIONS.get('sections', []))}")
    for section in LEVELS_QUESTIONS.get('sections', []):
        logger.debug(f"Section {section.get('id')}: {len(section.get('questions', []))} questions")
except Exception as e:
    logger.error(f"Error loading questions file: {str(e)}")
    raise

try:
    with open(LEVELS_CLASSIFICATION_PATH, 'r', encoding='utf-8') as f:
        LEVELS_CLASSIFICATION = json.load(f)
    logger.debug(f"Loaded classification file successfully. Classifications: {len(LEVELS_CLASSIFICATION.get('classifications', []))}")
except Exception as e:
    logger.error(f"Error loading classification file: {str(e)}")
    raise

def load_levels_config() -> Dict[str, Any]:
    """Load and format levels data from JSON configuration file"""
    try:
        with LEVELS_CLASSIFICATION_PATH.open('r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except Exception as e:
        logger.error(f"Error loading levels config: {str(e)}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        return {'classifications': []}

def calculate_daily_tasks_score(responses):
    task_score = 0
    frequency_multiplier = get_frequency_multiplier(responses.get('task_frequency', 'monthly'))
    
    # Track tasks by level
    tasks_by_level = {
        'CW1': 0,
        'CW2': 0,
        'CW3': 0,
        'CW4': 0,
        'CW5': 0,
        'CW6': 0,
        'CW7': 0,
        'CW8': 0,
        'ECW9': 0
    }
    
    # Calculate score for each selected task
    for task in responses.get('indicative_tasks', []):
        task_level = get_task_level(task)
        task_points = get_task_points(task)
        
        # Weight tasks based on frequency
        weighted_score = task_points * frequency_multiplier
        
        # Track tasks by level
        tasks_by_level[task_level] += 1
        
        task_score += weighted_score
    
    # Determine primary level based on task distribution
    primary_level = determine_primary_level(tasks_by_level)
    
    # Calculate level score
    level_score = calculate_level_score(tasks_by_level, primary_level)
    
    return {
        'total_score': task_score,
        'level_score': level_score,
        'primary_level': primary_level,
        'tasks_by_level': tasks_by_level
    }

def get_frequency_multiplier(frequency):
    multipliers = {
        'daily': 3,
        'weekly': 2,
        'monthly': 1
    }
    return multipliers.get(frequency, 1)

def get_task_level(task):
    # Extract level from task data
    return task.get('level', 'CW1')

def get_task_points(task):
    # Extract points from task data
    return task.get('points', 1)

def determine_primary_level(tasks_by_level):
    # Find level with most tasks
    max_tasks = max(tasks_by_level.values())
    primary_level = max(tasks_by_level.items(), key=lambda x: x[1])[0]
    
    # Check if there's a clear progression
    for level in sorted(tasks_by_level.keys()):
        if tasks_by_level[level] >= max_tasks * 0.7:  # 70% threshold
            return level
    
    return primary_level

def calculate_level_score(tasks_by_level, primary_level):
    score = 0
    for level, count in tasks_by_level.items():
        if level == primary_level:
            # Full points for primary level tasks
            score += count * 3
        elif level > primary_level:
            # Bonus points for higher level tasks
            score += count * 2
        else:
            # Reduced points for lower level tasks
            score += count
    
    return score

def process_classification(data):
    """Process classification based on responses."""
    try:
        # Extract data from request
        responses = data.get('responses', {})
        total_points = data.get('total_points', 0)
        confidence_score = data.get('confidence_score', 0)
        
        # Calculate level based on total points
        level = determine_level(total_points)
        
        # Calculate section scores
        section_scores = {
            section_id: section_data.get('score', 0)
            for section_id, section_data in responses.items()
        }
        
        # Get level details
        level_details = get_level_details_from_config(level)
        
        return {
            'level': level,
            'confidence_score': confidence_score,
            'section_scores': section_scores,
            'total_points': total_points,
            'level_details': level_details
        }
    except Exception as e:
        logger.error(f"Error processing classification: {str(e)}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise

def determine_level(points: int) -> str:
    """Determine classification level based on points."""
    if points < 50:
        return 'CW1'
    elif points < 100:
        return 'CW2'
    elif points < 150:
        return 'CW3'
    elif points < 200:
        return 'CW4'
    elif points < 250:
        return 'CW5'
    else:
        return 'CW6'

def get_level_details_from_config(level: str) -> dict:
    """Get level details from configuration."""
    try:
        level_num = ''.join(filter(str.isdigit, str(level)))
        level_key = f"CW/ECW {level_num}"
        
        classifications = LEVELS_CLASSIFICATION.get('classifications', [])
        level_details = next((c for c in classifications if c['level'] == level_key), None)
        
        if level_details:
            return {
                "level": level_num,
                "description": level_details.get('description', ''),
                "skills": level_details.get('skills', []),
                "indicative_tasks": level_details.get('indicative_tasks', []),
                "qualifications": level_details.get('qualifications', []),
                "weekly_rate": level_details.get('weekly_rate', 0)
            }
        return {}
    except Exception as e:
        logger.error(f"Error getting level details: {str(e)}")
        return {}

@levels_classification_bp.route('/')
def levels_classification():
    """Render the levels classification page."""
    logger.debug("Rendering levels classification page")
    logger.debug(f"Number of sections: {len(LEVELS_QUESTIONS.get('sections', []))}")
    
    # Log details of each section
    for section in LEVELS_QUESTIONS.get('sections', []):
        logger.debug(f"Section {section.get('id')}:")
        logger.debug(f"  Title: {section.get('title')}")
        logger.debug(f"  Questions: {len(section.get('questions', []))}")
        for q in section.get('questions', []):
            logger.debug(f"    Question {q.get('id')}: {q.get('text', q.get('question', 'No text'))}")
    
    return render_template('levels_classification.html', 
                         sections=LEVELS_QUESTIONS["sections"],
                         classifications=LEVELS_CLASSIFICATION["classifications"])

@levels_classification_bp.route('/classify', methods=['POST'])
def classify():
    """API endpoint for classification processing."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), HTTPStatus.BAD_REQUEST
            
        logger.debug(f"Received classification request: {data}")
        
        result = process_classification(data)
        logger.debug(f"Classification result: {result}")
        
        return jsonify(result)
    except Exception as e:
        logger.error(f"Classification error: {str(e)}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        return jsonify({"error": str(e)}), HTTPStatus.BAD_REQUEST

@levels_classification_bp.route('/get_level_details', methods=['GET'])
def get_level_details():
    """Get details for a specific level"""
    try:
        level = request.args.get('level')
        if not level:
            return jsonify({"error": "Level parameter is required"}), HTTPStatus.BAD_REQUEST
        
        # Clean the level input
        level_num = ''.join(filter(str.isdigit, str(level)))
        level_key = f"CW/ECW {level_num}"
        
        # Get classification details
        classifications = LEVELS_CLASSIFICATION.get('classifications', [])
        level_details = next((c for c in classifications if c['level'] == level_key), None)
        
        if not level_details:
            return jsonify({"error": "Invalid level"}), HTTPStatus.NOT_FOUND
            
        return jsonify({
            "level": level_num,
            "description": level_details.get('description', ''),
            "skills": level_details.get('skills', []),
            "indicative_tasks": level_details.get('indicative_tasks', []),
            "qualifications": level_details.get('qualifications', []),
            "weekly_rate": level_details.get('weekly_rate', 0)
        }), HTTPStatus.OK
    except Exception as e:
        logger.error(f"Error getting level details: {str(e)}")
        return jsonify({"error": "Failed to get level details"}), HTTPStatus.INTERNAL_SERVER_ERROR

@levels_classification_bp.route('/search', methods=['POST'])
def search_classifications():
    """Search classifications by term"""
    try:
        data = request.get_json()
        search_term = data.get('term', '').lower()
        
        results = []
        classifications = LEVELS_CLASSIFICATION.get('classifications', [])
        
        for classification in classifications:
            matches = []
            
            # Search in qualifications
            for qual in classification.get('qualifications', []):
                if search_term in qual.lower():
                    matches.append({
                        'category': 'Qualifications',
                        'text': qual
                    })
            
            # Search in skills
            for skill in classification.get('skills', []):
                if search_term in skill.lower():
                    matches.append({
                        'category': 'Skills',
                        'text': skill
                    })
            
            # Search in tasks
            for task in classification.get('indicative_tasks', []):
                if search_term in task.lower():
                    matches.append({
                        'category': 'Tasks',
                        'text': task
                    })
            
            if matches:
                results.append({
                    'level': classification['level'],
                    'matches': matches
                })
        
        return jsonify(results)
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        return jsonify({"error": str(e)}), HTTPStatus.INTERNAL_SERVER_ERROR

@levels_classification_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'version': current_app.config.get('VERSION', '1.0.0')
    })

def register_blueprint(app):
    """Register the blueprint with the Flask app"""
    app.register_blueprint(levels_classification_bp)