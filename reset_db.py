import os
from extensions import db
from models import User
from werkzeug.security import generate_password_hash

def reset_database():
    # Configuration
    from flask import Flask
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///streamify.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize extensions
    db.init_app(app)
    
    with app.app_context():
        # Drop all tables
        db.drop_all()
        print("Dropped all tables")
        
        # Create all tables
        db.create_all()
        print("Created all tables")
        
        # Create default admin user
        admin = User(
            username='admin',
            email='admin@example.com',
            password_hash=generate_password_hash('admin123'),
            is_admin=True
        )
        db.session.add(admin)
        db.session.commit()
        print("Created default admin user")

if __name__ == '__main__':
    # Delete the existing database file if it exists
    db_file = 'instance/streamify.db'
    if os.path.exists(db_file):
        os.remove(db_file)
        print(f"Removed existing database file: {db_file}")
    
    # Ensure the instance directory exists
    os.makedirs('instance', exist_ok=True)
    
    reset_database()
    print("Database reset complete")
