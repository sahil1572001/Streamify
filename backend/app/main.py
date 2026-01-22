from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, users, movies, watchlist, search
from .database import engine, Base, SessionLocal
from . import models
from .models import Movie

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Auto-seed database if empty
def init_db():
    """Initialize database with seed data if empty"""
    db = SessionLocal()
    try:
        movie_count = db.query(Movie).count()
        if movie_count == 0:
            print("🌱 Database is empty. Loading seed data...")
            from .seed_data import seed_movies
            seed_movies(num_pages=2)
        else:
            print(f"✓ Database already has {movie_count} movies")
    except Exception as e:
        print(f"⚠️  Could not check database: {str(e)}")
    finally:
        db.close()

init_db()

app = FastAPI(title="Streamify API",
             description="AI-Native OTT Movie Discovery Platform",
             version="1.0.0")

# CORS Middleware - MUST be added before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081", "http://127.0.0.1:8081", "http://localhost:19006"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(movies.router)
app.include_router(watchlist.router)
app.include_router(search.router)

@app.get("/")
async def root():
    return {
        "message": "Welcome to Streamify API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
