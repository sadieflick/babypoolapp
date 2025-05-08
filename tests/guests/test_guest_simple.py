"""
Simple test for guest participation functionality to diagnose issues.
"""

import unittest
import json
from datetime import datetime, timedelta
from app import app, db
from models import User, Event, DateGuess, HourGuess, MinuteGuess, NameGuess
from werkzeug.security import generate_password_hash

class GuestSimpleTestCase(unittest.TestCase):
    """Simple test case for guest participation"""

    def setUp(self):
        """Set up test environment"""
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        app.config['WTF_CSRF_ENABLED'] = False

        self.client = app.test_client()
        
        with app.app_context():
            db.create_all()
            
            # Create a test host
            test_host = User(
                email='test_host@example.com',
                password_hash=generate_password_hash('password123'),
                first_name='Test',
                last_name='Host',
                is_host=True
            )
            db.session.add(test_host)
            
            # Create a test guest
            test_guest = User(
                email='test_guest@example.com',
                password_hash=generate_password_hash('password123'),
                first_name='Test',
                last_name='Guest',
                is_host=False
            )
            db.session.add(test_guest)
            db.session.commit()
            
            # Create a test event
            event_date = (datetime.now() + timedelta(days=30)).date()
            due_date = (datetime.now() + timedelta(days=60)).date()
            
            test_event = Event(
                title='Test Baby Shower',
                event_code=Event.generate_event_code(),
                host_id=test_host.id,
                mother_name='Jane Doe',
                partner_name='John Doe',
                event_date=event_date,
                due_date=due_date,
                guess_price=1.0,
                name_game_enabled=True
            )
            db.session.add(test_event)
            db.session.commit()
            
            # Add guest to event
            test_event.guests.append(test_guest)
            db.session.commit()
            
            self.test_host_id = test_host.id
            self.test_guest_id = test_guest.id
            self.test_event_id = test_event.id
            self.test_event_code = test_event.event_code
    
    def tearDown(self):
        """Clean up after tests"""
        with app.app_context():
            db.session.remove()
            db.drop_all()
    
    def login_as_guest(self):
        """Helper method to log in as the test guest"""
        return self.client.post('/auth/guest/login',
            json={
                'login_type': 'email',
                'email': 'test_guest@example.com'
            },
            content_type='application/json')
    
    def test_guest_login(self):
        """Test that a guest can log in"""
        response = self.login_as_guest()
        
        print(f"Login status code: {response.status_code}")
        print(f"Login response data: {response.data.decode('utf-8')}")
        
        self.assertEqual(response.status_code, 200)
        
        # Verify login was successful
        data = json.loads(response.data)
        
        # Should return status 'need_event' for a new email
        if 'status' in data and data['status'] == 'need_event':
            self.assertIn('message', data)
            self.assertIn('User not found', data['message'])
        else:
            # For existing user, check these fields
            self.assertIn('user_id', data, "Response should include user_id for existing user")
            # If fully registered, will include events data
            if 'events' in data:
                self.assertIsInstance(data['events'], list)
    
    def test_date_guess(self):
        """Test that a guest can make a date guess for an event"""
        # First login
        login_response = self.login_as_guest()
        self.assertEqual(login_response.status_code, 200)
        
        # Make a date guess
        guess_date = (datetime.now() + timedelta(days=65)).strftime('%Y-%m-%d')
        
        guess_data = {
            'date': guess_date
        }
        
        response = self.client.post(f'/api/events/{self.test_event_id}/guesses/date',
            json=guess_data,
            content_type='application/json')
        
        print(f"Date guess status code: {response.status_code}")
        print(f"Date guess response data: {response.data.decode('utf-8')}")
        
        self.assertEqual(response.status_code, 201)
        
        # Verify guess was created
        data = json.loads(response.data)
        self.assertIn('id', data)
        
        # Verify it exists in the database
        with app.app_context():
            date_guess = DateGuess.query.filter_by(
                user_id=self.test_guest_id,
                event_id=self.test_event_id
            ).first()
            self.assertIsNotNone(date_guess)
            self.assertEqual(date_guess.guess_date.strftime('%Y-%m-%d'), guess_date)

    def test_view_guesses(self):
        """Test that a guest can view their guesses"""
        # First login
        login_response = self.login_as_guest()
        self.assertEqual(login_response.status_code, 200)
        
        # First, make a date guess
        guess_date = (datetime.now() + timedelta(days=65)).strftime('%Y-%m-%d')
        guess_data = {'date': guess_date}
        
        self.client.post(f'/api/events/{self.test_event_id}/guesses/date',
            json=guess_data,
            content_type='application/json')
        
        # Now get the user's guesses
        response = self.client.get(f'/api/events/{self.test_event_id}/user/guesses')
        
        print(f"View guesses status code: {response.status_code}")
        print(f"View guesses response data: {response.data.decode('utf-8')}")
        
        self.assertEqual(response.status_code, 200)
        
        # Verify the guesses are returned
        data = json.loads(response.data)
        self.assertIn('date_guesses', data)
        self.assertEqual(len(data['date_guesses']), 1)
        self.assertEqual(data['total_guesses'], 1)
        self.assertEqual(data['guess_price'], 1.0)

if __name__ == '__main__':
    unittest.main()