from app import app, db
from models import User
from werkzeug.security import generate_password_hash

with app.app_context():
    # Check if the test user already exists
    existing_user = User.query.filter_by(email='test@example.com').first()
    
    if not existing_user:
        # Create a new test host
        test_host = User(
            email='test@example.com',
            password_hash=generate_password_hash('password'),
            first_name='Test',
            last_name='User',
            is_host=True
        )
        
        db.session.add(test_host)
        db.session.commit()
        print(f"Created new test host: ID: {test_host.id}, Email: {test_host.email}")
    else:
        print(f"Test host already exists: ID: {existing_user.id}, Email: {existing_user.email}")