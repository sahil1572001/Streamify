import os
from app import create_app
from extensions import db
from models import User, Movie, Actor, MovieActor, WatchHistory, Watchlist, Favorite, Subscription, Payment, Notification

def reset_database():
    # Create app instance
    app = create_app()
    
    with app.app_context():
        print("Dropping all database tables...")
        # Drop all tables
        db.drop_all()
        print("Creating database tables...")
        # Recreate all tables
        db.create_all()
        
        # Create default admin user
        from werkzeug.security import generate_password_hash
        print("Creating default admin user...")
        admin = User(
            username='admin',
            email='admin@example.com',
            password_hash=generate_password_hash('admin123')
        )
        db.session.add(admin)
        db.session.commit()
        
        print("Database reset complete!")

if __name__ == '__main__':
    # Delete the SQLite database file if it exists
    db_file = 'instance/streamify.db'
    if os.path.exists(db_file):
        try:
            os.remove(db_file)
            print(f"Removed existing database file: {db_file}")
        except Exception as e:
            print(f"Error removing database file: {e}")
    
    # Reset the database
    reset_database()
    
    print("\nYou can now start the application. It will automatically import movies on first run.")
