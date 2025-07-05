import os
from datetime import datetime
from werkzeug.security import generate_password_hash

# Initialize SQLAlchemy directly
from extensions import db
from models import User, Movie, Actor, MovieActor, WatchHistory, Watchlist, Favorite, Subscription, Payment, Notification

def reset_database():
    # Delete the database file if it exists
    db_file = 'instance/streamify.db'
    if os.path.exists(db_file):
        try:
            os.remove(db_file)
            print(f"Removed existing database file: {db_file}")
        except Exception as e:
            print(f"Error removing database file: {e}")
    
    # Create all tables
    print("Creating database tables...")
    db.create_all()
    
    # Create default admin user
    print("Creating default admin user...")
    admin = User(
        username='admin',
        email='admin@example.com',
        password_hash=generate_password_hash('admin123')
    )
    db.session.add(admin)
    db.session.commit()
    
    print("\nDatabase reset complete!")
    print("You can now start the application. It will automatically import movies on first run.")

if __name__ == '__main__':
    # Initialize the app with just the database configuration
    from flask import Flask
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///streamify.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize extensions with minimal configuration
    db.init_app(app)
    
    # Create app context and run the reset
    with app.app_context():
        reset_database()
