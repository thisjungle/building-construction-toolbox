"""
Utility functions for the classification system.
"""
from typing import Dict, Any, List, Set
import logging
from datetime import datetime
import json
from pathlib import Path

logger = logging.getLogger(__name__)

def calculate_section_points(section: str, value: Any, config: Dict[str, Any]) -> int:
    """Calculate points for a specific section"""
    weights = config.get('section_weights', {})
    weight = weights.get(section, 0)
    
    if section == 'experience':
        return calculate_experience_points(value, weight)
    elif section == 'qualifications':
        return calculate_qualification_points(value, weight)
    elif section == 'responsibilities':
        return calculate_responsibility_points(value, weight)
    elif section == 'complexity':
        return calculate_complexity_points(value, weight)
    elif section == 'autonomy':
        return calculate_autonomy_points(value, weight)
    
    return 0

def calculate_experience_points(value: str, weight: int) -> int:
    """Calculate points for experience"""
    experience_mapping = {
        'less_than_1_year': 0,
        '1_to_2_years': 25,
        '2_to_5_years': 50,
        '5_to_8_years': 75,
        'over_8_years': 100
    }
    return int((experience_mapping.get(value, 0) / 100) * weight)

def calculate_qualification_points(value: List[str], weight: int) -> int:
    """Calculate points for qualifications"""
    qualification_mapping = {
        'none': 0,
        'basic': 25,
        'trade': 50,
        'advanced': 75,
        'specialist': 100
    }
    max_points = max(qualification_mapping.get(q, 0) for q in value)
    return int((max_points / 100) * weight)

def calculate_responsibility_points(value: str, weight: int) -> int:
    """Calculate points for responsibilities"""
    responsibility_mapping = {
        'basic': 0,
        'team': 25,
        'technical': 50,
        'planning': 75,
        'leadership': 100
    }
    return int((responsibility_mapping.get(value, 0) / 100) * weight)

def calculate_complexity_points(value: str, weight: int) -> int:
    """Calculate points for complexity"""
    complexity_mapping = {
        'simple': 0,
        'moderate': 33,
        'complex': 66,
        'highly_complex': 100
    }
    return int((complexity_mapping.get(value, 0) / 100) * weight)

def calculate_autonomy_points(value: str, weight: int) -> int:
    """Calculate points for autonomy"""
    autonomy_mapping = {
        'none': 0,
        'low': 25,
        'medium': 50,
        'high': 75,
        'expert': 100
    }
    return int((autonomy_mapping.get(value, 0) / 100) * weight)

def save_classification_result(
    result: Dict[str, Any],
    employee_id: str,
    data_dir: Path
) -> bool:
    """Save classification result to file"""
    try:
        # Create data directory if it doesn't exist
        data_dir.mkdir(parents=True, exist_ok=True)
        
        # Create filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{employee_id}_{timestamp}.json"
        filepath = data_dir / filename
        
        # Save result
        with filepath.open('w', encoding='utf-8') as f:
            json.dump(result, f, indent=2)
        
        logger.info(f"Saved classification result to {filepath}")
        return True
        
    except Exception as e:
        logger.error(f"Error saving classification result: {str(e)}")
        return False

def load_classification_history(
    employee_id: str,
    data_dir: Path,
    limit: int = 5
) -> List[Dict[str, Any]]:
    """Load classification history for an employee"""
    try:
        if not data_dir.exists():
            return []
        
        # Get all classification files for employee
        files = sorted(
            data_dir.glob(f"{employee_id}_*.json"),
            key=lambda x: x.stat().st_mtime,
            reverse=True
        )
        
        # Load results
        results = []
        for file in files[:limit]:
            try:
                with file.open('r', encoding='utf-8') as f:
                    result = json.load(f)
                    results.append(result)
            except Exception as e:
                logger.error(f"Error loading classification file {file}: {str(e)}")
                continue
        
        return results
        
    except Exception as e:
        logger.error(f"Error loading classification history: {str(e)}")
        return []

def format_classification_result(result: Dict[str, Any]) -> Dict[str, Any]:
    """Format classification result for display"""
    return {
        'level': result['level'],
        'confidence': result['confidence'],
        'reasoning': result['reasoning'],
        'date_classified': result['date_classified'],
        'points': result['points'],
        'section_points': result['section_points'],
        'certifications': result['certifications'],
        'competencies': result['competencies'],
        'missing_requirements': result['missing_requirements'],
        'progression_path': result['progression_path']
    }

def validate_points(points: int, min_points: int) -> bool:
    """Validate if points meet minimum requirement"""
    return points >= min_points

def calculate_progression_time(missing_requirements: List[str]) -> str:
    """Estimate time needed to meet missing requirements"""
    if not missing_requirements:
        return "Ready for progression"
    
    # Simple estimation based on number of missing requirements
    if len(missing_requirements) <= 2:
        return "1-3 months"
    elif len(missing_requirements) <= 4:
        return "3-6 months"
    else:
        return "6-12 months" 