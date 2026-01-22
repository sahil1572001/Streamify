from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from ..models.watchlist import Watchlist
from ..models.movie import Movie
from ..models.user import User
from ..schemas.watchlist import Watchlist as WatchlistSchema, WatchlistCreate, WatchlistUpdate, WatchlistWithMovie
from ..auth import get_current_user
from ..services.embedding_service import get_embedding_service
from ..services.pinecone_service import get_pinecone_service

router = APIRouter(
    prefix="/api/watchlist",
    tags=["watchlist"]
)

@router.get("/", response_model=List[WatchlistWithMovie])
async def get_watchlist(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get user's watchlist with movie details"""
    watchlist = db.query(Watchlist).filter(
        Watchlist.user_id == current_user.id
    ).all()
    return watchlist

@router.post("/", response_model=WatchlistSchema)
async def add_to_watchlist(
    watchlist_item: WatchlistCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Add a movie to watchlist"""
    # Check if movie exists
    movie = db.query(Movie).filter(Movie.id == watchlist_item.movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    # Check if already in watchlist
    existing = db.query(Watchlist).filter(
        Watchlist.user_id == current_user.id,
        Watchlist.movie_id == watchlist_item.movie_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Movie already in watchlist")
    
    db_watchlist = Watchlist(
        user_id=current_user.id,
        movie_id=watchlist_item.movie_id
    )
    db.add(db_watchlist)
    db.commit()
    db.refresh(db_watchlist)
    
    # Update user profile vector based on new watchlist
    try:
        await update_user_profile_vector(current_user, db)
    except Exception as e:
        print(f"⚠️ Failed to update user vector: {str(e)}")
        # Don't fail the request if vector update fails
    
    return db_watchlist

@router.put("/{watchlist_id}", response_model=WatchlistSchema)
async def update_watchlist_item(
    watchlist_id: int,
    watchlist_update: WatchlistUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update watchlist item (mark as watched, update progress)"""
    db_watchlist = db.query(Watchlist).filter(
        Watchlist.id == watchlist_id,
        Watchlist.user_id == current_user.id
    ).first()
    
    if not db_watchlist:
        raise HTTPException(status_code=404, detail="Watchlist item not found")
    
    update_data = watchlist_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_watchlist, field, value)
    
    # If marking as watched, update watch history
    if watchlist_update.watched:
        watch_history = current_user.watch_history or []
        watch_entry = {
            "movie_id": db_watchlist.movie_id,
            "watched_at": datetime.now().isoformat()
        }
        watch_history.append(watch_entry)
        current_user.watch_history = watch_history
        db.commit()
        
        # Update user profile vector
        try:
            await update_user_profile_vector(current_user, db)
        except Exception as e:
            print(f"⚠️ Failed to update user vector: {str(e)}")
    
    db.commit()
    db.refresh(db_watchlist)
    return db_watchlist

@router.delete("/{watchlist_id}")
async def remove_from_watchlist(
    watchlist_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Remove a movie from watchlist"""
    db_watchlist = db.query(Watchlist).filter(
        Watchlist.id == watchlist_id,
        Watchlist.user_id == current_user.id
    ).first()
    
    if not db_watchlist:
        raise HTTPException(status_code=404, detail="Watchlist item not found")
    
    db.delete(db_watchlist)
    db.commit()
    
    # Update user profile vector after removal
    try:
        await update_user_profile_vector(current_user, db)
    except Exception as e:
        print(f"⚠️ Failed to update user vector: {str(e)}")
    
    return {"message": "Movie removed from watchlist"}


async def update_user_profile_vector(user: User, db: Session):
    """Update user's profile vector in Pinecone based on their watchlist"""
    try:
        embedder = get_embedding_service()
        pinecone = get_pinecone_service()
        
        # Check if services are available
        if not embedder or not pinecone:
            print(f"⚠️ Vector services not available - skipping profile update")
            return
        
        # Get user's watchlist
        watchlist_items = db.query(Watchlist).filter(
            Watchlist.user_id == user.id
        ).all()
        
        if not watchlist_items:
            print(f"⚠️ User {user.id} has no watchlist items - skipping profile update")
            return
        
        # Get movie details for watchlist
        watchlist_movie_ids = [item.movie_id for item in watchlist_items]
        watchlist_movies = db.query(Movie).filter(Movie.id.in_(watchlist_movie_ids)).all()
        
        # Prepare watched movies data
        watched_movies_data = [
            {
                'title': movie.title,
                'genres': movie.genres,
                'description': movie.description,
                'cast': movie.cast,
                'director': movie.director
            }
            for movie in watchlist_movies
        ]
        
        # Prepare preferences
        preferences = {
            'favorite_genres': user.favorite_genres or [],
            'favorite_themes': user.favorite_themes or []
        }
        
        # Log watchlist details
        print(f"\n{'='*70}")
        print(f"📊 USER PROFILE VECTOR UPDATE")
        print(f"{'='*70}")
        print(f"👤 User ID: {user.id}")
        print(f"📧 Email: {user.email}")
        print(f"📽️  Watchlist movies ({len(watchlist_items)}):")
        for movie in watchlist_movies:
            genres_str = ', '.join(movie.genres) if movie.genres else 'N/A'
            print(f"   - {movie.title} ({genres_str})")
        
        # Generate updated profile vector
        print(f"\n🔄 Generating new profile vector...")
        profile_vector = embedder.generate_user_profile_embedding(
            watched_movies=watched_movies_data,
            preferences=preferences
        )
        
        # Show vector info
        print(f"   Vector dimension: {len(profile_vector)}")
        print(f"   Vector sample (first 5 values): {[round(v, 4) for v in profile_vector[:5]]}")
        
        # Get old vector for comparison
        old_vector = pinecone.get_user_profile(user.id)
        if old_vector:
            old_vector_values = old_vector['values']
            print(f"\n📊 VECTOR COMPARISON:")
            print(f"   Old vector sample: {[round(v, 4) for v in old_vector_values[:5]]}")
            print(f"   New vector sample: {[round(v, 4) for v in profile_vector[:5]]}")
            
            # Calculate similarity
            import numpy as np
            old_arr = np.array(old_vector_values)
            new_arr = np.array(profile_vector)
            similarity = np.dot(old_arr, new_arr) / (np.linalg.norm(old_arr) * np.linalg.norm(new_arr))
            print(f"   Cosine similarity: {similarity:.4f} (1.0 = identical, 0.0 = completely different)")
        else:
            print(f"\n📊 VECTOR COMPARISON:")
            print(f"   Old vector: None (first time)")
            print(f"   New vector sample: {[round(v, 4) for v in profile_vector[:5]]}")
        
        # Upsert to Pinecone
        vector_id = f"user_{user.id}"
        pinecone.upsert_user_profile(
            user_id=user.id,
            profile_embedding=profile_vector,
            metadata={
                "user_id": user.id,
                "email": user.email,
                "watchlist_count": len(watchlist_items),
                "favorite_genres": user.favorite_genres or [],
                "updated_at": datetime.now().isoformat()
            }
        )
        
        # Update user's profile_vector_id
        user.profile_vector_id = vector_id
        db.commit()
        
        print(f"\n✅ PROFILE VECTOR UPDATED")
        print(f"   Vector ID: {vector_id}")
        print(f"   Watchlist items: {len(watchlist_items)}")
        print(f"{'='*70}\n")
        
    except Exception as e:
        print(f"❌ Error updating user profile vector: {str(e)}")
        import traceback
        traceback.print_exc()
        # Don't raise - allow watchlist operations to succeed even if vector update fails
