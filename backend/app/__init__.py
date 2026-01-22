# This file makes the app directory a Python package

# Import models to ensure they are registered with SQLAlchemy
from . import models

# Import schemas to make them available at the package level
from .schemas import auth as auth_schemas

# Re-export commonly used items
__all__ = [
    'models',
    'schemas',
    'auth',
    'config',
    'database',
    'routers'
]
