from app import app, db
from models import Event

with app.app_context():
    print('Current events in database:')
    for event in Event.query.all():
        print(f'ID: {event.id}, Title: {event.title}, Host ID: {event.host_id}, Event Code: {event.event_code}')