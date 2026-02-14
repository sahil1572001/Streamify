# 🎬 Vision Board Feature Documentation

## Overview

The **Vision Board** is a beautiful, modern feature that allows users to organize and plan their movie-watching journey. Unlike a simple watchlist, the Vision Board lets users:

- **Order movies** in their preferred watch sequence
- **Set priorities** (Must Watch, Soon, Someday)
- **Add personal notes** about why they want to watch each movie
- **Visualize their movie marathon** with stunning UI

---

## ✨ Features

### 🎨 Modern UI Design

#### Grid View
- **Card-based layout** with movie posters
- **Position badges** showing watch order (#1, #2, etc.)
- **Priority indicators** with color-coded gradients:
  - 🔥 **Red** - Must Watch (High Priority)
  - ⭐ **Yellow** - Soon (Medium Priority)
  - ⏰ **Green** - Someday (Low Priority)
- **Gradient overlays** for better text readability
- **Rating and year** displayed on each card

#### List View
- **Detailed list format** with larger movie info
- **Numbered positions** for easy tracking
- **Genre tags** for quick reference
- **Priority icons** (flame, star, clock)
- **Smooth gradients** and modern styling

### 🎯 Key Functionality

1. **Add Movies to Vision Board**
   - Select movies from browse/search
   - Set initial priority
   - Add personal notes

2. **Reorder Movies**
   - Drag and drop (future enhancement)
   - Manual position updates
   - Automatic reordering of other items

3. **Priority Management**
   - High (Must Watch) - Red gradient
   - Medium (Soon) - Yellow gradient
   - Low (Someday) - Green gradient

4. **View Modes**
   - Toggle between Grid and List views
   - Refresh to sync with backend
   - Empty state with call-to-action

---

## 🔧 Technical Implementation

### Frontend (`vision-board.tsx`)

**Location:** `streamify-frontend/app/(tabs)/vision-board.tsx`

**Key Components:**
- Grid view with 2-column layout
- List view with detailed information
- Priority color system with LinearGradient
- Authentication handling with token expiration
- Responsive design for mobile and web

**API Integration:**
```typescript
GET  /api/vision-board/     - Fetch user's vision board
POST /api/vision-board/     - Add movie to vision board
PUT  /api/vision-board/:id  - Update position/priority/notes
DELETE /api/vision-board/:id - Remove from vision board
POST /api/vision-board/reorder - Reorder entire board
```

### Backend API (`vision_board.py`)

**Location:** `backend/app/routers/vision_board.py`

**Endpoints:**

1. **GET /api/vision-board/**
   - Returns user's vision board with movie details
   - Sorted by position
   - Requires authentication

2. **POST /api/vision-board/**
   - Add movie to vision board
   - Auto-assigns next position
   - Validates movie exists
   - Prevents duplicates

3. **PUT /api/vision-board/{item_id}**
   - Update position, priority, or notes
   - Auto-reorders other items when position changes
   - Maintains sequence integrity

4. **DELETE /api/vision-board/{item_id}**
   - Remove movie from vision board
   - Reorders remaining items
   - Maintains position sequence

5. **POST /api/vision-board/reorder**
   - Bulk reorder operation
   - Accepts array of item IDs in new order
   - Updates all positions atomically

### Database Model (`vision_board.py`)

**Location:** `backend/app/models/vision_board.py`

**Schema:**
```sql
CREATE TABLE vision_board (
    id INTEGER PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    priority VARCHAR NOT NULL DEFAULT 'medium',
    notes TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `id` - Primary key
- `user_id` - Foreign key to users table
- `movie_id` - Foreign key to movies table
- `position` - Order in the vision board (0-indexed)
- `priority` - 'high', 'medium', or 'low'
- `notes` - Optional personal notes
- `added_at` - Timestamp when added

---

## 🚀 Usage

### For Users

1. **Navigate to Vision Board Tab**
   - Click the 🎬 Film icon in the bottom navigation

2. **Add Movies**
   - Browse movies on Home tab
   - Click "Add to Vision Board" button
   - Set priority and add notes (optional)

3. **Organize Your List**
   - View in Grid or List mode
   - Reorder movies by updating position
   - Change priorities as needed
   - Add/edit notes for each movie

4. **Start Watching**
   - Follow your planned order
   - Remove movies as you watch them
   - Keep your board updated

### For Developers

**Setup:**
```bash
# Backend - Table already created
cd backend
python create_vision_board_table.py

# Frontend - Already integrated
cd streamify-frontend
npm start
```

**Adding Vision Board Button to Movie Cards:**
```typescript
import axios from 'axios';
import { authService } from '../../services/authService';
import { API_CONFIG } from '../../config/api';

const addToVisionBoard = async (movieId: number) => {
  const token = await authService.getToken();
  await axios.post(
    `${API_CONFIG.BASE_URL}/api/vision-board/`,
    {
      movie_id: movieId,
      priority: 'medium',
      notes: ''
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};
```

---

## 🎨 Design Highlights

### Color Palette
- **Background:** Pure black (#000) with dark gradients
- **Cards:** Dark gray (#1a1a1a) with subtle gradients
- **Text:** White (#fff) with gray accents (#888)
- **Priority Colors:**
  - High: #FF6B6B → #EE5A6F (Red gradient)
  - Medium: #FFD93D → #F6C744 (Yellow gradient)
  - Low: #6BCF7F → #51B96B (Green gradient)

### Typography
- **Header:** 32px bold, white
- **Subtitle:** 16px regular, gray
- **Movie Titles:** 16-18px bold, white
- **Meta Info:** 12-14px, gray/white

### Spacing & Layout
- **Grid:** 2 columns with 16px padding
- **Cards:** 16px border radius, 8px shadows
- **Gaps:** 12-16px between elements
- **Padding:** 20px screen edges, 12px card interiors

---

## 🔮 Future Enhancements

1. **Drag & Drop Reordering**
   - Touch-friendly drag handles
   - Visual feedback during drag
   - Smooth animations

2. **Collaborative Boards**
   - Share vision boards with friends
   - Group movie planning
   - Voting on next movie

3. **Smart Suggestions**
   - AI-powered watch order recommendations
   - Mood-based sequencing
   - Genre balancing

4. **Progress Tracking**
   - Mark movies as watched
   - Track completion percentage
   - Watch history integration

5. **Export & Share**
   - Generate shareable links
   - Export as image/PDF
   - Social media integration

---

## 📊 API Response Examples

### Get Vision Board
```json
[
  {
    "id": 1,
    "user_id": 3,
    "movie_id": 100,
    "position": 0,
    "priority": "high",
    "notes": "Been wanting to watch this forever!",
    "added_at": "2026-01-28T22:00:00Z",
    "movie": {
      "id": 100,
      "title": "The Shawshank Redemption",
      "poster_url": "https://...",
      "rating": 9.3,
      "genres": ["Drama"],
      "release_year": 1994
    }
  }
]
```

### Add to Vision Board
```json
{
  "movie_id": 150,
  "priority": "medium",
  "notes": "Recommended by friend"
}
```

---

## 🐛 Troubleshooting

### Vision Board Empty
- **Check authentication:** Token may be expired
- **Sign in again** to get fresh token
- **Refresh the page** after signing in

### Can't Add Movies
- **Verify movie exists** in database
- **Check for duplicates** - can't add same movie twice
- **Ensure authenticated** - requires valid token

### Position Not Updating
- **Backend handles reordering** automatically
- **Refresh vision board** to see changes
- **Check console logs** for errors

---

## 📝 Notes

- Vision Board is **user-specific** - each user has their own board
- **Position is 0-indexed** but displayed as 1-indexed (#1, #2, etc.)
- **Deleting a movie** automatically reorders remaining items
- **Priority changes** don't affect position
- **Notes are optional** but enhance the planning experience

---

**Created:** January 28, 2026  
**Status:** ✅ Fully Implemented  
**Version:** 1.0.0
