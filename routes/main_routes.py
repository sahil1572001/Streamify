from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, make_response
from flask_login import login_required, current_user, login_user, logout_user
from extensions import db
from models import Movie, User, WatchHistory, Watchlist, Favorite, Subscription, Payment, Notification
from recommendation import get_movie_recommendations
from datetime import datetime
from functools import wraps

# Create a Blueprint for main routes
main_routes = Blueprint('main', __name__, template_folder='../templates')

def json_response(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        result = f(*args, **kwargs)
        if request.path.startswith('/api/'):
            if isinstance(result, tuple) and isinstance(result[0], dict):
                return jsonify(result[0]), result[1] if len(result) > 1 else 200
            elif isinstance(result, dict):
                return jsonify(result)
            return jsonify({'error': 'Invalid response format'}), 500
        return result
    return wrapped

def get_popular_movies(limit=20):
    """Helper function to get popular movies"""
    return Movie.query.order_by(Movie.release_year.desc()).limit(limit).all()

# API Endpoints
@main_routes.route('/api/movies/popular')
@json_response
def api_popular_movies():
    limit = min(int(request.args.get('limit', 20)), 50)
    movies = get_popular_movies(limit)
    return {
        'success': True,
        'results': [{
            'id': m.id,
            'title': m.title,
            'overview': m.description or '',
            'release_year': m.release_year,
            'genre': m.genre,
            'rating': float(m.rating) if m.rating else 0.0,
            'poster_url': m.poster_url or '',
            'banner_url': m.banner_url or '',
            'video_url': m.video_url or ''
        } for m in movies]
    }

# Web Routes
@main_routes.route('/')
def index():
    # Get featured movies
    featured_movies = get_popular_movies(8)
    
    # Get recently added movies
    recent_movies = Movie.query.order_by(Movie.id.desc()).limit(8).all()
    
    # Get recommended movies if user is logged in
    recommended_movies = []
    if current_user.is_authenticated:
        recommended_movies = get_movie_recommendations(current_user.id)
    
    # Get movies grouped by genre for the home page
    all_movies = Movie.query.all()
    movies_by_genre = {}
    
    for movie in all_movies:
        if movie.genre:  # Only process movies with a genre
            if movie.genre not in movies_by_genre:
                movies_by_genre[movie.genre] = []
            movies_by_genre[movie.genre].append(movie)
    
    # Limit the number of movies per genre to 8
    for genre in movies_by_genre:
        movies_by_genre[genre] = movies_by_genre[genre][:8]
    
    # Check if the request wants JSON (for API)
    if request.path.startswith('/api/'):
        return {
            'featured_movies': [{'id': m.id, 'title': m.title} for m in featured_movies],
            'recent_movies': [{'id': m.id, 'title': m.title} for m in recent_movies],
            'recommended_movies': [{'id': m.id, 'title': m.title} for m in recommended_movies],
            'movies_by_genre': {
                genre: [{'id': m.id, 'title': m.title} for m in movies]
                for genre, movies in movies_by_genre.items()
            }
        }
    
    # Return HTML for web
    return render_template('index.html', 
                         featured_movies=featured_movies,
                         recent_movies=recent_movies,
                         recommended_movies=recommended_movies,
                         movies_by_genre=movies_by_genre)

# All movies route
@main_routes.route('/movies')
def all_movies():
    # Get query parameters for filtering and sorting
    page = request.args.get('page', 1, type=int)
    per_page = 12  # Number of movies per page
    selected_genre = request.args.get('genre', '')
    sort = request.args.get('sort', 'rating_desc')
    
    # Get all unique genres for the filter dropdown
    all_genres = db.session.query(Movie.genre).distinct().all()
    all_genres = [g[0] for g in all_genres if g[0]]  # Flatten and remove None values
    
    # If a specific genre is selected, show only that genre
    if selected_genre and selected_genre.lower() != 'all':
        query = Movie.query.filter(Movie.genre.ilike(f'%{selected_genre}%'))
        
        # Apply sorting
        if sort == 'rating_asc':
            query = query.order_by(Movie.rating.asc())
        elif sort == 'title_asc':
            query = query.order_by(Movie.title.asc())
        elif sort == 'title_desc':
            query = query.order_by(Movie.title.desc())
        elif sort == 'year_asc':
            query = query.order_by(Movie.release_year.asc())
        elif sort == 'year_desc':
            query = query.order_by(Movie.release_year.desc())
        else:  # Default: rating_desc
            query = query.order_by(Movie.rating.desc())
        
        # Get all movies for the selected genre
        movies = query.all()
        
        # Group by genre (will be a single genre in this case)
        movies_by_genre = {selected_genre: movies}
    else:
        # Group all movies by genre
        movies_by_genre = {}
        
        # Get all movies with their genres
        all_movies = Movie.query.all()
        
        for movie in all_movies:
            if not movie.genre:
                continue
                
            # Split the genre string into individual genres
            movie_genres = [g.strip() for g in movie.genre.split(',')]
            
            # Add movie to each of its genre groups
            for genre in movie_genres:
                if genre not in movies_by_genre:
                    movies_by_genre[genre] = []
                movies_by_genre[genre].append(movie)
        
        # Sort movies within each genre
        for genre, movies in movies_by_genre.items():
            if sort == 'rating_asc':
                movies.sort(key=lambda x: (x.rating or 0, x.title))
            elif sort == 'title_asc':
                movies.sort(key=lambda x: (x.title or '', x.rating or 0))
            elif sort == 'title_desc':
                movies.sort(key=lambda x: (x.title or '', x.rating or 0), reverse=True)
            elif sort == 'year_asc':
                movies.sort(key=lambda x: (x.release_year or 0, x.rating or 0))
            elif sort == 'year_desc':
                movies.sort(key=lambda x: (x.release_year or 0, x.rating or 0), reverse=True)
            else:  # Default: rating_desc
                movies.sort(key=lambda x: (x.rating or 0, x.title or ''), reverse=True)
    
    # For pagination, we'll handle it client-side since we're grouping by genre
    # We'll pass all movies and let the template handle the display
    
    return render_template('movies.html',
                         movies_by_genre=movies_by_genre,
                         all_genres=all_genres,
                         current_genre=selected_genre,
                         current_sort=sort)

# Movie detail route
@main_routes.route('/movie/<int:movie_id>')
def movie_detail(movie_id):
    movie = Movie.query.get_or_404(movie_id)
    # Get movies with the same genre, excluding the current movie
    similar_movies = Movie.query.filter(
        Movie.genre == movie.genre,
        Movie.id != movie.id
    ).limit(10).all()  # Limit to 10 similar movies
    return render_template('movie_detail.html', movie=movie, similar_movies=similar_movies)

# Search route
@main_routes.route('/search')
def search():
    query = request.args.get('q', '')
    if not query:
        return redirect(url_for('index'))
    
    # Search in movie titles and descriptions
    movies = Movie.query.filter(
        (Movie.title.ilike(f'%{query}%')) | 
        (Movie.description.ilike(f'%{query}%'))
    ).all()
    
    return render_template('search_results.html', query=query, results=movies)

# User profile route
@main_routes.route('/profile')
@login_required
def profile():
    # Get user's watch history
    watch_history = WatchHistory.query.filter_by(user_id=current_user.id).order_by(
        WatchHistory.watched_at.desc()
    ).limit(10).all()
    
    # Get user's watchlist
    watchlist = Watchlist.query.filter_by(user_id=current_user.id).all()
    
    # Get user's favorites
    favorites = Favorite.query.filter_by(user_id=current_user.id).all()
    
    # Get subscription status
    subscription = Subscription.query.filter_by(user_id=current_user.id).first()
    
    return render_template('profile.html', 
                         watch_history=watch_history,
                         watchlist=watchlist,
                         favorites=favorites,
                         subscription=subscription)

# Authentication routes (login, register, logout, etc.) would go here
# ...

# Admin routes would go in a separate file
# ...
