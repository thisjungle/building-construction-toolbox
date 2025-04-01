import os
import json
from pathlib import Path

def rename_files():
    """Rename files to follow snake_case convention"""
    config_dir = Path('config')
    
    # Files to rename
    renames = {
        'trainingWage.json': 'training_wage.json',
        'timeoff_nopay.json': 'time_off_no_pay.json'
    }
    
    for old_name, new_name in renames.items():
        old_path = config_dir / old_name
        new_path = config_dir / new_name
        if old_path.exists() and not new_path.exists():
            print(f"Renaming {old_name} to {new_name}")
            old_path.rename(new_path)
        elif old_path.exists() and new_path.exists():
            print(f"Warning: Both {old_name} and {new_name} exist")
        elif not old_path.exists():
            print(f"Warning: {old_name} not found")

# Rename the file
old_name = 'helpers/calculateAllowances.py'
new_name = 'helpers/calculate_allowances.py'

try:
    os.rename(old_name, new_name)
    print(f"Successfully renamed {old_name} to {new_name}")
except Exception as e:
    print(f"Error renaming file: {e}")

if __name__ == '__main__':
    rename_files() 