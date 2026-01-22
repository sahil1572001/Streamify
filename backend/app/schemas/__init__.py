# This file makes the schemas directory a Python package

# Import schemas to make them available when importing from app.schemas
from . import auth as auth_schemas

# Re-export schemas
from .auth import (
    Token,
    TokenData,
    UserBase,
    UserCreate,
    UserLogin,
    UserResponse
)

__all__ = [
    'Token',
    'TokenData',
    'UserBase',
    'UserCreate',
    'UserLogin',
    'UserResponse',
    'auth_schemas'
]
