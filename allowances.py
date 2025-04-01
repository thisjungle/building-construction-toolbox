"""
Allowances routes with improved error handling and logging.
"""
from flask import Blueprint, render_template, jsonify
import json
import logging
import traceback
from typing import Dict, List, Any
from pathlib import Path
from helpers.calculate_allowances import AllowanceError

logger = logging.getLogger(__name__)

allowances_bp = Blueprint('allowances', __name__, url_prefix='/allowances')

# Constants
ALLOWANCES_CONFIG_PATH = Path('data/allowances.json')

def load_allowances_config() -> Dict[str, List[Dict[str, Any]]]:
    """
    Load allowances data from JSON configuration file.
    
    Returns:
        Dictionary containing allowances by category
        
    Raises:
        AllowanceError: If there's an error loading the configuration
    """
    try:
        with open(ALLOWANCES_CONFIG_PATH) as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed to load allowances config: {e}")
        logger.debug(traceback.format_exc())
        raise AllowanceError("Failed to load allowances configuration")

@allowances_bp.route('/')
def index():
    """
    Main route for the allowances calculator.
    
    Returns:
        Rendered template with allowances configuration
        
    Raises:
        AllowanceError: If there's an error loading the configuration
    """
    try:
        # Load allowances configuration
        config = load_allowances_config()
        
        # Log configuration summary
        logger.info(
            f"Loaded allowances config: "
            f"{len(config['industry'][0]['options'])} industry, "
            f"{len(config['tools'][0]['options'])} tools, "
            f"{len(config['first_aid'][0]['options'])} first aid, "
            f"{len(config['other'][0]['options'])} other allowances"
        )
        
        # Render template with initial values
        return render_template(
            'allowances.html',
            allowances_config=config,
            total_amount=0,
            selected_allowances=[]
        )
        
    except AllowanceError as e:
        logger.error(f"Allowance error: {str(e)}")
        return render_template('error.html', error=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        return render_template('error.html', error="An unexpected error occurred") 