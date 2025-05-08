"""
Test script for guest participation functionality.

This script tests the various endpoints and logic for guests to participate
in baby shower events, including accessing events, making guesses, and
handling payments.

Each test focuses on a specific user story from our requirements.
"""

import unittest
import os
import json
from datetime import datetime, timedelta
from flask import session
from app import app, db
from models import User, Event, DateGuess, HourGuess, MinuteGuess, NameGuess, Payment
from werkzeug.security import generate_password_hash

class GuestParticipationTestCase(unittest.TestCase):
    """Test cases for guest participation in events"""

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
            
            # Create a test guest user
            test_guest = User(
                email='testguest@example.com',
                password_hash=generate_password_hash('password123'),
                first_name='Test',
                last_name='Guest',
                is_host=False
            )
            db.session.add(test_guest)
            
            # Create a test event
            event_date = datetime.now() + timedelta(days=30)
            due_date = datetime.now() + timedelta(days=60)
            
            test_event = Event(
                event_code='TEST123',
                title='Test Baby Shower',
                host_id=1,  # The first user (host)
                mother_name='Jane Doe',
                partner_name='John Doe',
                event_date=event_date,
                due_date=due_date,
                guess_price=1.0,
                name_game_enabled=True
            )
            db.session.add(test_event)
            
            # Add the guest to the event
            test_event.guests.append(test_guest)
            
            db.session.commit()
            
            self.test_host_id = test_host.id
            self.test_guest_id = test_guest.id
            self.test_event_id = test_event.id
    
    def tearDown(self):
        """Clean up after tests"""
        with app.app_context():
            db.session.remove()
            db.drop_all()
    
    def login_as_guest(self):
        """Helper method to log in as the test guest"""
        return self.client.post('/auth/guest/login', 
            json={'email': 'testguest@example.com', 'password': 'password123'},
            content_type='application/json')
    
    def test_access_event_by_code(self):
        """Test that a guest can access an event using the event code"""
        response = self.client.get('/api/events/code/TEST123')
        
        self.assertEqual(response.status_code, 200)
        
        # Verify the correct event was returned
        data = json.loads(response.data)
        self.assertEqual(data['title'], 'Test Baby Shower')
        self.assertEqual(data['mother_name'], 'Jane Doe')
    
    def test_make_date_guess(self):
        """Test that a guest can make a date guess for an event"""
        # Log in as guest
        login_response = self.login_as_guest()
        self.assertEqual(login_response.status_code, 200)
        
        # Make a date guess
        guess_date = (datetime.now() + timedelta(days=61)).strftime('%Y-%m-%d')
        
        guess_data = {
            'date': guess_date
        }
        
        response = self.client.post(f'/api/events/{self.test_event_id}/guesses/date', 
            json=guess_data,
            content_type='application/json')
        
        self.assertEqual(response.status_code, 201)
        
        # Verify guess was created
        data = json.loads(response.data)
        self.assertIn('id', data)
        self.assertEqual(data['event_id'], self.test_event_id)
        
        # Verify it exists in the database
        with app.app_context():
            guess = DateGuess.query.get(data['id'])
            self.assertIsNotNone(guess)
            self.assertEqual(guess.user_id, self.test_guest_id)
            self.assertEqual(guess.event_id, self.test_event_id)
    
    def test_make_hour_guess(self):
        """Test that a guest can make an hour guess for an event"""
        # Log in as guest
        login_response = self.login_as_guest()
        self.assertEqual(login_response.status_code, 200)
        
        # Make an hour guess
        guess_data = {
            'hour': 3,
            'am_pm': 'PM'
        }
        
        response = self.client.post(f'/api/events/{self.test_event_id}/guesses/hour', 
            json=guess_data,
            content_type='application/json')
        
        self.assertEqual(response.status_code, 201)
        
        # Verify guess was created
        data = json.loads(response.data)
        self.assertIn('id', data)
        self.assertEqual(data['event_id'], self.test_event_id)
        self.assertEqual(data['hour'], 3)
        self.assertEqual(data['am_pm'], 'PM')
        
        # Verify it exists in the database
        with app.app_context():
            guess = HourGuess.query.get(data['id'])
            self.assertIsNotNone(guess)
            self.assertEqual(guess.user_id, self.test_guest_id)
            self.assertEqual(guess.event_id, self.test_event_id)
            self.assertEqual(guess.hour, 3)
            self.assertEqual(guess.am_pm, 'PM')
    
    def test_make_minute_guess(self):
        """Test that a guest can make a minute guess for an event"""
        # Log in as guest
        login_response = self.login_as_guest()
        self.assertEqual(login_response.status_code, 200)
        
        # Make a minute guess
        guess_data = {
            'minute': 42
        }
        
        response = self.client.post(f'/api/events/{self.test_event_id}/guesses/minute', 
            json=guess_data,
            content_type='application/json')
        
        self.assertEqual(response.status_code, 201)
        
        # Verify guess was created
        data = json.loads(response.data)
        self.assertIn('id', data)
        self.assertEqual(data['event_id'], self.test_event_id)
        self.assertEqual(data['minute'], 42)
        
        # Verify it exists in the database
        with app.app_context():
            guess = MinuteGuess.query.get(data['id'])
            self.assertIsNotNone(guess)
            self.assertEqual(guess.user_id, self.test_guest_id)
            self.assertEqual(guess.event_id, self.test_event_id)
            self.assertEqual(guess.minute, 42)
    
    def test_make_name_guess(self):
        """Test that a guest can make a name guess for an event with name game enabled"""
        # Log in as guest
        login_response = self.login_as_guest()
        self.assertEqual(login_response.status_code, 200)
        
        # Make a name guess
        guess_data = {
            'name': 'Sophia'
        }
        
        response = self.client.post(f'/api/events/{self.test_event_id}/guesses/name', 
            json=guess_data,
            content_type='application/json')
        
        self.assertEqual(response.status_code, 201)
        
        # Verify guess was created
        data = json.loads(response.data)
        self.assertIn('id', data)
        self.assertEqual(data['event_id'], self.test_event_id)
        self.assertEqual(data['name'], 'Sophia')
        
        # Verify it exists in the database
        with app.app_context():
            guess = NameGuess.query.get(data['id'])
            self.assertIsNotNone(guess)
            self.assertEqual(guess.user_id, self.test_guest_id)
            self.assertEqual(guess.event_id, self.test_event_id)
            self.assertEqual(guess.name, 'Sophia')
    
    def test_cannot_make_name_guess_if_disabled(self):
        """Test that a guest cannot make a name guess if the name game is disabled"""
        # Disable the name game for the test event
        with app.app_context():
            event = Event.query.get(self.test_event_id)
            event.name_game_enabled = False
            db.session.commit()
        
        # Log in as guest
        login_response = self.login_as_guest()
        self.assertEqual(login_response.status_code, 200)
        
        # Try to make a name guess
        guess_data = {
            'name': 'Sophia'
        }
        
        response = self.client.post(f'/api/events/{self.test_event_id}/guesses/name', 
            json=guess_data,
            content_type='application/json')
        
        # Should be forbidden
        self.assertEqual(response.status_code, 403)
        
        # Verify error message
        data = json.loads(response.data)
        self.assertIn('error', data)
        self.assertIn('disabled', data['error'].lower())
    
    def test_view_user_guesses(self):
        """Test that a guest can view their own guesses for an event"""
        # Set up a test guess in the database
        with app.app_context():
            date_guess = DateGuess(
                user_id=self.test_guest_id,
                event_id=self.test_event_id,
                guess_date=datetime.now() + timedelta(days=61)
            )
            db.session.add(date_guess)
            db.session.commit()
        
        # Log in as guest
        login_response = self.login_as_guest()
        self.assertEqual(login_response.status_code, 200)
        
        # Get user guesses
        response = self.client.get(f'/api/events/{self.test_event_id}/user/guesses')
        
        self.assertEqual(response.status_code, 200)
        
        # Verify guesses are returned
        data = json.loads(response.data)
        self.assertIn('date_guesses', data)
        self.assertEqual(len(data['date_guesses']), 1)
    
    def test_mark_payment_made(self):
        """Test that a guest can mark that they've made a payment"""
        # Log in as guest
        login_response = self.login_as_guest()
        self.assertEqual(login_response.status_code, 200)
        
        # Create a payment record
        payment_data = {
            'amount': 3.0,  # $3 for 3 guesses
            'status': 'paid'
        }
        
        response = self.client.put(f'/api/events/{self.test_event_id}/guests/{self.test_guest_id}/payment', 
            json=payment_data,
            content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        
        # Verify payment was recorded
        data = json.loads(response.data)
        self.assertEqual(data['amount'], 3.0)
        self.assertEqual(data['status'], 'paid')
        
        # Verify it exists in the database
        with app.app_context():
            payment = Payment.query.filter_by(
                user_id=self.test_guest_id, 
                event_id=self.test_event_id
            ).first()
            self.assertIsNotNone(payment)
            self.assertEqual(payment.amount, 3.0)
            self.assertEqual(payment.status, 'paid')

if __name__ == '__main__':
    unittest.main()