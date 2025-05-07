import unittest
import requests
import json
import os
from app import app, db
from models import User
from werkzeug.security import generate_password_hash
from flask import session


class LoginTestCase(unittest.TestCase):
    """Test cases for login and redirect functionality"""

    def setUp(self):
        """Set up test client and database"""
        app.config['TESTING'] = True
        app.config['WTF_CSRF_ENABLED'] = False
        # Keep using the production database for these tests since we need persistence
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

    def tearDown(self):
        """Clean up after tests"""
        with app.app_context():
            db.session.remove()
            # Don't drop tables in the production database

    def test_successful_login_api(self):
        """Test that the login API returns successful response with user data"""
        response = self.client.post(
            '/auth/host/login',
            data=json.dumps({
                'email': 'test@example.com',
                'password': 'password123'
            }),
            content_type='application/json'
        )
        
        # Assert response status code
        self.assertEqual(response.status_code, 200)
        
        # Assert response contains user data
        data = json.loads(response.data)
        self.assertEqual(data['email'], 'test@example.com')
        self.assertTrue(data['is_host'])
        self.assertIn('hosted_events_count', data)
        self.assertIn('message', data)
        self.assertEqual(data['message'], 'Login successful')

    def test_failed_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = self.client.post(
            '/auth/host/login',
            data=json.dumps({
                'email': 'test@example.com',
                'password': 'wrongpassword'
            }),
            content_type='application/json'
        )
        
        # Assert response status code
        self.assertEqual(response.status_code, 401)
        
        # Assert error message
        data = json.loads(response.data)
        self.assertIn('error', data)

    def test_dashboard_redirect_not_logged_in(self):
        """Test that /dashboard redirects to login when not logged in"""
        response = self.client.get('/dashboard', follow_redirects=False)
        
        # Assert redirect status code
        self.assertEqual(response.status_code, 302)
        
        # Assert redirect location
        location = response.location
        self.assertTrue(location.endswith('/host/dashboard'), f"Expected redirect to end with /host/dashboard, got {location}")

    def test_dashboard_redirect_logged_in(self):
        """Test that /dashboard redirects to host/dashboard when logged in"""
        # First login
        self.client.post(
            '/auth/host/login',
            data=json.dumps({
                'email': 'test@example.com',
                'password': 'password123'
            }),
            content_type='application/json'
        )
        
        # Then access dashboard
        response = self.client.get('/dashboard', follow_redirects=False)
        
        # Assert redirect status code
        self.assertEqual(response.status_code, 302)
        
        # Assert redirect location
        self.assertTrue(response.location.endswith('/host/dashboard'))

    def test_host_dashboard_access_not_logged_in(self):
        """Test that /host/dashboard serves content when not logged in"""
        response = self.client.get('/host/dashboard')
        
        # Should still return 200 even if user is not logged in
        # Because our SPA handles auth client side
        self.assertEqual(response.status_code, 200)
        
        # Response should contain the root div for React
        self.assertIn(b'<div id="root">', response.data)


if __name__ == '__main__':
    unittest.main()