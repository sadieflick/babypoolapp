import os
import secrets

class Config:
    # Flask configuration
    SECRET_KEY = os.environ.get('SECRET_KEY', secrets.token_hex(16))
    
    # Database configuration
    DB_URL = os.environ.get('DATABASE_URL', 'sqlite:///baby_pool.db')
    
    # PostgreSQL connection settings
    # Note: Don't modify the URL directly as SQLAlchemy will handle connection parameters
    SQLALCHEMY_DATABASE_URI = DB_URL
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,
        'max_overflow': 20,
        'pool_recycle': 1800,  # Recycle connections after 30 minutes
        'pool_pre_ping': True,  # Test connections before using them
    }
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Session configuration
    PERMANENT_SESSION_LIFETIME = 2592000  # 30 days in seconds for guests
    
    # File upload configuration
    UPLOAD_FOLDER = 'static/uploads'
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5MB max upload size
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
