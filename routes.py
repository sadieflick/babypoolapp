from flask import Blueprint, jsonify, request, current_app
from flask_login import current_user, login_required
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from models import db, User, Event, DateGuess, HourGuess, MinuteGuess, NameGuess, Payment
from werkzeug.utils import secure_filename
import os
from datetime import datetime, timedelta
import uuid
from utils import calculate_amount_owed

api = Blueprint('api', __name__)

# Helper function to get user from JWT identity
def get_user_from_jwt():
    """Get the current user based on JWT identity"""
    try:
        jwt_identity = get_jwt_identity()
        
        print(f"DEBUG: JWT identity type and value: {type(jwt_identity).__name__}, {jwt_identity}")
        
        # Handle different formats of identity
        if isinstance(jwt_identity, str):
            # String identities need to be converted to int
            try:
                user_id = int(jwt_identity)
            except ValueError:
                # If it's not a valid int string, use as is
                user_id = jwt_identity
        # Legacy support for dict format if needed
        elif isinstance(jwt_identity, dict):
            # Get user_id from dict, might be int or string
            user_id = jwt_identity.get('id')
            print(f"DEBUG: ID from dict: {user_id}, type: {type(user_id).__name__}")
            if isinstance(user_id, str):
                # Convert string to int if possible
                try:
                    user_id = int(user_id)
                except ValueError:
                    # Keep as string if not convertible
                    pass
        else:
            # Assume it's already an int or other format
            user_id = jwt_identity
            
        if not user_id:
            print("DEBUG: No user_id found in JWT")
            return None
            
        print(f"DEBUG: Final user_id: {user_id}, type: {type(user_id).__name__}")
        
        # Query with explicit integer conversion for safety
        try:
            user_id_int = int(user_id)
            user = User.query.get(user_id_int)
            if user:
                return user
        except (ValueError, TypeError):
            # If int conversion fails, try string lookup or other methods
            print(f"DEBUG: Int conversion failed, trying string comparison")
        
        # Fallback to manual filtering to handle string IDs
        return User.query.filter(User.id == user_id).first()
    except Exception as e:
        print(f"Error getting user from JWT: {str(e)}")
        return None

# User endpoints
@api.route('/users/me', methods=['GET'])
@api.route('/current-user', methods=['GET'])  # Add an alias that matches what the test is using
@jwt_required()
def get_current_user_info():
    """Return information about the currently logged-in user using JWT"""
    user = get_user_from_jwt()
    
    if not user:
        return jsonify({'error': 'User not found'}), 401
        
    user_data = {
        'id': user.id,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'nickname': user.nickname,
        'phone': user.phone,
        'is_host': user.is_host
    }
    
    # Include events if the user is a guest
    if not user.is_host:
        events_data = []
        for event in user.events:
            events_data.append({
                'id': event.id,
                'title': event.title,
                'mother_name': event.mother_name,
                'event_code': event.event_code
            })
        user_data['events'] = events_data
    
    return jsonify(user_data)

# Helper function for file uploads
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

# Event routes
@api.route('/events', methods=['GET'])
def get_events():
    try:
        user = None
        
        # Try to get user from JWT if available
        try:
            verify_jwt_in_request(optional=True)
            raw_identity = get_jwt_identity()
            print(f"DEBUG: Raw JWT identity: {raw_identity}, type: {type(raw_identity)}")
            
            # Debug print for request headers
            auth_header = request.headers.get('Authorization')
            print(f"DEBUG: Authorization header: {auth_header}")
            
            user = get_user_from_jwt()
            print(f"DEBUG: User from JWT: {user}")
        except:
            # If JWT verification fails, try to use session-based authentication
            if current_user.is_authenticated:
                user = current_user
                print(f"DEBUG: User from session: {user}")
        
        if not user:
            return jsonify({'error': 'User not authenticated'}), 401
    except Exception as e:
        print(f"ERROR in get_events: {str(e)}")
        return jsonify({'error': f'Authentication error: {str(e)}'}), 500
        
    if user.is_host:
        events = Event.query.filter_by(host_id=user.id).all()
    else:
        events = user.events
    
    events_data = []
    for event in events:
        events_data.append({
            'id': event.id,
            'title': event.title,
            'event_code': event.event_code,
            'mother_name': event.mother_name,
            'event_date': event.event_date.strftime('%Y-%m-%d'),
            'due_date': event.due_date.strftime('%Y-%m-%d')
        })
    
    return jsonify(events_data)



@api.route('/events/<int:event_id>', methods=['GET'])
def get_event(event_id):
    event = Event.query.get_or_404(event_id)
    user = None
    
    # Try to get user from JWT if available
    try:
        verify_jwt_in_request(optional=True)
        user = get_user_from_jwt()
    except:
        # If JWT verification fails, try to use session-based authentication
        if current_user.is_authenticated:
            user = current_user
        
    # If user is not the host and not a guest, only return limited info
    if not user or (
        user.id != event.host_id and 
        user not in event.guests
    ):
        return jsonify({
            'id': event.id,
            'title': event.title,
            'mother_name': event.mother_name,
            'event_date': event.event_date.strftime('%Y-%m-%d'),
            'due_date': event.due_date.strftime('%Y-%m-%d')
        })
    
    # Full event details for hosts and guests
    host = User.query.get(event.host_id)
    event_data = {
        'id': event.id,
        'title': event.title,
        'event_code': event.event_code,
        'mother_name': event.mother_name,
        'partner_name': event.partner_name,
        'event_date': event.event_date.strftime('%Y-%m-%d'),
        'due_date': event.due_date.strftime('%Y-%m-%d'),
        'host': {
            'id': host.id,
            'name': host.get_full_name(),
            'email': host.email if event.show_host_email else None,
        },
        'shower_link': event.shower_link,
        'guess_price': event.guess_price,
        'image_path': event.image_path,
        'theme': event.theme,
        'theme_mode': event.theme_mode,
        'name_game_enabled': event.name_game_enabled,
        'baby_name_revealed': event.baby_name_revealed,
        'created_at': event.created_at.strftime('%Y-%m-%d %H:%M:%S')
    }
    
    return jsonify(event_data)

@api.route('/events', methods=['POST'])
@jwt_required()
def create_event():
    user = get_user_from_jwt()
    
    if not user:
        return jsonify({'error': 'User not found'}), 401
        
    if not user.is_host:
        return jsonify({'error': 'Only hosts can create events'}), 403
    
    data = request.json
    
    # Validate required fields
    if not data.get('mother_name'):
        return jsonify({'error': "Mother's name is required"}), 400
    
    if not data.get('due_date'):
        return jsonify({'error': "Baby's due date is required"}), 400
    
    try:
        # Handle optional date fields
        event_date = None
        if data.get('event_date'):
            try:
                event_date = datetime.strptime(data.get('event_date'), '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': "Invalid event date format"}), 400
        else:
            # Default to current date if not provided
            event_date = datetime.utcnow().date()
        
        due_date = None
        try:
            due_date = datetime.strptime(data.get('due_date'), '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': "Invalid due date format"}), 400
        
        # Create the event
        new_event = Event(
            event_code=Event.generate_event_code(),
            title=data.get('title', f"{data.get('mother_name')}'s Baby Shower"),
            host_id=user.id,
            mother_name=data.get('mother_name'),
            partner_name=data.get('partner_name'),
            event_date=event_date,
            due_date=due_date,
            baby_name=data.get('baby_name'),
            baby_name_revealed=data.get('baby_name_revealed', False),
            name_game_enabled=data.get('name_game_enabled', False),
            show_host_email=data.get('show_host_email', False),
            shower_link=data.get('shower_link'),
            guess_price=float(data.get('guess_price', 1.0)),
            theme=data.get('theme', 'default'),
            theme_mode=data.get('theme_mode', 'light')
        )
        
        db.session.add(new_event)
        db.session.commit()
        
        # Process guest emails if provided
        guest_emails = data.get('guest_emails', [])
        if guest_emails:
            for email in guest_emails:
                if not email or '@' not in email:
                    continue  # Skip invalid emails
                    
                # Check if the user already exists
                guest_user = User.query.filter_by(email=email).first()
                if not guest_user:
                    guest_user = User(email=email)
                    db.session.add(guest_user)
                
                # Add user to the event's guests
                if guest_user not in new_event.guests:
                    new_event.guests.append(guest_user)
            
            db.session.commit()
        
        # Handle Venmo information if provided
        venmo_username = data.get('venmo_username')
        venmo_phone_last4 = data.get('venmo_phone_last4')
        
        if venmo_username and venmo_phone_last4:
            user.venmo_username = venmo_username
            user.venmo_phone_last4 = venmo_phone_last4
            db.session.commit()
        
        return jsonify({
            'id': new_event.id,
            'event_code': new_event.event_code,
            'message': 'Event created successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating event: {str(e)}")
        return jsonify({'error': f"Failed to create event: {str(e)}"}), 400

@api.route('/events/<int:event_id>', methods=['PUT'])
@jwt_required()
def update_event(event_id):
    user = get_user_from_jwt()
    
    if not user:
        return jsonify({'error': 'User not found'}), 401
        
    event = Event.query.get_or_404(event_id)
    
    # Ensure only the host can update the event
    if user.id != event.host_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.json
    
    try:
        if 'title' in data:
            event.title = data['title']
        if 'mother_name' in data:
            event.mother_name = data['mother_name']
        if 'partner_name' in data:
            event.partner_name = data['partner_name']
        if 'event_date' in data:
            event.event_date = datetime.strptime(data['event_date'], '%Y-%m-%d').date()
        if 'due_date' in data:
            event.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
        if 'baby_name' in data:
            event.baby_name = data['baby_name']
        if 'baby_name_revealed' in data:
            event.baby_name_revealed = data['baby_name_revealed']
        if 'name_game_enabled' in data:
            event.name_game_enabled = data['name_game_enabled']
        if 'show_host_email' in data:
            event.show_host_email = data['show_host_email']
        if 'shower_link' in data:
            event.shower_link = data['shower_link']
        if 'guess_price' in data:
            event.guess_price = data['guess_price']
        if 'theme' in data:
            event.theme = data['theme']
        if 'theme_mode' in data:
            event.theme_mode = data['theme_mode']
        
        db.session.commit()
        
        return jsonify({'message': 'Event updated successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@api.route('/events/<int:event_id>/image', methods=['POST'])
@login_required
def upload_event_image(event_id):
    event = Event.query.get_or_404(event_id)
    
    # Ensure only the host can update the event
    if current_user.id != event.host_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Check if the post request has the file part
    if 'image' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['image']
    
    # If the user does not select a file, the browser submits an
    # empty file without a filename.
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        # Add a unique identifier to prevent filename collisions
        unique_filename = f"{uuid.uuid4()}_{filename}"
        upload_folder = current_app.config['UPLOAD_FOLDER']
        
        # Create the upload directory if it doesn't exist
        os.makedirs(upload_folder, exist_ok=True)
        
        file_path = os.path.join(upload_folder, unique_filename)
        file.save(file_path)
        
        # Update the event with the new image path
        event.image_path = f"/static/uploads/{unique_filename}"
        db.session.commit()
        
        return jsonify({
            'message': 'Image uploaded successfully',
            'image_path': event.image_path
        })
    
    return jsonify({'error': 'File type not allowed'}), 400

@api.route('/events/code/<event_code>', methods=['GET'])
def find_event_by_code(event_code):
    event = Event.query.filter_by(event_code=event_code).first()
    
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    return jsonify({
        'id': event.id,
        'title': event.title,
        'mother_name': event.mother_name,
        'event_date': event.event_date.strftime('%Y-%m-%d'),
        'due_date': event.due_date.strftime('%Y-%m-%d'),
        'host': User.query.get(event.host_id).get_full_name()
    })

@api.route('/events/find-by-mother', methods=['GET'])
def find_event_by_mother():
    search_term = request.args.get('name', '')
    if not search_term or len(search_term) < 2:
        return jsonify({'error': 'Search term must be at least 2 characters'}), 400
    
    # Search for events with matching mother's name
    events = Event.query.filter(Event.mother_name.ilike(f'%{search_term}%')).all()
    
    events_data = []
    for event in events:
        host = User.query.get(event.host_id)
        events_data.append({
            'id': event.id,
            'title': event.title,
            'mother_name': event.mother_name,
            'host_name': host.get_full_name()
        })
    
    return jsonify(events_data)

@api.route('/events/<int:event_id>/add-guest', methods=['POST'])
@login_required
def add_guest_to_event(event_id):
    event = Event.query.get_or_404(event_id)
    
    # Ensure only the host can add guests
    if current_user.id != event.host_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.json
    email = data.get('email')
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    # Check if the user already exists
    user = User.query.filter_by(email=email).first()
    if not user:
        # Create a new user
        user = User(email=email)
        db.session.add(user)
    
    # Check if user is already a guest
    if user in event.guests:
        return jsonify({'error': 'User is already a guest for this event'}), 400
    
    # Add user to the event's guests
    event.guests.append(user)
    db.session.commit()
    
    return jsonify({'message': 'Guest added successfully'})

@api.route('/events/<int:event_id>/guests', methods=['GET'])
@login_required
def get_event_guests(event_id):
    event = Event.query.get_or_404(event_id)
    
    # Ensure only the host can view guests
    if current_user.id != event.host_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    guests_data = []
    for guest in event.guests:
        # Calculate guesses and payments
        date_guesses = DateGuess.query.filter_by(user_id=guest.id, event_id=event_id).count()
        hour_guesses = HourGuess.query.filter_by(user_id=guest.id, event_id=event_id).count()
        minute_guesses = MinuteGuess.query.filter_by(user_id=guest.id, event_id=event_id).count()
        name_guesses = NameGuess.query.filter_by(user_id=guest.id, event_id=event_id).count()
        
        total_guesses = date_guesses + hour_guesses + minute_guesses + name_guesses
        amount_owed = total_guesses * event.guess_price
        
        # Get total paid
        payments = Payment.query.filter_by(user_id=guest.id, event_id=event_id).all()
        total_paid = sum(payment.amount for payment in payments)
        
        payment_status = 'paid' if total_paid >= amount_owed else 'pending'
        if 0 < total_paid < amount_owed:
            payment_status = 'partial'
        
        guests_data.append({
            'id': guest.id,
            'email': guest.email,
            'first_name': guest.first_name,
            'last_name': guest.last_name,
            'nickname': guest.nickname,
            'phone': guest.phone,
            'payment_method': guest.payment_method,
            'total_guesses': total_guesses,
            'amount_owed': amount_owed,
            'total_paid': total_paid,
            'payment_status': payment_status
        })
    
    return jsonify(guests_data)

@api.route('/events/<int:event_id>/guests/<int:user_id>', methods=['GET'])
@login_required
def get_guest_details(event_id, user_id):
    event = Event.query.get_or_404(event_id)
    user = User.query.get_or_404(user_id)
    
    # Ensure only the host can view guest details
    if current_user.id != event.host_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Ensure the user is a guest of this event
    if user not in event.guests:
        return jsonify({'error': 'User is not a guest of this event'}), 400
    
    # Get all guesses
    date_guesses = DateGuess.query.filter_by(user_id=user.id, event_id=event_id).all()
    hour_guesses = HourGuess.query.filter_by(user_id=user.id, event_id=event_id).all()
    minute_guesses = MinuteGuess.query.filter_by(user_id=user.id, event_id=event_id).all()
    name_guesses = NameGuess.query.filter_by(user_id=user.id, event_id=event_id).all()
    
    # Calculate amount owed
    total_guesses = len(date_guesses) + len(hour_guesses) + len(minute_guesses) + len(name_guesses)
    amount_owed = total_guesses * event.guess_price
    
    # Get payments
    payments = Payment.query.filter_by(user_id=user.id, event_id=event_id).all()
    total_paid = sum(payment.amount for payment in payments)
    
    payment_status = 'paid' if total_paid >= amount_owed else 'pending'
    if 0 < total_paid < amount_owed:
        payment_status = 'partial'
    
    # Format guesses
    date_guesses_data = [{'id': g.id, 'date': g.guess_date.strftime('%Y-%m-%d')} for g in date_guesses]
    hour_guesses_data = [{'id': g.id, 'hour': g.hour, 'am_pm': g.am_pm} for g in hour_guesses]
    minute_guesses_data = [{'id': g.id, 'minute': g.minute} for g in minute_guesses]
    name_guesses_data = [{'id': g.id, 'name': g.name} for g in name_guesses]
    
    payments_data = [{'id': p.id, 'amount': p.amount, 'status': p.status} for p in payments]
    
    return jsonify({
        'id': user.id,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'nickname': user.nickname,
        'phone': user.phone,
        'payment_method': user.payment_method,
        'total_guesses': total_guesses,
        'amount_owed': amount_owed,
        'total_paid': total_paid,
        'payment_status': payment_status,
        'date_guesses': date_guesses_data,
        'hour_guesses': hour_guesses_data,
        'minute_guesses': minute_guesses_data,
        'name_guesses': name_guesses_data,
        'payments': payments_data
    })

@api.route('/events/<int:event_id>/guests/<int:user_id>/payment', methods=['POST'])
@login_required
def update_guest_payment(event_id, user_id):
    event = Event.query.get_or_404(event_id)
    user = User.query.get_or_404(user_id)
    
    # Ensure only the host can update payments
    if current_user.id != event.host_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.json
    action = data.get('action')
    
    if action == 'mark_paid':
        # Calculate how much is owed
        amount_owed = calculate_amount_owed(user.id, event_id, event.guess_price)
        # Add a new payment for the full amount
        payment = Payment(
            user_id=user.id,
            event_id=event_id,
            amount=amount_owed,
            status='paid'
        )
        db.session.add(payment)
        db.session.commit()
        
        return jsonify({'message': 'Payment marked as paid'})
    
    elif action == 'mark_unpaid':
        # Delete all payments for this user in this event
        Payment.query.filter_by(user_id=user.id, event_id=event_id).delete()
        db.session.commit()
        
        return jsonify({'message': 'Payment marked as unpaid'})
    
    elif action == 'add_payment':
        amount = data.get('amount')
        if not amount or amount <= 0:
            return jsonify({'error': 'Valid amount is required'}), 400
        
        payment = Payment(
            user_id=user.id,
            event_id=event_id,
            amount=amount,
            status='paid'
        )
        db.session.add(payment)
        db.session.commit()
        
        return jsonify({'message': 'Payment added successfully'})
    
    return jsonify({'error': 'Invalid action'}), 400

@api.route('/events/<int:event_id>/guests/<int:user_id>', methods=['DELETE'])
@login_required
def remove_guest(event_id, user_id):
    event = Event.query.get_or_404(event_id)
    user = User.query.get_or_404(user_id)
    
    # Ensure only the host can remove guests
    if current_user.id != event.host_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Check if user has any guesses
    has_guesses = (
        DateGuess.query.filter_by(user_id=user.id, event_id=event_id).first() or
        HourGuess.query.filter_by(user_id=user.id, event_id=event_id).first() or
        MinuteGuess.query.filter_by(user_id=user.id, event_id=event_id).first() or
        NameGuess.query.filter_by(user_id=user.id, event_id=event_id).first()
    )
    
    # Only allow deletion if the user has no guesses
    if has_guesses:
        return jsonify({'error': 'Cannot remove guest with existing guesses'}), 400
    
    # Remove user from event guests
    event.guests.remove(user)
    db.session.commit()
    
    return jsonify({'message': 'Guest removed successfully'})

# Guess routes
@api.route('/events/<int:event_id>/guesses/date', methods=['GET'])
@jwt_required(optional=True)
def get_date_guesses(event_id):
    event = Event.query.get_or_404(event_id)
    
    # Get current user from JWT if available
    current_jwt_user = get_user_from_jwt()
    
    guesses = DateGuess.query.filter_by(event_id=event_id).all()
    
    guesses_data = []
    for guess in guesses:
        user = User.query.get(guess.user_id)
        
        # Calculate payment status
        amount_owed = calculate_amount_owed(user.id, event_id, event.guess_price)
        payments = Payment.query.filter_by(user_id=user.id, event_id=event_id).all()
        total_paid = sum(payment.amount for payment in payments)
        
        payment_status = 'paid' if total_paid >= amount_owed else 'pending'
        
        # Check if this guess belongs to the current user
        is_current_user = False
        if current_jwt_user and current_jwt_user.id == user.id:
            is_current_user = True
        elif current_user.is_authenticated and current_user.id == user.id:
            is_current_user = True
        
        guesses_data.append({
            'id': guess.id,
            'date': guess.guess_date.strftime('%Y-%m-%d'),
            'user': {
                'id': user.id,
                'display_name': user.get_display_name()
            },
            'payment_status': payment_status,
            'is_current_user': is_current_user
        })
    
    return jsonify(guesses_data)

@api.route('/events/<int:event_id>/guesses/date', methods=['POST'])
@jwt_required()
def create_date_guess(event_id):
    # Get user from JWT
    user = get_user_from_jwt()
    if not user:
        return jsonify({'error': 'User not found'}), 401
    
    event = Event.query.get_or_404(event_id)
    
    # Ensure the user is a guest of this event
    if user not in event.guests and user.id != event.host_id:
        # Add the user as a guest if they're not already
        event.guests.append(user)
        db.session.commit()
    
    data = request.json
    guess_date = data.get('guess_date') or data.get('date')  # Support both parameter names
    
    if not guess_date:
        return jsonify({'error': 'Date is required'}), 400
    
    try:
        # Parse the date
        date_obj = datetime.strptime(guess_date, '%Y-%m-%d').date()
        
        # Check if the user already has a guess for this date
        existing_guess = DateGuess.query.filter_by(
            user_id=user.id,
            event_id=event_id,
            guess_date=date_obj
        ).first()
        
        if existing_guess:
            return jsonify({'error': 'You have already guessed this date'}), 400
        
        # Check if the date is already taken by another user
        taken_guess = DateGuess.query.filter_by(
            event_id=event_id,
            guess_date=date_obj
        ).first()
        
        if taken_guess:
            guess_user = User.query.get(taken_guess.user_id)
            return jsonify({'error': f'This date is already taken by {guess_user.get_display_name()}'}), 400
        
        # Create the new guess
        new_guess = DateGuess(
            user_id=user.id,
            event_id=event_id,
            guess_date=date_obj
        )
        
        db.session.add(new_guess)
        db.session.commit()
        
        return jsonify({'message': 'Date guess created successfully', 'id': new_guess.id}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@api.route('/events/<int:event_id>/guesses/hour', methods=['GET'])
@jwt_required(optional=True)
def get_hour_guesses(event_id):
    event = Event.query.get_or_404(event_id)
    
    # Get current user from JWT if available
    current_jwt_user = get_user_from_jwt()
    
    guesses = HourGuess.query.filter_by(event_id=event_id).all()
    
    guesses_data = []
    for guess in guesses:
        user = User.query.get(guess.user_id)
        
        # Calculate payment status
        amount_owed = calculate_amount_owed(user.id, event_id, event.guess_price)
        payments = Payment.query.filter_by(user_id=user.id, event_id=event_id).all()
        total_paid = sum(payment.amount for payment in payments)
        
        payment_status = 'paid' if total_paid >= amount_owed else 'pending'
        
        # Check if this guess belongs to the current user
        is_current_user = False
        if current_jwt_user and current_jwt_user.id == user.id:
            is_current_user = True
        elif current_user.is_authenticated and current_user.id == user.id:
            is_current_user = True
        
        guesses_data.append({
            'id': guess.id,
            'hour': guess.hour,
            'am_pm': guess.am_pm,
            'user': {
                'id': user.id,
                'display_name': user.get_display_name()
            },
            'payment_status': payment_status,
            'is_current_user': is_current_user
        })
    
    return jsonify(guesses_data)

@api.route('/events/<int:event_id>/guesses/hour', methods=['POST'])
@jwt_required()
def create_hour_guess(event_id):
    # Get user from JWT
    user = get_user_from_jwt()
    if not user:
        return jsonify({'error': 'User not found'}), 401
    
    event = Event.query.get_or_404(event_id)
    
    # Ensure the user is a guest of this event
    if user not in event.guests and user.id != event.host_id:
        # Add the user as a guest if they're not already
        event.guests.append(user)
        db.session.commit()
    
    data = request.json
    hour = data.get('hour')
    am_pm = data.get('am_pm')
    
    if hour is None or not am_pm:
        return jsonify({'error': 'Hour and AM/PM are required'}), 400
    
    # Validate hour (1-12)
    if not (1 <= hour <= 12):
        return jsonify({'error': 'Hour must be between 1 and 12'}), 400
    
    # Validate AM/PM
    if am_pm not in ['AM', 'PM']:
        return jsonify({'error': 'AM/PM must be either "AM" or "PM"'}), 400
    
    try:
        # Check if the user already has a guess for this hour
        existing_guess = HourGuess.query.filter_by(
            user_id=user.id,
            event_id=event_id,
            hour=hour,
            am_pm=am_pm
        ).first()
        
        if existing_guess:
            return jsonify({'error': 'You have already guessed this hour'}), 400
        
        # Check if the hour is already taken by another user
        taken_guess = HourGuess.query.filter_by(
            event_id=event_id,
            hour=hour,
            am_pm=am_pm
        ).first()
        
        if taken_guess:
            guess_user = User.query.get(taken_guess.user_id)
            return jsonify({'error': f'This hour is already taken by {guess_user.get_display_name()}'}), 400
        
        # Create the new guess
        new_guess = HourGuess(
            user_id=user.id,
            event_id=event_id,
            hour=hour,
            am_pm=am_pm
        )
        
        db.session.add(new_guess)
        db.session.commit()
        
        return jsonify({'message': 'Hour guess created successfully', 'id': new_guess.id}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@api.route('/events/<int:event_id>/guesses/minute', methods=['GET'])
@jwt_required(optional=True)
def get_minute_guesses(event_id):
    event = Event.query.get_or_404(event_id)
    
    # Get current user from JWT if available
    current_jwt_user = get_user_from_jwt()
    
    guesses = MinuteGuess.query.filter_by(event_id=event_id).all()
    
    guesses_data = []
    for guess in guesses:
        user = User.query.get(guess.user_id)
        
        # Calculate payment status
        amount_owed = calculate_amount_owed(user.id, event_id, event.guess_price)
        payments = Payment.query.filter_by(user_id=user.id, event_id=event_id).all()
        total_paid = sum(payment.amount for payment in payments)
        
        payment_status = 'paid' if total_paid >= amount_owed else 'pending'
        
        # Check if this guess belongs to the current user
        is_current_user = False
        if current_jwt_user and current_jwt_user.id == user.id:
            is_current_user = True
        elif current_user.is_authenticated and current_user.id == user.id:
            is_current_user = True
        
        guesses_data.append({
            'id': guess.id,
            'minute': guess.minute,
            'user': {
                'id': user.id,
                'display_name': user.get_display_name()
            },
            'payment_status': payment_status,
            'is_current_user': is_current_user
        })
    
    return jsonify(guesses_data)

@api.route('/events/<int:event_id>/guesses/minute', methods=['POST'])
@jwt_required()
def create_minute_guess(event_id):
    # Get user from JWT
    user = get_user_from_jwt()
    if not user:
        return jsonify({'error': 'User not found'}), 401
    
    event = Event.query.get_or_404(event_id)
    
    # Ensure the user is a guest of this event
    if user not in event.guests and user.id != event.host_id:
        # Add the user as a guest if they're not already
        event.guests.append(user)
        db.session.commit()
    
    data = request.json
    minute = data.get('minute')
    
    if minute is None:
        return jsonify({'error': 'Minute is required'}), 400
    
    # Validate minute (0-59)
    if not (0 <= minute <= 59):
        return jsonify({'error': 'Minute must be between 0 and 59'}), 400
    
    try:
        # Check if the user already has a guess for this minute
        existing_guess = MinuteGuess.query.filter_by(
            user_id=user.id,
            event_id=event_id,
            minute=minute
        ).first()
        
        if existing_guess:
            return jsonify({'error': 'You have already guessed this minute'}), 400
        
        # Check if the minute is already taken by another user
        taken_guess = MinuteGuess.query.filter_by(
            event_id=event_id,
            minute=minute
        ).first()
        
        if taken_guess:
            guess_user = User.query.get(taken_guess.user_id)
            return jsonify({'error': f'This minute is already taken by {guess_user.get_display_name()}'}), 400
        
        # Create the new guess
        new_guess = MinuteGuess(
            user_id=user.id,
            event_id=event_id,
            minute=minute
        )
        
        db.session.add(new_guess)
        db.session.commit()
        
        return jsonify({'message': 'Minute guess created successfully', 'id': new_guess.id}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@api.route('/events/<int:event_id>/guesses/name', methods=['GET'])
@jwt_required(optional=True)
def get_name_guesses(event_id):
    event = Event.query.get_or_404(event_id)
    
    if not event.name_game_enabled:
        return jsonify({'error': 'Name game is not enabled for this event'}), 400
    
    # Get current user from JWT if available
    current_jwt_user = get_user_from_jwt()
    
    guesses = NameGuess.query.filter_by(event_id=event_id).all()
    
    guesses_data = []
    for guess in guesses:
        user = User.query.get(guess.user_id)
        
        # Calculate payment status
        amount_owed = calculate_amount_owed(user.id, event_id, event.guess_price)
        payments = Payment.query.filter_by(user_id=user.id, event_id=event_id).all()
        total_paid = sum(payment.amount for payment in payments)
        
        payment_status = 'paid' if total_paid >= amount_owed else 'pending'
        
        # Check if this guess belongs to the current user
        is_current_user = False
        if current_jwt_user and current_jwt_user.id == user.id:
            is_current_user = True
        elif current_user.is_authenticated and current_user.id == user.id:
            is_current_user = True
        
        guesses_data.append({
            'id': guess.id,
            'name': guess.name,
            'user': {
                'id': user.id,
                'display_name': user.get_display_name()
            },
            'payment_status': payment_status,
            'is_current_user': is_current_user
        })
    
    return jsonify(guesses_data)

@api.route('/events/<int:event_id>/guesses/name', methods=['POST'])
@jwt_required()
def create_name_guess(event_id):
    # Get user from JWT
    user = get_user_from_jwt()
    if not user:
        return jsonify({'error': 'User not found'}), 401
    
    event = Event.query.get_or_404(event_id)
    
    if not event.name_game_enabled:
        return jsonify({'error': 'Name game is not enabled for this event'}), 400
    
    # Ensure the user is a guest of this event
    if user not in event.guests and user.id != event.host_id:
        # Add the user as a guest if they're not already
        event.guests.append(user)
        db.session.commit()
    
    data = request.json
    name = data.get('name')
    
    if not name:
        return jsonify({'error': 'Name is required'}), 400
    
    try:
        # Create the new name guess
        new_guess = NameGuess(
            user_id=user.id,
            event_id=event_id,
            name=name
        )
        
        db.session.add(new_guess)
        db.session.commit()
        
        return jsonify({'message': 'Name guess created successfully', 'id': new_guess.id}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@api.route('/events/<int:event_id>/guesses/<string:guess_type>/<int:guess_id>', methods=['DELETE'])
@jwt_required()
def delete_guess(event_id, guess_type, guess_id):
    # Get user from JWT
    user = get_user_from_jwt()
    if not user:
        return jsonify({'error': 'User not found'}), 401
    
    event = Event.query.get_or_404(event_id)
    
    # Determine which model to use based on guess_type
    if guess_type == 'date':
        guess = DateGuess.query.get_or_404(guess_id)
        model_name = 'DateGuess'
    elif guess_type == 'hour':
        guess = HourGuess.query.get_or_404(guess_id)
        model_name = 'HourGuess'
    elif guess_type == 'minute':
        guess = MinuteGuess.query.get_or_404(guess_id)
        model_name = 'MinuteGuess'
    elif guess_type == 'name':
        guess = NameGuess.query.get_or_404(guess_id)
        model_name = 'NameGuess'
    else:
        return jsonify({'error': 'Invalid guess type'}), 400
    
    # Ensure the user has permission to delete this guess
    # (either they are the host or it's their own guess)
    if user.id != event.host_id and user.id != guess.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        db.session.delete(guess)
        db.session.commit()
        
        return jsonify({'message': f'{model_name} deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@api.route('/users/me', methods=['GET'])
@jwt_required()
def get_current_user():
    # Get user from JWT
    user = get_user_from_jwt()
    if not user:
        return jsonify({'error': 'User not found'}), 401
    
    return jsonify({
        'id': user.id,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'nickname': user.nickname,
        'phone': user.phone,
        'is_host': user.is_host,
        'payment_method': user.payment_method
    })

@api.route('/users/me', methods=['PUT'])
@jwt_required()
def update_current_user():
    # Get user from JWT
    user = get_user_from_jwt()
    if not user:
        return jsonify({'error': 'User not found'}), 401
    
    data = request.json
    
    try:
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'nickname' in data:
            user.nickname = data['nickname']
        if 'phone' in data:
            user.phone = data['phone']
        if 'payment_method' in data:
            user.payment_method = data['payment_method']
        
        # Host-specific fields
        if user.is_host:
            if 'venmo_username' in data:
                user.venmo_username = data['venmo_username']
            if 'venmo_phone_last4' in data:
                user.venmo_phone_last4 = data['venmo_phone_last4']
        
        db.session.commit()
        
        return jsonify({'message': 'User updated successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@api.route('/events/<int:event_id>/guesses/current', methods=['GET'])
def get_current_user_guesses(event_id):
    user = None
    
    # Try to get user from JWT if available
    try:
        verify_jwt_in_request(optional=True)
        user = get_user_from_jwt()
    except:
        # If JWT verification fails, try to use session-based authentication
        if current_user.is_authenticated:
            user = current_user
            
    if not user:
        return jsonify({'error': 'User not authenticated'}), 401
    
    event = Event.query.get_or_404(event_id)
    
    # Get all guesses for the user
    date_guess = DateGuess.query.filter_by(user_id=user.id, event_id=event_id).first()
    hour_guess = HourGuess.query.filter_by(user_id=user.id, event_id=event_id).first()
    minute_guess = MinuteGuess.query.filter_by(user_id=user.id, event_id=event_id).first()
    name_guess = NameGuess.query.filter_by(user_id=user.id, event_id=event_id).first()
    
    # Create combined time guess if both hour and minute exist
    time_guess = None
    if hour_guess and minute_guess:
        time_guess = {
            'hour': hour_guess.hour,
            'minute': minute_guess.minute,
            'am_pm': hour_guess.am_pm
        }
    
    result = {
        'date_guess': date_guess and {
            'id': date_guess.id,
            'guess_date': date_guess.guess_date.strftime('%Y-%m-%d')
        },
        'time_guess': time_guess,
        'name_guess': name_guess and {
            'id': name_guess.id,
            'name': name_guess.name
        }
    }
    
    return jsonify(result)

@api.route('/events/<int:event_id>/guesses', methods=['GET'])
def get_all_event_guesses(event_id):
    user = None
    
    # Try to get user from JWT if available
    try:
        verify_jwt_in_request(optional=True)
        user = get_user_from_jwt()
    except:
        # If JWT verification fails, try to use session-based authentication
        if current_user.is_authenticated:
            user = current_user
            
    if not user:
        return jsonify({'error': 'User not authenticated'}), 401
    
    event = Event.query.get_or_404(event_id)
    
    # Check if user is authorized (either host or guest)
    if user.id != event.host_id and user not in event.guests:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Get all guesses for the event
    date_guesses = DateGuess.query.filter_by(event_id=event_id).all()
    hour_guesses = HourGuess.query.filter_by(event_id=event_id).all()
    minute_guesses = MinuteGuess.query.filter_by(event_id=event_id).all()
    name_guesses = NameGuess.query.filter_by(event_id=event_id).all() if event.name_game_enabled else []
    
    # Format the guesses with user info
    date_guesses_data = []
    for guess in date_guesses:
        guess_user = User.query.get(guess.user_id)
        date_guesses_data.append({
            'id': guess.id,
            'guess_date': guess.guess_date.strftime('%Y-%m-%d'),
            'user_id': guess.user_id,
            'user_name': guess_user.get_display_name() if guess_user else 'Unknown User'
        })
    
    hour_guesses_data = []
    for guess in hour_guesses:
        guess_user = User.query.get(guess.user_id)
        hour_guesses_data.append({
            'id': guess.id,
            'hour': guess.hour,
            'am_pm': guess.am_pm,
            'user_id': guess.user_id,
            'user_name': guess_user.get_display_name() if guess_user else 'Unknown User'
        })
    
    minute_guesses_data = []
    for guess in minute_guesses:
        guess_user = User.query.get(guess.user_id)
        minute_guesses_data.append({
            'id': guess.id,
            'minute': guess.minute,
            'user_id': guess.user_id,
            'user_name': guess_user.get_display_name() if guess_user else 'Unknown User'
        })
    
    name_guesses_data = []
    for guess in name_guesses:
        guess_user = User.query.get(guess.user_id)
        name_guesses_data.append({
            'id': guess.id,
            'name': guess.name,
            'user_id': guess.user_id,
            'user_name': guess_user.get_display_name() if guess_user else 'Unknown User'
        })
    
    return jsonify({
        'date_guesses': date_guesses_data,
        'hour_guesses': hour_guesses_data,
        'minute_guesses': minute_guesses_data,
        'name_guesses': name_guesses_data
    })

@api.route('/events/<int:event_id>/user/guesses', methods=['GET'])
def get_user_guesses(event_id):
    user = None
    
    # Try to get user from JWT if available
    try:
        verify_jwt_in_request(optional=True)
        user = get_user_from_jwt()
    except:
        # If JWT verification fails, try to use session-based authentication
        if current_user.is_authenticated:
            user = current_user
            
    if not user:
        return jsonify({'error': 'User not authenticated'}), 401
    
    event = Event.query.get_or_404(event_id)
    
    # Ensure the user is a guest of this event or the host
    if user not in event.guests and user.id != event.host_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Get all guesses for the current user in this event
    date_guesses = DateGuess.query.filter_by(user_id=user.id, event_id=event_id).all()
    hour_guesses = HourGuess.query.filter_by(user_id=user.id, event_id=event_id).all()
    minute_guesses = MinuteGuess.query.filter_by(user_id=user.id, event_id=event_id).all()
    name_guesses = NameGuess.query.filter_by(user_id=user.id, event_id=event_id).all()
    
    # Format guesses
    date_guesses_data = [{'id': g.id, 'date': g.guess_date.strftime('%Y-%m-%d')} for g in date_guesses]
    hour_guesses_data = [{'id': g.id, 'hour': g.hour, 'am_pm': g.am_pm} for g in hour_guesses]
    minute_guesses_data = [{'id': g.id, 'minute': g.minute} for g in minute_guesses]
    name_guesses_data = [{'id': g.id, 'name': g.name} for g in name_guesses]
    
    # Calculate amount owed and paid
    total_guesses = len(date_guesses) + len(hour_guesses) + len(minute_guesses) + len(name_guesses)
    amount_owed = total_guesses * event.guess_price
    
    payments = Payment.query.filter_by(user_id=user.id, event_id=event_id).all()
    total_paid = sum(payment.amount for payment in payments)
    
    payment_status = 'paid' if total_paid >= amount_owed else 'pending'
    if 0 < total_paid < amount_owed:
        payment_status = 'partial'
    
    return jsonify({
        'date_guesses': date_guesses_data,
        'hour_guesses': hour_guesses_data,
        'minute_guesses': minute_guesses_data,
        'name_guesses': name_guesses_data,
        'total_guesses': total_guesses,
        'amount_owed': amount_owed,
        'total_paid': total_paid,
        'payment_status': payment_status,
        'guess_price': event.guess_price
    })
