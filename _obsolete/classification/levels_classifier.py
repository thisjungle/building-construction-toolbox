"""
Classification logic for determining employee levels based on the Building and Construction General On-site Award 2020.
"""
from typing import Dict, Any, List, Set, Optional
import logging
from dataclasses import dataclass
from datetime import datetime
from config.levels_config import (
    load_config,
    get_level_requirements,
    get_award_mapping,
    get_experience_mapping,
    get_section_weight
)

logger = logging.getLogger(__name__)

@dataclass
class ClassificationResult:
    level: str
    award_level: str
    award_description: str
    confidence: float
    points: int
    section_points: Dict[str, int]
    certifications: Set[str]
    competencies: Set[str]
    completed_sections: List[str]
    missing_requirements: List[str]
    progression_requirements: List[str]
    level_description: str
    responsibilities: List[str]
    sub_level: Optional[str] = None

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
        completed_sections = []
        held_certifications = set()
        held_competencies = set()
        
        # Process each section with improved weighting
        for section, section_data in submission_data.items():
            if section_data.get('complete'):
                points, certifications, competencies = calculate_section_points(section_data, config)
                weighted_points = points * get_section_weight(section, config)
                total_points += weighted_points
                section_points[section] = weighted_points
                completed_sections.append(section)
                held_certifications.update(certifications)
                held_competencies.update(competencies)
        
        # Special handling for CW1 sub-levels
        if is_cw1_candidate(data):
            return handle_cw1_classification(data, total_points, section_points, 
                                          held_certifications, held_competencies,
                                          completed_sections, config)
        
        # Handle experience-only classification with improved logic
        if len(completed_sections) == 1 and 'experience' in completed_sections:
            return handle_experience_only_classification(
                data, total_points, section_points,
                held_certifications, held_competencies,
                completed_sections, config
            )
        
        # Full classification logic with improved requirements checking
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

def is_cw1_candidate(data: Dict[str, Any]) -> bool:
    """Check if the employee is a potential CW1 candidate"""
    experience = data.get('experience', {}).get('value', '')
    qualifications = data.get('qualifications', {}).get('value', [])
    
    return (experience in ['less_than_1_year', '1_to_2_years'] or
            not any(q in ['trade', 'advanced', 'specialist'] for q in qualifications))

def handle_cw1_classification(data: Dict[str, Any], total_points: int,
                            section_points: Dict[str, int],
                            held_certifications: Set[str],
                            held_competencies: Set[str],
                            completed_sections: List[str],
                            config: Dict[str, Any]) -> ClassificationResult:
    """Handle classification for CW1 level with sub-levels"""
    experience = data.get('experience', {}).get('value', '')
    supervision = data.get('supervision', {}).get('value', '')
    
    # Determine sub-level based on experience and supervision
    if experience == 'less_than_1_year':
        if supervision == 'direct':
            sub_level = 'a'
        elif supervision == 'general':
            sub_level = 'b'
        else:
            sub_level = 'c'
    else:
        sub_level = 'd'
    
    level = 'CW1'
    award_level, award_info = get_award_mapping(level, config)
    level_reqs = get_level_requirements(level, config)
    
    return ClassificationResult(
        level=level,
        sub_level=sub_level,
        award_level=award_level or 'B.1',
        award_description=award_info['award_description'] if award_info else '',
        confidence=calculate_confidence_score(
            completed_sections,
            len(config['question_groups']),
            total_points,
            level_reqs.get('min_points', 0),
            held_certifications,
            set(level_reqs.get('required_certs', []))
        ),
        points=total_points,
        section_points=section_points,
        certifications=held_certifications,
        competencies=held_competencies,
        completed_sections=completed_sections,
        missing_requirements=get_missing_requirements(
            level, held_certifications, held_competencies,
            completed_sections, config
        ),
        progression_requirements=get_progression_requirements(level, config),
        level_description=level_reqs.get('description', ''),
        responsibilities=level_reqs.get('responsibilities', [])
    )

def handle_experience_only_classification(data: Dict[str, Any], total_points: int,
                                        section_points: Dict[str, int],
                                        held_certifications: Set[str],
                                        held_competencies: Set[str],
                                        completed_sections: List[str],
                                        config: Dict[str, Any]) -> ClassificationResult:
    """Handle classification based on experience only with improved mapping"""
    exp_data = data['experience']
    exp_mapping = get_experience_mapping()
    
    if exp_data.get('value') in exp_mapping:
        level = exp_mapping[exp_data['value']]
        award_level, award_info = get_award_mapping(level, config)
        if award_level:
            level_reqs = get_level_requirements(level, config)
            return ClassificationResult(
                level=level,
                award_level=award_level,
                award_description=award_info['award_description'],
                confidence=calculate_confidence_score(
                    completed_sections,
                    len(config['question_groups']),
                    total_points,
                    100,
                    held_certifications,
                    set(level_reqs.get('required_certs', []))
                ),
                points=total_points,
                section_points=section_points,
                certifications=held_certifications,
                competencies=held_competencies,
                completed_sections=completed_sections,
                missing_requirements=get_missing_requirements(
                    level, held_certifications, held_competencies,
                    completed_sections, config
                ),
                progression_requirements=get_progression_requirements(level, config),
                level_description=level_reqs.get('description', ''),
                responsibilities=level_reqs.get('responsibilities', [])
            )
    
    # Default to CW1 if experience mapping fails
    return create_default_classification(
        total_points, section_points, held_certifications,
        held_competencies, completed_sections, config
    )

def perform_full_classification(data: Dict[str, Any], total_points: int,
                              section_points: Dict[str, int],
                              held_certifications: Set[str],
                              held_competencies: Set[str],
                              completed_sections: List[str],
                              config: Dict[str, Any]) -> ClassificationResult:
    """Perform full classification with improved requirements checking"""
    level_requirements = config['level_requirements']
    
    # Sort levels in descending order (CW9 to CW1)
    for level in sorted(level_requirements.keys(), reverse=True):
        requirements = level_requirements[level]
        
        # Check if total points meet minimum requirement
        if total_points >= requirements['min_points']:
            required_sections = set(requirements['required_sections'])
            required_certs = set(requirements.get('required_certs', []))
            required_comps = set(requirements.get('required_competencies', []))
            
            # Enhanced requirements checking
            if (required_sections.issubset(set(completed_sections)) and 
                required_certs.issubset(held_certifications) and
                required_comps.issubset(held_competencies)):
                
                # Additional checks for higher levels
                if level in ['CW7', 'CW8', 'CW9']:
                    if not check_leadership_requirements(data, level):
                        continue
                
                award_level, award_info = get_award_mapping(level, config)
                if award_level:
                    return ClassificationResult(
                        level=level,
                        award_level=award_level,
                        award_description=award_info['award_description'],
                        confidence=calculate_confidence_score(
                            completed_sections,
                            len(config['question_groups']),
                            total_points,
                            requirements['min_points'],
                            held_certifications,
                            required_certs
                        ),
                        points=total_points,
                        section_points=section_points,
                        certifications=held_certifications,
                        competencies=held_competencies,
                        completed_sections=completed_sections,
                        missing_requirements=get_missing_requirements(
                            level, held_certifications, held_competencies,
                            completed_sections, config
                        ),
                        progression_requirements=get_progression_requirements(level, config),
                        level_description=requirements.get('description', ''),
                        responsibilities=requirements.get('responsibilities', [])
                    )
    
    # If no higher level matches, default to CW1
    return create_default_classification(
        total_points, section_points, held_certifications,
        held_competencies, completed_sections, config
    )

def check_leadership_requirements(data: Dict[str, Any], level: str) -> bool:
    """Check leadership requirements for higher levels"""
    leadership = data.get('leadership', {}).get('value', '')
    
    if level == 'CW9':
        return leadership in ['technical_director', 'project_director']
    elif level == 'CW8':
        return leadership in ['project_director', 'department_lead']
    elif level == 'CW7':
        return leadership in ['department_lead', 'team_lead']
    
    return False

def create_default_classification(total_points: int,
                                section_points: Dict[str, int],
                                held_certifications: Set[str],
                                held_competencies: Set[str],
                                completed_sections: List[str],
                                config: Dict[str, Any]) -> ClassificationResult:
    """Create a default CW1 classification result"""
    level = 'CW1'
    level_reqs = get_level_requirements(level, config)
    award_level, award_info = get_award_mapping(level, config)
    
    return ClassificationResult(
        level=level,
        award_level=award_level or 'B.1',
        award_description=award_info['award_description'] if award_info else '',
        confidence=calculate_confidence_score(
            completed_sections,
            len(config['question_groups']),
            total_points,
            level_reqs.get('min_points', 0),
            held_certifications,
            set(level_reqs.get('required_certs', []))
        ),
        points=total_points,
        section_points=section_points,
        certifications=held_certifications,
        competencies=held_competencies,
        completed_sections=completed_sections,
        missing_requirements=get_missing_requirements(
            level, held_certifications, held_competencies,
            completed_sections, config
        ),
        progression_requirements=get_progression_requirements(level, config),
        level_description=level_reqs.get('description', ''),
        responsibilities=level_reqs.get('responsibilities', [])
    )

def calculate_section_points(section_data, config):
    """Calculate points and track certifications and competencies for a section"""
    points = 0
    certifications = set()
    competencies = set()
    
    section_name = section_data.get('section', '')
    if not section_name:
        return 0, set(), set()
        
    section_config = config['question_groups'].get(section_name, {})
    
    # Handle multiple questions in a section (like autonomy and supervision)
    for key, value in section_data.items():
        if key not in ['complete', 'section', 'id', 'value', 'values']:
            for question in section_config.get('questions', []):
                if question['id'] == key:
                    for option in question.get('options', []):
                        if option['value'] == value:
                            # Add points for this specific question
                            question_points = option.get('points', 0)
                            points += question_points
                            # Update certifications and competencies
                            certifications.update(option.get('certifications', []))
                            competencies.update(option.get('competencies', []))
                            # Log the points for debugging
                            print(f"Added {question_points} points for {key} = {value}")
    
    # Handle single value questions (for backward compatibility)
    if 'value' in section_data:
        for question in section_config.get('questions', []):
            for option in question.get('options', []):
                if option['value'] == section_data['value']:
                    points += option.get('points', 0)
                    certifications.update(option.get('certifications', []))
                    competencies.update(option.get('competencies', []))
    
    # Handle checkbox questions (multiple values)
    if 'values' in section_data:
        for question in section_config.get('questions', []):
            if question.get('type') == 'checkbox':
                for value in section_data['values']:
                    for option in question.get('options', []):
                        if option['value'] == value:
                            points += option.get('points', 0)
                            certifications.update(option.get('certifications', []))
                            competencies.update(option.get('competencies', []))
    
    # Calculate weighted points based on section weight
    section_weight = config['section_weights'].get(section_name, 0.25)  # Default to 0.25 if not specified
    weighted_points = points * section_weight
    
    # Log the final points for debugging
    print(f"Section {section_name}: Raw points = {points}, Weight = {section_weight}, Weighted points = {weighted_points}")
    
    return weighted_points, certifications, competencies

def calculate_confidence_score(completed_sections, total_sections, points, max_points, 
                             held_certifications, required_certifications):
    """Calculate confidence score based on completion, points, and certifications"""
    completion_weight = 0.4
    points_weight = 0.3
    certification_weight = 0.3
    
    completion_score = (len(completed_sections) / total_sections) * 100
    
    # Handle points score calculation
    points_score = 0
    if max_points > 0:
        # If points equals max_points, give full score
        if points >= max_points:
            points_score = 100
        else:
            points_score = (points / max_points) * 100
    
    # Handle certification score
    cert_score = 0
    if required_certifications:
        cert_score = (len(held_certifications.intersection(required_certifications)) / 
                     len(required_certifications)) * 100
    
    # Calculate final score
    final_score = round(
        (completion_score * completion_weight) + 
        (points_score * points_weight) + 
        (cert_score * certification_weight)
    )
    
    # Ensure minimum score of 0 and maximum of 100
    return max(0, min(100, final_score))

def get_missing_requirements(level, held_certifications, held_competencies, completed_sections, config):
    """Get list of missing requirements for the current level"""
    level_reqs = get_level_requirements(level, config)
    
    return {
        'certifications': list(set(level_reqs.get('required_certs', [])) - held_certifications),
        'competencies': list(set(level_reqs.get('required_competencies', [])) - held_competencies),
        'sections': list(set(level_reqs.get('required_sections', [])) - set(completed_sections))
    }

def get_progression_requirements(current_level, config):
    """Get requirements for progression to next level"""
    levels = sorted(config['level_requirements'].keys())
    try:
        current_index = levels.index(current_level)
        if current_index < len(levels) - 1:
            next_level = levels[current_index + 1]
            progression_key = f"{current_level}_to_{next_level}"
            return config['progression_requirements'].get(progression_key, {})
    except ValueError:
        pass
    return None 