"""
Test script focused on JWT token handling for guest authentication.

This script tests whether JWT tokens are properly generated, stored,
and used for guest authentication flows.
"""

import os
import json
from app import app, db
from models import User, Event
from flask_jwt_extended import create_access_token, create_refresh_token, decode_token

class JWTDebugger:
    def __init__(self):
        self.app = app
        self.client = app.test_client()
        app.config['TESTING'] = True
        app.config['WTF_CSRF_ENABLED'] = False
    
    def print_header(self, message):
        """Print a formatted header."""
        print("\n" + "=" * 80)
        print(f" {message} ".center(80, "="))
        print("=" * 80)
    
    def print_jwt_config(self):
        """Print the current JWT configuration."""
        self.print_header("JWT CONFIGURATION")
        
        with self.app.app_context():
            config = {
                'JWT_SECRET_KEY': app.config.get('JWT_SECRET_KEY', 'Not set'),
                'JWT_ACCESS_TOKEN_EXPIRES': app.config.get('JWT_ACCESS_TOKEN_EXPIRES', 'Not set'),
                'JWT_REFRESH_TOKEN_EXPIRES': app.config.get('JWT_REFRESH_TOKEN_EXPIRES', 'Not set'),
                'JWT_COOKIE_SECURE': app.config.get('JWT_COOKIE_SECURE', 'Not set'),
                'JWT_TOKEN_LOCATION': app.config.get('JWT_TOKEN_LOCATION', 'Not set'),
                'JWT_COOKIE_CSRF_PROTECT': app.config.get('JWT_COOKIE_CSRF_PROTECT', 'Not set')
            }
            
            for key, value in config.items():
                print(f"{key}: {value}")
    
    def create_and_decode_guest_token(self):
        """Create and decode a JWT token for a guest user."""
        self.print_header("CREATING AND DECODING GUEST TOKEN")
        
        with self.app.app_context():
            # Find a guest user or create one
            guest = User.query.filter_by(is_host=False).first()
            if not guest:
                print("No guest users found. Creating a test guest...")
                guest = User(
                    email="test_token_guest@example.com",
                    first_name="Token",
                    last_name="Test",
                    is_host=False
                )
                db.session.add(guest)
                db.session.commit()
            
            print(f"Using guest: ID={guest.id}, Email={guest.email}")
            
            # Create access and refresh tokens
            access_token = create_access_token(identity=guest.id)
            refresh_token = create_refresh_token(identity=guest.id)
            
            print(f"\nAccess Token: {access_token[:30]}...")
            print(f"Refresh Token: {refresh_token[:30]}...")
            
            # Decode tokens
            try:
                decoded_access = decode_token(access_token)
                print(f"\nDecoded Access Token: {json.dumps(decoded_access, indent=2)}")
                
                decoded_refresh = decode_token(refresh_token)
                print(f"Decoded Refresh Token: {json.dumps(decoded_refresh, indent=2)}")
                
                return access_token, refresh_token
            except Exception as e:
                print(f"Error decoding tokens: {str(e)}")
                return None, None
    
    def test_api_endpoint_with_token(self, token):
        """Test accessing an API endpoint with the token."""
        self.print_header("TESTING API ENDPOINT WITH TOKEN")
        
        if not token:
            print("No token provided")
            return
        
        # Test accessing current user endpoint
        headers = {'Authorization': f'Bearer {token}'}
        response = self.client.get('/api/user/current', headers=headers)
        
        print(f"Status Code: {response.status_code}")
        try:
            data = response.json
            if callable(data):
                data = data()
            print(f"Response: {json.dumps(data, indent=2)}")
        except Exception:
            print(f"Response: {response.data.decode('utf-8')[:200]}...")
    
    def test_guest_login_jwt_response(self):
        """Test if the guest login endpoint returns JWT tokens."""
        self.print_header("TESTING GUEST LOGIN JWT RESPONSE")
        
        with self.app.app_context():
            # Find a guest user or create one
            guest = User.query.filter_by(is_host=False).first()
            if not guest:
                print("No guest users found")
                return
            
            # Log in as the guest
            response = self.client.post('/auth/guest/login', 
                                       json={'login_type': 'email', 'email': guest.email},
                                       content_type='application/json')
            
            print(f"Status Code: {response.status_code}")
            
            # Check response data
            data = response.json
            if callable(data):
                data = data()
            
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Check for token in response
            if 'access_token' in data:
                print("\nAccess token found in response!")
                token = data['access_token']
                print(f"Token: {token[:30]}...")
                
                try:
                    decoded = decode_token(token)
                    print(f"Decoded: {json.dumps(decoded, indent=2)}")
                except Exception as e:
                    print(f"Error decoding token: {str(e)}")
            else:
                print("\nNo access_token found in response")
            
            # Check for token in cookies
            if 'Set-Cookie' in response.headers:
                cookies = response.headers.getlist('Set-Cookie')
                print(f"\nCookies: {cookies}")
                
                jwt_cookies = [c for c in cookies if 'access_token' in c]
                if jwt_cookies:
                    print(f"JWT cookies found: {jwt_cookies}")
                else:
                    print("No JWT cookies found")
    
    def test_guest_login_to_event_flow(self):
        """Test the complete guest login and event access flow."""
        self.print_header("TESTING GUEST LOGIN TO EVENT FLOW")
        
        # Find an event
        with self.app.app_context():
            event = Event.query.first()
            if not event:
                print("No events found in database")
                return
            
            print(f"Testing with event: ID={event.id}, Code={event.event_code}")
        
        # Clear cookies
        self.client.cookie_jar.clear()
        
        # Step 1: Login with email
        print("\nStep 1: Login with email")
        email_response = self.client.post('/auth/guest/login', 
                                          json={'login_type': 'email', 'email': 'test_flow@example.com'},
                                          content_type='application/json')
        
        print(f"Status Code: {email_response.status_code}")
        email_data = email_response.json
        print(f"Response: {json.dumps(email_data, indent=2)}")
        
        # Print session state
        with self.client.session_transaction() as session:
            print(f"\nSession after email login: {dict(session)}")
        
        # Step 2: Login with event code
        print("\nStep 2: Login with event code")
        code_response = self.client.post('/auth/guest/login', 
                                         json={'login_type': 'event_code', 'event_code': event.event_code},
                                         content_type='application/json')
        
        print(f"Status Code: {code_response.status_code}")
        code_data = code_response.json
        print(f"Response: {json.dumps(code_data, indent=2)}")
        
        # Print session state
        with self.client.session_transaction() as session:
            print(f"\nSession after event code: {dict(session)}")
        
        # Step 3: Provide user info if needed
        if code_data.get('status') == 'need_user_info':
            print("\nStep 3: Providing user info")
            user_info_response = self.client.post('/auth/guest/login', 
                                                 json={
                                                     'login_type': 'event_code', 
                                                     'event_code': event.event_code,
                                                     'email': 'test_flow@example.com',
                                                     'first_name': 'Test',
                                                     'last_name': 'Flow'
                                                 },
                                                 content_type='application/json')
            
            print(f"Status Code: {user_info_response.status_code}")
            user_data = user_info_response.json
            print(f"Response: {json.dumps(user_data, indent=2)}")
            
            # Check for JWT token
            if 'access_token' in user_data:
                print(f"\nAccess token: {user_data['access_token'][:30]}...")
            
            # Print session state
            with self.client.session_transaction() as session:
                print(f"\nSession after user info: {dict(session)}")
        
        # Step 4: Try to access the event
        print("\nStep 4: Accessing the event")
        event_response = self.client.get(f'/guest/event/{event.id}')
        
        print(f"Status Code: {event_response.status_code}")
        try:
            print(f"Response: {event_response.data.decode('utf-8')[:200]}...")
        except Exception as e:
            print(f"Error decoding response: {str(e)}")
        
        # Print request headers
        print("\nCurrent request headers that would be sent:")
        headers = {}
        for cookie in self.client.cookie_jar:
            headers['Cookie'] = headers.get('Cookie', '') + f"{cookie.name}={cookie.value}; "
        
        print(f"Headers: {headers}")

if __name__ == "__main__":
    debugger = JWTDebugger()
    
    # Run tests
    debugger.print_jwt_config()
    access_token, refresh_token = debugger.create_and_decode_guest_token()
    debugger.test_api_endpoint_with_token(access_token)
    debugger.test_guest_login_jwt_response()
    debugger.test_guest_login_to_event_flow()
    
    print("\nAll tests completed")