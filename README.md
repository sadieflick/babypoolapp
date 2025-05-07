# Baby Pool - Baby Shower Event App

A full-stack application for creating and managing baby shower prediction pools, allowing hosts to create events and guests to make guesses about baby details like birth date, time, and name.

## Overview

Baby Pool is a responsive, mobile-first web application built with Flask backend and React frontend, designed to make baby shower events more interactive and engaging. The application allows hosts to create customized baby shower events where guests can participate by making predictions about the baby's birth details.

### Core Features

1. **User Authentication**
   - Email/password authentication
   - Google OAuth integration
   - Separate host and guest roles
   - Persistent login sessions

2. **Event Management**
   - Create baby shower events with customizable details
   - Multi-step event creation process
   - Image uploads for event customization
   - Theme selection and customization
   - Guest management and invitations

3. **Guessing Games**
   - Birth date prediction
   - Birth time prediction (hour and minute)
   - Baby name prediction (optional)

4. **Payment Integration**
   - Optional payment tracking for guesses
   - Venmo integration via QR code uploads (not API integration)
   - Payment status management

5. **Dashboard and Analytics**
   - Host dashboard for event management
   - Visual representations of guesses
   - Winner determination and notification

## User Stories

### Host Experience

1. **Registration and Login**
   - As a host, I can register with my email, password, and personal details
   - As a host, I can log in with my email and password
   - As a host, I can log in with my Google account
   - As a host, I remain logged in when navigating between pages
   - As a host, I can log out to end my session

2. **Event Creation**
   - As a host, I can create a new baby shower event through a multi-step form
   - As a host, I can enter basic information including mother's name, partner's name, event date, and due date
   - As a host, I can upload a custom image for the event
   - As a host, I can select and customize a theme for the event
   - As a host, I can set the price per guess (default $1)
   - As a host, I can enable/disable the name guessing game
   - As a host, I can provide my Venmo details or upload a Venmo QR code for payments

3. **Guest Management**
   - As a host, I can invite guests via email
   - As a host, I can view a list of all guests for my event
   - As a host, I can track payment status for each guest
   - As a host, I can mark payments as received
   - As a host, I can remove guests from the event

4. **Event Management**
   - As a host, I can view and edit event details
   - As a host, I can view all guesses made for my event
   - As a host, I can determine winners after the baby is born
   - As a host, I can reveal the baby's name when ready

### Guest Experience

1. **Access and Authentication**
   - As a guest, I can access an event using an event code
   - As a guest, I can create a simple account with my email and personal details
   - As a guest, I can log in with my email
   - As a guest, I can log in with my Google account
   - As a guest, I remain logged in when navigating between pages

2. **Making Guesses**
   - As a guest, I can make a prediction about the baby's birth date
   - As a guest, I can make a prediction about the birth hour (1-12, AM/PM)
   - As a guest, I can make a prediction about the birth minute (0-59)
   - As a guest, I can make a prediction about the baby's name (if enabled)
   - As a guest, I can see which dates are already chosen
   - As a guest, I can view my own guesses

3. **Payments**
   - As a guest, I can see how much I owe based on my guesses
   - As a guest, I can view the host's Venmo information or QR code
   - As a guest, I can mark that I've made a payment

4. **Results and Interaction**
   - As a guest, I can view other guests' guesses
   - As a guest, I can see if I've won after the baby is born
   - As a guest, I can view the baby's actual birth details once revealed

## Technical Documentation

### API Routes and Methods

#### Authentication Routes
```
POST /auth/host/register - Register a new host
POST /auth/host/login - Login as a host
POST /auth/guest/login - Login as a guest
POST /auth/guest/select_event - Associate guest with an event
GET /google_login - Initiate Google OAuth login
GET /google_login/callback - Google OAuth callback
GET /logout - Logout current user
PUT /auth/update_profile - Update user profile
```

#### User Routes
```
GET /api/current_user - Get current user information
PUT /api/user - Update current user
GET /api/events/:event_id/user/guesses - Get user's guesses for an event
```

#### Event Routes
```
GET /api/events - Get all events for current host
GET /api/events/:event_id - Get specific event details
POST /api/events - Create a new event
PUT /api/events/:event_id - Update event details
POST /api/events/:event_id/image - Upload event image
GET /api/events/code/:event_code - Find event by code
GET /api/events/search - Search for events by mother's name
```

#### Guest Management Routes
```
GET /api/events/:event_id/guests - Get all guests for an event
GET /api/events/:event_id/guests/:user_id - Get guest details
POST /api/events/:event_id/guests - Add a guest to an event
PUT /api/events/:event_id/guests/:user_id/payment - Update guest payment status
DELETE /api/events/:event_id/guests/:user_id - Remove a guest from an event
```

#### Guess Routes
```
GET /api/events/:event_id/guesses/date - Get all date guesses
POST /api/events/:event_id/guesses/date - Create a date guess
GET /api/events/:event_id/guesses/hour - Get all hour guesses
POST /api/events/:event_id/guesses/hour - Create an hour guess
GET /api/events/:event_id/guesses/minute - Get all minute guesses
POST /api/events/:event_id/guesses/minute - Create a minute guess
GET /api/events/:event_id/guesses/name - Get all name guesses
POST /api/events/:event_id/guesses/name - Create a name guess
DELETE /api/events/:event_id/guesses/:guess_type/:guess_id - Delete a guess
```

### Database Schema

```
User
- id: Integer (Primary Key)
- email: String (Unique)
- password_hash: String (Nullable)
- first_name: String (Nullable)
- last_name: String (Nullable)
- nickname: String (Nullable)
- phone: String (Nullable)
- is_host: Boolean
- created_at: DateTime
- payment_method: String (Nullable)
- venmo_username: String (Nullable)
- venmo_phone_last4: String (Nullable)
- venmo_qr_path: String (Nullable)

Event
- id: Integer (Primary Key)
- event_code: String (Unique)
- title: String
- host_id: Integer (Foreign Key to User)
- mother_name: String
- partner_name: String (Nullable)
- event_date: Date
- due_date: Date
- baby_name: String (Nullable)
- baby_name_revealed: Boolean
- name_game_enabled: Boolean
- show_host_email: Boolean
- shower_link: String (Nullable)
- guess_price: Float
- image_path: String (Nullable)
- theme: String
- theme_mode: String
- created_at: DateTime

DateGuess
- id: Integer (Primary Key)
- user_id: Integer (Foreign Key to User)
- event_id: Integer (Foreign Key to Event)
- guess_date: Date
- created_at: DateTime

HourGuess
- id: Integer (Primary Key)
- user_id: Integer (Foreign Key to User)
- event_id: Integer (Foreign Key to Event)
- hour: Integer
- am_pm: String
- created_at: DateTime

MinuteGuess
- id: Integer (Primary Key)
- user_id: Integer (Foreign Key to User)
- event_id: Integer (Foreign Key to Event)
- minute: Integer
- created_at: DateTime

NameGuess
- id: Integer (Primary Key)
- user_id: Integer (Foreign Key to User)
- event_id: Integer (Foreign Key to Event)
- name: String
- created_at: DateTime

Payment
- id: Integer (Primary Key)
- user_id: Integer (Foreign Key to User)
- event_id: Integer (Foreign Key to Event)
- amount: Float
- status: String
- created_at: DateTime
```

## Testing

### Backend Tests

To run backend tests:
```bash
python test_login.py
python test_login_flow.py
python test_login_persistence.py
```

### Frontend Tests

To run frontend auth tests in the browser console:
```javascript
// Load the test script
// <script src="/static/js/auth_test.js"></script>

// Run all auth tests
authTest.runAll();

// Test login form submission
testLoginForm();

// Test login persistence
checkAuthState();
```

## Technical Stack

- **Backend**: Flask with extensions (Flask-SQLAlchemy, Flask-Login, Flask-Bcrypt, Flask-WTF, Flask-CORS)
- **Database**: PostgreSQL
- **Frontend**: React, JavaScript, HTML5, CSS3
- **Authentication**: Email/password + Google OAuth integration
- **File Storage**: Local file system for image uploads
- **Payment Integration**: Venmo QR code display (no direct API integration)

## Deployment

The application is designed to be deployed on Replit and is configured for this environment. It uses the Replit database and environment variables for configuration.

## Future Enhancements

- Email notifications for invitations and winner announcements
- Social media sharing of events and results
- Additional prediction categories (weight, height, etc.)
- More payment options beyond Venmo
- Enhanced analytics and visualization of guesses