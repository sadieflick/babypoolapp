"""
Simple test for event creation to diagnose issues.
"""

import unittest
import json
from datetime import datetime, timedelta
from app import app, db
from models import User, Event
from werkzeug.security import generate_password_hash

class EventTestCase(unittest.TestCase):
    """Simple test case for event creation"""

    def setUp(self):
        """Set up test environment"""
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        app.config['WTF_CSRF_ENABLED'] = False

        self.client = app.test_client()
        
        with app.app_context():
            db.create_all()
            
            # Create a test user
            test_user = User(
                email='test@example.com',
                password_hash=generate_password_hash('password123'),
                first_name='Test',
                last_name='User',
                is_host=True
            )
            db.session.add(test_user)
            db.session.commit()
    
    def tearDown(self):
        """Clean up after tests"""
        with app.app_context():
            db.session.remove()
            db.drop_all()
    
    def test_login(self):
        """Test that login works"""
        # Test login
        login_data = {
            'email': 'test@example.com',
            'password': 'password123'
        }
        
        response = self.client.post('/auth/host/login', 
            json=login_data,
            content_type='application/json')
        
        # Log the response data for debugging
        print(f"Login status code: {response.status_code}")
        print(f"Login response data: {response.data.decode('utf-8')}")
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('message', data)
        self.assertEqual(data['message'], 'Login successful')
        
    def test_create_event(self):
        """Test event creation"""
        # First login
        login_data = {
            'email': 'test@example.com',
            'password': 'password123'
        }
        
        login_response = self.client.post('/auth/host/login', 
            json=login_data,
            content_type='application/json')
        
        self.assertEqual(login_response.status_code, 200)
        
        # Now create an event
        event_date = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
        due_date = (datetime.now() + timedelta(days=60)).strftime('%Y-%m-%d')
        
        event_data = {
            'title': 'Test Baby Shower',
            'mother_name': 'Jane Doe',
            'partner_name': 'John Doe',
            'event_date': event_date,
            'due_date': due_date,
            'guess_price': 1.0
        }
        
        response = self.client.post('/api/events', 
            json=event_data,
            content_type='application/json')
        
        # Log the response for debugging
        print(f"Event creation status code: {response.status_code}")
        print(f"Event creation response data: {response.data.decode('utf-8')}")
        
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertIn('id', data)
        self.assertIn('event_code', data)
        
        # Verify the event was created in the database
        with app.app_context():
            event = Event.query.get(data['id'])
            self.assertIsNotNone(event)
            self.assertEqual(event.mother_name, 'Jane Doe')

if __name__ == '__main__':
    unittest.main()