from flask import Flask, render_template, request, jsonify, current_app, send_from_directory
from flask_cors import CORS
import json
import logging
import traceback
import os
from datetime import datetime
from http import HTTPStatus
from config.app_config import PATHS
from job_posting_route import job_posting_bp
from levels_classification import levels_classification_bp
from allowances import allowances_bp
from award_primer import award_primer_bp
from pay_calculator import pay_calc_bp

# Set up detailed logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(job_posting_bp)
app.register_blueprint(levels_classification_bp)
app.register_blueprint(allowances_bp)
app.register_blueprint(award_primer_bp)
app.register_blueprint(pay_calc_bp)

# Ensure data directory exists
os.makedirs(PATHS['DATA'], exist_ok=True)

@app.route('/data/<path:filename>')
def serve_data(filename):
    """Serve files from the data directory."""
    return send_from_directory(PATHS['DATA'], filename)

@app.route('/')
def index():
    """Render the main page."""
    return render_template('home.html')

@app.route('/position_creation')
def position_creation():
    """Render the position creation page."""
    return render_template('position_creation.html')

@app.route('/health')
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }), HTTPStatus.OK

if __name__ == '__main__':
    app.run(debug=True)
