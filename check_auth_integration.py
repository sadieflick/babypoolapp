"""
Test script to check integration between server-side authentication and frontend code.

This script examines how authentication data is passed between the server and client,
focusing on the responses that the frontend would receive and how it should process them.
"""

import os
import json
from app import app, db
from models import User, Event
from werkzeug.security import generate_password_hash
from flask_jwt_extended import create_access_token, get_jwt_identity, decode_token

def print_divider(title):
    print("\n" + "-" * 80)
    print(f" {title} ".center(80, "-"))
    print("-" * 80)

def check_guest_login_response_format():
    """Check the format of the guest login response to verify it contains necessary auth data."""
    print_divider("GUEST LOGIN RESPONSE FORMAT")
    
    client = app.test_client()
    
    # Find or create a test guest
    with app.app_context():
        test_email = "test_format@example.com"
        guest = User.query.filter_by(email=test_email).first()
        
        if not guest:
            guest = User(
                email=test_email,
                first_name="Format",
                last_name="Test",
                is_host=False
            )
            db.session.add(guest)
            db.session.commit()
            print(f"Created test guest: {guest.id}")
        
        # Create an event if none exists
        event = Event.query.first()
        if not event:
            print("No events in database to test with")
            return
        
        # Add guest to event if not already
        if guest not in event.guests:
            event.guests.append(guest)
            db.session.commit()
            print(f"Added guest to event: {event.id}")
    
    # Test the login endpoint
    response = client.post('/auth/guest/login',
                          json={'login_type': 'email', 'email': test_email},
                          content_type='application/json')
    
    print(f"Status code: {response.status_code}")
    
    # Parse the response data
    data = response.json
    if callable(data):
        data = data()
    
    print(f"Response data: {json.dumps(data, indent=2)}")
    
    # Check for expected fields needed by the frontend
    expected_fields = ['status', 'user_id', 'events']
    missing_fields = [field for field in expected_fields if field not in data]
    
    if missing_fields:
        print(f"Missing expected fields: {missing_fields}")
    else:
        print("All expected fields present")
    
    # Check for JWT token
    if 'access_token' in data:
        print(f"Access token found: {data['access_token'][:30]}...")
    else:
        print("No access token in response - frontend authentication may fail")
    
    # Compare with the format expected by frontend
    with open('frontend/src/components/AuthContext.js', 'r') as f:
        auth_context = f.read()
        print("\nChecking against AuthContext.js...")
        
        if "const login = (userData) => {" in auth_context:
            print("Found login handler in AuthContext")
            
            # Look for how token is stored
            if "localStorage.setItem('token'" in auth_context:
                print("Frontend expects 'token' in response")
                if 'access_token' in data and 'token' not in data:
                    print("WARNING: Backend returns 'access_token' but frontend expects 'token'")
            
            # Look for user data storage
            if "localStorage.setItem('userData'" in auth_context:
                print("Frontend expects 'userData' object")

def check_auth_headers_usage():
    """Check how authentication headers are used in the code."""
    print_divider("AUTH HEADERS USAGE")
    
    # Look for places where Authorization header is set in frontend code
    try:
        with open('frontend/src/utils/api.js', 'r') as f:
            api_code = f.read()
            
            print("Checking frontend API utils...")
            
            if "const token = localStorage.getItem('token')" in api_code:
                print("Frontend retrieves token from localStorage")
            
            if "headers: { Authorization: `Bearer ${token}` }" in api_code:
                print("Frontend sets Authorization header with Bearer token")
            
            # Look for axios interceptors
            if "axios.interceptors.request.use" in api_code:
                print("Frontend uses axios interceptors for request handling")
            
            if "axios.interceptors.response.use" in api_code:
                print("Frontend uses axios interceptors for response handling")
    except FileNotFoundError:
        print("Could not find frontend/src/utils/api.js")
    
    # Check backend routes for JWT protection
    from routes import api
    protected_routes = []
    unprotected_routes = []
    
    for rule in app.url_map.iter_rules():
        if rule.endpoint.startswith('api.'):
            view_function = app.view_functions[rule.endpoint]
            function_code = view_function.__code__.co_consts
            
            # Check if the route is protected with @jwt_required
            is_protected = any('jwt_required' in str(const) for const in function_code if isinstance(const, str))
            
            if is_protected:
                protected_routes.append(rule.rule)
            else:
                unprotected_routes.append(rule.rule)
    
    print(f"\nProtected API routes: {len(protected_routes)}")
    for route in protected_routes[:5]:
        print(f"  {route}")
    if len(protected_routes) > 5:
        print(f"  ...and {len(protected_routes) - 5} more")
    
    print(f"\nUnprotected API routes: {len(unprotected_routes)}")
    for route in unprotected_routes[:5]:
        print(f"  {route}")
    if len(unprotected_routes) > 5:
        print(f"  ...and {len(unprotected_routes) - 5} more")

def check_frontend_auth_handling():
    """Check how frontend code handles authentication and redirects."""
    print_divider("FRONTEND AUTH HANDLING")
    
    try:
        # Check AuthContext implementation
        with open('frontend/src/components/AuthContext.js', 'r') as f:
            auth_context = f.read()
            
            print("Checking AuthContext.js...")
            
            # Check login implementation
            if "const login = " in auth_context:
                print("Found login handler")
                
                if "localStorage.setItem(" in auth_context:
                    print("Login stores data in localStorage")
                
                if "setCurrentUser(" in auth_context:
                    print("Login updates current user state")
            
            # Check authentication state loading
            if "useEffect(" in auth_context and "localStorage.getItem(" in auth_context:
                print("Found effect to load auth state from localStorage")
            
            # Check logout implementation
            if "const logout = " in auth_context:
                print("Found logout handler")
                
                if "localStorage.removeItem(" in auth_context:
                    print("Logout clears localStorage")
                
                if "setCurrentUser(null)" in auth_context:
                    print("Logout clears current user state")
        
        # Check routing/redirects in App.js
        with open('frontend/src/App.js', 'r') as f:
            app_code = f.read()
            
            print("\nChecking App.js for protected routes...")
            
            if "PrivateRoute" in app_code or "RequireAuth" in app_code:
                print("Found protected route implementation")
            
            if "<Route path=\"/guest/event/:eventId\"" in app_code:
                print("Found guest event route")
                
                # Check if protected
                if "element={<GuestLanding />}" in app_code:
                    print("Guest landing page is not protected")
                elif "element={<RequireAuth><GuestLanding /></RequireAuth>}" in app_code:
                    print("Guest landing page is protected")
    
    except FileNotFoundError as e:
        print(f"Could not find file: {str(e)}")

def check_jwt_expiration_handling():
    """Check how JWT token expiration is handled."""
    print_divider("JWT EXPIRATION HANDLING")
    
    # Check frontend code for token refresh logic
    try:
        with open('frontend/src/utils/api.js', 'r') as f:
            api_code = f.read()
            
            print("Checking for token refresh implementation...")
            
            if "refreshToken" in api_code or "refresh_token" in api_code:
                print("Found reference to refresh token")
            
            if "axios.interceptors.response.use" in api_code and "401" in api_code:
                print("Found response interceptor handling 401 errors")
                
                if "refresh" in api_code.lower():
                    print("Interceptor appears to implement token refresh")
    except FileNotFoundError:
        print("Could not find frontend/src/utils/api.js")
    
    # Check backend code for refresh endpoint
    refresh_endpoint = False
    token_verification_endpoint = False
    
    for rule in app.url_map.iter_rules():
        if "refresh" in rule.rule.lower() and "token" in rule.rule.lower():
            refresh_endpoint = True
        if "verify" in rule.rule.lower() and "token" in rule.rule.lower():
            token_verification_endpoint = True
    
    print(f"\nRefresh token endpoint exists: {refresh_endpoint}")
    print(f"Token verification endpoint exists: {token_verification_endpoint}")
    
    # Check JWT settings
    print("\nJWT Configuration:")
    print(f"JWT_ACCESS_TOKEN_EXPIRES: {app.config.get('JWT_ACCESS_TOKEN_EXPIRES')}")
    print(f"JWT_REFRESH_TOKEN_EXPIRES: {app.config.get('JWT_REFRESH_TOKEN_EXPIRES')}")

if __name__ == "__main__":
    # Run the checks
    check_guest_login_response_format()
    check_auth_headers_usage()
    check_frontend_auth_handling()
    check_jwt_expiration_handling()
    
    print("\nAll checks completed")