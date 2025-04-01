"""
Utility functions for classification calculations.
"""
from typing import Dict, List, Optional, Any
import json
from ..config.classification_config import CLASSIFICATION_CONFIG

def calculate_qualification_score(
    qualification: str,
    modules_completed: int,
    required_qualifications: List[str],
    qualification_pathway: str
) -> float:
    """Calculate qualification score considering both formal qualifications and modules"""
    # Get base qualification score
    qual_info = CLASSIFICATION_CONFIG['qualification_map'].get(qualification, {'level': 'none', 'weight': 0.0})
    base_score = qual_info['weight']
    
    # Get pathway multiplier based on Schedule A.1.9 and A.1.6
    pathway_multiplier = CLASSIFICATION_CONFIG['qualification_pathways'].get(qualification_pathway, 0.6)
    
    # Calculate module contribution based on Schedule A requirements
    module_contribution = 0.0
    if modules_completed >= 30:
        module_contribution = 0.3  # Significant module completion (CW5+)
    elif modules_completed >= 24:
        module_contribution = 0.2  # Base requirement (CW3)
    elif modules_completed >= 20:
        module_contribution = 0.15  # CW2 requirement
    elif modules_completed >= 16:
        module_contribution = 0.1  # CW1 requirement
    
    # Combine scores with pathway multiplier
    total_score = (base_score + module_contribution) * pathway_multiplier
    
    # Check if qualification meets requirements
    if qualification in required_qualifications:
        return min(total_score + 0.2, 1.0)  # Bonus for meeting requirements
    return total_score

def calculate_technical_score(responses: Dict[str, Any], required_skills: List[str]) -> float:
    """Calculate technical field experience score based on Schedule A.1.13"""
    score = 0.0
    
    # Get technical field experience
    technical_fields = responses.get('technical_fields', {})
    
    for field, components in CLASSIFICATION_CONFIG['technical_fields'].items():
        field_weight = components['weight']
        field_skills = components['skills']
        
        # Calculate field score
        field_score = 0.0
        for skill in field_skills:
            if skill in technical_fields:
                field_score += 1.0
                
        # Normalize field score
        field_score = min(field_score / len(field_skills), 1.0)
        
        # Add weighted field score to total
        score += field_score * field_weight
    
    return min(score, 1.0)

def calculate_skills_score(responses: Dict[str, Any], required_skills: List[str]) -> float:
    """Calculate how well the responses match the required skills based on Schedule A"""
    score = 0.0
    weights = {
        'supervision': 0.25,    # Supervision level is crucial
        'quality_control': 0.2,  # Quality control responsibilities
        'training': 0.2,        # Training capabilities
        'autonomy': 0.2,        # Level of autonomy
        'discretion': 0.15      # Exercise of discretion
    }
    
    # Calculate weighted scores for each skill category
    for category, weight in weights.items():
        response_level = responses.get(category, 'basic')
        category_score = CLASSIFICATION_CONFIG['skills_matrix'][category].get(response_level, 0.3)
        score += category_score * weight
    
    return min(score, 1.0)

def determine_sub_level(level: str, experience: float, responses: Dict[str, Any]) -> Optional[str]:
    """Determine the appropriate sub-level based on experience and responses"""
    if level not in CLASSIFICATION_CONFIG['sub_levels']:
        return None
        
    sub_levels = CLASSIFICATION_CONFIG['sub_levels'][level]
    experience_months = experience * 12
    
    # Find the highest applicable sub-level
    applicable_sub_level = None
    for sub_level, requirements in sub_levels.items():
        if experience_months >= requirements['months']:
            applicable_sub_level = sub_level
            
    return applicable_sub_level

def calculate_daily_work_score(responses, required_activities):
    """Calculate score based on daily work activities."""
    score = 0
    daily_work = responses.get('daily_activities', [])
    supervision = responses.get('supervision_level')
    decision_making = responses.get('decision_making')
    
    # Check required activities
    for activity in required_activities:
        if activity in daily_work:
            activity_level = activity.split('_')[0]
            level_points = {
                'cw1': 10, 'cw2': 20, 'cw3': 30, 'cw4': 35,
                'cw5': 40, 'cw6': 45, 'cw7': 50, 'cw8': 55, 'cw9': 60
            }
            score += level_points.get(activity_level, 10)
    
    # Consider supervision level
    supervision_scores = {'direct': 10, 'general': 20, 'limited': 30}
    if supervision in supervision_scores:
        score += supervision_scores[supervision]
    
    # Consider decision-making level
    decision_scores = {
        'basic': 10, 'operational': 20, 'technical': 30,
        'strategic': 40, 'executive': 50
    }
    if decision_making in decision_scores:
        score += decision_scores[decision_making]
    
    return min(score, 100)

def calculate_experience_score(responses, requirements):
    """Calculate experience score based on Schedule A requirements."""
    score = 0
    experience = responses.get('experience')
    technical_field = responses.get('technical_field')
    
    # Experience scores
    exp_scores = {
        'new': 10, '3-12m': 20, '1-3y': 30,
        '3-8y': 40, '8plus': 50
    }
    
    if experience in exp_scores:
        score += exp_scores[experience]
    
    # Technical field contribution
    field_scores = {
        'production_planning': 20,
        'technical': 30,
        'design': 20
    }
    
    if technical_field in field_scores:
        score += field_scores[technical_field]
    
    return min(score, 100)

def meets_minimum_requirements(responses, requirements):
    """Check if responses meet minimum requirements for the level."""
    # Check required sections
    for section in requirements['required_sections']:
        if section not in responses:
            return False
    
    # Check required certifications
    for cert in requirements['required_certifications']:
        if cert not in responses.get('certifications', []):
            return False
    
    # Check module requirements
    modules_completed = responses.get('modules_completed', 0)
    if modules_completed < requirements['module_requirements']['minimum']:
        return False
    
    # Check supervision level
    supervision = responses.get('supervision_level')
    if supervision != requirements['supervision_level']:
        return False
    
    return True

def calculate_confidence(score, all_scores):
    """Calculate confidence level based on score and other level scores."""
    max_score = max(all_scores.values())
    if max_score == 0:
        return 0
    
    # Calculate percentage above next highest score
    sorted_scores = sorted(all_scores.values(), reverse=True)
    if len(sorted_scores) > 1:
        next_highest = sorted_scores[1]
        difference = score - next_highest
        confidence = min((difference / max_score) * 100, 100)
    else:
        confidence = (score / max_score) * 100
    
    return round(confidence, 2)

def process_classification(responses: Dict[str, Any]) -> Dict[str, Any]:
    """Process classification based on responses, following Schedule A principles."""
    # Load levels data
    with open('data/levels_config.json', 'r') as f:
        levels_data = json.load(f)
    
    # Calculate scores for each classification level
    scores = {}
    explanations = []
    
    for level, requirements in levels_data['award_mappings'].items():
        score = 0
        level_explanations = []
        
        # Check daily work activities
        daily_work_score = calculate_daily_work_score(responses, requirements['daily_work_activities'])
        score += daily_work_score * 0.4  # 40% weight for daily work
        
        # Check qualifications
        qual_score = calculate_qualification_score(responses, requirements)
        score += qual_score * 0.3  # 30% weight for qualifications
        
        # Check experience
        exp_score = calculate_experience_score(responses, requirements)
        score += exp_score * 0.3  # 30% weight for experience
        
        # Check if minimum requirements are met
        if not meets_minimum_requirements(responses, requirements):
            score = 0
            level_explanations.append(f"Does not meet minimum requirements for {level}")
        
        scores[level] = score
        explanations.extend(level_explanations)
    
    # Find best match
    best_level = max(scores.items(), key=lambda x: x[1])
    
    # Calculate confidence
    confidence = calculate_confidence(best_level[1], scores)
    
    return {
        'level': best_level[0],
        'confidence': confidence,
        'score': best_level[1],
        'explanations': explanations
    } 