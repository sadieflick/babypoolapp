"""
Database initialization script.
Run this script to create all database tables.
"""

from app import app, db
from models import User, Event, DateGuess, HourGuess, MinuteGuess, NameGuess, Payment
from werkzeug.security import generate_password_hash

def init_db():
    """Create all database tables and add a test user."""
    print("Creating database tables...")
    with app.app_context():
        # Create all tables
        db.create_all()
        print("Tables created successfully!")
        
        # Check if test user exists
        test_user = User.query.filter_by(email='test@example.com').first()
        
        if not test_user:
            print("Creating test user...")
            test_user = User(
                email='test@example.com',
                password_hash=generate_password_hash('password123'),
                first_name='Test',
                last_name='User',
                is_host=True
            )
            db.session.add(test_user)
            db.session.commit()
            print("Test user created successfully!")
        else:
            print("Test user already exists.")

if __name__ == "__main__":
    init_db()