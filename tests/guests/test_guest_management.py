"""
Test script for guest management functionality.

This script tests the various endpoints and logic for hosts to manage guests,
including inviting guests, tracking payments, and viewing guest details.

Each test focuses on a specific user story from our requirements.
"""

import unittest
import os
import json
from datetime import datetime, timedelta
from flask import session
from app import app, db
from models import User, Event, Payment
from werkzeug.security import generate_password_hash

class GuestManagementTestCase(unittest.TestCase):
    """Test cases for host management of guests"""

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
            
            db.session.commit()
            
            self.test_host_id = test_host.id
            self.test_event_id = test_event.id
    
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
    
    def test_invite_guest(self):
        """Test that a host can invite a guest to their event"""
        # Log in as host
        login_response = self.login_as_host()
        self.assertEqual(login_response.status_code, 200)
        
        # Invite a guest by email
        guest_data = {
            'email': 'newguest@example.com'
        }
        
        response = self.client.post(f'/api/events/{self.test_event_id}/guests', 
            json=guest_data,
            content_type='application/json')
        
        self.assertEqual(response.status_code, 201)
        
        # Verify guest was added
        data = json.loads(response.data)
        self.assertIn('id', data)
        self.assertEqual(data['email'], 'newguest@example.com')
        
        # Verify guest exists in database and is associated with the event
        with app.app_context():
            guest = User.query.filter_by(email='newguest@example.com').first()
            self.assertIsNotNone(guest)
            
            event = Event.query.get(self.test_event_id)
            self.assertIn(guest, event.guests)
    
    def test_get_event_guests(self):
        """Test that a host can view all guests for their event"""
        # Add some test guests
        with app.app_context():
            guest1 = User(
                email='guest1@example.com',
                first_name='Guest',
                last_name='One',
                is_host=False
            )
            guest2 = User(
                email='guest2@example.com',
                first_name='Guest',
                last_name='Two',
                is_host=False
            )
            db.session.add(guest1)
            db.session.add(guest2)
            
            event = Event.query.get(self.test_event_id)
            event.guests.append(guest1)
            event.guests.append(guest2)
            
            db.session.commit()
        
        # Log in as host
        login_response = self.login_as_host()
        self.assertEqual(login_response.status_code, 200)
        
        # Get all guests for the event
        response = self.client.get(f'/api/events/{self.test_event_id}/guests')
        
        self.assertEqual(response.status_code, 200)
        
        # Verify the guests are returned
        data = json.loads(response.data)
        self.assertEqual(len(data), 2)
        emails = [guest['email'] for guest in data]
        self.assertIn('guest1@example.com', emails)
        self.assertIn('guest2@example.com', emails)
    
    def test_update_guest_payment_status(self):
        """Test that a host can update a guest's payment status"""
        # Add a test guest
        with app.app_context():
            guest = User(
                email='guest@example.com',
                first_name='Test',
                last_name='Guest',
                is_host=False
            )
            db.session.add(guest)
            
            event = Event.query.get(self.test_event_id)
            event.guests.append(guest)
            
            # Create an initial payment record
            payment = Payment(
                user_id=guest.id,
                event_id=self.test_event_id,
                amount=2.0,
                status='pending'
            )
            db.session.add(payment)
            
            db.session.commit()
            
            self.test_guest_id = guest.id
        
        # Log in as host
        login_response = self.login_as_host()
        self.assertEqual(login_response.status_code, 200)
        
        # Update the guest's payment status
        payment_data = {
            'amount': 2.0,
            'status': 'paid'
        }
        
        response = self.client.put(f'/api/events/{self.test_event_id}/guests/{self.test_guest_id}/payment', 
            json=payment_data,
            content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        
        # Verify payment status was updated
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'paid')
        
        # Verify it was updated in the database
        with app.app_context():
            payment = Payment.query.filter_by(
                user_id=self.test_guest_id, 
                event_id=self.test_event_id
            ).first()
            self.assertEqual(payment.status, 'paid')
    
    def test_get_guest_details(self):
        """Test that a host can view detailed information about a guest"""
        # Add a test guest with some guesses and a payment
        with app.app_context():
            from models import DateGuess, HourGuess, MinuteGuess
            
            guest = User(
                email='guest@example.com',
                first_name='Test',
                last_name='Guest',
                is_host=False
            )
            db.session.add(guest)
            
            event = Event.query.get(self.test_event_id)
            event.guests.append(guest)
            
            # Add some guesses
            date_guess = DateGuess(
                user_id=guest.id,
                event_id=self.test_event_id,
                guess_date=datetime.now() + timedelta(days=61)
            )
            db.session.add(date_guess)
            
            hour_guess = HourGuess(
                user_id=guest.id,
                event_id=self.test_event_id,
                hour=5,
                am_pm='PM'
            )
            db.session.add(hour_guess)
            
            # Create a payment record
            payment = Payment(
                user_id=guest.id,
                event_id=self.test_event_id,
                amount=2.0,
                status='pending'
            )
            db.session.add(payment)
            
            db.session.commit()
            
            self.test_guest_id = guest.id
        
        # Log in as host
        login_response = self.login_as_host()
        self.assertEqual(login_response.status_code, 200)
        
        # Get the guest details
        response = self.client.get(f'/api/events/{self.test_event_id}/guests/{self.test_guest_id}')
        
        self.assertEqual(response.status_code, 200)
        
        # Verify guest details include guesses and payment info
        data = json.loads(response.data)
        self.assertEqual(data['email'], 'guest@example.com')
        self.assertIn('guesses', data)
        self.assertIn('date_guesses', data['guesses'])
        self.assertEqual(len(data['guesses']['date_guesses']), 1)
        self.assertIn('hour_guesses', data['guesses'])
        self.assertEqual(len(data['guesses']['hour_guesses']), 1)
        self.assertIn('payment', data)
        self.assertEqual(data['payment']['amount'], 2.0)
        self.assertEqual(data['payment']['status'], 'pending')
    
    def test_remove_guest(self):
        """Test that a host can remove a guest from their event"""
        # Add a test guest
        with app.app_context():
            guest = User(
                email='guest@example.com',
                first_name='Test',
                last_name='Guest',
                is_host=False
            )
            db.session.add(guest)
            
            event = Event.query.get(self.test_event_id)
            event.guests.append(guest)
            
            db.session.commit()
            
            self.test_guest_id = guest.id
        
        # Log in as host
        login_response = self.login_as_host()
        self.assertEqual(login_response.status_code, 200)
        
        # Remove the guest
        response = self.client.delete(f'/api/events/{self.test_event_id}/guests/{self.test_guest_id}')
        
        self.assertEqual(response.status_code, 200)
        
        # Verify guest was removed from the event
        with app.app_context():
            event = Event.query.get(self.test_event_id)
            guest = User.query.get(self.test_guest_id)
            
            # Guest should still exist, but not be in the event's guests
            self.assertIsNotNone(guest)
            self.assertNotIn(guest, event.guests)

if __name__ == '__main__':
    unittest.main()