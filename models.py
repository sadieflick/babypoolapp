from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime
import random

db = SQLAlchemy()

# Association tables for many-to-many relationships
event_guests = db.Table('event_guests',
    db.Column('event_id', db.Integer, db.ForeignKey('event.id')),
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'))
)

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=True)
    password_hash = db.Column(db.String(128), nullable=True)
    first_name = db.Column(db.String(50), nullable=True)
    last_name = db.Column(db.String(50), nullable=True)
    nickname = db.Column(db.String(50), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    is_host = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    payment_method = db.Column(db.String(20), nullable=True)  # 'venmo' or 'cash'
    
    # Host-specific fields
    venmo_username = db.Column(db.String(50), nullable=True)
    venmo_phone_last4 = db.Column(db.String(4), nullable=True)
    venmo_qr_path = db.Column(db.String(255), nullable=True)
    
    # Relationships
    hosted_events = db.relationship('Event', backref='host', lazy=True)
    date_guesses = db.relationship('DateGuess', backref='user', lazy=True)
    hour_guesses = db.relationship('HourGuess', backref='user', lazy=True)
    minute_guesses = db.relationship('MinuteGuess', backref='user', lazy=True)
    name_guesses = db.relationship('NameGuess', backref='user', lazy=True)
    payments = db.relationship('Payment', backref='user', lazy=True)
    
    def __repr__(self):
        return f'<User {self.email}>'
    
    def get_full_name(self):
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.email or "Anonymous"
    
    def get_display_name(self):
        if self.nickname:
            return self.nickname
        if self.first_name:
            return f"{self.first_name} {self.last_name[0]}." if self.last_name else self.first_name
        return self.email or "Anonymous"

class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    event_code = db.Column(db.String(10), unique=True, nullable=False)
    title = db.Column(db.String(255), nullable=False)
    host_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    mother_name = db.Column(db.String(100), nullable=False)
    partner_name = db.Column(db.String(100), nullable=True)
    event_date = db.Column(db.Date, nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    baby_name = db.Column(db.String(100), nullable=True)
    baby_name_revealed = db.Column(db.Boolean, default=False)
    name_game_enabled = db.Column(db.Boolean, default=False)
    show_host_email = db.Column(db.Boolean, default=False)
    shower_link = db.Column(db.String(255), nullable=True)
    guess_price = db.Column(db.Float, default=1.0)
    image_path = db.Column(db.String(255), nullable=True)
    theme = db.Column(db.String(50), default='default')
    theme_mode = db.Column(db.String(10), default='light')  # 'light' or 'dark'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship with guests (many-to-many)
    guests = db.relationship('User', secondary=event_guests, lazy='subquery',
                            backref=db.backref('events', lazy=True))
    
    # One-to-many relationships
    date_guesses = db.relationship('DateGuess', backref='event', lazy=True, cascade="all, delete-orphan")
    hour_guesses = db.relationship('HourGuess', backref='event', lazy=True, cascade="all, delete-orphan")
    minute_guesses = db.relationship('MinuteGuess', backref='event', lazy=True, cascade="all, delete-orphan")
    name_guesses = db.relationship('NameGuess', backref='event', lazy=True, cascade="all, delete-orphan")
    payments = db.relationship('Payment', backref='event', lazy=True, cascade="all, delete-orphan")
    
    def __repr__(self):
        return f'<Event {self.title}>'
    
    @staticmethod
    def generate_event_code():
        # Generate a unique 4-digit event code
        while True:
            code = str(random.randint(1000, 9999))
            # Check if the code already exists
            if not Event.query.filter_by(event_code=code).first():
                return code

class DateGuess(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
    guess_date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Ensure unique constraint for user+event+date combination
    __table_args__ = (db.UniqueConstraint('user_id', 'event_id', 'guess_date', name='unique_date_guess'),)
    
    def __repr__(self):
        return f'<DateGuess {self.guess_date}>'

class HourGuess(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
    hour = db.Column(db.Integer, nullable=False)  # 0-23
    am_pm = db.Column(db.String(2), nullable=False)  # 'AM' or 'PM'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Ensure unique constraint for user+event+hour combination
    __table_args__ = (db.UniqueConstraint('user_id', 'event_id', 'hour', 'am_pm', name='unique_hour_guess'),)
    
    def __repr__(self):
        return f'<HourGuess {self.hour} {self.am_pm}>'

class MinuteGuess(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
    minute = db.Column(db.Integer, nullable=False)  # 0-59
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Ensure unique constraint for user+event+minute combination
    __table_args__ = (db.UniqueConstraint('user_id', 'event_id', 'minute', name='unique_minute_guess'),)
    
    def __repr__(self):
        return f'<MinuteGuess {self.minute}>'

class NameGuess(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<NameGuess {self.name}>'

class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending')  # 'pending', 'paid'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Payment {self.amount}>'
