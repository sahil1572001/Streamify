# Movies API Reference

Complete API documentation for movie-related endpoints.

## Base URL

```
http://localhost:8000/api/movies
```

## Endpoints Overview

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | List all movies (paginated) | No |
| GET | `/featured` | Get featured movies | No |
| GET | `/trending` | Get trending movies | No |
| GET | `/top-rated` | Get top-rated movies | No |
| GET | `/by-genre` | Filter movies by genre | No |
| GET | `/{movie_id}` | Get movie details | No |
| POST | `/` | Create new movie | Yes (Admin) |
| PUT | `/{movie_id}` | Update movie | Yes (Admin) |
| DELETE | `/{movie_id}` | Delete movie | Yes (Admin) |

---

## Get All Movies

Retrieve a paginated list of movies with optional filters.

**Endpoint**: `GET /api/movies/`

**Query Parameters**:
- `page` (integer, default: 1) - Page number
- `page_size` (integer, default: 20, max: 100) - Items per page
- `genre` (string, optional) - Filter by genre
- `year` (integer, optional) - Filter by release year
- `search` (string, optional) - Search in movie titles

**Example Request**:
```bash
GET /api/movies/?page=1&page_size=20&genre=Action&year=2023
```

**Response**: `200 OK`
```json
{
  "movies": [
    {
      "id": 1,
      "title": "Inception",
      "description": "A thief who steals corporate secrets...",
      "release_year": 2010,
      "rating": 8.8,
      "duration_minutes": 148,
      "poster_url": "https://example.com/poster.jpg",
      "trailer_url": "https://youtube.com/watch?v=...",
      "genres": ["Action", "Sci-Fi", "Thriller"],
      "cast": ["Leonardo DiCaprio", "Joseph Gordon-Levitt"],
      "director": "Christopher Nolan",
      "language": "English",
      "country": "USA",
      "popularity_score": 95.5,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "page_size": 20
}
```

---

## Get Featured Movies

Retrieve featured/popular movies.

**Endpoint**: `GET /api/movies/featured`

**Query Parameters**:
- `limit` (integer, default: 20, max: 100) - Number of movies to return

**Example Request**:
```bash
GET /api/movies/featured?limit=10
```

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "title": "Inception",
    "description": "A thief who steals corporate secrets...",
    "rating": 8.8,
    "poster_url": "https://example.com/poster.jpg",
    "genres": ["Action", "Sci-Fi", "Thriller"],
    "popularity_score": 95.5
  }
]
```

---

## Get Trending Movies

Retrieve recently added or trending movies.

**Endpoint**: `GET /api/movies/trending`

**Query Parameters**:
- `limit` (integer, default: 20, max: 100) - Number of movies to return

**Example Request**:
```bash
GET /api/movies/trending?limit=15
```

**Response**: `200 OK`
```json
[
  {
    "id": 2,
    "title": "The Matrix",
    "description": "A computer hacker learns...",
    "rating": 8.7,
    "poster_url": "https://example.com/matrix.jpg",
    "genres": ["Action", "Sci-Fi"],
    "created_at": "2024-01-15T00:00:00Z"
  }
]
```

---

## Get Top-Rated Movies

Retrieve highest-rated movies.

**Endpoint**: `GET /api/movies/top-rated`

**Query Parameters**:
- `limit` (integer, default: 20, max: 100) - Number of movies to return

**Example Request**:
```bash
GET /api/movies/top-rated?limit=10
```

**Response**: `200 OK`
```json
[
  {
    "id": 3,
    "title": "The Shawshank Redemption",
    "description": "Two imprisoned men bond...",
    "rating": 9.3,
    "poster_url": "https://example.com/shawshank.jpg",
    "genres": ["Drama"]
  }
]
```

---

## Get Movies by Genre

Filter movies by specific genre.

**Endpoint**: `GET /api/movies/by-genre`

**Query Parameters**:
- `genre` (string, **required**) - Genre to filter by
- `limit` (integer, default: 20, max: 100) - Number of movies to return

**Example Request**:
```bash
GET /api/movies/by-genre?genre=Sci-Fi&limit=20
```

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "title": "Inception",
    "genres": ["Action", "Sci-Fi", "Thriller"],
    "rating": 8.8
  },
  {
    "id": 2,
    "title": "Interstellar",
    "genres": ["Sci-Fi", "Drama"],
    "rating": 8.6
  }
]
```

---

## Get Movie Details

Retrieve detailed information about a specific movie.

**Endpoint**: `GET /api/movies/{movie_id}`

**Path Parameters**:
- `movie_id` (integer, **required**) - Movie ID

**Example Request**:
```bash
GET /api/movies/1
```

**Response**: `200 OK`
```json
{
  "id": 1,
  "title": "Inception",
  "description": "A thief who steals corporate secrets through dream-sharing technology...",
  "release_year": 2010,
  "rating": 8.8,
  "duration_minutes": 148,
  "poster_url": "https://example.com/inception.jpg",
  "trailer_url": "https://youtube.com/watch?v=YoHD9XEInc0",
  "genres": ["Action", "Sci-Fi", "Thriller"],
  "cast": [
    "Leonardo DiCaprio",
    "Joseph Gordon-Levitt",
    "Ellen Page",
    "Tom Hardy"
  ],
  "director": "Christopher Nolan",
  "language": "English",
  "country": "USA",
  "popularity_score": 95.5,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Error Response**: `404 Not Found`
```json
{
  "detail": "Movie not found"
}
```

---

## Create Movie

Create a new movie entry (Admin only).

**Endpoint**: `POST /api/movies/`

**Authentication**: Required (JWT Bearer Token)

**Request Body**:
```json
{
  "title": "New Movie",
  "description": "An exciting new film...",
  "release_year": 2024,
  "rating": 8.5,
  "duration_minutes": 120,
  "poster_url": "https://example.com/poster.jpg",
  "trailer_url": "https://youtube.com/watch?v=...",
  "genres": ["Action", "Adventure"],
  "cast": ["Actor 1", "Actor 2"],
  "director": "Director Name",
  "language": "English",
  "country": "USA",
  "popularity_score": 85.0
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:8000/api/movies/" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Movie",
    "description": "An exciting new film...",
    "release_year": 2024,
    "rating": 8.5,
    "genres": ["Action"]
  }'
```

**Response**: `200 OK`
```json
{
  "id": 100,
  "title": "New Movie",
  "description": "An exciting new film...",
  "release_year": 2024,
  "rating": 8.5,
  "created_at": "2024-01-22T00:00:00Z"
}
```

**Error Responses**:
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `422 Unprocessable Entity` - Validation error

---

## Update Movie

Update an existing movie (Admin only).

**Endpoint**: `PUT /api/movies/{movie_id}`

**Authentication**: Required (JWT Bearer Token)

**Path Parameters**:
- `movie_id` (integer, **required**) - Movie ID

**Request Body** (all fields optional):
```json
{
  "title": "Updated Title",
  "description": "Updated description...",
  "rating": 9.0,
  "genres": ["Action", "Sci-Fi"]
}
```

**Example Request**:
```bash
curl -X PUT "http://localhost:8000/api/movies/1" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 9.0
  }'
```

**Response**: `200 OK`
```json
{
  "id": 1,
  "title": "Inception",
  "rating": 9.0,
  "updated_at": "2024-01-22T12:00:00Z"
}
```

**Error Responses**:
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Movie not found

---

## Delete Movie

Delete a movie (Admin only).

**Endpoint**: `DELETE /api/movies/{movie_id}`

**Authentication**: Required (JWT Bearer Token)

**Path Parameters**:
- `movie_id` (integer, **required**) - Movie ID

**Example Request**:
```bash
curl -X DELETE "http://localhost:8000/api/movies/1" \
  -H "Authorization: Bearer <token>"
```

**Response**: `200 OK`
```json
{
  "message": "Movie deleted successfully"
}
```

**Error Responses**:
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Movie not found

---

## Data Models

### Movie Schema

```python
{
  "id": int,                      # Unique identifier
  "title": str,                   # Movie title (required)
  "description": str,             # Plot summary (optional)
  "release_year": int,            # Release year (optional)
  "rating": float,                # Rating 0-10 (optional)
  "duration_minutes": int,        # Duration in minutes (optional)
  "poster_url": str,              # Poster image URL (optional)
  "trailer_url": str,             # Trailer video URL (optional)
  "genres": List[str],            # List of genres (optional)
  "cast": List[str],              # List of actors (optional)
  "director": str,                # Director name (optional)
  "language": str,                # Primary language (optional)
  "country": str,                 # Country of origin (optional)
  "popularity_score": float,      # Popularity metric (optional)
  "created_at": datetime,         # Creation timestamp
  "updated_at": datetime          # Last update timestamp
}
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Movie doesn't exist |
| 422 | Unprocessable Entity - Validation error |
| 500 | Internal Server Error |

---

## Rate Limiting

- **Anonymous users**: 100 requests/hour
- **Authenticated users**: 1000 requests/hour
- **Admin users**: Unlimited

---

## Related Documentation

- [Authentication API](API-Authentication.md)
- [Watchlist API](API-Watchlist.md)
- [Search API](API-Search.md)
- [Quick Start Guide](Quick-Start.md)
