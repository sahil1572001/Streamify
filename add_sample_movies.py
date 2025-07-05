from app import create_app
from extensions import db
from models import Movie
from datetime import datetime

def add_sample_movies():
    app = create_app()
    with app.app_context():
        # Check if movies already exist
        if Movie.query.count() > 0:
            print("Movies already exist in the database. Skipping sample data creation.")
            return

        # Sample movies data
        sample_movies = [
            {
                'title': 'The Shawshank Redemption',
                'description': 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
                'release_year': 1994,
                'genre': 'Drama',
                'rating': 9.3,
                'poster_url': 'https://m.media-amazon.com/images/M/MV5BMDFkYTc0MGEtZmNhMC00ZDIzLWFmNTEtODM1ZmRlYWMwMWFmXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg',
                'banner_url': 'https://m.media-amazon.com/images/M/MV5BNDE3ODcxYzMtY2YzZC00NmNlLWJiNDMtZDViZWM2MzIxZDYwXkEyXkFqcGdeQXVyNjAwNDUxODI@._V1_.jpg',
                'video_url': 'https://www.youtube.com/embed/6hB3S9bIaco'
            },
            {
                'title': 'The Godfather',
                'description': 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.',
                'release_year': 1972,
                'genre': 'Crime',
                'rating': 9.2,
                'poster_url': 'https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg',
                'banner_url': 'https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg',
                'video_url': 'https://www.youtube.com/embed/sY1S34973zA'
            },
            {
                'title': 'The Dark Knight',
                'description': 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
                'release_year': 2008,
                'genre': 'Action',
                'rating': 9.0,
                'poster_url': 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_.jpg',
                'banner_url': 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_.jpg',
                'video_url': 'https://www.youtube.com/embed/EXeTwQWrcwY'
            },
            {
                'title': 'Pulp Fiction',
                'description': 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.',
                'release_year': 1994,
                'genre': 'Crime',
                'rating': 8.9,
                'poster_url': 'https://m.media-amazon.com/images/M/MV5BNGNhMDIzZTUtNTBlZi00MTRlLWFjM2ItYzViMjE3YzI5MjljXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg',
                'banner_url': 'https://m.media-amazon.com/images/M/MV5BNGNhMDIzZTUtNTBlZi00MTRlLWFjM2ItYzViMjE3YzI5MjljXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg',
                'video_url': 'https://www.youtube.com/embed/s7EdQ4FqbhY'
            },
            {
                'title': 'Inception',
                'description': 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
                'release_year': 2010,
                'genre': 'Sci-Fi',
                'rating': 8.8,
                'poster_url': 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg',
                'banner_url': 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg',
                'video_url': 'https://www.youtube.com/embed/YoHD9XEInc0'
            },
            {
                'title': 'The Matrix',
                'description': 'A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.',
                'release_year': 1999,
                'genre': 'Sci-Fi',
                'rating': 8.7,
                'poster_url': 'https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTVkLWI0MTEtMDllZjNkYzNjNTc4L2ltYWdlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_.jpg',
                'banner_url': 'https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTVkLWI0MTEtMDllZjNkYzNjNTc4L2ltYWdlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_.jpg',
                'video_url': 'https://www.youtube.com/embed/vKQi3bBA1y8'
            },
            {
                'title': 'Parasite',
                'description': 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
                'release_year': 2019,
                'genre': 'Drama',
                'rating': 8.6,
                'poster_url': 'https://m.media-amazon.com/images/M/MV5BYWZjMjk3ZTItODQ2ZC00NTY5LWE0ZDYtZmUwZTYzM2M5ODM4XkEyXkFqcGdeQXVyODk4OTc3MTY@._V1_.jpg',
                'banner_url': 'https://m.media-amazon.com/images/M/MV5BOWZhZjE5NWItOWY1My00ZGNlLTg0MmUtZmMxNWI4Y2MyNWI4XkEyXkFqcGdeQXVyODk4OTc3MTY@._V1_.jpg',
                'video_url': 'https://www.youtube.com/embed/5xH0HfJHsaY'
            },
            {
                'title': 'The Lion King',
                'description': 'Lion prince Simba and his father are targeted by his bitter uncle, who wants to ascend the throne himself.',
                'release_year': 1994,
                'genre': 'Animation',
                'rating': 8.5,
                'poster_url': 'https://m.media-amazon.com/images/M/MV5BYTYxNGMyZTYtMjEyMS00MzVlLTk1MDYtMTQ2YzFhNzUxM2M3XkEyXkFqcGdeQXVyNjY5NDU4NzI@._V1_.jpg',
                'banner_url': 'https://m.media-amazon.com/images/M/MV5BYTYxNGMyZTYtMjEyMS00MzVlLTk1MDYtMTQ2YzFhNzUxM2M3XkEyXkFqcGdeQXVyNjY5NDU4NzI@._V1_.jpg',
                'video_url': 'https://www.youtube.com/embed/4sj1MT05lAA'
            }
        ]

        # Add movies to database
        for movie_data in sample_movies:
            movie = Movie(**movie_data)
            db.session.add(movie)
        
        db.session.commit()
        print(f"Added {len(sample_movies)} sample movies to the database.")

if __name__ == '__main__':
    add_sample_movies()
