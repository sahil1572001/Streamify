# This file makes the routers directory a Python package

# Import routers to make them available when importing from app.routers
from . import auth, users

# Re-export routers
__all__ = [
    'auth',
    'users'
]
