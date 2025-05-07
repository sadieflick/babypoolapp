"""
Test script for the event creation functionality.

This script tests the various endpoints and logic for creating and managing
baby shower events, focusing on the host's perspective.

Each test focuses on a specific user story from our requirements.
"""

import unittest
import os
import json
from datetime import datetime, timedelta
from flask import session
from app import app, db
from models import User, Event
from werkzeug.security import generate_password_hash
import io

class EventCreationTestCase(unittest.TestCase):
    """Test cases for event creation and management"""

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
        
        self.assertEqual(response.status_code, 201)
        
        # Verify event was created
        data = json.loads(response.data)
        self.assertIn('id', data)
        self.assertIn('event_code', data)
        self.assertEqual(data['mother_name'], 'Jane Doe')
        
        # Verify it exists in the database
        with app.app_context():
            event = Event.query.get(data['id'])
            self.assertIsNotNone(event)
            self.assertEqual(event.mother_name, 'Jane Doe')
    
    def test_create_event_missing_required_fields(self):
        """Test that event creation fails when required fields are missing"""
        # Log in as host
        login_response = self.login_as_host()
        self.assertEqual(login_response.status_code, 200)
        
        # Create event with missing required fields
        event_data = {
            'title': 'Test Baby Shower',
            # Missing mother_name
            'partner_name': 'John Doe',
            # Missing event_date
            # Missing due_date
        }
        
        response = self.client.post('/api/events', 
            json=event_data,
            content_type='application/json')
        
        self.assertEqual(response.status_code, 400)
        
        # Verify response contains error messages for missing fields
        data = json.loads(response.data)
        self.assertIn('error', data)
        self.assertIn('mother_name', data['error'])
        self.assertIn('event_date', data['error'])
        self.assertIn('due_date', data['error'])
    
    def test_upload_event_image(self):
        """Test that a host can upload an image for their event"""
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
            'due_date': due_date,
            'guess_price': 1.0
        }
        
        response = self.client.post('/api/events', 
            json=event_data,
            content_type='application/json')
        
        self.assertEqual(response.status_code, 201)
        event_id = json.loads(response.data)['id']
        
        # Now upload an image for the event
        test_image = (io.BytesIO(b'test image content'), 'test_image.jpg')
        response = self.client.post(f'/api/events/{event_id}/image',
            data={'image': test_image},
            content_type='multipart/form-data')
        
        self.assertEqual(response.status_code, 200)
        
        # Verify image path was set
        data = json.loads(response.data)
        self.assertIn('image_path', data)
        self.assertIsNotNone(data['image_path'])
        
        # Verify it was updated in the database
        with app.app_context():
            event = Event.query.get(event_id)
            self.assertIsNotNone(event.image_path)
    
    def test_update_event_theme(self):
        """Test that a host can update the theme of their event"""
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
            'due_date': due_date,
            'guess_price': 1.0,
            'theme': 'default',
            'theme_mode': 'light'
        }
        
        response = self.client.post('/api/events', 
            json=event_data,
            content_type='application/json')
        
        self.assertEqual(response.status_code, 201)
        event_id = json.loads(response.data)['id']
        
        # Now update the theme
        update_data = {
            'theme': 'safari',
            'theme_mode': 'dark'
        }
        
        response = self.client.put(f'/api/events/{event_id}', 
            json=update_data,
            content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        
        # Verify theme was updated
        data = json.loads(response.data)
        self.assertEqual(data['theme'], 'safari')
        self.assertEqual(data['theme_mode'], 'dark')
        
        # Verify it was updated in the database
        with app.app_context():
            event = Event.query.get(event_id)
            self.assertEqual(event.theme, 'safari')
            self.assertEqual(event.theme_mode, 'dark')
    
    def test_enable_name_game(self):
        """Test that a host can enable the name guessing game"""
        # Log in as host
        login_response = self.login_as_host()
        self.assertEqual(login_response.status_code, 200)
        
        # First create an event with name_game_enabled=False
        event_date = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
        due_date = (datetime.now() + timedelta(days=60)).strftime('%Y-%m-%d')
        
        event_data = {
            'title': 'Test Baby Shower',
            'mother_name': 'Jane Doe',
            'partner_name': 'John Doe',
            'event_date': event_date,
            'due_date': due_date,
            'guess_price': 1.0,
            'name_game_enabled': False
        }
        
        response = self.client.post('/api/events', 
            json=event_data,
            content_type='application/json')
        
        self.assertEqual(response.status_code, 201)
        event_id = json.loads(response.data)['id']
        
        # Now enable the name game
        update_data = {
            'name_game_enabled': True
        }
        
        response = self.client.put(f'/api/events/{event_id}', 
            json=update_data,
            content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        
        # Verify name game was enabled
        data = json.loads(response.data)
        self.assertTrue(data['name_game_enabled'])
        
        # Verify it was updated in the database
        with app.app_context():
            event = Event.query.get(event_id)
            self.assertTrue(event.name_game_enabled)
    
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
            'due_date': due_date,
            'guess_price': 1.0
        }
        
        response = self.client.post('/api/events', 
            json=event_data,
            content_type='application/json')
        
        self.assertEqual(response.status_code, 201)
        created_event = json.loads(response.data)
        event_code = created_event['event_code']
        
        # Now find the event by code
        response = self.client.get(f'/api/events/code/{event_code}')
        
        self.assertEqual(response.status_code, 200)
        
        # Verify the correct event was returned
        data = json.loads(response.data)
        self.assertEqual(data['id'], created_event['id'])
        self.assertEqual(data['title'], 'Test Baby Shower')
        self.assertEqual(data['mother_name'], 'Jane Doe')
    
    def test_event_price_per_guess(self):
        """Test that a host can set a custom price per guess"""
        # Log in as host
        login_response = self.login_as_host()
        self.assertEqual(login_response.status_code, 200)
        
        # Create event with custom guess price
        event_date = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
        due_date = (datetime.now() + timedelta(days=60)).strftime('%Y-%m-%d')
        
        event_data = {
            'title': 'Test Baby Shower',
            'mother_name': 'Jane Doe',
            'partner_name': 'John Doe',
            'event_date': event_date,
            'due_date': due_date,
            'guess_price': 5.0  # $5 per guess
        }
        
        response = self.client.post('/api/events', 
            json=event_data,
            content_type='application/json')
        
        self.assertEqual(response.status_code, 201)
        
        # Verify guess price was set
        data = json.loads(response.data)
        self.assertEqual(data['guess_price'], 5.0)
        
        # Verify it was set in the database
        with app.app_context():
            event = Event.query.get(data['id'])
            self.assertEqual(event.guess_price, 5.0)

if __name__ == '__main__':
    unittest.main()