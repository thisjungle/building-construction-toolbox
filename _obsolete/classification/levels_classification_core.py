"""
Core classification logic with improved functionality.
Handles point calculations, level determination, and classification results.
"""
from typing import TypedDict, List, Set, Optional, Dict, Any
from datetime import datetime
import uuid
from functools import lru_cache
import logging
from config.levels_config import (
    load_config,
    get_level_requirements,
    get_award_mapping,
    get_experience_mapping,
    get_section_weight
)

logger = logging.getLogger(__name__)

class ClassificationError(Exception):
    """Custom exception for classification errors"""
    pass

class ClassificationResult(TypedDict):
    level: str
    confidence: float
    reasoning: List[str]
    date_classified: str
    classification_id: str
    progression_path: Optional[Dict[str, Any]]
    points: int
    section_points: Dict[str, int]
    certifications: List[str]
    competencies: List[str]
    completed_sections: Set[str]
    missing_requirements: List[str]
    level_description: str
    responsibilities: List[str]

@lru_cache(maxsize=128)
def get_level_requirements(level: str, config: Dict) -> Dict:
    """Cached function to get level requirements"""
    return config['level_requirements'].get(level, {})

def validate_submission_data(data: Dict) -> None:
    """Validate submission data before processing"""
    required_fields = ['experience', 'qualifications']
    missing_fields = [field for field in required_fields if field not in data]
    if missing_fields:
        raise ClassificationError(f"Missing required fields: {', '.join(missing_fields)}")

def sanitize_submission_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Sanitize and normalize submission data"""
    return {
        'experience': data.get('experience', 'none').lower(),
        'qualifications': [q.lower() for q in data.get('qualifications', [])],
        'responsibility': data.get('responsibility', 'basic').lower(),
        'complexity': data.get('complexity', 'simple').lower(),
        'autonomy': data.get('autonomy', 'none').lower(),
        'supervision': data.get('supervision', 'constant').lower()
    }

def calculate_confidence_score(
    completed_sections: Set[str],
    total_sections: int,
    points: int,
    min_points: int,
    held_certs: Set[str],
    required_certs: Set[str]
) -> float:
    """Calculate confidence score with weighted components"""
    # Base confidence on completed sections
    section_confidence = (len(completed_sections) / total_sections) * 40
    
    # Points confidence
    points_confidence = min((points / min_points) * 40, 40)
    
    # Certification confidence
    cert_confidence = (len(held_certs.intersection(required_certs)) / len(required_certs)) * 20
    
    return min(section_confidence + points_confidence + cert_confidence, 100)

def track_progression(
    current_level: str,
    next_level: str,
    missing_requirements: List[str],
    config: Dict
) -> Dict[str, Any]:
    """Track what's needed for next level"""
    return {
        'current_level': current_level,
        'next_level': next_level,
        'missing_requirements': missing_requirements,
        'estimated_time': estimate_progression_time(missing_requirements, config)
    }

def estimate_progression_time(missing_requirements: List[str], config: Dict) -> str:
    """Estimate time needed to meet missing requirements"""
    # Implementation depends on your specific requirements
    return "3-6 months"  # Placeholder

def log_classification_result(
    result: ClassificationResult,
    submission_data: Dict[str, Any]
) -> None:
    """Log classification results for monitoring"""
    logger.info(
        "Classification completed",
        extra={
            'classification_id': result['classification_id'],
            'level': result['level'],
            'confidence': result['confidence'],
            'sections_completed': len(submission_data.get('completed_sections', [])),
            'certifications': len(submission_data.get('certifications', [])),
            'points': result['points']
        }
    )

def classify_employee(submission_data: Dict[str, Any]) -> ClassificationResult:
    """Classify an employee based on submitted data with improved functionality"""
    try:
        # Validate and sanitize input
        validate_submission_data(submission_data)
        data = sanitize_submission_data(submission_data)
        
        # Load configuration
        config = load_config()
        
        # Calculate points and track completed sections
        total_points = 0
        section_points = {}
        completed_sections = set()
        held_certifications = set()
        held_competencies = set()
        
        # Process each section
        for section, weight in get_section_weight().items():
            if section in data:
                points = calculate_section_points(section, data[section], config)
                section_points[section] = points
                total_points += points
                completed_sections.add(section)
                
                # Track certifications and competencies
                if section == 'certifications':
                    held_certifications.update(data[section])
                elif section == 'competencies':
                    held_competencies.update(data[section])
        
        # Handle experience-only classification
        if len(completed_sections) == 1 and 'experience' in completed_sections:
            return handle_experience_only_classification(
                data, total_points, section_points,
                held_certifications, held_competencies,
                completed_sections, config
            )
        
        # Full classification logic
        result = perform_full_classification(
            data, total_points, section_points,
            held_certifications, held_competencies,
            completed_sections, config
        )
        
        # Log the result
        log_classification_result(result, data)
        
        return result
        
    except Exception as e:
        logger.error(f"Error in classification: {str(e)}")
        raise ClassificationError(f"Classification failed: {str(e)}")

def calculate_section_points(section: str, value: Any, config: Dict) -> int:
    """Calculate points for a specific section"""
    # Implementation depends on your specific point calculation logic
    return 0  # Placeholder

def handle_experience_only_classification(
    data: Dict[str, Any],
    total_points: int,
    section_points: Dict[str, int],
    held_certs: Set[str],
    held_comps: Set[str],
    completed_sections: Set[str],
    config: Dict
) -> ClassificationResult:
    """Handle classification based only on experience"""
    exp_data = data['experience']
    exp_mapping = get_experience_mapping()
    
    if exp_data.get('value') in exp_mapping:
        level = exp_mapping[exp_data['value']]
        award_level, award_info = get_award_mapping(level, config)
        
        if award_level:
            level_reqs = get_level_requirements(level, config)
            return create_classification_result(
                level=level,
                award_level=award_level,
                award_description=award_info['award_description'],
                total_points=total_points,
                section_points=section_points,
                held_certs=held_certs,
                held_comps=held_comps,
                completed_sections=completed_sections,
                config=config,
                level_reqs=level_reqs
            )
    
    return create_default_classification(
        total_points, section_points,
        held_certs, held_comps,
        completed_sections, config
    )

def perform_full_classification(
    data: Dict[str, Any],
    total_points: int,
    section_points: Dict[str, int],
    held_certs: Set[str],
    held_comps: Set[str],
    completed_sections: Set[str],
    config: Dict
) -> ClassificationResult:
    """Perform full classification with all factors"""
    level_requirements = config['level_requirements']
    
    # Sort levels in descending order (CW5 to CW1)
    for level in sorted(level_requirements.keys(), reverse=True):
        requirements = level_requirements[level]
        
        if total_points >= requirements['min_points']:
            required_sections = set(requirements['required_sections'])
            required_certs = set(requirements.get('required_certs', []))
            required_comps = set(requirements.get('required_competencies', []))
            
            if (required_sections.issubset(completed_sections) and 
                required_certs.issubset(held_certs) and
                required_comps.issubset(held_comps)):
                
                award_level, award_info = get_award_mapping(level, config)
                if award_level:
                    return create_classification_result(
                        level=level,
                        award_level=award_level,
                        award_description=award_info['award_description'],
                        total_points=total_points,
                        section_points=section_points,
                        held_certs=held_certs,
                        held_comps=held_comps,
                        completed_sections=completed_sections,
                        config=config,
                        level_reqs=requirements
                    )
    
    return create_default_classification(
        total_points, section_points,
        held_certs, held_comps,
        completed_sections, config
    )

def create_classification_result(
    level: str,
    award_level: str,
    award_description: str,
    total_points: int,
    section_points: Dict[str, int],
    held_certs: Set[str],
    held_comps: Set[str],
    completed_sections: Set[str],
    config: Dict,
    level_reqs: Dict[str, Any]
) -> ClassificationResult:
    """Create a complete classification result"""
    next_level = get_next_level(level, config)
    
    return ClassificationResult(
        level=level,
        confidence=calculate_confidence_score(
            completed_sections,
            len(config['question_groups']),
            total_points,
            level_reqs['min_points'],
            held_certs,
            set(level_reqs.get('required_certs', []))
        ),
        reasoning=generate_reasoning(level, level_reqs, held_certs, completed_sections),
        date_classified=datetime.now().strftime("%Y-%m-%d"),
        classification_id=str(uuid.uuid4()),
        progression_path=track_progression(
            level, next_level,
            get_missing_requirements(level, held_certs, held_comps, completed_sections, config),
            config
        ),
        points=total_points,
        section_points=section_points,
        certifications=list(held_certs),
        competencies=list(held_comps),
        completed_sections=completed_sections,
        missing_requirements=get_missing_requirements(
            level, held_certs, held_comps, completed_sections, config
        ),
        level_description=level_reqs.get('description', ''),
        responsibilities=level_reqs.get('responsibilities', [])
    )

def create_default_classification(
    total_points: int,
    section_points: Dict[str, int],
    held_certs: Set[str],
    held_comps: Set[str],
    completed_sections: Set[str],
    config: Dict
) -> ClassificationResult:
    """Create a default CW1 classification result"""
    level = 'CW1'
    level_reqs = get_level_requirements(level, config)
    award_level, award_info = get_award_mapping(level, config)
    
    return create_classification_result(
        level=level,
        award_level=award_level or 'B.1',
        award_description=award_info['award_description'] if award_info else '',
        total_points=total_points,
        section_points=section_points,
        held_certs=held_certs,
        held_comps=held_comps,
        completed_sections=completed_sections,
        config=config,
        level_reqs=level_reqs
    )

def get_next_level(current_level: str, config: Dict) -> str:
    """Get the next level in progression"""
    levels = sorted(config['level_requirements'].keys())
    current_index = levels.index(current_level)
    return levels[current_index + 1] if current_index < len(levels) - 1 else current_level

def generate_reasoning(
    level: str,
    level_reqs: Dict[str, Any],
    held_certs: Set[str],
    completed_sections: Set[str]
) -> List[str]:
    """Generate reasoning for the classification"""
    reasoning = [f"Classified as {level} based on:"]
    
    if 'experience' in completed_sections:
        reasoning.append("Experience requirements met")
    
    if held_certs:
        reasoning.append(f"Hold {len(held_certs)} relevant certifications")
    
    if level_reqs.get('description'):
        reasoning.append(level_reqs['description'])
    
    return reasoning

def get_missing_requirements(
    level: str,
    held_certs: Set[str],
    held_comps: Set[str],
    completed_sections: Set[str],
    config: Dict
) -> List[str]:
    """Get list of missing requirements for the level"""
    level_reqs = get_level_requirements(level, config)
    missing = []
    
    required_sections = set(level_reqs.get('required_sections', []))
    required_certs = set(level_reqs.get('required_certs', []))
    required_comps = set(level_reqs.get('required_competencies', []))
    
    if not required_sections.issubset(completed_sections):
        missing.append("Missing required sections")
    if not required_certs.issubset(held_certs):
        missing.append("Missing required certifications")
    if not required_comps.issubset(held_comps):
        missing.append("Missing required competencies")
    
    return missing 