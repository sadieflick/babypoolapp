"""
Test script specifically targeting login persistence issues

This script focuses on testing the login persistence between requests
and verifies that authentication state is properly maintained.
"""

import unittest
import json
import time
import requests
from app import app, db
from models import User
from werkzeug.security import generate_password_hash
from flask import session
from flask_login import current_user, login_user, logout_user


class LoginPersistenceTestCase(unittest.TestCase):
    """Test cases for login persistence across multiple requests"""

    def setUp(self):
        """Set up test client and database"""
        app.config['TESTING'] = True
        app.config['WTF_CSRF_ENABLED'] = False
        self.client = app.test_client()
        
        with app.app_context():
            # Check if the test user already exists
            test_user = User.query.filter_by(email='test@example.com').first()
            if not test_user:
                # Create test user
                test_user = User(
                    email='test@example.com',
                    password_hash=generate_password_hash('password123'),
                    first_name='Test',
                    last_name='User',
                    is_host=True
                )
                db.session.add(test_user)
                db.session.commit()
            self.user_id = test_user.id

    def tearDown(self):
        """Clean up after tests"""
        with app.app_context():
            db.session.remove()

    def test_session_persistence(self):
        """Test that server-side session persists across requests"""
        # Login the user
        with self.client.session_transaction() as sess:
            # Clear any existing session
            sess.clear()
        
        # Make login request
        login_response = self.client.post(
            '/auth/host/login',
            data=json.dumps({
                'email': 'test@example.com',
                'password': 'password123'
            }),
            content_type='application/json'
        )
        
        # Check login succeeded with 200 response
        self.assertEqual(login_response.status_code, 200)
        
        # Get login response data
        login_data = json.loads(login_response.data)
        self.assertTrue(login_data.get('is_host'))
        self.assertEqual(login_data.get('email'), 'test@example.com')
        
        # Now make a request to a protected endpoint (dashboard)
        dashboard_response = self.client.get('/dashboard', follow_redirects=False)
        
        # Should redirect to host dashboard, not login page
        self.assertEqual(dashboard_response.status_code, 302)
        self.assertTrue(dashboard_response.location.endswith('/host/dashboard'))
        
        # Check session directly to confirm login state
        with self.client.session_transaction() as sess:
            self.assertIn('_user_id', sess)
            self.assertEqual(int(sess['_user_id']), self.user_id)
        
        # Make another request that should be authenticated
        profile_response = self.client.get('/api/user', follow_redirects=False)
        
        # This API endpoint should return user data, not redirect/error
        # Note: will need to create this endpoint if it doesn't exist
        if profile_response.status_code == 404:
            print("Warning: /api/user endpoint not found, can't fully verify persistence")
        else:
            self.assertNotEqual(profile_response.status_code, 401)
            self.assertNotEqual(profile_response.status_code, 302)

    def test_login_response_format(self):
        """Test the login response format to ensure it has all required fields for client-side storage"""
        login_response = self.client.post(
            '/auth/host/login',
            data=json.dumps({
                'email': 'test@example.com',
                'password': 'password123'
            }),
            content_type='application/json'
        )
        
        # Check login succeeded
        self.assertEqual(login_response.status_code, 200)
        
        # Verify response format
        login_data = json.loads(login_response.data)
        
        # Check essential fields for client-side auth
        required_fields = ['id', 'email', 'is_host', 'first_name', 'last_name', 'hosted_events_count']
        for field in required_fields:
            self.assertIn(field, login_data, f"Missing field in login response: {field}")
        
        # Check field types
        self.assertIsInstance(login_data['id'], int)
        self.assertIsInstance(login_data['is_host'], bool)
        self.assertTrue(login_data['is_host'])  # Should be True for host login
        
        # Verify there's no malformed data that could cause JSON parsing issues
        try:
            # Re-serialize to detect any issues
            json_str = json.dumps(login_data)
            parsed = json.loads(json_str)
            self.assertEqual(parsed['id'], login_data['id'])
        except Exception as e:
            self.fail(f"Login response JSON is malformed: {str(e)}")

    def test_client_side_persistence_simulation(self):
        """Simulate the client-side persistence with manual localStorage setting"""
        # This is more of a hint of what client-side code should do, not a true test
        # since we can't access localStorage directly
        
        # 1. First get auth token data
        login_response = self.client.post(
            '/auth/host/login',
            data=json.dumps({
                'email': 'test@example.com',
                'password': 'password123'
            }),
            content_type='application/json'
        )
        
        login_data = json.loads(login_response.data)
        
        # 2. Print what should be stored in localStorage
        print("\nClient should store in localStorage:")
        print(f"localStorage.setItem('token', 'some-generated-token');")
        print(f"localStorage.setItem('isHost', '{str(login_data['is_host']).lower()}');")
        print(f"localStorage.setItem('currentUser', '{json.dumps(login_data)}');")
        
        # 3. If login form handler doesn't do this properly, there will be auth issues


if __name__ == '__main__':
    unittest.main()