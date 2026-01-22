# Quick Start Guide

Get Streamify up and running in 5 minutes!

## Prerequisites

Ensure you have completed the [Installation Guide](Installation-Guide.md) first.

## Step 1: Start the Backend

```bash
cd backend
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

✅ Backend running at: http://localhost:8000

## Step 2: Start the Frontend

Open a new terminal:

```bash
cd streamify-frontend
npm start
```

✅ Frontend running at: http://localhost:3000

## Step 3: Create Your First User

### Using API Docs (Swagger UI)

1. Visit: http://localhost:8000/docs
2. Navigate to **POST /api/auth/signup**
3. Click "Try it out"
4. Enter user details:

```json
{
  "email": "user@example.com",
  "username": "testuser",
  "password": "SecurePass123!",
  "full_name": "Test User"
}
```

5. Click "Execute"

### Using Frontend

1. Visit: http://localhost:3000
2. Click "Sign Up"
3. Fill in the registration form
4. Click "Create Account"

## Step 4: Login

### Get Access Token (API)

1. Go to: http://localhost:8000/docs
2. Navigate to **POST /api/auth/login**
3. Enter credentials:

```json
{
  "username": "user@example.com",
  "password": "SecurePass123!"
}
```

4. Copy the `access_token` from response
5. Click "Authorize" button (🔒 icon at top)
6. Enter: `Bearer <your-access-token>`

### Using Frontend

1. Click "Login"
2. Enter email and password
3. Click "Sign In"

## Step 5: Explore Movies

### Browse Movies

```bash
# Get all movies
GET http://localhost:8000/api/movies/

# Get featured movies
GET http://localhost:8000/api/movies/featured

# Get top-rated movies
GET http://localhost:8000/api/movies/top-rated

# Search movies
GET http://localhost:8000/api/movies/?search=inception
```

### Get Movie Details

```bash
GET http://localhost:8000/api/movies/1
```

## Step 6: Add to Watchlist

### Using API

```bash
POST http://localhost:8000/api/watchlist/
Authorization: Bearer <your-token>

{
  "movie_id": 1
}
```

### Using Frontend

1. Browse movies
2. Click "Add to Watchlist" button
3. View your watchlist in profile

## Step 7: Get Recommendations

### Using API

```bash
POST http://localhost:8000/api/search/recommendations
Authorization: Bearer <your-token>

{
  "top_k": 10
}
```

### Using Frontend

1. Navigate to "Recommendations" page
2. View personalized movie suggestions
3. Based on your watchlist and preferences

## Common API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login and get token
- `GET /api/auth/me` - Get current user info

### Movies
- `GET /api/movies/` - List all movies (paginated)
- `GET /api/movies/{id}` - Get movie details
- `GET /api/movies/featured` - Get featured movies
- `GET /api/movies/trending` - Get trending movies
- `GET /api/movies/top-rated` - Get top-rated movies
- `GET /api/movies/by-genre?genre=Action` - Filter by genre

### Watchlist
- `GET /api/watchlist/` - Get user's watchlist
- `POST /api/watchlist/` - Add movie to watchlist
- `DELETE /api/watchlist/{movie_id}` - Remove from watchlist

### Search & Recommendations
- `POST /api/search/semantic` - Semantic search
- `POST /api/search/recommendations` - Get personalized recommendations

### User Profile
- `GET /api/profile/` - Get user profile
- `PUT /api/profile/` - Update profile
- `PUT /api/profile/preferences` - Update preferences

## Testing with cURL

### Register User

```bash
curl -X POST "http://localhost:8000/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "SecurePass123!",
    "full_name": "Test User"
  }'
```

### Login

```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=SecurePass123!"
```

### Get Movies (Authenticated)

```bash
curl -X GET "http://localhost:8000/api/movies/" \
  -H "Authorization: Bearer <your-access-token>"
```

## Next Steps

- [API Documentation](API-Design.md) - Complete API reference
- [Features Guide](Recommendations.md) - Learn about AI recommendations
- [Development Guide](Development-Setup.md) - Start developing

## Troubleshooting

### Backend not starting?
- Check PostgreSQL is running
- Verify `.env` file exists with correct values
- Check port 8000 is not in use

### Frontend not loading?
- Ensure backend is running first
- Check `REACT_APP_API_URL` in frontend `.env`
- Clear browser cache

### Authentication failing?
- Verify JWT `SECRET_KEY` is set in backend `.env`
- Check token format: `Bearer <token>`
- Token expires after 30 minutes (default)

### No movies showing?
- Run seed data: `python -m app.seed_data`
- Check database connection
- Verify migrations ran: `alembic upgrade head`

## Support

Need help? Check:
- [Common Issues](Common-Issues.md)
- [FAQ](FAQ.md)
- [GitHub Issues](https://github.com/sahil1572001/streamify/issues)
