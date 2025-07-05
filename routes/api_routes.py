from flask import Blueprint, jsonify, request
from models import Movie, db
from sqlalchemy import desc, or_

# Create a Blueprint for API routes
api_routes = Blueprint('api', __name__, url_prefix='/api')

@api_routes.route('/movies/popular', methods=['GET'])
def get_popular_movies():
    try:
        # Get query parameters
        limit = min(int(request.args.get('limit', 20)), 50)  # Default 20, max 50
        
        # Query popular movies, ordered by rating (descending)
        popular_movies = Movie.query.order_by(desc(Movie.rating), desc(Movie.release_year)).limit(limit).all()
        
        # Format the response
        movies_data = [{
            'id': movie.id,
            'title': movie.title,
            'overview': movie.overview,
            'release_year': movie.release_year,
            'genre': movie.genre,
            'rating': movie.rating,
            'poster_url': movie.poster_url,
            'banner_url': movie.banner_url,
            'trailer_url': movie.trailer_url
        } for movie in popular_movies]
        
        return jsonify({
            'success': True,
            'results': movies_data,
            'count': len(movies_data)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@api_routes.route('/movies/<int:movie_id>', methods=['GET'])
def get_movie(movie_id):
    try:
        # Query the movie with a join to the actors table
        from sqlalchemy.orm import joinedload
        from sqlalchemy import and_
        from models import Movie, Actor  # Import the models
        
        # Get the requested movie
        movie = Movie.query.options(joinedload(Movie.actors)).get_or_404(movie_id)
        
        # Get 4 similar movies (same genre, excluding the current movie)
        similar_movies = Movie.query.filter(
            and_(
                Movie.genre == movie.genre,
                Movie.id != movie.id
            )
        ).order_by(Movie.rating.desc()).limit(4).all()
        
        # Format similar movies data
        similar_movies_data = [{
            'id': m.id,
            'title': m.title,
            'poster_url': m.poster_url,
            'rating': m.rating,
            'release_year': m.release_year
        } for m in similar_movies]
        
        return jsonify({
            'success': True,
            'data': {
                'id': movie.id,
                'title': movie.title,
                'overview': movie.description,
                'release_year': movie.release_year,
                'genre': movie.genre,
                'rating': movie.rating,
                'poster_url': movie.poster_url,
                'banner_url': movie.banner_url,
                'trailer_url': getattr(movie, 'trailer_url', None),  # Handle missing trailer_url
                'duration': movie.duration,
                'director': getattr(movie, 'director', 'Unknown'),  # Handle missing director
                'cast': [{
                    'id': actor.id,
                    'name': getattr(actor, 'name', 'Unknown'),
                    'profile_url': getattr(actor, 'profile_url', None)
                } for actor in movie.actors],
                'similar_movies': similar_movies_data  # Add similar movies to the response
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
