from flask import Blueprint, jsonify, current_app
import json
import os
import logging

# Set up logging
logger = logging.getLogger(__name__)

activity_streams_bp = Blueprint('activity_streams', __name__)

def load_activity_streams():
    try:
        # Get paths relative to app root
        activity_streams_path = os.path.join(current_app.root_path, 'data', 'activity_streams.json')
        levels_path = os.path.join(current_app.root_path, 'data', 'levels_classification.json')
        
        logger.info(f"Loading activity streams from: {activity_streams_path}")
        logger.info(f"Loading levels data from: {levels_path}")
        
        # Load activity streams data
        with open(activity_streams_path, 'r', encoding='utf-8') as f:
            streams_data = json.load(f)
            logger.info(f"Successfully loaded activity streams data with {len(streams_data.get('streams', {}))} streams")
            
        # Load levels classification data
        with open(levels_path, 'r', encoding='utf-8') as f:
            levels_data = json.load(f)
            logger.info(f"Successfully loaded levels data with {len(levels_data.get('levels', {}))} levels")
            
        # Merge indicative tasks from levels data into streams data
        for stream_id, stream in streams_data['streams'].items():
            for level_group in stream['levels'].values():
                for activity in level_group['activities']:
                    level = activity['level']
                    if level in levels_data.get('levels', {}):
                        level_data = levels_data['levels'][level]
                        # Add indicative tasks from levels data
                        activity['indicative_tasks'].extend(level_data.get('indicative_tasks', []))
                        # Add skills and duties
                        activity['skills_and_duties'] = level_data.get('skills_and_duties', [])
                        # Add training requirements
                        activity['training_requirements'] = level_data.get('training_requirements', [])
        
        logger.info("Successfully merged levels data into activity streams")
        return streams_data
    except FileNotFoundError as e:
        logger.error(f"File not found error: {e}")
        return {"streams": {}, "error": "Data files not found"}
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {e}")
        return {"streams": {}, "error": "Invalid JSON in data files"}
    except Exception as e:
        logger.error(f"Unexpected error loading activity streams: {e}")
        return {"streams": {}, "error": str(e)}

@activity_streams_bp.route('/activities')
def get_activity_streams():
    """Serve activity streams data with merged levels classification data"""
    data = load_activity_streams()
    if not data.get('streams'):
        logger.error("No streams data available")
    return jsonify(data) 