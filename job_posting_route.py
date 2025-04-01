from flask import Blueprint, render_template, jsonify, request, current_app
import json
import os
from config.app_config import PATHS
from models.position import Position

job_posting_bp = Blueprint('job_posting', __name__)

def load_job_posting_templates():
    """Load job posting templates from JSON file"""
    try:
        templates_file = os.path.join(PATHS['DATA'], 'job_posting_templates.json')
        with open(templates_file, 'r') as f:
            return json.load(f)
    except Exception as e:
        current_app.logger.error(f"Error loading job posting templates: {e}")
        return {}

@job_posting_bp.route('/create/<position_id>')
def create_job_posting(position_id):
    """Render the job posting creation page"""
    templates = load_job_posting_templates()
    return render_template('job_posting_creation.html', 
                         templates=templates,
                         position_id=position_id)

@job_posting_bp.route('/api/templates')
def get_templates():
    """API endpoint to get job posting templates"""
    templates = load_job_posting_templates()
    return jsonify(templates)

@job_posting_bp.route('/api/save', methods=['POST'])
def save_job_posting():
    """API endpoint to save a job posting"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Create and save the position
        position = Position(
            title=data.get('title'),
            description=data.get('description'),
            requirements=data.get('requirements')
        )
        position.save()

        return jsonify({
            "success": True,
            "position_id": position.id
        })

    except Exception as e:
        current_app.logger.error(f"Error saving job posting: {e}")
        return jsonify({"error": str(e)}), 500 