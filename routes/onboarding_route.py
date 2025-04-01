from flask import Blueprint, render_template, jsonify, request, current_app
import json
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

onboarding_bp = Blueprint('onboarding', __name__)

def load_onboarding_data():
    """Load onboarding data from JSON file"""
    try:
        data_path = os.path.join(current_app.root_path, 'data', 'onboarding_data.json')
        with open(data_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading onboarding data: {str(e)}")
        return {}

@onboarding_bp.route('/onboarding/<position_id>')
def onboarding(position_id):
    """Render the onboarding page"""
    return render_template('onboarding.html', position_id=position_id)

@onboarding_bp.route('/onboarding_pack/<position_id>')
def onboarding_pack(position_id):
    """Render the onboarding pack page"""
    return render_template('onboarding_pack.html', position_id=position_id)

@onboarding_bp.route('/api/onboarding_data/<position_id>')
def get_onboarding_data(position_id):
    """Get onboarding data for a specific position"""
    try:
        data = load_onboarding_data()
        return jsonify(data.get(position_id, {}))
    except Exception as e:
        logger.error(f"Error getting onboarding data: {str(e)}")
        return jsonify({'error': str(e)}), 500

@onboarding_bp.route('/api/save_onboarding', methods=['POST'])
def save_onboarding():
    """Save onboarding data"""
    try:
        data = request.get_json()
        # Here you would typically save the data to a database
        # For now, we'll just return success
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"Error saving onboarding data: {str(e)}")
        return jsonify({'error': str(e)}), 500 