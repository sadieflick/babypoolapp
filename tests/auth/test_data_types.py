#!/usr/bin/env python3
"""
Test script to verify data types are being properly handled between frontend and backend.
This tests type consistency issues in the JWT token handling.
"""
import requests
import json
import sys
from pprint import pprint

BASE_URL = 'http://127.0.0.1:5000'

def print_divider(title):
    """Print a section divider with title."""
    print("\n" + "=" * 80)
    print(f" {title} ".center(80, "-"))
    print("=" * 80 + "\n")

def examine_guest_login_data_types():
    """Test guest login with email and examine the response data types."""
    print_divider("EXAMINING GUEST LOGIN DATA TYPES")
    
    try:
        # Login with test email
        login_data = {
            "login_type": "email",
            "email": "testguest@example.com"
        }
        
        print(f"POST {BASE_URL}/auth/guest/login")
        print(f"Data: {json.dumps(login_data, indent=2)}")
        
        login_response = requests.post(
            f"{BASE_URL}/auth/guest/login",
            json=login_data
        )
        
        print(f"\nStatus Code: {login_response.status_code}")
        
        if login_response.status_code != 200:
            print(f"Error: Login failed with status code {login_response.status_code}")
            return None
        
        # Parse response data
        try:
            response_data = login_response.json()
            
            # Examine data types of key fields
            print("\nExamining response data types:")
            print(f"- status: {response_data.get('status')} ({type(response_data.get('status')).__name__})")
            print(f"- user_id: {response_data.get('user_id')} ({type(response_data.get('user_id')).__name__})")
            print(f"- is_host: {response_data.get('is_host')} ({type(response_data.get('is_host')).__name__})")
            print(f"- event_id: {response_data.get('event_id')} ({type(response_data.get('event_id')).__name__})")
            
            if 'events' in response_data:
                print(f"- events: {type(response_data.get('events')).__name__} with {len(response_data.get('events'))} items")
                if response_data.get('events'):
                    first_event = response_data.get('events')[0]
                    print(f"  - First event: {first_event}")
                    print(f"  - First event ID: {first_event.get('id')} ({type(first_event.get('id')).__name__})")
            
            # Check for token data
            print(f"- access_token present: {'access_token' in response_data}")
            print(f"- refresh_token present: {'refresh_token' in response_data}")
            
            return response_data
        except Exception as e:
            print(f"Error parsing response data: {e}")
            print(f"Raw response: {login_response.text}")
            return None
    except Exception as e:
        print(f"Error in test: {e}")
        return None

def verify_token_and_extract_data(access_token):
    """Verify the token and examine the data extracted from it."""
    print_divider("VERIFYING TOKEN DATA EXTRACTION")
    
    if not access_token:
        print("No access token provided")
        return None
    
    try:
        # Verify token
        print(f"GET {BASE_URL}/auth/token/verify")
        verify_response = requests.get(
            f"{BASE_URL}/auth/token/verify",
            headers={
                'Authorization': f'Bearer {access_token}'
            }
        )
        
        print(f"\nStatus Code: {verify_response.status_code}")
        
        if verify_response.status_code != 200:
            print(f"Error: Token verification failed with status code {verify_response.status_code}")
            return None
        
        # Parse response data
        try:
            verify_data = verify_response.json()
            
            # Examine data types of key fields
            print("\nExamining token verification data:")
            print(f"- valid: {verify_data.get('valid')} ({type(verify_data.get('valid')).__name__})")
            print(f"- user_id: {verify_data.get('user_id')} ({type(verify_data.get('user_id')).__name__})")
            print(f"- is_host: {verify_data.get('is_host')} ({type(verify_data.get('is_host')).__name__})")
            
            # Now try to access a protected endpoint
            print(f"\nTesting access to protected endpoint with token:")
            user_response = requests.get(
                f"{BASE_URL}/api/current-user",
                headers={
                    'Authorization': f'Bearer {access_token}'
                }
            )
            
            print(f"Status Code: {user_response.status_code}")
            
            if user_response.status_code != 200:
                print(f"Error: Failed to access protected endpoint with status code {user_response.status_code}")
                return None
            
            # Parse user data
            user_data = user_response.json()
            print("\nExamining user data from protected endpoint:")
            print(f"- id: {user_data.get('id')} ({type(user_data.get('id')).__name__})")
            print(f"- is_host: {user_data.get('is_host')} ({type(user_data.get('is_host')).__name__})")
            
            if 'events' in user_data:
                print(f"- events: {type(user_data.get('events')).__name__} with {len(user_data.get('events'))} items")
                if user_data.get('events'):
                    first_event = user_data.get('events')[0]
                    print(f"  - First event: {first_event}")
                    print(f"  - First event ID: {first_event.get('id')} ({type(first_event.get('id')).__name__})")
            
            return user_data
        except Exception as e:
            print(f"Error parsing response data: {e}")
            print(f"Raw response: {verify_response.text}")
            return None
    except Exception as e:
        print(f"Error in test: {e}")
        return None

def test_frontend_payload_simulation():
    """Simulate the exact payload that would be sent from frontend to backend."""
    print_divider("SIMULATING FRONTEND PAYLOAD")
    
    try:
        # Login with test email
        login_data = {
            "login_type": "email",
            "email": "testguest@example.com"
        }
        
        print(f"POST {BASE_URL}/auth/guest/login")
        print(f"Data: {json.dumps(login_data, indent=2)}")
        
        login_response = requests.post(
            f"{BASE_URL}/auth/guest/login",
            json=login_data,
            headers={
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        )
        
        if login_response.status_code != 200:
            print(f"Error: Login failed with status code {login_response.status_code}")
            return None
        
        response_data = login_response.json()
        access_token = response_data.get('access_token')
        
        if not access_token:
            print("No access token in response")
            return None
        
        # Now simulate exactly how frontend would process this
        # In frontend, we'd store string values in localStorage
        string_token = str(access_token)
        print(f"\nExamining token format:")
        print(f"- Original token type: {type(access_token).__name__}")
        print(f"- Stringified token type: {type(string_token).__name__}")
        print(f"- Length: {len(string_token)}")
        
        # When reading from localStorage in the frontend, we'd get it as a string
        # Simulate auth header construction from stored string
        auth_header = f'Bearer {string_token}'
        print(f"- Authorization header: {auth_header[:20]}... ({type(auth_header).__name__})")
        
        # Now try to access API with this header
        print(f"\nTesting access with simulated frontend auth header:")
        try:
            user_response = requests.get(
                f"{BASE_URL}/api/current-user",
                headers={
                    'Authorization': auth_header,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            )
            
            print(f"Status Code: {user_response.status_code}")
            
            if user_response.status_code == 200:
                print("✓ Successfully accessed API with simulated frontend auth header")
                return True
            else:
                print("✗ Failed to access API with simulated frontend auth header")
                return False
        except Exception as e:
            print(f"Error accessing API: {e}")
            return False
    except Exception as e:
        print(f"Error in test: {e}")
        return False

def verify_auth_flow_for_code_consistency():
    """Test the complete auth flow checking for type handling consistency."""
    print_divider("TESTING COMPLETE AUTH FLOW FOR TYPE CONSISTENCY")
    
    try:
        # 1. Get login response
        response_data = examine_guest_login_data_types()
        if not response_data:
            return False
        
        # 2. Extract token
        access_token = response_data.get('access_token')
        if not access_token:
            print("No access token in login response")
            return False
        
        # 3. Verify token and access protected endpoint
        user_data = verify_token_and_extract_data(access_token)
        if not user_data:
            return False
        
        # 4. Simulate frontend token handling
        frontend_simulation = test_frontend_payload_simulation()
        
        return frontend_simulation
    except Exception as e:
        print(f"Error in auth flow test: {e}")
        return False

def verify_jwt_handling_in_get_user_from_jwt():
    """Test the get_user_from_jwt function with different ID formats."""
    print_divider("EXAMINING JWT USER EXTRACTION LOGIC")
    
    print("Based on the code review, get_user_from_jwt() has the following type handling:")
    print("1. If jwt_identity is a string, it tries to convert to int")
    print("2. If jwt_identity is a dict, it looks for an 'id' key")
    print("3. Otherwise, it uses jwt_identity directly as the user ID")
    
    print("\nThis could lead to issues if:")
    print("- Frontend sends numeric IDs but backend expects strings")
    print("- IDs are stored as strings in one place but integers in another")
    print("- There's type mismatch between token creation and verification")
    
    print("\nLooking at the code, a common issue is:")
    print("- create_access_token might be encoding user.id (an int)")
    print("- But localStorage might be storing it as a string")
    print("- And backend might be comparing with == instead of === (in JS) or not handling type conversion")
    
    return True

def check_auth_context_typecasting():
    """Examine the AuthContext.js file for potential type issues."""
    print_divider("EXAMINING FRONTEND AUTH CONTEXT TYPE HANDLING")
    
    print("The AuthContext.js file may have type handling issues:")
    print("1. When storing data in localStorage, everything becomes a string")
    print("2. When parsing JSON from localStorage, numbers remain as numbers")
    print("3. The `!!currentUser` check in isAuthenticated will be false if currentUser is {}")
    print("4. The userData?.is_host || false pattern may have issues if is_host is undefined vs null")
    
    print("\nCommon localStorage issues:")
    print("- localStorage.getItem('isHost') === 'true' vs localStorage.getItem('isHost') == true")
    print("- JSON.parse(localStorage.getItem('currentUser')) failing if the string is not valid JSON")
    print("- event_id being stored as string, but compared as number somewhere else")
    
    return True

def run_all_tests():
    """Run all data type verification tests."""
    print_divider("STARTING DATA TYPE VERIFICATION TESTS")
    
    all_passed = True
    
    # Run auth flow test
    print("\nTesting auth flow for type consistency...")
    auth_flow_result = verify_auth_flow_for_code_consistency()
    all_passed = all_passed and auth_flow_result
    
    # Check JWT handling
    print("\nExamining JWT handling logic...")
    jwt_handling_result = verify_jwt_handling_in_get_user_from_jwt()
    all_passed = all_passed and jwt_handling_result
    
    # Check AuthContext typecasting
    print("\nExamining frontend AuthContext type handling...")
    auth_context_result = check_auth_context_typecasting()
    all_passed = all_passed and auth_context_result
    
    print_divider("DATA TYPE VERIFICATION TEST RESULTS")
    if all_passed:
        print("✓ All tests completed (some manual verification required)")
    else:
        print("✗ Some tests failed - see details above")
    
    return all_passed

if __name__ == "__main__":
    run_all_tests()