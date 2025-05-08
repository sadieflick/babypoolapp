"""
Test suite for the complete guest login flow.

This test suite verifies the end-to-end guest login experience, including:
1. Initial login with event code
2. User information collection
3. JWT token generation and storage
4. Proper redirection to guest dashboard
"""
import os
import json
import unittest
import requests
from flask import url_for
from app import app, db
from models import User, Event
from datetime import date, timedelta

class GuestLoginFlowTest(unittest.TestCase):
    """Test the complete guest login flow."""
    
    def setUp(self):
        """Set up the test environment before each test."""
        self.app = app
        self.app.config['TESTING'] = True
        self.app.config['WTF_CSRF_ENABLED'] = False
        self.client = app.test_client()
        
        # Create a test database context
        with self.app.app_context():
            # Create a test event
            host = User.query.filter_by(is_host=True).first()
            
            if not host:
                host = User(
                    email="testhost@example.com",
                    first_name="Test",
                    last_name="Host",
                    is_host=True
                )
                db.session.add(host)
                db.session.commit()
            
            # Check if test event exists
            test_event = Event.query.filter_by(event_code="TEST1").first()
            
            if not test_event:
                test_event = Event(
                    event_code="TEST1",
                    title="Test Baby Shower",
                    host_id=host.id,
                    mother_name="Test Mother",
                    event_date=date.today() + timedelta(days=30),
                    due_date=date.today() + timedelta(days=60)
                )
                db.session.add(test_event)
                db.session.commit()
            
            self.event_id = test_event.id
            self.event_code = test_event.event_code
        
        # Store base URL for API calls
        self.base_url = "http://localhost:5000"
    
    def tearDown(self):
        """Clean up after each test."""
        # For now, we're not doing any cleanup to preserve test data
        pass
    
    def test_01_guest_login_with_event_code(self):
        """Test guest login using an event code."""
        # Step 1: Access the guest login page
        response = self.client.get('/auth/guest_login')
        self.assertEqual(response.status_code, 200)
        # Now check for the React app root since we're serving the SPA
        self.assertIn(b'id="root"', response.data)
        
        # Step 2: Submit the event code form
        response = self.client.post(
            '/auth/guest/login',
            data=json.dumps({
                'login_type': 'event_code',
                'event_code': self.event_code
            }),
            content_type='application/json'
        )
        
        # Assert that we got a successful response
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        
        # Should return a need_user_info status for a new user
        self.assertEqual(data['status'], 'need_user_info')
        self.assertEqual(data['event_id'], self.event_id)
        print(f"Event code login response: {data}")
        
        return data  # Return data for use in subsequent tests
    
    def test_02_submit_user_info(self):
        """Test submission of user information after finding event."""
        # First do event code login to get event ID
        event_data = self.test_01_guest_login_with_event_code()
        
        # Step 3: Submit user information form
        response = self.client.post(
            '/auth/guest/select-event',
            data=json.dumps({
                'event_id': event_data['event_id'],
                'first_name': 'Test',
                'last_name': 'Guest',
                'email': 'testguest@example.com',
                'phone': '1234567890',
                'payment_method': 'venmo'
            }),
            content_type='application/json'
        )
        
        # Assert that we got a successful response
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        
        # Should return a logged_in status and tokens
        self.assertEqual(data['status'], 'logged_in')
        self.assertIn('access_token', data)
        self.assertIn('refresh_token', data)
        self.assertIn('user_id', data)
        self.assertIn('event_id', data)
        print(f"User info submission response: {data}")
        
        return data  # Return data for use in subsequent tests
    
    def test_03_access_guest_dashboard(self):
        """Test accessing the guest dashboard with JWT token."""
        # First do login and get tokens
        auth_data = self.test_02_submit_user_info()
        
        # Step 4: Access guest dashboard with token
        response = self.client.get(
            f'/guest/event/{auth_data["event_id"]}',
            headers={
                'Authorization': f'Bearer {auth_data["access_token"]}'
            }
        )
        
        # Dashboard should load successfully
        self.assertEqual(response.status_code, 200)
        
        # Since we're using a SPA, the dashboard should return index.html
        # which contains the React root element
        self.assertIn(b'id="root"', response.data)
        
        print(f"Dashboard access status: {response.status_code}")
    
    def test_04_complete_flow(self):
        """Test the complete guest login flow end-to-end."""
        # Step 1: Submit event code
        response = self.client.post(
            '/auth/guest/login',
            data=json.dumps({
                'login_type': 'event_code',
                'event_code': self.event_code
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        event_id = data['event_id']
        
        # Step 2: Submit user info
        response = self.client.post(
            '/auth/guest/select-event',
            data=json.dumps({
                'event_id': event_id,
                'first_name': 'Complete',
                'last_name': 'FlowTest',
                'email': 'complete_flow@example.com',
                'payment_method': 'cash'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        token = data['access_token']
        
        # Step 3: Access dashboard
        response = self.client.get(
            f'/guest/event/{event_id}',
            headers={
                'Authorization': f'Bearer {token}'
            }
        )
        self.assertEqual(response.status_code, 200)
        
        # Verify we created a user correctly
        with self.app.app_context():
            user = User.query.filter_by(email='complete_flow@example.com').first()
            self.assertIsNotNone(user)
            self.assertEqual(user.first_name, 'Complete')
            self.assertEqual(user.last_name, 'FlowTest')
            self.assertEqual(user.payment_method, 'cash')
            
            # Verify user is linked to the event
            event = Event.query.get(event_id)
            self.assertIn(user, event.guests)
    
    def test_05_server_routes_serve_index_html_for_react_routes(self):
        """Test that server routes for React views all serve index.html."""
        react_routes = [
            '/guest/event/1',
            '/guest/dashboard',
            '/host/dashboard',
            '/host/event/create',
            '/auth/guest_login'
        ]
        
        for route in react_routes:
            response = self.client.get(route)
            self.assertEqual(response.status_code, 200)
            # All these routes should return the same index.html
            # containing the React app root
            self.assertIn(b'id="root"', response.data)

if __name__ == '__main__':
    unittest.main()