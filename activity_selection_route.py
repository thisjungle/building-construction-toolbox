from flask import Blueprint, render_template, current_app
import json
import os
import logging

# Set up logging
logger = logging.getLogger(__name__)

position_bp = Blueprint('position', __name__)

def load_position_config():
    """Load position creation configuration"""
    try:
        config_path = os.path.join(current_app.root_path, 'data', 'position_creation_config.json')
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading position config: {e}")
        return {"sections": {}}

def load_employment_types():
    """Load employment types configuration"""
    try:
        config_path = os.path.join(current_app.root_path, 'data', 'employment_types.json')
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading employment types: {e}")
        return {"employment_types": {}}

def load_streams():
    """Load streams configuration"""
    try:
        config_path = os.path.join(current_app.root_path, 'data', 'streams.json')
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading streams: {e}")
        return {"streams": {}}

@position_bp.route('/')
def position_creation():
    """Render the position creation page"""
    config = load_position_config()
    employment_types = load_employment_types()
    streams = load_streams()
    
    return render_template('position_creation.html', 
                         config=config,
                         employment_types=employment_types['employment_types'],
                         streams=streams['streams'])

@position_bp.route('/api/activities')
def get_activities():
    """Get activities data for position creation"""
    from activity_streams import load_activity_streams
    return load_activity_streams()

@position_bp.route('/api/positions', methods=['POST'])
def save_position():
    """Save position data"""
    return {"success": True}  # Placeholder for now 