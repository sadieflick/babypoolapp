from models import DateGuess, HourGuess, MinuteGuess, NameGuess, Payment
from datetime import datetime, timedelta

def calculate_amount_owed(user_id, event_id, guess_price):
    """Calculate the total amount owed by a user for an event"""
    # Count all guesses
    date_guesses = DateGuess.query.filter_by(user_id=user_id, event_id=event_id).count()
    hour_guesses = HourGuess.query.filter_by(user_id=user_id, event_id=event_id).count()
    minute_guesses = MinuteGuess.query.filter_by(user_id=user_id, event_id=event_id).count()
    name_guesses = NameGuess.query.filter_by(user_id=user_id, event_id=event_id).count()
    
    total_guesses = date_guesses + hour_guesses + minute_guesses + name_guesses
    return total_guesses * guess_price

def format_date(date_obj):
    """Format a date object as a string"""
    if not date_obj:
        return None
    return date_obj.strftime('%Y-%m-%d')

def get_date_range(due_date):
    """Get the date range for a due date (1 month before and after)"""
    if not due_date:
        return None, None
    
    start_date = due_date - timedelta(days=30)
    end_date = due_date + timedelta(days=30)
    
    return start_date, end_date

def generate_available_dates(due_date, existing_guesses):
    """Generate a list of available dates for guessing"""
    if not due_date:
        return []
    
    start_date, end_date = get_date_range(due_date)
    
    # Generate all dates in the range
    current_date = start_date
    dates = []
    while current_date <= end_date:
        dates.append({
            'date': format_date(current_date),
            'is_due_date': current_date == due_date,
            'is_available': True,
            'user': None
        })
        current_date += timedelta(days=1)
    
    # Mark dates that are already taken
    for guess in existing_guesses:
        for date_item in dates:
            if date_item['date'] == format_date(guess['date']):
                date_item['is_available'] = False
                date_item['user'] = guess['user']
                break
    
    return dates
