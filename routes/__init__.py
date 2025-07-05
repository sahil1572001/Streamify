# This file makes the routes directory a Python package

def init_app(app):
    # Import blueprints here to avoid circular imports
    from .main_routes import main_routes
    from .api_routes import api_routes
    from .search_routes import search_routes
    
    # List of all blueprints
    blueprints = [
        main_routes,
        api_routes,
        search_routes,
        # Add other blueprints here
    ]
    
    # Register blueprints
    for blueprint in blueprints:
        app.register_blueprint(blueprint)
    
    return app
