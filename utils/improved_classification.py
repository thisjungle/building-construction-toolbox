"""
Improved classification system that better aligns with the Building and Construction General On-site Award.
"""
from typing import Dict, List, Optional, Any, Tuple
import json
from datetime import datetime
from pathlib import Path

class ClassificationError(Exception):
    """Custom exception for classification errors"""
    pass

class ClassificationResult:
    """Class to hold classification results"""
    def __init__(self, level: str, sub_level: Optional[str], confidence: float, 
                 explanations: List[str], requirements_met: Dict[str, bool]):
        self.level = level
        self.sub_level = sub_level
        self.confidence = confidence
        self.explanations = explanations
        self.requirements_met = requirements_met

def load_award_data() -> Dict[str, Any]:
    """Load the award data from levels.json"""
    try:
        with open('data/levels.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        raise ClassificationError(f"Failed to load award data: {str(e)}")

def get_required_qualifications(level: str, award_data: Dict[str, Any]) -> List[str]:
    """Get required qualifications for a level"""
    level_data = next((l for l in award_data['classifications'] if l['level'] == level), None)
    if not level_data:
        raise ClassificationError(f"Invalid level: {level}")
    return level_data.get('qualifications', [])

def get_required_modules(level: str, award_data: Dict[str, Any]) -> int:
    """Get required modules for a level"""
    level_data = next((l for l in award_data['classifications'] if l['level'] == level), None)
    if not level_data:
        raise ClassificationError(f"Invalid level: {level}")
    
    # Module requirements from the award
    module_requirements = {
        'CW/ECW 1': 16,  # For level d
        'CW/ECW 2': 20,
        'CW/ECW 3': 24,  # Base requirement
        'CW/ECW 4': 27,  # Additional to CW3
        'CW/ECW 5': 30,  # Additional to CW3
        'CW/ECW 6': 33,  # Additional to CW3
        'CW/ECW 7': 34.5,  # Additional to CW3
        'CW/ECW 8': 36,  # Additional to CW3
        'CW/ECW 9': 39   # Additional to CW3
    }
    return module_requirements.get(level, 0)

def get_required_skills(level: str, award_data: Dict[str, Any]) -> List[str]:
    """Get required skills for a level"""
    level_data = next((l for l in award_data['classifications'] if l['level'] == level), None)
    if not level_data:
        raise ClassificationError(f"Invalid level: {level}")
    return level_data.get('skills', [])

def get_sub_levels(level: str, award_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Get sub-level requirements for a level"""
    level_data = next((l for l in award_data['classifications'] if l['level'] == level), None)
    if not level_data:
        raise ClassificationError(f"Invalid level: {level}")
    return level_data.get('sub_levels', [])

def get_broadbanded_requirements(role: str, award_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Get requirements for a broadbanded classification"""
    for level in award_data['classifications']:
        if role in level.get('broadbanded_classifications', []):
            return {
                'level': level['level'],
                'qualifications': level.get('qualifications', []),
                'skills': level.get('skills', []),
                'typical_tasks': level.get('typical_tasks', {})
            }
    return None

def meets_qualifications(responses: Dict[str, Any], required_quals: List[str]) -> Tuple[bool, List[str]]:
    """Check if responses meet qualification requirements"""
    explanations = []
    qual_level = responses.get('qual_level', 'none')
    modules_completed = responses.get('modules_completed', 0)
    qual_pathway = responses.get('qual_pathway', '')
    
    # Check formal qualifications
    has_required_qual = False
    for req_qual in required_quals:
        if 'trade' in req_qual.lower() and qual_level in ['complete', 'advanced']:
            has_required_qual = True
            break
        elif 'structured training' in req_qual.lower() and qual_pathway in ['trade', 'advanced_cert']:
            has_required_qual = True
            break
    
    if not has_required_qual:
        explanations.append("Does not meet qualification requirements")
    
    return has_required_qual, explanations

def meets_module_requirements(responses: Dict[str, Any], required_modules: int) -> Tuple[bool, List[str]]:
    """Check if responses meet module requirements"""
    explanations = []
    modules_completed = responses.get('modules_completed', 0)
    
    if modules_completed < required_modules:
        explanations.append(f"Does not meet module requirements ({modules_completed}/{required_modules} modules)")
    
    return modules_completed >= required_modules, explanations

def meets_skill_requirements(responses: Dict[str, Any], required_skills: List[str]) -> Tuple[bool, List[str]]:
    """Check if responses meet skill requirements"""
    explanations = []
    daily_activities = responses.get('daily_activities', [])
    supervision_level = responses.get('supervision_level', 'direct')
    decision_making = responses.get('decision_making', 'basic')
    
    # Check supervision level
    if 'limited supervision' in required_skills and supervision_level != 'limited':
        explanations.append("Does not meet supervision level requirements")
    
    # Check decision-making level
    if 'exercises discretion' in required_skills and decision_making == 'basic':
        explanations.append("Does not meet decision-making requirements")
    
    # Check daily activities against required skills
    for skill in required_skills:
        if not any(skill.lower() in activity.lower() for activity in daily_activities):
            explanations.append(f"Does not demonstrate required skill: {skill}")
    
    return len(explanations) == 0, explanations

def meets_sub_level_requirements(responses: Dict[str, Any], sub_level: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """Check if responses meet sub-level requirements"""
    explanations = []
    
    # Check if they meet the substantive requirements
    if 'substantive requirements' in sub_level['description'].lower():
        # Check qualifications
        qual_level = responses.get('qual_level', 'none')
        if qual_level == 'none':
            explanations.append("Does not meet substantive requirements")
        
        # Check modules
        modules_completed = responses.get('modules_completed', 0)
        if modules_completed < 16:  # Minimum for CW1 level d
            explanations.append("Does not meet module requirements for substantive level")
    
    return len(explanations) == 0, explanations

def meets_broadbanded_requirements(responses: Dict[str, Any], broadbanded: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """Check if responses meet broadbanded classification requirements"""
    explanations = []
    
    # Check qualifications
    qual_met, qual_explanations = meets_qualifications(responses, broadbanded['qualifications'])
    if not qual_met:
        explanations.extend(qual_explanations)
    
    # Check skills
    skills_met, skills_explanations = meets_skill_requirements(responses, broadbanded['skills'])
    if not skills_met:
        explanations.extend(skills_explanations)
    
    return len(explanations) == 0, explanations

def assess_quality_control(level: str, responses: Dict[str, Any], award_data: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """Assess quality control requirements"""
    explanations = []
    level_data = next((l for l in award_data['classifications'] if l['level'] == level), None)
    if not level_data:
        raise ClassificationError(f"Invalid level: {level}")
    
    qc_requirements = []
    for skill in level_data.get('skills', []):
        if 'quality' in skill.lower():
            qc_requirements.append(skill)
    
    if qc_requirements:
        qc_experience = responses.get('quality_control_experience', [])
        for req in qc_requirements:
            if not any(req.lower() in exp.lower() for exp in qc_experience):
                explanations.append(f"Does not meet quality control requirement: {req}")
    
    return len(explanations) == 0, explanations

def classify_employee(responses: Dict[str, Any]) -> ClassificationResult:
    """
    Classify an employee based on their responses.
    This is the main entry point for classification.
    """
    try:
        # Load award data
        award_data = load_award_data()
        
        # Get role if specified
        role = responses.get('role')
        if role:
            # Check broadbanded classification first
            broadbanded = get_broadbanded_requirements(role, award_data)
            if broadbanded:
                met, explanations = meets_broadbanded_requirements(responses, broadbanded)
                if met:
                    return ClassificationResult(
                        level=broadbanded['level'],
                        sub_level=None,
                        confidence=100.0,
                        explanations=[],
                        requirements_met={'broadbanded': True}
                    )
        
        # Regular classification process
        best_level = None
        best_score = 0
        best_explanations = []
        requirements_met = {}
        
        # Check each level from highest to lowest
        for level_data in reversed(award_data['classifications']):
            level = level_data['level']
            explanations = []
            level_requirements_met = {}
            
            # Check prerequisites
            qual_met, qual_explanations = meets_qualifications(responses, level_data['qualifications'])
            level_requirements_met['qualifications'] = qual_met
            explanations.extend(qual_explanations)
            
            module_met, module_explanations = meets_module_requirements(responses, get_required_modules(level, award_data))
            level_requirements_met['modules'] = module_met
            explanations.extend(module_explanations)
            
            skill_met, skill_explanations = meets_skill_requirements(responses, level_data['skills'])
            level_requirements_met['skills'] = skill_met
            explanations.extend(skill_explanations)
            
            qc_met, qc_explanations = assess_quality_control(level, responses, award_data)
            level_requirements_met['quality_control'] = qc_met
            explanations.extend(qc_explanations)
            
            # Calculate score based on requirements met
            score = sum(1 for met in level_requirements_met.values() if met)
            score = (score / len(level_requirements_met)) * 100
            
            if score > best_score:
                best_score = score
                best_level = level
                best_explanations = explanations
                requirements_met = level_requirements_met
        
        if not best_level:
            raise ClassificationError("Could not determine classification level")
        
        # Determine sub-level
        experience_months = responses.get('experience_months', 0)
        sub_levels = get_sub_levels(best_level, award_data)
        sub_level = None
        
        for sub_level_data in reversed(sub_levels):
            met, sub_explanations = meets_sub_level_requirements(responses, sub_level_data)
            if met:
                sub_level = sub_level_data['name']
                break
        
        return ClassificationResult(
            level=best_level,
            sub_level=sub_level,
            confidence=best_score,
            explanations=best_explanations,
            requirements_met=requirements_met
        )
        
    except Exception as e:
        raise ClassificationError(f"Classification failed: {str(e)}") 