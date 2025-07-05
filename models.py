from extensions import db
from flask_login import UserMixin
from datetime import datetime
from sqlalchemy import func

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    join_date = db.Column(db.DateTime, default=datetime.utcnow)
    is_admin = db.Column(db.Boolean, default=False)
    
    # Relationships
    watch_history = db.relationship('WatchHistory', backref='user', lazy=True)
    watchlist = db.relationship('Watchlist', backref='user', lazy=True)
    favorites = db.relationship('Favorite', backref='user', lazy=True)
    subscriptions = db.relationship('Subscription', backref='user', lazy=True)
    payments = db.relationship('Payment', backref='user', lazy=True)
    notifications = db.relationship('Notification', backref='user', lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Movie(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    release_year = db.Column(db.Integer, nullable=True)
    genre = db.Column(db.String(100), nullable=True)
    rating = db.Column(db.Float, default=0.0)
    poster_url = db.Column(db.String(500), nullable=True)
    banner_url = db.Column(db.String(500), nullable=True)
    video_url = db.Column(db.String(500), nullable=True)
    duration = db.Column(db.Integer, nullable=True)  # in minutes
    language = db.Column(db.String(10), default='en')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    watch_history = db.relationship('WatchHistory', backref='movie', lazy=True, cascade='all, delete-orphan')
    watchlist = db.relationship('Watchlist', backref='movie', lazy=True, cascade='all, delete-orphan')
    favorites = db.relationship('Favorite', backref='movie', lazy=True, cascade='all, delete-orphan')
    actors = db.relationship('MovieActor', back_populates='movie', lazy=True, cascade='all, delete-orphan')
    
    def get_actors(self):
        """Get list of actors for this movie, ordered by cast order."""
        return [ma.actor for ma in sorted(self.actors, key=lambda x: x.cast_order)]
    
    def __repr__(self):
        return f'<Movie {self.title} ({self.release_year})>'

class Actor(db.Model):
    """Actor model to store information about actors/actresses."""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, index=True)
    bio = db.Column(db.Text, nullable=True)
    profile_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    movies = db.relationship('MovieActor', back_populates='actor', lazy=True, cascade='all, delete-orphan')
    
    def get_movies(self, limit=None):
        """Get movies this actor has appeared in, ordered by release year."""
        query = Movie.query.join(MovieActor).filter(MovieActor.actor_id == self.id)\
                        .order_by(Movie.release_year.desc())
        if limit:
            query = query.limit(limit)
        return query.all()
    
    def __repr__(self):
        return f'<Actor {self.name}>'


class MovieActor(db.Model):
    """Association table for many-to-many relationship between Movie and Actor."""
    __tablename__ = 'movie_actor'
    
    id = db.Column(db.Integer, primary_key=True)
    movie_id = db.Column(db.Integer, db.ForeignKey('movie.id', ondelete='CASCADE'), nullable=False)
    actor_id = db.Column(db.Integer, db.ForeignKey('actor.id', ondelete='CASCADE'), nullable=False)
    character_name = db.Column(db.String(200), nullable=True)
    cast_order = db.Column(db.Integer, default=0)  # Order of appearance in credits
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    movie = db.relationship('Movie', back_populates='actors')
    actor = db.relationship('Actor', back_populates='movies')
    
    # Composite unique constraint
    __table_args__ = (
        db.UniqueConstraint('movie_id', 'actor_id', name='_movie_actor_uc'),
    )
    
    def __repr__(self):
        return f'<MovieActor {self.actor.name} as {self.character_name} in {self.movie.title}>'


class WatchHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    movie_id = db.Column(db.Integer, db.ForeignKey('movie.id'), nullable=False)
    watched_at = db.Column(db.DateTime, default=datetime.utcnow)
    progress = db.Column(db.Integer, default=0)  # in seconds

class Watchlist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    movie_id = db.Column(db.Integer, db.ForeignKey('movie.id'), nullable=False)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)

class Favorite(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    movie_id = db.Column(db.Integer, db.ForeignKey('movie.id'), nullable=False)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)

class Subscription(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    plan = db.Column(db.String(50), nullable=False)  # e.g., 'basic', 'premium'
    start_date = db.Column(db.DateTime, default=datetime.utcnow)
    end_date = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    auto_renew = db.Column(db.Boolean, default=True)

class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), default='USD')
    payment_date = db.Column(db.DateTime, default=datetime.utcnow)
    payment_method = db.Column(db.String(50))
    status = db.Column(db.String(20))  # 'pending', 'completed', 'failed', 'refunded'
    subscription_id = db.Column(db.Integer, db.ForeignKey('subscription.id'))

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    notification_type = db.Column(db.String(50))  # 'info', 'warning', 'success', 'error'
