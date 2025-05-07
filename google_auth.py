# Use this Flask blueprint for Google authentication. Do not use flask-dance.

import json
import os
import time
from datetime import timedelta

import requests
from flask import Blueprint, redirect, request, url_for, make_response
from flask_login import login_required, login_user, logout_user
from flask_jwt_extended import (
    create_access_token, create_refresh_token, 
    set_access_cookies, set_refresh_cookies,
    unset_jwt_cookies
)
from models import User, db
from oauthlib.oauth2 import WebApplicationClient

GOOGLE_CLIENT_ID = os.environ["GOOGLE_OAUTH_CLIENT_ID"]
GOOGLE_CLIENT_SECRET = os.environ["GOOGLE_OAUTH_CLIENT_SECRET"]
GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration"

# Make sure to use this redirect URL. It has to match the one in the whitelist
DEV_REDIRECT_URL = f'https://{os.environ.get("REPLIT_DEV_DOMAIN", "localhost")}/google_login/callback'

# ALWAYS display setup instructions to the user:
print(f"""To make Google authentication work:
1. Go to https://console.cloud.google.com/apis/credentials
2. Create a new OAuth 2.0 Client ID
3. Add {DEV_REDIRECT_URL} to Authorized redirect URIs

For detailed instructions, see:
https://docs.replit.com/additional-resources/google-auth-in-flask#set-up-your-oauth-app--client
""")

client = WebApplicationClient(GOOGLE_CLIENT_ID)

google_auth = Blueprint("google_auth", __name__)


@google_auth.route("/google_login")
def login():
    google_provider_cfg = requests.get(GOOGLE_DISCOVERY_URL).json()
    authorization_endpoint = google_provider_cfg["authorization_endpoint"]

    request_uri = client.prepare_request_uri(
        authorization_endpoint,
        # Replacing http:// with https:// is important as the external
        # protocol must be https to match the URI whitelisted
        redirect_uri=request.base_url.replace("http://", "https://") + "/callback",
        scope=["openid", "email", "profile"],
    )
    return redirect(request_uri)


@google_auth.route("/google_login/callback")
def callback():
    code = request.args.get("code")
    google_provider_cfg = requests.get(GOOGLE_DISCOVERY_URL).json()
    token_endpoint = google_provider_cfg["token_endpoint"]

    token_url, headers, body = client.prepare_token_request(
        token_endpoint,
        # Replacing http:// with https:// is important as the external
        # protocol must be https to match the URI whitelisted
        authorization_response=request.url.replace("http://", "https://"),
        redirect_url=request.base_url.replace("http://", "https://"),
        code=code,
    )
    token_response = requests.post(
        token_url,
        headers=headers,
        data=body,
        auth=(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
    )

    client.parse_request_body_response(json.dumps(token_response.json()))

    userinfo_endpoint = google_provider_cfg["userinfo_endpoint"]
    uri, headers, body = client.add_token(userinfo_endpoint)
    userinfo_response = requests.get(uri, headers=headers, data=body)

    userinfo = userinfo_response.json()
    if userinfo.get("email_verified"):
        users_email = userinfo["email"]
        users_name = userinfo["given_name"]
    else:
        return "User email not available or not verified by Google.", 400

    user = User.query.filter_by(email=users_email).first()
    if not user:
        # Create new user with Google info
        user = User(
            email=users_email,
            first_name=users_name,
            is_host=False  # Default to non-host account
        )
        db.session.add(user)
        db.session.commit()

    # Log in the user
    login_user(user)
    
    # Fetch hosted_events_count for host users
    hosted_events_count = 0
    if user.is_host:
        # Count the number of events the user hosts
        from models import Event
        hosted_events_count = Event.query.filter_by(host_id=user.id).count()
    
    # Create a response with a script that will set localStorage before redirecting
    user_data = {
        'id': user.id,
        'email': user.email,
        'first_name': user.first_name or users_name,
        'last_name': user.last_name or '',
        'nickname': user.nickname,
        'is_host': user.is_host,
        'hosted_events_count': hosted_events_count
    }
    
    # Create JWT tokens for the user
    identity = {
        'id': user.id,
        'email': user.email,
        'is_host': user.is_host,
        'type': 'host' if user.is_host else 'guest'
    }
    
    # Create tokens with appropriate expirations
    access_token_expires = timedelta(days=7) if user.is_host else timedelta(days=30)
    refresh_token_expires = timedelta(days=30)
    
    access_token = create_access_token(identity=identity, expires_delta=access_token_expires)
    refresh_token = create_refresh_token(identity=identity, expires_delta=refresh_token_expires)
    
    # Determine redirect URL based on user type
    redirect_url = '/host/dashboard' if user.is_host else '/'
    if user.is_host:
        # Redirect to host dashboard
        print("Redirecting to host dashboard")
        redirect_url = '/host/dashboard'
    elif hasattr(user, 'events') and user.events:
        # Redirect to the first event if user is a guest with events
        event_id = user.events[0].id
        print(f"Redirecting to guest event {event_id}")
        redirect_url = f'/guest/event/{event_id}'
    else:
        # No events, redirect to home
        redirect_url = '/'
    
    # Create HTML response with tokens
    html_response = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Google Login Successful</title>
        <script>
            // Store authentication data in localStorage
            const token = "{access_token}";
            localStorage.setItem('token', token);
            localStorage.setItem('refresh_token', "{refresh_token}");
            
            // Convert boolean to string 'true'/'false' in the correct format expected by isHost()
            localStorage.setItem('isHost', {str(user.is_host).lower()} ? 'true' : 'false');
            localStorage.setItem('currentUser', '{json.dumps(user_data)}');
            
            console.log('Authentication data stored from Google login:', {{
                token: localStorage.getItem('token').substring(0, 20) + "...", // Only log partial token for security
                refresh_token: "present", // Don't log actual refresh token
                isHost: localStorage.getItem('isHost'),
                userData: {json.dumps(user_data)}
            }});
            
            // Redirect to the appropriate page
            window.location.href = "{redirect_url}";
        </script>
    </head>
    <body>
        <h1>Login Successful!</h1>
        <p>You are being redirected...</p>
    </body>
    </html>
    """
    
    # Create response object and set cookies
    response = make_response(html_response)
    set_access_cookies(response, access_token)
    set_refresh_cookies(response, refresh_token)
    
    return response


@google_auth.route("/logout")
@login_required
def logout():
    logout_user()
    
    # Return HTML that clears localStorage before redirecting
    html_response = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Logout Successful</title>
        <script>
            // Clear all authentication data from localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('isHost');
            localStorage.removeItem('currentUser');
            
            console.log('Authentication data cleared on logout');
            
            // Redirect to home page
            window.location.href = '/';
        </script>
    </head>
    <body>
        <h1>Logout Successful!</h1>
        <p>You are being redirected to the home page...</p>
    </body>
    </html>
    """
    
    # Create response and clear cookies
    response = make_response(html_response)
    unset_jwt_cookies(response)
    
    return response