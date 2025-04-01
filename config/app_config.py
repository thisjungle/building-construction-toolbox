# Application Configuration

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Flask settings
FLASK_CONFIG = {
    'SECRET_KEY': os.getenv('FLASK_SECRET_KEY', 'dev_key'),
    'DEBUG': os.getenv('FLASK_DEBUG', 'False').lower() == 'true',
    'TESTING': False,
    'TEMPLATES_AUTO_RELOAD': True
}

# File paths
PATHS = {
    'TEMPLATES': os.path.join(os.path.dirname(os.path.dirname(__file__)), 'templates'),
    'STATIC': os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static'),
    'DATA': os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data'),
    'LOGS': os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
}

# Ensure required directories exist
for path in PATHS.values():
    os.makedirs(path, exist_ok=True)

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'standard': {
            'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        },
    },
    'handlers': {
        'file': {
            'class': 'logging.FileHandler',
            'filename': os.path.join(PATHS['LOGS'], 'app.log'),
            'formatter': 'standard'
        },
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'standard'
        }
    },
    'loggers': {
        '': {  # Root logger
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': True
        }
    }
}

# Security settings
SECURITY = {
    'SESSION_COOKIE_SECURE': True,
    'SESSION_COOKIE_HTTPONLY': True,
    'PERMANENT_SESSION_LIFETIME': 1800,  # 30 minutes
    'MAX_CONTENT_LENGTH': 16 * 1024 * 1024  # 16MB max file size
}

# Cache settings
CACHE = {
    'CACHE_TYPE': 'SimpleCache',
    'CACHE_DEFAULT_TIMEOUT': 300  # 5 minutes
} 