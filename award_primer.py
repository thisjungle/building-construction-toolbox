from flask import Blueprint, render_template, jsonify
import json
import os

award_primer_bp = Blueprint('award_primer', __name__)

@award_primer_bp.route('/award_primer')
def index():
    """Render the award primer page"""
    return render_template('award_primer.html')

@award_primer_bp.route('/award_primer/api/award-content')
def get_award_content():
    """Return the award content as JSON"""
    try:
        # Define the award content directly in the route
        award_content = {
            "sections": [
                {
                    "title": "Welcome to Your Award Guide",
                    "content": "Welcome to the Building and Construction Award Guide! This interactive primer will help you understand your rights and responsibilities under the Building and Construction General On-site Award 2020.",
                    "key_points": [
                        "Learn about your rights under the Award",
                        "Understand different employment types",
                        "Know your entitlements and allowances",
                        "Master classification levels"
                    ],
                    "quiz": {
                        "question": "What will you learn from this guide?",
                        "options": [
                            "How to cook better",
                            "Your rights under the Building Award",
                            "How to build a house",
                            "How to start a business"
                        ],
                        "correct": 1,
                        "explanation": "This guide focuses on understanding your rights and entitlements under the Building and Construction Award."
                    }
                },
                {
                    "title": "What is the Building Award?",
                    "content": "The Building and Construction General On-site Award 2020 is a legal document that sets out the minimum terms and conditions of employment for workers in the building and construction industry.",
                    "key_points": [
                        "Sets minimum employment standards",
                        "Covers wages and conditions",
                        "Applies to on-site building work",
                        "Updated regularly"
                    ],
                    "quiz": {
                        "question": "What is the main purpose of the Award?",
                        "options": [
                            "To make construction more expensive",
                            "To set minimum standards for work conditions",
                            "To make work harder",
                            "To reduce worker rights"
                        ],
                        "correct": 1,
                        "explanation": "The Award's primary purpose is to protect workers by setting minimum standards for wages and conditions."
                    }
                }
            ]
        }
        return jsonify(award_content)
    except Exception as e:
        return jsonify({"error": str(e)}), 500 