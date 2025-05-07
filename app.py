import os
import logging
from datetime import timedelta
from flask import Flask, render_template, send_from_directory, redirect, jsonify
from flask_cors import CORS
from flask_login import LoginManager, login_required, current_user
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, jwt_required
from config import Config
from models import db, User
from sqlalchemy import event
from sqlalchemy.engine import Engine
from sqlalchemy.exc import DisconnectionError, OperationalError

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__, 
            static_folder='./static', 
            template_folder='./templates')
app.config.from_object(Config)

# Configure JWT settings
app.config['JWT_SECRET_KEY'] = app.config['SECRET_KEY']
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)  # Default expiration for hosts
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)  # For longer sessions
app.config['JWT_TOKEN_LOCATION'] = ['headers', 'cookies']  # Look for token in both headers and cookies

# Initialize extensions
db.init_app(app)
CORS(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)
login_manager = LoginManager(app)
login_manager.login_view = 'auth.host_login_page'

# Add database connection pool ping for PostgreSQL
@event.listens_for(Engine, "connect")
def ping_connection(dbapi_connection, connection_record):
    """Ping database connection to prevent disconnections"""
    cursor = dbapi_connection.cursor()
    try:
        cursor.execute("SELECT 1")
    except Exception:
        # Optional - raise disconnection error
        raise DisconnectionError("Database connection failed")
    finally:
        cursor.close()

# Configure a connection handler for retrying failed queries
def get_db_connection_with_retry(max_retries=3):
    """Get database connection with retry logic"""
    retries = 0
    while retries < max_retries:
        try:
            return db.engine.connect()
        except OperationalError as e:
            retries += 1
            logger.error(f"Database connection error (attempt {retries}/{max_retries}): {str(e)}")
            if retries >= max_retries:
                raise
            # Add exponential backoff if needed

@login_manager.user_loader
def load_user(user_id):
    try:
        return User.query.get(int(user_id))
    except Exception as e:
        logger.error(f"Error loading user: {str(e)}")
        return None

# Register blueprints
from routes import api
from auth import auth_blueprint
from google_auth import google_auth

app.register_blueprint(api, url_prefix='/api')
app.register_blueprint(auth_blueprint, url_prefix='/auth')
app.register_blueprint(google_auth, url_prefix='/google_auth')

# Create database tables
with app.app_context():
    db.create_all()

# Route for dashboard is handled by the SPA
# All frontend routes are handled by the catch-all route below

# Removed non-SPA route for event creation since the React app handles it now

@app.route('/dashboard')
@login_required
def dashboard():
    """Redirect dashboard requests to the SPA host dashboard route"""
    return redirect('/host/dashboard')

@app.route('/test/auth')
def test_auth():
    """Test authentication page for debugging purposes"""
    return render_template('test_auth.html')

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    """Serve the React single-page application for all routes not handled by API endpoints"""
    # First check if the path corresponds to a static file
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    
    # Otherwise, serve the index.html template to handle SPA routing
    return render_template('index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
