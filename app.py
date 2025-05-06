import os
from flask import Flask, render_template, send_from_directory
from flask_cors import CORS
from flask_login import LoginManager
from flask_bcrypt import Bcrypt
from config import Config
from models import db, User

app = Flask(__name__, 
            static_folder='./static', 
            template_folder='./templates')
app.config.from_object(Config)

# Initialize extensions
db.init_app(app)
CORS(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.login_view = 'auth.login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

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
