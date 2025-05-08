import os
import logging
from datetime import timedelta
from flask import Flask, render_template, send_from_directory, redirect, jsonify, request
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
def dashboard():
    """Redirect dashboard requests to the SPA host dashboard route
    
    This handles both Flask-Login and JWT authentication methods
    """
    # For JWT auth, we don't need to check here since the SPA will handle it
    # Just redirect to the SPA route and let the frontend handle auth state
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

    # Define SPA routes that should always return index.html
    spa_routes = [
        'host/dashboard', 
        'host/event/create',
        'host/event/',
        'guest/dashboard',
        'guest/event/',
        'guest/login',
        'auth/guest_login'
    ]
    
    # Check if path matches any SPA route pattern
    is_spa_route = any(path.startswith(route) for route in spa_routes)
    
    # Check if this is an API or auth endpoint that should not return index.html
    # Only handle API endpoints if they're not already defined (to avoid 404)
    is_api_route = path.startswith('api/') or \
                  path == 'api' or \
                  path.startswith('auth/') and not is_spa_route
    
    if is_api_route and request.method != 'GET':
        # Don't catch POST/PUT/DELETE API requests here - let them be handled by their blueprints
        return jsonify({"error": f"API endpoint not found: /{path}"}), 404
    
    # Handle old URL patterns to ensure proper redirection to SPA routes
    if path == 'guest-info' and request.args.get('event_id'):
        event_id = request.args.get('event_id')
        return redirect(f'/guest/event/{event_id}')

    if path.startswith('event/') and path.split('/')[1].isdigit():
        event_id = path.split('/')[1]
        return redirect(f'/guest/event/{event_id}')
    
    # For SPA routes or the root path, serve index.html to let the React router handle it
    if is_spa_route or path == '':
        # Log for debugging in test environment
        logger.debug(f"Serving SPA index.html for path: /{path}")
        return render_template('index.html')
        
    # For unmatched API routes, return 404
    if is_api_route:
        return jsonify({"error": f"API endpoint not found: /{path}"}), 404
        
    # For any other unmatched route, assume it's a frontend route and serve index.html
    return render_template('index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)