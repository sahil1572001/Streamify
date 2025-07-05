# Streamify Backend Documentation

## Overview
This document provides a comprehensive guide to the Streamify backend, which is built with Python Flask and SQLAlchemy. The backend provides a RESTful API for the Streamify OTT platform, handling user authentication, movie management, recommendations, and more.

## Table of Contents
1. [Project Structure](#project-structure)
2. [Database Models](#database-models)
3. [API Endpoints](#api-endpoints)
4. [Recommendation System](#recommendation-system)
5. [Authentication](#authentication)
6. [Setup & Configuration](#setup--configuration)
7. [Mobile Integration](#mobile-integration)

## Project Structure

```
OTT_Backup/
├── app.py                 # Main application entry point
├── models.py             # Database models
├── recommendation.py     # Movie recommendation engine
├── import_movies.py      # Script to import movies into the database
├── requirements.txt      # Python dependencies
├── routes/
│   ├── __init__.py      # Route initialization
│   └── main_routes.py   # Main API routes
└── utils/
    └── movie_importer.py # Utility for importing movies
```

## Database Models

### User
- **Fields**: id, username, email, password_hash, join_date, is_admin
- **Relationships**:
  - watch_history: Tracks movies watched by the user
  - watchlist: Movies saved to watch later
  - favorites: User's favorite movies
  - subscriptions: User's subscription details
  - payments: Payment history
  - notifications: User notifications

### Movie
- **Fields**: id, title, description, release_year, genre, rating, poster_url, banner_url, video_url, duration, language
- **Relationships**:
  - watch_history: Tracks which users watched this movie
  - watchlist: Users who added this to their watchlist
  - favorites: Users who favorited this movie
  - actors: Cast members in the movie

### WatchHistory
Tracks user viewing history with progress tracking.
- **Fields**: id, user_id, movie_id, watched_at, progress (in seconds)

### Watchlist
User's saved movies to watch later.
- **Fields**: id, user_id, movie_id, added_at

### Favorite
User's favorited movies.
- **Fields**: id, user_id, movie_id, added_at

### Subscription
User subscription details.
- **Fields**: id, user_id, plan, start_date, end_date, is_active, auto_renew

## API Endpoints

### Movies
- `GET /movies` - List all movies with filtering and pagination
  - Query params: page, genre, sort (rating_asc, rating_desc, title_asc, title_desc, year_asc, year_desc)
  - Returns: Paginated list of movies

- `GET /movies/<int:movie_id>` - Get movie details
  - Returns: Detailed movie information including cast and similar movies

- `GET /search` - Search for movies
  - Query params: q (search query)
  - Returns: Matching movies

### User
- `POST /login` - User login
- `POST /register` - Create new user account
- `GET /profile` - Get user profile
- `GET /watchlist` - Get user's watchlist
- `POST /watchlist/<int:movie_id>` - Add to watchlist
- `DELETE /watchlist/<int:movie_id>` - Remove from watchlist

## Recommendation System

The recommendation system suggests movies based on:
- Content-based filtering (movie features like genre, cast, crew)
- User's watch history and preferences

Key functions in `recommendation.py`:
- `load_data()`: Loads and processes movie data
- `build_recommendation_model()`: Creates the recommendation model
- `get_movie_recommendations(movie_title, limit=10)`: Gets similar movies
- `get_user_recommendations(user_id)`: Gets personalized recommendations for a user

## Authentication

- Uses Flask-Login for session management
- JWT tokens for API authentication
- Password hashing with Werkzeug's security utilities

## Setup & Configuration

1. **Prerequisites**
   - Python 3.8+
   - SQLite (or another database of choice)
   - Required packages: `flask`, `flask-sqlalchemy`, `flask-login`, `pandas`, `numpy`, `scikit-learn`

2. **Installation**
   ```bash
   # Clone the repository
   git clone <repository-url>
   cd Streamify/OTT_Backup
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Initialize the database
   python -c "from app import create_app; app = create_app(); app.app_context().push()"
   
   # Import sample movies
   python import_movies.py
   ```

3. **Environment Variables**
   Create a `.env` file:
   ```
   SECRET_KEY=your-secret-key
   DATABASE_URL=sqlite:///streamify.db
   TMDB_API_KEY=your-tmdb-api-key
   ```

4. **Running the Server**
   ```bash
   python app.py
   ```
   The API will be available at `http://localhost:5000`

## Mobile Integration

### API Base URL
```
http://<your-server-ip>:5000/api
```

### Authentication Flow
1. Register a new user or login to get an access token
2. Include the token in the `Authorization` header for authenticated requests

### Example API Calls

**Login**
```http
POST /api/login
Content-Type: application/json

{
  "username": "user123",
  "password": "securepassword"
}
```

**Get Movie Recommendations**
```http
GET /api/recommendations
Authorization: Bearer <token>
```

**Add to Watchlist**
```http
POST /api/watchlist/123
Authorization: Bearer <token>
```

### Error Handling
- 401 Unauthorized: Invalid or missing authentication token
- 404 Not Found: Requested resource not found
- 400 Bad Request: Invalid request data
- 500 Internal Server Error: Server error

## Troubleshooting

- **Database Issues**: Ensure the database file has proper write permissions
- **Import Errors**: Make sure all dependencies are installed
- **CORS Errors**: Configure CORS headers if accessing from a different domain

## Next Steps

1. Implement rate limiting
2. Add more robust error handling
3. Enhance recommendation algorithm with collaborative filtering
4. Add API versioning
5. Implement caching for better performance
