from flask import Blueprint, render_template

home_bp = Blueprint('home', __name__)

@home_bp.route('/')
def home():
    """Render the home page."""
    try:
        return render_template('home.html')
    except Exception as e:
        return str(e) 