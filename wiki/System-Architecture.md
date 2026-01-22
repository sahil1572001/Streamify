# System Architecture

Comprehensive overview of Streamify's architecture and design decisions.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   React UI   │  │  React Query │  │  TailwindCSS │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              FastAPI Application                      │   │
│  │  • Authentication Middleware                          │   │
│  │  • Rate Limiting                                      │   │
│  │  • CORS Configuration                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────┐
│  Authentication  │ │    Movies    │ │   Watchlist  │
│     Router       │ │    Router    │ │    Router    │
└──────────────────┘ └──────────────┘ └──────────────┘
            │               │               │
            └───────────────┼───────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Services   │  │  Validators  │  │   Schemas    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────┐
│   PostgreSQL     │ │   Pinecone   │ │  OpenAI API  │
│   (Relational)   │ │   (Vector)   │ │ (Embeddings) │
└──────────────────┘ └──────────────┘ └──────────────┘
```

## Component Architecture

### 1. Frontend Layer

**Technology**: React 18 + TypeScript

**Key Components**:
- **Pages**: Home, Movies, Watchlist, Profile, Search
- **Components**: MovieCard, SearchBar, Navigation, Auth Forms
- **State Management**: React Query for server state
- **Styling**: Tailwind CSS + shadcn/ui components

**Responsibilities**:
- User interface rendering
- Client-side routing
- API communication
- Local state management
- Authentication token storage

### 2. API Layer (FastAPI)

**Structure**:
```
backend/app/
├── main.py              # Application entry point
├── config.py            # Configuration management
├── database.py          # Database connection
├── auth.py              # Authentication utilities
├── models/              # SQLAlchemy models
│   ├── user.py
│   ├── movie.py
│   └── watchlist.py
├── schemas/             # Pydantic schemas
│   ├── user.py
│   ├── movie.py
│   └── watchlist.py
├── routers/             # API endpoints
│   ├── auth.py
│   ├── movies.py
│   ├── watchlist.py
│   ├── search.py
│   └── user_profile.py
└── services/            # Business logic
    ├── embedding_service.py
    ├── recommendation_service.py
    └── vector_service.py
```

**Key Features**:
- RESTful API design
- JWT authentication
- Request validation (Pydantic)
- Automatic API documentation (Swagger/ReDoc)
- Async request handling
- CORS middleware

### 3. Database Layer

#### PostgreSQL (Relational Data)

**Tables**:
- `users` - User accounts and authentication
- `movies` - Movie metadata and details
- `watchlist` - User watchlist entries
- `user_profiles` - User preferences and settings

**Key Features**:
- JSONB columns for flexible attributes
- Full-text search indexes
- Foreign key constraints
- Timestamps (created_at, updated_at)

#### Pinecone (Vector Database)

**Purpose**: Semantic search and recommendations

**Index Structure**:
- **Dimensions**: 1536 (OpenAI ada-002)
- **Metric**: Cosine similarity
- **Metadata**: movie_id, title, genres, rating

**Vector Types**:
- Movie vectors (plot + metadata embeddings)
- User profile vectors (aggregated preferences)

### 4. AI/ML Layer

#### OpenAI Integration

**Model**: text-embedding-ada-002

**Use Cases**:
1. **Movie Embeddings**: Generate vectors from plot descriptions
2. **Search Queries**: Convert user queries to vectors
3. **User Profiles**: Create preference embeddings

#### Recommendation Engine

**Algorithm**:
```python
1. Extract user's watchlist movies
2. Generate user profile embedding (weighted average)
3. Query Pinecone for similar movies
4. Filter out already-watched movies
5. Rank by similarity score
6. Return top-k recommendations
```

**Fallback Strategy**:
- If Pinecone unavailable → Genre-based recommendations
- If OpenAI unavailable → Use cached embeddings
- If both unavailable → Popular movies by rating

## Data Flow

### Movie Search Flow

```
User Query
    ↓
Frontend (React)
    ↓
POST /api/search/semantic
    ↓
FastAPI Router
    ↓
Generate Query Embedding (OpenAI)
    ↓
Vector Search (Pinecone)
    ↓
Enrich with Metadata (PostgreSQL)
    ↓
Return Results
    ↓
Display in Frontend
```

### Recommendation Flow

```
User adds movie to watchlist
    ↓
POST /api/watchlist/
    ↓
Save to PostgreSQL
    ↓
Frontend requests recommendations
    ↓
POST /api/search/recommendations
    ↓
Fetch user's watchlist
    ↓
Generate user profile embedding
    ↓
Store in Pinecone (user_{user_id})
    ↓
Query similar movies
    ↓
Filter & rank results
    ↓
Return recommendations
```

### Authentication Flow

```
User Login
    ↓
POST /api/auth/login
    ↓
Validate credentials (PostgreSQL)
    ↓
Generate JWT token
    ↓
Return token to frontend
    ↓
Store in localStorage
    ↓
Include in Authorization header
    ↓
Middleware validates token
    ↓
Extract user from token
    ↓
Process request
```

## Security Architecture

### Authentication
- **JWT Tokens**: HS256 algorithm
- **Token Expiry**: 30 minutes (configurable)
- **Password Hashing**: bcrypt
- **Secure Storage**: httpOnly cookies (optional)

### Authorization
- **Role-Based Access Control (RBAC)**
- **Protected Routes**: Require valid JWT
- **User Context**: Injected via dependency

### API Security
- **CORS**: Configured allowed origins
- **Rate Limiting**: Per-user request limits
- **Input Validation**: Pydantic schemas
- **SQL Injection Protection**: SQLAlchemy ORM

## Scalability Considerations

### Horizontal Scaling
- **Stateless API**: Can run multiple instances
- **Load Balancer**: Distribute traffic
- **Database Connection Pooling**: Efficient connections

### Caching Strategy
- **Redis**: Cache frequent queries
- **Embedding Cache**: Store computed embeddings
- **API Response Cache**: Cache popular endpoints

### Performance Optimization
- **Async Operations**: Non-blocking I/O
- **Database Indexes**: Optimized queries
- **Pagination**: Limit result sets
- **Lazy Loading**: Load data on demand

## Monitoring & Observability

### Logging
- **Structured Logging**: JSON format
- **Log Levels**: DEBUG, INFO, WARNING, ERROR
- **Request Logging**: Track API calls

### Metrics
- **API Response Time**: p50, p95, p99
- **Error Rates**: 4xx, 5xx responses
- **Database Query Time**: Slow query detection
- **Vector Search Latency**: Pinecone performance

### Health Checks
- `/health` - Basic health check
- `/health/db` - Database connectivity
- `/health/vector` - Pinecone connectivity

## Deployment Architecture

### Development
```
Local Machine
├── PostgreSQL (Docker)
├── Backend (localhost:8000)
└── Frontend (localhost:3000)
```

### Production (Recommended)
```
Cloud Infrastructure
├── Load Balancer
├── API Servers (Multiple instances)
├── PostgreSQL (Managed service)
├── Pinecone (Cloud)
├── CDN (Static assets)
└── Monitoring (Prometheus/Grafana)
```

## Technology Decisions

### Why FastAPI?
- High performance (async support)
- Automatic API documentation
- Type safety with Pydantic
- Modern Python features

### Why Pinecone?
- Managed vector database
- Fast similarity search
- Scalable infrastructure
- Metadata filtering support

### Why PostgreSQL?
- Robust relational database
- JSONB support for flexibility
- Full-text search capabilities
- Strong consistency guarantees

### Why React?
- Component-based architecture
- Large ecosystem
- Excellent developer experience
- Strong TypeScript support

## Future Enhancements

- [ ] Redis caching layer
- [ ] Event-driven architecture (Kafka/Kinesis)
- [ ] Real-time updates (WebSockets)
- [ ] Multi-agent AI orchestration
- [ ] A/B testing framework
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Microservices architecture

## Related Documentation

- [Database Schema](Database-Schema.md)
- [API Design](API-Design.md)
- [Vector Database](Vector-Database.md)
- [Deployment Guide](Deployment-Guide.md)
