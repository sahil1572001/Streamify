from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.vision_board import VisionBoard
from ..models.movie import Movie
from ..schemas.vision_board import (
    VisionBoard as VisionBoardSchema,
    VisionBoardCreate,
    VisionBoardUpdate,
    VisionBoardWithMovie
)
from ..auth import get_current_user

router = APIRouter(
    prefix="/api/vision-board",
    tags=["vision-board"]
)

@router.get("/", response_model=List[VisionBoardWithMovie])
async def get_vision_board(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get user's vision board with movie details"""
    vision_board = db.query(VisionBoard).filter(
        VisionBoard.user_id == current_user.id
    ).order_by(VisionBoard.position).all()
    return vision_board

@router.post("/", response_model=VisionBoardSchema)
async def add_to_vision_board(
    item: VisionBoardCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Add a movie to vision board (must be in watchlist first)"""
    # Check if movie exists
    movie = db.query(Movie).filter(Movie.id == item.movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    # IMPORTANT: Check if movie is in user's watchlist first
    from ..models.watchlist import Watchlist
    in_watchlist = db.query(Watchlist).filter(
        Watchlist.user_id == current_user.id,
        Watchlist.movie_id == item.movie_id
    ).first()
    
    if not in_watchlist:
        raise HTTPException(
            status_code=400, 
            detail="Movie must be in your Watchlist before adding to Vision Board. Add it to Watchlist first!"
        )
    
    # Check if already in vision board
    existing = db.query(VisionBoard).filter(
        VisionBoard.user_id == current_user.id,
        VisionBoard.movie_id == item.movie_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Movie already in vision board")
    
    # Get the next position (last position + 1)
    max_position = db.query(VisionBoard).filter(
        VisionBoard.user_id == current_user.id
    ).count()
    
    db_item = VisionBoard(
        user_id=current_user.id,
        movie_id=item.movie_id,
        position=item.position if item.position is not None else max_position,
        priority=item.priority,
        notes=item.notes
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    return db_item

@router.put("/{item_id}", response_model=VisionBoardSchema)
async def update_vision_board_item(
    item_id: int,
    item_update: VisionBoardUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update vision board item (position, priority, notes)"""
    db_item = db.query(VisionBoard).filter(
        VisionBoard.id == item_id,
        VisionBoard.user_id == current_user.id
    ).first()
    
    if not db_item:
        raise HTTPException(status_code=404, detail="Vision board item not found")
    
    update_data = item_update.dict(exclude_unset=True)
    
    # If updating position, reorder other items
    if 'position' in update_data and update_data['position'] != db_item.position:
        old_position = db_item.position
        new_position = update_data['position']
        
        # Get all items for this user
        all_items = db.query(VisionBoard).filter(
            VisionBoard.user_id == current_user.id,
            VisionBoard.id != item_id
        ).order_by(VisionBoard.position).all()
        
        # Reorder positions
        if new_position < old_position:
            # Moving up - shift items down
            for other_item in all_items:
                if new_position <= other_item.position < old_position:
                    other_item.position += 1
        else:
            # Moving down - shift items up
            for other_item in all_items:
                if old_position < other_item.position <= new_position:
                    other_item.position -= 1
    
    # Update the item
    for field, value in update_data.items():
        setattr(db_item, field, value)
    
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/{item_id}")
async def remove_from_vision_board(
    item_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Remove a movie from vision board"""
    db_item = db.query(VisionBoard).filter(
        VisionBoard.id == item_id,
        VisionBoard.user_id == current_user.id
    ).first()
    
    if not db_item:
        raise HTTPException(status_code=404, detail="Vision board item not found")
    
    removed_position = db_item.position
    
    # Delete the item
    db.delete(db_item)
    
    # Reorder remaining items
    remaining_items = db.query(VisionBoard).filter(
        VisionBoard.user_id == current_user.id,
        VisionBoard.position > removed_position
    ).all()
    
    for item in remaining_items:
        item.position -= 1
    
    db.commit()
    
    return {"message": "Movie removed from vision board"}

@router.post("/reorder")
async def reorder_vision_board(
    item_ids: List[int],
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Reorder entire vision board by providing ordered list of item IDs"""
    # Verify all items belong to user
    items = db.query(VisionBoard).filter(
        VisionBoard.id.in_(item_ids),
        VisionBoard.user_id == current_user.id
    ).all()
    
    if len(items) != len(item_ids):
        raise HTTPException(status_code=400, detail="Some items not found or don't belong to user")
    
    # Update positions
    for position, item_id in enumerate(item_ids):
        item = next((i for i in items if i.id == item_id), None)
        if item:
            item.position = position
    
    db.commit()
    
    return {"message": "Vision board reordered successfully"}
