from app import app, db
from models import User

with app.app_context():
    print('Current users in database:')
    for user in User.query.all():
        print(f'ID: {user.id}, Email: {user.email}, Is Host: {user.is_host}, First Name: {user.first_name}')