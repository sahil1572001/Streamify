from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security.oauth2 import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from pydantic import BaseModel

from .. import models, schemas, auth
from ..database import get_db
from ..config import settings
from ..services.embedding_service import get_embedding_service
from ..services.pinecone_service import get_pinecone_service

router = APIRouter(tags=['Authentication'])

def create_initial_user_vector(user: models.User, db: Session):
    """
    Create initial user profile vector based on user preferences
    This is called on first login to enable personalized recommendations
    """
    try:
        embedder = get_embedding_service()
        pinecone = get_pinecone_service()
        
        # Skip if services not available
        if not embedder or not pinecone:
            print("⚠️ Vector services not configured - skipping user vector creation")
            return False
        
        # Create initial profile text from user data
        profile_parts = []
        
        # Add user name for context
        if user.full_name:
            profile_parts.append(f"User: {user.full_name}")
        
        # Add favorite genres if available
        if user.favorite_genres:
            profile_parts.append(f"Favorite genres: {', '.join(user.favorite_genres)}")
        else:
            # Default preferences for new users
            profile_parts.append("Interested in: Action, Drama, Comedy, Sci-Fi, Thriller")
        
        # Add favorite themes if available
        if user.favorite_themes:
            profile_parts.append(f"Favorite themes: {', '.join(user.favorite_themes)}")
        else:
            # Default themes
            profile_parts.append("Themes: Adventure, Romance, Mystery, Family-friendly")
        
        # Add bio if available
        if user.bio:
            profile_parts.append(f"About: {user.bio}")
        
        profile_text = ". ".join(profile_parts)
        
        # Generate embedding
        profile_embedding = embedder.generate_embedding(profile_text)
        
        # Upsert to Pinecone
        pinecone.upsert_user_profile(
            user_id=user.id,
            profile_embedding=profile_embedding,
            metadata={
                'user_id': user.id,
                'email': user.email,
                'full_name': user.full_name or '',
                'favorite_genres': user.favorite_genres or [],
                'favorite_themes': user.favorite_themes or [],
                'created_at': str(user.created_at) if hasattr(user, 'created_at') else ''
            }
        )
        
        # Update user record
        user.profile_vector_id = f"user_{user.id}"
        db.commit()
        
        return True
    except Exception as e:
        print(f"Error creating initial user vector: {str(e)}")
        raise

@router.post('/register', response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash the password
    hashed_password = auth.get_password_hash(user.password)
    
    # Create new user
    db_user = models.User(
        email=user.email,
        password=hashed_password,
        full_name=user.full_name
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@router.post('/login', response_model=schemas.Token)
def login(user_credentials: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Find user by email
    user = db.query(models.User).filter(
        models.User.email == user_credentials.username
    ).first()
    
    # Verify user exists and password is correct
    if not user or not auth.verify_password(user_credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid credentials"
        )
    
    # Create initial user profile vector if not exists
    if not user.profile_vector_id:
        try:
            create_initial_user_vector(user, db)
            print(f"✅ Created initial profile vector for user {user.id}")
        except Exception as e:
            print(f"⚠️ Failed to create initial user vector: {str(e)}")
            import traceback
            traceback.print_exc()
            # Don't fail login if vector creation fails - continue with login
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = auth.create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
