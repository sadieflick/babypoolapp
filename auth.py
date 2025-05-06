from flask import Blueprint, request, jsonify, session, current_app, render_template, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, Event
import re
from datetime import datetime, timedelta

auth_blueprint = Blueprint('auth', __name__)

# Email validation regex
EMAIL_REGEX = re.compile(r"[^@]+@[^@]+\.[^@]+")

def validate_email(email):
    """Validate email format"""
    return EMAIL_REGEX.match(email)

@auth_blueprint.route('/host_register', methods=['GET'])
def host_register_page():
    """Render the host registration page"""
    return render_template('host_register.html')

@auth_blueprint.route('/host/register', methods=['POST'])
def host_register():
    data = request.json
    
    # Validate required fields
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    # Validate email format
    if not validate_email(email):
        return jsonify({'error': 'Invalid email format'}), 400
    
    try:
        # Check if email already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({'error': 'Email already exists'}), 400
        
        # Create new host user with specifically configured hash method
        new_user = User(
            email=email,
            password_hash=generate_password_hash(
                password,
                method='pbkdf2:sha256',  # Use PBKDF2 with SHA256 for better security
                salt_length=16           # Specify salt length
            ),
            is_host=True
        )
        
        # Add optional fields if provided
        if 'first_name' in data:
            new_user.first_name = data['first_name']
        if 'last_name' in data:
            new_user.last_name = data['last_name']
        if 'nickname' in data:
            new_user.nickname = data['nickname']
        
        # Add to session and commit
        db.session.add(new_user)
        db.session.commit()
        
        # Log in the new user
        login_user(new_user)
        
        # Set shorter session expiry for hosts (1 week)
        session.permanent = True
        current_app.permanent_session_lifetime = timedelta(days=7)
        
        return jsonify({
            'id': new_user.id,
            'email': new_user.email,
            'is_host': new_user.is_host,
            'message': 'Host registration successful'
        }), 201
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Registration error: {str(e)}")
        return jsonify({'error': 'An error occurred during registration. Please try again.'}), 500

@auth_blueprint.route('/host_login', methods=['GET'])
def host_login_page():
    """Render the host login page"""
    return render_template('host_login.html')

@auth_blueprint.route('/host/login', methods=['POST'])
def host_login():
    data = request.json
    
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    user = User.query.filter_by(email=email).first()
    
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    if not user.is_host:
        return jsonify({'error': 'This account is not registered as a host'}), 403
    
    # Login the user
    login_user(user)
    
    # Set shorter session expiry for hosts (1 week)
    session.permanent = True
    current_app.permanent_session_lifetime = timedelta(days=7)
    
    return jsonify({
        'id': user.id,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'nickname': user.nickname,
        'is_host': user.is_host,
        'message': 'Login successful'
    })

@auth_blueprint.route('/guest_login', methods=['GET'])
def guest_login_page():
    """Render the guest login page"""
    return render_template('guest_login.html')

@auth_blueprint.route('/guest/login', methods=['POST'])
def guest_login():
    data = request.json
    login_type = data.get('login_type')
    
    if login_type == 'email':
        email = data.get('email')
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Check if user exists
        user = User.query.filter_by(email=email).first()
        
        if not user:
            # Store email in session and return status asking for more info
            session['temp_email'] = email
            return jsonify({
                'status': 'need_event',
                'message': 'User not found. Please provide an event code or search for mother-to-be'
            }), 200
        
        # User exists, log them in
        login_user(user)
        
        # Set longer session expiry for guests (30 days)
        session.permanent = True
        current_app.permanent_session_lifetime = timedelta(days=30)
        
        # Check if user has all required info
        if not user.first_name or not user.last_name:
            return jsonify({
                'status': 'need_profile_info',
                'user_id': user.id,
                'message': 'Please complete your profile'
            }), 200
        
        # Return user's events
        user_events = []
        for event in user.events:
            user_events.append({
                'id': event.id,
                'title': event.title,
                'mother_name': event.mother_name
            })
        
        return jsonify({
            'status': 'logged_in',
            'user_id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'nickname': user.nickname,
            'events': user_events,
            'message': 'Login successful'
        })
        
    elif login_type == 'event_code':
        event_code = data.get('event_code')
        
        if not event_code:
            return jsonify({'error': 'Event code is required'}), 400
        
        # Find the event
        event = Event.query.filter_by(event_code=event_code).first()
        
        if not event:
            return jsonify({'error': 'Event not found'}), 404
        
        # Check if we have a temp email in session or email/name in request
        email = session.get('temp_email') or data.get('email')
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        phone = data.get('phone')
        
        # Need either email or first/last name
        if not email and (not first_name or not last_name) and not phone:
            return jsonify({
                'status': 'need_user_info',
                'event_id': event.id,
                'event_title': event.title,
                'message': 'Please provide your contact information'
            }), 200
        
        # Look for existing user with email if provided
        user = None
        if email:
            user = User.query.filter_by(email=email).first()
        
        # If no user found by email, check for user with matching first/last name in this event
        if not user and first_name and last_name:
            for guest in event.guests:
                if guest.first_name == first_name and guest.last_name == last_name:
                    user = guest
                    break
        
        # If still no user, create a new one
        if not user:
            user = User(
                email=email,
                first_name=first_name,
                last_name=last_name,
                phone=phone,
                is_host=False
            )
            db.session.add(user)
        else:
            # Update any missing fields
            if first_name and not user.first_name:
                user.first_name = first_name
            if last_name and not user.last_name:
                user.last_name = last_name
            if phone and not user.phone:
                user.phone = phone
        
        # Add user to event guests if not already
        if user not in event.guests:
            event.guests.append(user)
        
        db.session.commit()
        
        # Login the user
        login_user(user)
        
        # Clear the temp email if it exists
        if 'temp_email' in session:
            session.pop('temp_email')
        
        # Set longer session expiry for guests (30 days)
        session.permanent = True
        current_app.permanent_session_lifetime = timedelta(days=30)
        
        # Check if user has all required info
        if not user.first_name or not user.last_name:
            return jsonify({
                'status': 'need_profile_info',
                'user_id': user.id,
                'event_id': event.id,
                'message': 'Please complete your profile'
            }), 200
        
        return jsonify({
            'status': 'logged_in',
            'user_id': user.id,
            'event_id': event.id,
            'event_title': event.title,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'nickname': user.nickname,
            'message': 'Successfully joined event'
        })
        
    elif login_type == 'mother_search':
        search_term = data.get('search_term')
        
        if not search_term or len(search_term) < 2:
            return jsonify({'error': 'Search term must be at least 2 characters'}), 400
        
        # Search for events with matching mother's name
        events = Event.query.filter(Event.mother_name.ilike(f'%{search_term}%')).all()
        
        if not events:
            return jsonify({'error': 'No events found with that mother\'s name'}), 404
        
        # Return the list of events for the user to choose from
        events_data = []
        for event in events:
            host = User.query.get(event.host_id)
            events_data.append({
                'id': event.id,
                'title': event.title,
                'event_code': event.event_code,
                'mother_name': event.mother_name,
                'host_name': host.get_full_name()
            })
        
        return jsonify({
            'status': 'events_found',
            'events': events_data,
            'message': 'Please select an event'
        })
    
    return jsonify({'error': 'Invalid login type'}), 400

@auth_blueprint.route('/guest/select-event', methods=['POST'])
def guest_select_event():
    data = request.json
    event_id = data.get('event_id')
    
    if not event_id:
        return jsonify({'error': 'Event ID is required'}), 400
    
    # Find the event
    event = Event.query.get(event_id)
    
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    # Check if we have email, first name, last name
    email = session.get('temp_email') or data.get('email')
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    phone = data.get('phone')
    nickname = data.get('nickname')
    payment_method = data.get('payment_method')
    
    # Need either email or first/last name
    if not email and (not first_name or not last_name) and not phone:
        return jsonify({
            'status': 'need_user_info',
            'event_id': event.id,
            'event_title': event.title,
            'message': 'Please provide your contact information'
        }), 200
    
    # Look for existing user
    user = None
    if email:
        user = User.query.filter_by(email=email).first()
    
    # If no user found by email, check for user with matching first/last name in this event
    if not user and first_name and last_name:
        for guest in event.guests:
            if guest.first_name == first_name and guest.last_name == last_name:
                user = guest
                break
    
    # If still no user, create a new one
    if not user:
        user = User(
            email=email,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            nickname=nickname,
            payment_method=payment_method,
            is_host=False
        )
        db.session.add(user)
    else:
        # Update any missing fields
        if first_name and not user.first_name:
            user.first_name = first_name
        if last_name and not user.last_name:
            user.last_name = last_name
        if phone and not user.phone:
            user.phone = phone
        if nickname:
            user.nickname = nickname
        if payment_method:
            user.payment_method = payment_method
    
    # Add user to event guests if not already
    if user not in event.guests:
        event.guests.append(user)
    
    db.session.commit()
    
    # Login the user
    login_user(user)
    
    # Clear the temp email if it exists
    if 'temp_email' in session:
        session.pop('temp_email')
    
    # Set longer session expiry for guests (30 days)
    session.permanent = True
    current_app.permanent_session_lifetime = timedelta(days=30)
    
    return jsonify({
        'status': 'logged_in',
        'user_id': user.id,
        'event_id': event.id,
        'event_title': event.title,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'nickname': user.nickname,
        'message': 'Successfully joined event'
    })

@auth_blueprint.route('/logout', methods=['GET', 'POST'])
@login_required
def logout():
    """Log out the current user"""
    logout_user()
    
    # Check if the request is AJAX/API or browser-based
    if request.is_json or request.method == 'POST':
        return jsonify({'message': 'Logged out successfully'})
    else:
        return redirect(url_for('serve'))

@auth_blueprint.route('/update-profile', methods=['PUT'])
@login_required
def update_profile():
    data = request.json
    
    # Update user profile fields
    if 'first_name' in data:
        current_user.first_name = data['first_name']
    if 'last_name' in data:
        current_user.last_name = data['last_name']
    if 'nickname' in data:
        current_user.nickname = data['nickname']
    if 'phone' in data:
        current_user.phone = data['phone']
    if 'payment_method' in data:
        current_user.payment_method = data['payment_method']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated successfully',
        'user': {
            'id': current_user.id,
            'email': current_user.email,
            'first_name': current_user.first_name,
            'last_name': current_user.last_name,
            'nickname': current_user.nickname,
            'phone': current_user.phone,
            'payment_method': current_user.payment_method
        }
    })
