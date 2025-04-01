from datetime import datetime
import uuid
import json
import os
from config.app_config import PATHS

class Position:
    """Position model for job postings"""
    def __init__(self, title, description, requirements):
        self.id = str(uuid.uuid4())
        self.title = title
        self.description = description
        self.requirements = requirements
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    @staticmethod
    def _get_positions_file():
        """Get the path to the positions JSON file"""
        return os.path.join(PATHS['DATA'], 'positions.json')

    @staticmethod
    def _load_positions():
        """Load all positions from JSON file"""
        positions_file = Position._get_positions_file()
        if os.path.exists(positions_file):
            with open(positions_file, 'r') as f:
                return json.load(f)
        return []

    def save(self):
        """Save the position to JSON file"""
        positions = Position._load_positions()
        positions.append(self.to_dict())
        
        with open(Position._get_positions_file(), 'w') as f:
            json.dump(positions, f, indent=2)

    @staticmethod
    def get_by_id(position_id):
        """Get a position by ID"""
        positions = Position._load_positions()
        for pos in positions:
            if pos['id'] == position_id:
                position = Position(pos['title'], pos['description'], pos['requirements'])
                position.id = pos['id']
                position.created_at = datetime.fromisoformat(pos['created_at'])
                position.updated_at = datetime.fromisoformat(pos['updated_at'])
                return position
        return None

    def to_dict(self):
        """Convert position to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'requirements': self.requirements,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 