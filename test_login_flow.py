"""
End-to-end test of the login flow.

This script simulates a user visiting the login page, submitting credentials,
and being redirected to the dashboard.

Run this script to conduct an end-to-end test of the login functionality.
"""

import requests
import sys
import json
from urllib.parse import urlparse

# Test config
BASE_URL = "https://7c042730-8a5a-4e01-97b1-634fc69ab091-00-jr4li66n88of.worf.replit.dev"  # Your Replit URL
TEST_EMAIL = "test@example.com"  # Using our test user
TEST_PASSWORD = "password123"  # Using our test password


def print_step(message):
    """Print a step in the test process"""
    print(f"\n==== {message} ====")


def print_response(response):
    """Print details about a response"""
    print(f"Status Code: {response.status_code}")
    print(f"Headers: {dict(response.headers)}")
    
    # Try to print JSON response if available
    try:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response Text: {response.text[:500]}...")


def test_login_flow():
    """Test the end-to-end login flow"""
    session = requests.Session()
    
    # Step 1: Visit the login page to get a session
    print_step("Visiting login page")
    login_url = f"{BASE_URL}/auth/host_login"
    response = session.get(login_url)
    
    if response.status_code != 200:
        print("FAILED: Could not access login page")
        print_response(response)
        return False
    
    print("SUCCESS: Accessed login page")
    
    # Step 2: Submit login credentials
    print_step("Submitting login credentials")
    login_data = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    
    login_response = session.post(
        f"{BASE_URL}/auth/host/login",
        json=login_data
    )
    
    if login_response.status_code != 200:
        print("FAILED: Login request was not successful")
        print_response(login_response)
        return False
    
    # Check if login was successful by examining response
    try:
        login_json = login_response.json()
        if login_json.get("error"):
            print(f"FAILED: Login error: {login_json['error']}")
            return False
        
        if not login_json.get("is_host"):
            print(f"FAILED: User is not a host")
            return False
        
        print("SUCCESS: Login API request successful")
        print(f"User data: {json.dumps(login_json, indent=2)}")
    except Exception as e:
        print(f"FAILED: Error parsing login response: {e}")
        print_response(login_response)
        return False
    
    # Step 3: Visit the dashboard page (should automatically redirect if not logged in)
    print_step("Visiting dashboard page")
    dashboard_url = f"{BASE_URL}/dashboard"
    dashboard_response = session.get(dashboard_url, allow_redirects=False)
    
    if dashboard_response.status_code != 302:
        print("FAILED: Dashboard page did not redirect as expected")
        print_response(dashboard_response)
        return False
    
    redirect_url = dashboard_response.headers.get('Location')
    print(f"Dashboard redirected to: {redirect_url}")
    
    if not redirect_url or not redirect_url.endswith('/host/dashboard'):
        print(f"FAILED: Dashboard redirected to unexpected location: {redirect_url}")
        return False
    
    print("SUCCESS: Dashboard redirected to /host/dashboard as expected")
    
    # Step 4: Follow the redirect to host dashboard
    print_step("Following redirect to host dashboard")
    host_dashboard_url = f"{BASE_URL}{redirect_url}" if redirect_url.startswith('/') else redirect_url
    host_dashboard_response = session.get(host_dashboard_url)
    
    if host_dashboard_response.status_code != 200:
        print("FAILED: Could not access host dashboard page")
        print_response(host_dashboard_response)
        return False
    
    print("SUCCESS: Accessed host dashboard page")
    
    # Check if we got the expected HTML
    if '<div id="root">' not in host_dashboard_response.text:
        print("FAILED: Host dashboard page does not contain the root div")
        return False
    
    print("SUCCESS: Host dashboard page contains the root div")
    
    print("\n==== OVERALL TEST RESULT ====")
    print("✅ Login flow test PASSED!")
    return True


def main():
    """Main function to run the test"""
    try:
        success = test_login_flow()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"ERROR: Unexpected exception: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()