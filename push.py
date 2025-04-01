import os
import subprocess
import sys
from datetime import datetime

def run_command(command):
    """Run a command and print its output"""
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error: {e.stderr}")
        return False

def push_changes(message=None):
    """Push changes to GitHub with an optional message"""
    # If no message provided, create one with timestamp
    if not message:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        message = f"Update at {timestamp}"
    
    print("🚀 Starting push process...")
    
    # Step 1: Add all changes
    print("\n1️⃣ Adding changes...")
    if not run_command("git add ."):
        print("❌ Failed to add changes")
        return False
    
    # Step 2: Commit changes
    print("\n2️⃣ Creating checkpoint...")
    if not run_command(f'git commit -m "{message}"'):
        print("❌ Failed to commit changes")
        return False
    
    # Step 3: Push to GitHub
    print("\n3️⃣ Pushing to GitHub...")
    if not run_command("git push"):
        print("❌ Failed to push to GitHub")
        return False
    
    print("\n✅ Push completed successfully!")
    return True

if __name__ == "__main__":
    # Get message from command line if provided
    message = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else None
    
    # Run the push process
    push_changes(message) 