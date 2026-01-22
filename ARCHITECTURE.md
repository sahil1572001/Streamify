# 🎬 Streamify Architecture Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [Vector Embeddings Generation](#vector-embeddings-generation)
3. [Recommendation System Flow](#recommendation-system-flow)
4. [Semantic Search Flow](#semantic-search-flow)
5. [Data Flow Diagrams](#data-flow-diagrams)

---

## System Overview

Streamify uses **vector embeddings** and **semantic search** to provide personalized movie recommendations. The system has three main components:

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Frontend      │ ───> │    Backend      │ ───> │   Vector DB     │
│  (React Native) │ <─── │   (FastAPI)     │ <─── │   (Pinecone)    │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                 │
                                 ▼
                         ┌─────────────────┐
                         │   PostgreSQL    │
                         │   (AWS RDS)     │
                         └─────────────────┘
```

---

## Vector Embeddings Generation

### What are Vector Embeddings?

Vector embeddings convert text (movie titles, descriptions, genres) into numerical arrays that capture semantic meaning. Similar movies have similar vectors.

```
Movie: "The Dark Knight"
Text: "The Dark Knight - Action, Crime, Drama - A Batman movie..."
         ↓ (OpenAI Embedding Model)
Vector: [0.023, -0.145, 0.892, ..., 0.234]  (1536 dimensions)
```

### Movie Embedding Process

**File:** `backend/load_movie_embeddings.py`

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Fetch Movies from Database                          │
│ ─────────────────────────────────────────────────────────── │
│ SELECT * FROM movies                                        │
│ Result: 900+ movies with title, genre, description          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Create Text Representation                          │
│ ─────────────────────────────────────────────────────────── │
│ For each movie:                                             │
│   text = f"{title} - {genre} - {description}"               │
│   Example: "Inception - Sci-Fi, Thriller - A thief..."      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Generate Embeddings (OpenAI API)                    │
│ ─────────────────────────────────────────────────────────── │
│ Model: text-embedding-ada-002                               │
│ Input: Movie text                                           │
│ Output: 1536-dimensional vector                             │
│ Batch: 100 movies at a time                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Store in Pinecone Vector Database                   │
│ ─────────────────────────────────────────────────────────── │
│ Index: "streamify-movies"                                   │
│ Data stored:                                                │
│   - id: movie_id                                            │
│   - values: [embedding vector]                              │
│   - metadata: {title, genre, rating, year, etc.}            │
└─────────────────────────────────────────────────────────────┘
```

### User Profile Embedding Process

**File:** `backend/app/services/embedder.py`

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Get User's Watchlist                                │
│ ─────────────────────────────────────────────────────────── │
│ SELECT movies FROM watchlist WHERE user_id = ?              │
│ Result: List of movies user has watched                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Combine Movie Information                           │
│ ─────────────────────────────────────────────────────────── │
│ For each watched movie:                                      │
│   - Extract: title, genre, description                       │
│   - Combine into single text                                 │
│ Example: "User likes: Inception (Sci-Fi), The Matrix..."    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Generate User Profile Embedding                     │
│ ─────────────────────────────────────────────────────────── │
│ Model: text-embedding-ada-002                                │
│ Input: Combined watchlist text                               │
│ Output: 1536-dimensional user profile vector                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Store in User Database                              │
│ ─────────────────────────────────────────────────────────── │
│ UPDATE users SET profile_vector = ? WHERE id = ?            │
│ Triggered when: User adds/removes movies from watchlist     │
└─────────────────────────────────────────────────────────────┘
```

---

## Recommendation System Flow

### 🤖 "Recommended For You" Feature

**Endpoint:** `POST /api/search/recommendations`  
**File:** `backend/app/routers/search.py`

```
┌─────────────────────────────────────────────────────────────┐
│ USER OPENS HOME SCREEN                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend: Fetch Recommendations                             │
│ ─────────────────────────────────────────────────────────── │
│ File: streamify-frontend/app/(tabs)/index.tsx               │
│ Function: fetchRecommendations()                            │
│                                                             │
│ const response = await axios.post(                          │
│   `${API_URL}/api/search/recommendations`,                  │
│   { limit: 10 },                                            │
│   { headers: { Authorization: `Bearer ${token}` } }         │
│ );                                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend: Get User Profile Vector                            │
│ ─────────────────────────────────────────────────────────── │
│ 1. Authenticate user from JWT token                         │
│ 2. Fetch user.profile_vector from database                  │
│ 3. If no profile vector → return genre-based fallback       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Pinecone: Vector Similarity Search                          │
│ ─────────────────────────────────────────────────────────── │
│ Query:                                                      │
│   - vector: user.profile_vector                             │
│   - top_k: 10 (number of results)                           │
│   - include_metadata: true                                  │
│                                                             │
│ Pinecone finds movies with vectors closest to user vector   │
│ using cosine similarity                                     │
│                                                             │
│ Cosine Similarity Formula:                                  │
│   similarity = (A · B) / (||A|| × ||B||)                    │
│   Range: -1 to 1 (1 = identical, 0 = unrelated)             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend: Process Results                                    │
│ ─────────────────────────────────────────────────────────── │
│ 1. Extract movie IDs from Pinecone matches                  │
│ 2. Fetch full movie details from PostgreSQL                 │
│ 3. Filter out movies already in watchlist                   │
│ 4. Sort by similarity score (highest first)                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend: Display Recommendations                           │
│ ─────────────────────────────────────────────────────────── │
│ Render movie cards with:                                    │
│   - Poster image                                            │
│   - Title                                                   │
│   - Rating                                                  │
│   - Add to watchlist button                                 │
└─────────────────────────────────────────────────────────────┘
```

### Recommendation Update Trigger

```
USER ADDS MOVIE TO WATCHLIST
         ↓
┌─────────────────────────────────────────────────────────────┐
│ POST /api/watchlist/                                        │
│ ─────────────────────────────────────────────────────────── │
│ 1. Add movie to watchlist table                             │
│ 2. Call update_user_profile_vector()                        │
│    - Fetch all watchlist movies                             │
│    - Generate new embedding from combined text              │
│    - Calculate cosine similarity (old vs new)               │
│    - Update user.profile_vector in database                 │
│ 3. Return success                                           │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend: Refresh Recommendations                           │
│ ─────────────────────────────────────────────────────────── │
│ useFocusEffect() detects tab focus                          │
│ → Calls fetchRecommendations() again                        │
│ → New recommendations based on updated profile              │
└─────────────────────────────────────────────────────────────┘
```

---

## Semantic Search Flow

### 🔍 AI-Powered Search Feature

**Endpoint:** `POST /api/search/semantic`  
**File:** `backend/app/routers/search.py`

```
┌─────────────────────────────────────────────────────────────┐
│ USER TYPES SEARCH QUERY                                     │
│ Example: "movies about space exploration"                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend: Debouncing (800ms)                                │
│ ─────────────────────────────────────────────────────────── │
│ File: streamify-frontend/app/(tabs)/search.tsx              │
│                                                             │
│ User types: "m" → wait                                      │
│ User types: "mo" → wait                                     │
│ User types: "movies about space" → wait 800ms               │
│ No more typing → Send complete query                        │
│                                                             │
│ This prevents sending partial queries like "m", "mo", etc.  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend: Generate Query Embedding                           │
│ ─────────────────────────────────────────────────────────── │
│ Input: "movies about space exploration"                     │
│ Model: text-embedding-ada-002                               │
│ Output: 1536-dimensional query vector                       │
│                                                             │
│ This converts natural language to vector space              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Pinecone: Semantic Vector Search                            │
│ ─────────────────────────────────────────────────────────── │
│ Query:                                                      │
│   - vector: query_embedding                                 │
│   - top_k: 20 (number of results)                           │
│   - include_metadata: true                                  │
│                                                             │
│ Pinecone finds movies semantically similar to query:        │
│   ✅ "Interstellar" (space, exploration)                    │
│   ✅ "Gravity" (space, survival)                            │
│   ✅ "The Martian" (space, science)                         │
│   ❌ "The Matrix" (not about space exploration)             │
│                                                             │
│ Even though "space" isn't in the query, Pinecone            │
│ understands the semantic meaning!                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend: Fetch Full Movie Details                           │
│ ─────────────────────────────────────────────────────────── │
│ 1. Extract movie IDs from Pinecone results                  │
│ 2. Query PostgreSQL for complete movie data                 │
│ 3. Sort by similarity score                                 │
│ 4. Return JSON response                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend: Display Search Results                            │
│ ─────────────────────────────────────────────────────────── │
│ Render grid of movie cards with:                            │
│   - Poster                                                  │
│   - Title                                                   │
│   - Rating                                                  │
│   - Genre                                                   │
│   - Add to watchlist button                                 │
└─────────────────────────────────────────────────────────────┘
```

### Why Semantic Search is Powerful

**Traditional Keyword Search:**
```
Query: "space movies"
Matches: Movies with "space" in title/description
Misses: "Interstellar", "Gravity" (no "space" in title)
```

**Semantic Vector Search:**
```
Query: "space movies"
Embedding captures: exploration, astronauts, cosmos, sci-fi
Matches: 
  ✅ "Interstellar" (similar meaning)
  ✅ "Gravity" (similar theme)
  ✅ "The Martian" (similar context)
  ✅ "2001: A Space Odyssey" (exact match)
```

---

## Data Flow Diagrams

### Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         STREAMIFY SYSTEM                            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│  TMDB API       │ (External)
│  900+ Movies    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND: Data Loading (One-time Setup)                      │
│ ──────────────────────────────────────────────────────────  │
│ 1. load_tmdb_bulk.py                                        │
│    └─> Fetch movies from TMDB → Store in PostgreSQL         │
│                                                             │
│ 2. load_movie_embeddings.py                                 │
│    └─> Generate embeddings → Store in Pinecone              │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│ STORAGE LAYER                                                │
│ ───────────────────────────────────────────────────────────  │
│                                                              │
│ ┌─────────────────────┐    ┌─────────────────────┐           │
│ │ PostgreSQL (RDS)    │    │ Pinecone Vector DB  │           │
│ │ ─────────────────── │    │ ─────────────────── │           │
│ │ • Users             │    │ • Movie Embeddings  │           │
│ │ • Movies            │    │ • 1536 dimensions   │           │
│ │ • Watchlist         │    │ • Cosine similarity │           │
│ │ • Reviews           │    │ • Fast search       │           │
│ │ • Profile vectors   │    │                     │           │
│ └─────────────────────┘    └─────────────────────┘           │
└──────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌──────────────────────────────────────────────────────────────┐
│ BACKEND API (FastAPI)                                        │
│ ───────────────────────────────────────────────────────────  │
│                                                              │
│ Authentication:                                              │
│   POST /login → JWT token (24hr expiry)                      │
│                                                              │
│ Movies:                                                      │
│   GET /api/movies/featured                                   │
│   GET /api/movies/trending                                   │
│   GET /api/movies/by-genre?genre=Action                      │
│                                                              │
│ Watchlist:                                                   │
│   GET /api/watchlist/ → Get user's watchlist                 │
│   POST /api/watchlist/ → Add movie + Update profile vector   │
│   DELETE /api/watchlist/{id} → Remove + Update profile       │
│                                                              │
│ Search & Recommendations:                                    │
│   POST /api/search/semantic → AI search                      │
│   POST /api/search/recommendations → Personalized picks      │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│ FRONTEND (React Native + Expo)                               │
│ ───────────────────────────────────────────────────────────  │
│                                                              │
│ Screens:                                                     │
│   • Home: Featured, Trending, Genre sections, Recommended    │
│   • Search: AI-powered semantic search                       │
│   • Watchlist: User's saved movies                           │
│   • Profile: User info, sign out                             │
│                                                              │
│ Features:                                                    │
│   • JWT authentication                                       │
│   • Real-time recommendation updates                         │
│   • Debounced search (800ms)                                 │
│   • Auto-refresh on tab focus                                │
└──────────────────────────────────────────────────────────────┘
```

### Vector Similarity Visualization

```
How Pinecone Finds Similar Movies:

User Profile Vector (based on watchlist):
  [0.23, -0.45, 0.89, ..., 0.12]  ← User likes action sci-fi
                │
                │ Cosine Similarity Calculation
                │
                ▼
┌───────────────────────────────────────────────────────┐
│ Movie Vectors in Pinecone                             │
│                                                       │
│ "Inception"        [0.21, -0.43, 0.91, ..., 0.10]   │ ← 0.95 similarity ✅
│ "The Matrix"       [0.19, -0.41, 0.88, ..., 0.15]   │ ← 0.93 similarity ✅
│ "Interstellar"     [0.25, -0.47, 0.87, ..., 0.09]   │ ← 0.91 similarity ✅
│ "The Notebook"     [-0.45, 0.78, -0.23, ..., 0.56]  │ ← 0.12 similarity ❌
│ "Toy Story"        [-0.12, 0.34, -0.67, ..., 0.89]  │ ← 0.08 similarity ❌
└───────────────────────────────────────────────────────┘
                │
                ▼
Return top 10 most similar movies
```

---

## Key Technologies

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | React Native + Expo | Cross-platform mobile app |
| **Backend** | FastAPI (Python) | REST API server |
| **Database** | PostgreSQL (AWS RDS) | Structured data storage |
| **Vector DB** | Pinecone | Semantic search & similarity |
| **Embeddings** | OpenAI Ada-002 | Text → Vector conversion |
| **Auth** | JWT | Secure authentication |

---

## Performance Optimizations

### 1. **Batch Processing**
- Load embeddings in batches of 100 movies
- Reduces API calls to OpenAI
- Faster initial setup

### 2. **Debouncing**
- Wait 800ms before sending search query
- Prevents unnecessary API calls
- Better user experience

### 3. **Caching**
- User profile vectors stored in database
- Only regenerate when watchlist changes
- Faster recommendations

### 4. **Lazy Loading**
- Fetch recommendations only when needed
- Use `useFocusEffect` to refresh on tab focus
- Reduces initial load time

---

## Summary

**Streamify uses a three-layer architecture:**

1. **Data Layer**: PostgreSQL for structured data + Pinecone for vector search
2. **API Layer**: FastAPI handles authentication, CRUD operations, and ML queries
3. **Client Layer**: React Native provides beautiful, responsive UI

**The magic happens through:**
- **Vector embeddings** that capture semantic meaning
- **Cosine similarity** to find related content
- **Real-time updates** when user preferences change
- **AI-powered search** that understands natural language

This creates a Netflix-like experience with intelligent, personalized recommendations! 🎬✨
