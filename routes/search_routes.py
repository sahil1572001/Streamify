from flask import Blueprint, jsonify, request
from models import Movie, db
from sqlalchemy import or_

# Create a Blueprint for search routes
search_routes = Blueprint('search', __name__)

@search_routes.route('/api/movies/search', methods=['GET'])
def search_movies():
    try:
        query = request.args.get('q', '').strip()
        if not query:
            return jsonify({
                'success': True,
                'results': [],
                'count': 0,
                'query': query
            })
        
        # Search in movie titles and descriptions
        movies = Movie.query.filter(
            or_(
                Movie.title.ilike(f'%{query}%'),
                Movie.description.ilike(f'%{query}%')
            )
        ).all()
        
        # Format the response
        movies_data = [{
            'id': movie.id,
            'title': movie.title,
            'overview': movie.description or '',
            'release_year': movie.release_year,
            'genre': movie.genre,
            'rating': float(movie.rating) if movie.rating else 0.0,
            'poster_url': movie.poster_url or '',
            'banner_url': movie.banner_url or '',
            'trailer_url': getattr(movie, 'trailer_url', None)
        } for movie in movies]
        
        return jsonify({
            'success': True,
            'results': movies_data,
            'count': len(movies_data),
            'query': query
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'query': request.args.get('q', '')
        }), 500
