#!/usr/bin/env python3
"""
Test script to verify authentication headers are being properly passed and processed.
This tests the Flask backend authentication flow and JWT token handling.
"""
import requests
import json
import sys
from pprint import pprint

BASE_URL = 'http://127.0.0.1:5000'  # Flask development server

def print_divider(title):
    """Print a section divider with title."""
    print("\n" + "=" * 80)
    print(f" {title} ".center(80, "-"))
    print("=" * 80 + "\n")

def test_guest_login_with_event_code():
    """Test guest login using event code and verify JWT tokens are returned."""
    print_divider("TESTING GUEST LOGIN WITH EVENT CODE")
    
    # Step 1: Login with event code
    login_data = {
        "login_type": "event_code",
        "event_code": "8810"  # Using a known event code
    }
    
    print(f"POST {BASE_URL}/auth/guest/login")
    print(f"Data: {json.dumps(login_data, indent=2)}")
    
    response = requests.post(
        f"{BASE_URL}/auth/guest/login",
        json=login_data
    )
    
    print(f"\nStatus Code: {response.status_code}")
    
    # Safely extract and print headers
    print("\nResponse Headers:")
    for key, value in response.headers.items():
        # Don't print the actual Set-Cookie values, just note that they exist
        if key.lower() == 'set-cookie':
            print(f"{key}: [Cookie values present]")
        else:
            print(f"{key}: {value}")
    
    # Extract and examine response body, masking token values
    try:
        data = response.json()
        print("\nResponse Body:")
        
        # Create a copy to safely modify for printing
        printable_data = data.copy() if isinstance(data, dict) else data
        
        if isinstance(printable_data, dict):
            # Mask token values for security while showing they exist
            if 'access_token' in printable_data:
                token = printable_data['access_token']
                token_length = len(token) if token else 0
                printable_data['access_token'] = f"[Token present - {token_length} chars]"
            
            if 'refresh_token' in printable_data:
                token = printable_data['refresh_token']
                token_length = len(token) if token else 0
                printable_data['refresh_token'] = f"[Token present - {token_length} chars]"
        
        pprint(printable_data)
    except Exception as e:
        print(f"Error parsing response: {str(e)}")
        print(f"Raw response: {response.text}")
    
    # Return data for subsequent tests
    return response

def test_protected_access_with_token(previous_response=None):
    """Test accessing a protected endpoint with the JWT token."""
    print_divider("TESTING PROTECTED ACCESS WITH TOKEN")
    
    if previous_response is None or previous_response.status_code != 200:
        print("No valid login response to extract token from")
        return
    
    try:
        data = previous_response.json()
        
        # Get access token from response
        access_token = data.get('access_token')
        if not access_token:
            print("No access token found in login response")
            return
        
        # Get a cookie from the response if present
        cookies = previous_response.cookies
        
        # Try to access a protected endpoint with the token in Authorization header
        print(f"GET {BASE_URL}/api/current-user")
        print(f"Authorization: Bearer [token]")
        
        headers = {
            'Authorization': f'Bearer {access_token}'
        }
        
        response = requests.get(
            f"{BASE_URL}/api/current-user",
            headers=headers,
            cookies=cookies
        )
        
        print(f"\nStatus Code: {response.status_code}")
        
        print("\nResponse Headers:")
        for key, value in response.headers.items():
            if key.lower() == 'set-cookie':
                print(f"{key}: [Cookie values present]")
            else:
                print(f"{key}: {value}")
        
        try:
            data = response.json()
            print("\nResponse Body:")
            pprint(data)
        except Exception as e:
            print(f"Error parsing response: {str(e)}")
            print(f"Raw response: {response.text}")
            
    except Exception as e:
        print(f"Error in test: {str(e)}")

def test_axios_headers_simulation():
    """Simulate how Axios in the frontend might be sending requests."""
    print_divider("SIMULATING AXIOS HEADERS")
    
    # Login first to get a token
    login_data = {
        "login_type": "email",
        "email": "testguest@example.com"
    }
    
    print(f"POST {BASE_URL}/auth/guest/login (Initial Login)")
    print(f"Data: {json.dumps(login_data, indent=2)}")
    
    login_response = requests.post(
        f"{BASE_URL}/auth/guest/login",
        json=login_data
    )
    
    if login_response.status_code != 200:
        print(f"Login failed with status code: {login_response.status_code}")
        return
    
    try:
        login_data = login_response.json()
        access_token = login_data.get('access_token')
        
        if not access_token:
            print("No access token found in login response")
            return
        
        # Simulate how Axios might be configured in the frontend
        print("\nSimulating frontend Axios request configuration:")
        
        # Common Axios configurations
        common_headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'  # Common for AJAX requests
        }
        
        print("Headers being sent:")
        pprint(common_headers)
        
        # Let's try with the simulated Axios configuration
        print(f"\nGET {BASE_URL}/api/current-user (With Axios-like headers)")
        
        response = requests.get(
            f"{BASE_URL}/api/current-user",
            headers=common_headers,
            cookies=login_response.cookies,
            # Typical Axios configuration
            params={},  # Query parameters would go here
            # withCredentials: true in Axios equates to sending cookies
        )
        
        print(f"\nStatus Code: {response.status_code}")
        
        try:
            data = response.json()
            print("\nResponse Body:")
            pprint(data)
        except Exception as e:
            print(f"Error parsing response: {str(e)}")
            print(f"Raw response: {response.text}")
            
    except Exception as e:
        print(f"Error in Axios simulation test: {str(e)}")

def verify_api_utilities_configuration():
    """Verify the frontend API utilities configuration by checking how API requests should be set up."""
    print_divider("EXAMINING API UTILITIES CONFIGURATION")
    
    # For this test, we need to check the actual code in frontend/src/utils/api.js
    # Since we can't execute JavaScript code directly in Python, we'll print instructions
    print("To verify API utilities configuration, examine the following files:")
    print("1. frontend/src/utils/api.js - Check how API requests are configured")
    print("2. frontend/src/components/AuthContext.js - Check token storage/retrieval")
    print("\nSpecifically, check for:")
    print("- How Authorization headers are set")
    print("- If 'withCredentials: true' is set for cross-domain cookies")
    print("- If tokens are properly retrieved from localStorage")
    print("- If there's any preprocessing of API responses that might affect authentication")

def test_backend_token_verification():
    """Test how the backend verifies tokens by checking the token verification endpoint."""
    print_divider("TESTING BACKEND TOKEN VERIFICATION")
    
    # Login first to get a token
    login_data = {
        "login_type": "email",
        "email": "testguest@example.com"
    }
    
    login_response = requests.post(
        f"{BASE_URL}/auth/guest/login",
        json=login_data
    )
    
    if login_response.status_code != 200:
        print(f"Login failed with status code: {login_response.status_code}")
        return
    
    try:
        login_data = login_response.json()
        access_token = login_data.get('access_token')
        
        if not access_token:
            print("No access token found in login response")
            return
        
        # Try to verify the token
        print(f"GET {BASE_URL}/auth/token/verify")
        
        response = requests.get(
            f"{BASE_URL}/auth/token/verify",
            headers={'Authorization': f'Bearer {access_token}'},
            cookies=login_response.cookies
        )
        
        print(f"\nStatus Code: {response.status_code}")
        
        try:
            data = response.json()
            print("\nResponse Body:")
            pprint(data)
        except Exception as e:
            print(f"Error parsing response: {str(e)}")
            print(f"Raw response: {response.text}")
            
    except Exception as e:
        print(f"Error in token verification test: {str(e)}")

def check_frontend_redirect_issue():
    """Check for potential frontend redirect issues."""
    print_divider("CHECKING FRONTEND REDIRECT ISSUE")
    
    print("Based on the server logs, there appears to be a mismatch between:")
    print("1. The backend route patterns (/guest-info?event_id=X or /event/X)")
    print("2. The frontend React routes (/guest/event/X)")
    print("\nLikely causes:")
    print("- Backend is using 302 redirects instead of returning JWT tokens")
    print("- Frontend is not properly handling the JWT token-based authentication")
    print("- There might be a mismatch in how redirects are handled")
    print("\nCheck the following in the code:")
    print("1. backend redirect patterns in auth.py guest login functions")
    print("2. frontend route definitions in App.js")
    print("3. API utility functions in frontend/src/utils/api.js")
    print("4. How AuthContext.js handles redirects after login")
    
    print("\nImportant server log patterns observed:")
    print("1. '/guest-info?event_id=2' appearing frequently")
    print("2. Transitions from /auth/guest_login -> POST /auth/guest/login -> /guest-info")
    print("3. Auth status is consistently showing as 'false' in console logs")

def run_all_tests():
    """Run all auth tests in sequence."""
    print_divider("STARTING AUTHENTICATION TESTS")
    
    # Run tests in sequence, passing results between tests
    login_response = test_guest_login_with_event_code()
    test_protected_access_with_token(login_response)
    test_axios_headers_simulation()
    verify_api_utilities_configuration()
    test_backend_token_verification()
    check_frontend_redirect_issue()
    
    print_divider("AUTH TESTS COMPLETED")

if __name__ == "__main__":
    run_all_tests()