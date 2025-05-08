"""
Test script to diagnose guest authentication flow issues.

This script performs a step-by-step analysis of the guest login process,
checking for issues with JWT token generation, session persistence,
and redirect handling.
"""

import requests
import json
import os
from app import app, db
from models import User, Event
from flask_jwt_extended import decode_token

# Set up test client
client = app.test_client()
app.config['TESTING'] = True
app.config['WTF_CSRF_ENABLED'] = False

def print_separator(title):
    """Print a separator with a title."""
    print("\n" + "=" * 80)
    print(f" {title} ".center(80, "="))
    print("=" * 80 + "\n")

def print_response(response, title=None):
    """Print details of a response."""
    if title:
        print(f"\n--- {title} ---")
    
    print(f"Status Code: {response.status_code}")
    print(f"Headers: {dict(response.headers)}")
    
    try:
        # Try to parse as JSON
        data = response.json
        if callable(data):
            data = data()
        print(f"Response Data: {json.dumps(data, indent=2)}")
    except Exception:
        # If not JSON, print as text
        print(f"Response Text: {response.data.decode('utf-8')[:200]}...")

def test_guest_login_with_email():
    """Test guest login using an email address."""
    print_separator("GUEST LOGIN WITH EMAIL")
    
    # Test with a non-existent email to get 'need_event' status
    test_email = "test_new_guest@example.com"
    
    response = client.post('/auth/guest/login', 
                          json={'login_type': 'email', 'email': test_email},
                          content_type='application/json')
    
    print_response(response, "Login Response")
    
    # Check for JWT cookies or tokens in the response headers
    if 'Set-Cookie' in response.headers:
        print(f"\nCookies: {response.headers.getlist('Set-Cookie')}")
    
    # Check session state
    with app.test_request_context():
        from flask import session
        print(f"\nSession state: {session}")
    
    return response

def test_guest_login_with_event_code():
    """Test guest login using an event code."""
    print_separator("GUEST LOGIN WITH EVENT CODE")
    
    # Get a valid event code from the database
    with app.app_context():
        event = Event.query.first()
        if not event:
            print("No events found in the database. Creating a test event...")
            return None
        
        event_code = event.event_code
    
    print(f"Using event code: {event_code}")
    
    # Try login with just the event code
    response = client.post('/auth/guest/login', 
                          json={'login_type': 'event_code', 'event_code': event_code},
                          content_type='application/json')
    
    print_response(response, "Event Code Login Response")
    
    # Try with event code and user info
    response = client.post('/auth/guest/login', 
                          json={
                              'login_type': 'event_code', 
                              'event_code': event_code,
                              'email': 'test_guest@example.com',
                              'first_name': 'Test',
                              'last_name': 'Guest'
                          },
                          content_type='application/json')
    
    print_response(response, "Event Code with User Info Response")
    
    return response

def verify_jwt_in_guest_login():
    """Check if JWT tokens are being generated for guest logins."""
    print_separator("VERIFYING JWT IN GUEST LOGIN")
    
    # Find a guest user in the database
    with app.app_context():
        guest = User.query.filter_by(is_host=False).first()
        
        if not guest:
            print("No guest users found in the database. Creating a test guest...")
            guest = User(
                email="test_guest@example.com",
                first_name="Test",
                last_name="Guest",
                is_host=False
            )
            db.session.add(guest)
            db.session.commit()
            print(f"Created test guest: {guest.id}")
        
        print(f"Testing with guest: ID={guest.id}, Email={guest.email}")
    
    # Try to log in as the guest
    response = client.post('/auth/guest/login', 
                          json={'login_type': 'email', 'email': guest.email},
                          content_type='application/json')
    
    print_response(response, "Guest Login Response")
    
    data = response.json
    if callable(data):
        data = data()
    
    # Check for access_token in response
    if 'access_token' in data:
        token = data['access_token']
        print(f"\nAccess Token found: {token[:20]}...")
        
        # Try to decode the token
        try:
            with app.app_context():
                from flask_jwt_extended import decode_token
                decoded = decode_token(token)
                print(f"Decoded token: {json.dumps(decoded, indent=2)}")
        except Exception as e:
            print(f"Error decoding token: {str(e)}")
    else:
        print("\nNo access_token found in response")
    
    # Check for JWT cookies
    if 'Set-Cookie' in response.headers:
        cookies = response.headers.getlist('Set-Cookie')
        print(f"\nCookies: {cookies}")
        
        jwt_cookies = [c for c in cookies if 'access_token' in c or 'refresh_token' in c]
        if jwt_cookies:
            print(f"JWT cookies found: {jwt_cookies}")
        else:
            print("No JWT cookies found")
    
    return response

def test_guest_selection_flow():
    """Test the full guest event selection flow."""
    print_separator("GUEST EVENT SELECTION FLOW")
    
    # Step 1: Log in with email
    login_response = client.post('/auth/guest/login', 
                                json={'login_type': 'email', 'email': 'test_guest@example.com'},
                                content_type='application/json')
    
    print_response(login_response, "Initial Login Response")
    
    # Step 2: Get first event ID
    with app.app_context():
        event = Event.query.first()
        if not event:
            print("No events found in the database")
            return None
        
        print(f"Using event: ID={event.id}, Title={event.title}")
    
    # Step 3: Select the event
    with client.session_transaction() as session:
        print(f"Session before selection: {session}")
    
    select_response = client.post('/auth/guest/select-event', 
                                 json={'event_id': event.id},
                                 content_type='application/json',
                                 follow_redirects=True)
    
    print_response(select_response, "Event Selection Response")
    
    with client.session_transaction() as session:
        print(f"Session after selection: {session}")
    
    # Step 4: Check if we're redirected correctly
    if 'event_id' in select_response.json:
        event_id = select_response.json['event_id']
        print(f"\nEvent ID from response: {event_id}")
        
        # Try to access the guest event page
        event_page_response = client.get(f'/guest/event/{event_id}')
        print_response(event_page_response, "Guest Event Page Response")
    
    return select_response

def check_headers_in_requests():
    """Check what headers are being sent in authenticated requests."""
    print_separator("CHECKING HEADERS IN REQUESTS")
    
    # Log in as guest
    login_response = client.post('/auth/guest/login', 
                                json={'login_type': 'email', 'email': 'test_guest@example.com'},
                                content_type='application/json')
    
    data = login_response.json
    if callable(data):
        data = data()
    
    # Extract token if present
    token = None
    if 'access_token' in data:
        token = data['access_token']
    
    # Get stored cookies
    cookies = client.cookie_jar
    
    print(f"Token from response: {token[:20] if token else 'None'}")
    print(f"Cookies: {cookies}")
    
    # Make request with Authorization header
    if token:
        headers = {'Authorization': f'Bearer {token}'}
        print(f"Making request with Authorization header: {headers}")
        
        auth_response = client.get('/api/user/current', headers=headers)
        print_response(auth_response, "Response with Auth Header")
    
    # Make request with cookies
    cookie_response = client.get('/api/user/current')
    print_response(cookie_response, "Response with Cookies Only")
    
    return token, cookies

if __name__ == "__main__":
    print("\nRunning guest authentication flow tests...\n")
    
    # Run tests
    email_response = test_guest_login_with_email()
    event_code_response = test_guest_login_with_event_code()
    jwt_check = verify_jwt_in_guest_login()
    selection_flow = test_guest_selection_flow()
    headers_check = check_headers_in_requests()
    
    print("\nAll tests completed.\n")