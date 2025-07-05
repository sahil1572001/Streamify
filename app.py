from flask import Flask
import os
from extensions import db, login_manager
from utils import import_movies_from_csv

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or 'your-secret-key-here'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///streamify.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize extensions with app
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'main.login'  # Update this to your actual login route
    
    # Initialize routes
    from routes import init_app as init_routes
    init_routes(app)
    
    # Import models to ensure they are registered with SQLAlchemy
    from models import User, Movie, WatchHistory, Watchlist, Favorite, Subscription, Payment, Notification
    
    # Create database tables and default admin user
    with app.app_context():
        db.create_all()
        # Create default admin user if no users exist
        if not User.query.first():
            from werkzeug.security import generate_password_hash
            admin = User(
                username='admin',
                email='admin@example.com',
                password_hash=generate_password_hash('admin123')
            )
            db.session.add(admin)
            db.session.commit()
        
        # Import movies if database is empty
        if not Movie.query.first():
            print("No movies found in database. Starting import...")
            try:
                import_movies_from_csv()
                print("Movie import completed successfully!")
            except Exception as e:
                print(f"Error during movie import: {e}")
                # Continue running the app even if import fails
    
    return app

# Create the Flask application
app = create_app()

# Import models after app creation to avoid circular imports
from models import User

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

if __name__ == '__main__':
    # Run the app on all network interfaces (0.0.0.0) on port 5000
    app.run(host='0.0.0.0', port=5000, debug=True)
