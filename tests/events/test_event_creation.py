"""
Test script for the event creation functionality - simplified version.
"""

import unittest
import json
from datetime import datetime, timedelta
from app import app, db
from models import User, Event
from werkzeug.security import generate_password_hash

class EventCreationTestCase(unittest.TestCase):
    """Test cases for event creation and management - simplified"""

    def setUp(self):
        """Set up test client and database"""
        app.config['TESTING'] = True
        app.config['WTF_CSRF_ENABLED'] = False
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.client = app.test_client()
        
        # Create test database in memory
        with app.app_context():
            db.create_all()
            
            # Create a test host user
            test_host = User(
                email='testhost@example.com',
                password_hash=generate_password_hash('password123'),
                first_name='Test',
                last_name='Host',
                is_host=True
            )
            db.session.add(test_host)
            db.session.commit()
            
            self.test_host_id = test_host.id
    
    def tearDown(self):
        """Clean up after tests"""
        with app.app_context():
            db.session.remove()
            db.drop_all()
    
    def login_as_host(self):
        """Helper method to log in as the test host"""
        return self.client.post('/auth/host/login', 
            json={'email': 'testhost@example.com', 'password': 'password123'},
            content_type='application/json')
    
    def test_create_event_basic_info(self):
        """Test that a host can create a basic event with required information"""
        # Log in as host
        login_response = self.login_as_host()
        print(f"Login status code: {login_response.status_code}")
        print(f"Login response data: {login_response.data.decode('utf-8')}")
        self.assertEqual(login_response.status_code, 200)
        
        # Create event with basic info
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
        
        print(f"Event creation status code: {response.status_code}")
        print(f"Event creation response data: {response.data.decode('utf-8')}")
        
        self.assertEqual(response.status_code, 201)
        
        # Verify event was created
        data = json.loads(response.data)
        self.assertIn('id', data)
        self.assertIn('event_code', data)
        
        # Verify it exists in the database
        with app.app_context():
            event = Event.query.get(data['id'])
            self.assertIsNotNone(event)
            self.assertEqual(event.mother_name, 'Jane Doe')
    
    def test_get_event_by_code(self):
        """Test that an event can be found by its event code"""
        # Log in as host
        login_response = self.login_as_host()
        self.assertEqual(login_response.status_code, 200)
        
        # First create an event
        event_date = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
        due_date = (datetime.now() + timedelta(days=60)).strftime('%Y-%m-%d')
        
        event_data = {
            'title': 'Test Baby Shower',
            'mother_name': 'Jane Doe',
            'partner_name': 'John Doe',
            'event_date': event_date,
            'due_date': due_date
        }
        
        create_response = self.client.post('/api/events', 
            json=event_data,
            content_type='application/json')
        
        self.assertEqual(create_response.status_code, 201)
        created_event = json.loads(create_response.data)
        event_code = created_event['event_code']
        
        # Now find the event by code
        response = self.client.get(f'/api/events/code/{event_code}')
        
        print(f"Get event by code status: {response.status_code}")
        print(f"Get event response: {response.data.decode('utf-8')}")
        
        self.assertEqual(response.status_code, 200)
        
        # Verify the correct event was returned
        data = json.loads(response.data)
        self.assertEqual(data['id'], created_event['id'])
        self.assertEqual(data['mother_name'], 'Jane Doe')

if __name__ == '__main__':
    unittest.main()