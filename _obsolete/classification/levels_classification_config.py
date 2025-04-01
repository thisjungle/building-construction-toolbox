"""
Configuration settings for the classification system.
"""
from typing import Dict, Any, List
import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# Paths
BASE_DIR = Path(__file__).parent.parent
CONFIG_DIR = BASE_DIR / 'config'
DATA_DIR = BASE_DIR / 'data'

# Default configuration
DEFAULT_CONFIG = {
    'version': '1.0.0',
    'min_confidence': 60,
    'max_confidence': 100,
    'section_weights': {
        'experience': 30,
        'qualifications': 25,
        'responsibilities': 20,
        'complexity': 15,
        'autonomy': 10
    },
    'level_requirements': {
        'CW1': {
            'min_points': 0,
            'required_sections': ['experience'],
            'required_certs': [],
            'required_competencies': [],
            'description': 'Entry level classification',
            'responsibilities': ['Basic tasks under supervision']
        },
        'CW2': {
            'min_points': 30,
            'required_sections': ['experience', 'qualifications'],
            'required_certs': ['basic_safety'],
            'required_competencies': ['basic_skills'],
            'description': 'Intermediate level classification',
            'responsibilities': ['Independent work with supervision']
        },
        'CW3': {
            'min_points': 50,
            'required_sections': ['experience', 'qualifications', 'responsibilities'],
            'required_certs': ['advanced_safety', 'trade_cert'],
            'required_competencies': ['advanced_skills'],
            'description': 'Advanced level classification',
            'responsibilities': ['Complex tasks with minimal supervision']
        },
        'CW4': {
            'min_points': 70,
            'required_sections': ['experience', 'qualifications', 'responsibilities', 'complexity'],
            'required_certs': ['specialist_cert'],
            'required_competencies': ['specialist_skills'],
            'description': 'Specialist level classification',
            'responsibilities': ['Specialized work with team leadership']
        },
        'CW5': {
            'min_points': 90,
            'required_sections': ['experience', 'qualifications', 'responsibilities', 'complexity', 'autonomy'],
            'required_certs': ['expert_cert'],
            'required_competencies': ['expert_skills'],
            'description': 'Expert level classification',
            'responsibilities': ['Expert work with project leadership']
        }
    },
    'experience_mapping': {
        'less_than_1_year': 'CW1',
        '1_to_2_years': 'CW2',
        '2_to_5_years': 'CW3',
        '5_to_8_years': 'CW4',
        'over_8_years': 'CW5'
    },
    'award_mapping': {
        'CW1': {'level': 'B.1', 'description': 'Building and Construction General On-site Award Level 1'},
        'CW2': {'level': 'B.2', 'description': 'Building and Construction General On-site Award Level 2'},
        'CW3': {'level': 'B.3', 'description': 'Building and Construction General On-site Award Level 3'},
        'CW4': {'level': 'B.4', 'description': 'Building and Construction General On-site Award Level 4'},
        'CW5': {'level': 'B.5', 'description': 'Building and Construction General On-site Award Level 5'}
    }
}

def load_config() -> Dict[str, Any]:
    """Load configuration from file or use defaults"""
    try:
        config_path = CONFIG_DIR / 'levels_config.json'
        if config_path.exists():
            with config_path.open('r', encoding='utf-8') as f:
                config = json.load(f)
                return merge_config(config, DEFAULT_CONFIG)
        return DEFAULT_CONFIG.copy()
    except Exception as e:
        logger.error(f"Error loading config: {str(e)}")
        return DEFAULT_CONFIG.copy()

def merge_config(custom: Dict[str, Any], default: Dict[str, Any]) -> Dict[str, Any]:
    """Merge custom config with defaults"""
    merged = default.copy()
    for key, value in custom.items():
        if isinstance(value, dict) and key in merged and isinstance(merged[key], dict):
            merged[key] = merge_config(value, merged[key])
        else:
            merged[key] = value
    return merged

def get_section_weight() -> Dict[str, int]:
    """Get section weights from config"""
    config = load_config()
    return config.get('section_weights', {})

def get_level_requirements(level: str, config: Dict[str, Any]) -> Dict[str, Any]:
    """Get requirements for a specific level"""
    return config.get('level_requirements', {}).get(level, {})

def get_experience_mapping() -> Dict[str, str]:
    """Get experience to level mapping"""
    config = load_config()
    return config.get('experience_mapping', {})

def get_award_mapping(level: str, config: Dict[str, Any]) -> tuple[str, Dict[str, str]]:
    """Get award mapping for a level"""
    mapping = config.get('award_mapping', {}).get(level, {})
    return mapping.get('level', ''), mapping

def validate_config(config: Dict[str, Any]) -> List[str]:
    """Validate configuration structure"""
    errors = []
    
    # Check required sections
    required_sections = ['version', 'section_weights', 'level_requirements']
    for section in required_sections:
        if section not in config:
            errors.append(f"Missing required section: {section}")
    
    # Validate section weights
    weights = config.get('section_weights', {})
    total_weight = sum(weights.values())
    if total_weight != 100:
        errors.append(f"Section weights must sum to 100, got {total_weight}")
    
    # Validate level requirements
    levels = config.get('level_requirements', {})
    for level, reqs in levels.items():
        if 'min_points' not in reqs:
            errors.append(f"Missing min_points for level {level}")
        if 'required_sections' not in reqs:
            errors.append(f"Missing required_sections for level {level}")
    
    return errors 