"""
Embedding Generation Service
Generates vector embeddings for movies and queries using OpenAI
"""
from typing import List, Dict, Optional
import openai
from openai import OpenAI
from ..config import settings

class EmbeddingService:
    """Service for generating text embeddings"""
    
    def __init__(self):
        """Initialize OpenAI client"""
        if not settings.openai_api_key:
            raise ValueError("OPENAI_API_KEY is required. Set it in .env file")
        
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.model = settings.embedding_model
        self.dimension = settings.embedding_dimension
    
    def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for a single text
        
        Args:
            text: Input text to embed
        
        Returns:
            List of floats representing the embedding vector
        """
        try:
            response = self.client.embeddings.create(
                model=self.model,
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"Error generating embedding: {e}")
            raise
    
    def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts in batch
        
        Args:
            texts: List of input texts
        
        Returns:
            List of embedding vectors
        """
        try:
            response = self.client.embeddings.create(
                model=self.model,
                input=texts
            )
            return [item.embedding for item in response.data]
        except Exception as e:
            print(f"Error generating batch embeddings: {e}")
            raise
    
    def generate_movie_embedding(self, movie: Dict) -> List[float]:
        """
        Generate embedding for a movie based on its metadata
        
        Args:
            movie: Dictionary containing movie data (title, description, genres, etc.)
        
        Returns:
            Embedding vector for the movie
        """
        # Create rich text representation of the movie
        text_parts = []
        
        # Add title
        if movie.get('title'):
            text_parts.append(f"Title: {movie['title']}")
        
        # Add description/plot
        if movie.get('description'):
            text_parts.append(f"Plot: {movie['description']}")
        
        # Add genres
        if movie.get('genres'):
            genres = movie['genres'] if isinstance(movie['genres'], list) else []
            if genres:
                text_parts.append(f"Genres: {', '.join(genres)}")
        
        # Add director
        if movie.get('director'):
            text_parts.append(f"Director: {movie['director']}")
        
        # Add cast
        if movie.get('cast'):
            cast = movie['cast'] if isinstance(movie['cast'], list) else []
            if cast:
                text_parts.append(f"Cast: {', '.join(cast[:5])}")  # Top 5 actors
        
        # Add tags/themes
        if movie.get('tags'):
            tags = movie['tags'] if isinstance(movie['tags'], list) else []
            if tags:
                text_parts.append(f"Themes: {', '.join(tags)}")
        
        # Combine all parts
        movie_text = ". ".join(text_parts)
        
        # Generate embedding
        return self.generate_embedding(movie_text)
    
    def generate_query_embedding(self, query: str) -> List[float]:
        """
        Generate embedding for a search query
        
        Args:
            query: User search query
        
        Returns:
            Embedding vector for the query
        """
        return self.generate_embedding(query)
    
    def generate_user_profile_embedding(
        self, 
        watched_movies: List[Dict],
        preferences: Optional[Dict] = None
    ) -> List[float]:
        """
        Generate user profile embedding based on watch history and preferences
        
        Args:
            watched_movies: List of movies the user has watched/liked
            preferences: User preferences (genres, themes, etc.)
        
        Returns:
            User profile embedding vector
        """
        text_parts = []
        
        # Add user preferences
        if preferences:
            if preferences.get('favorite_genres'):
                text_parts.append(f"Favorite genres: {', '.join(preferences['favorite_genres'])}")
            if preferences.get('favorite_themes'):
                text_parts.append(f"Favorite themes: {', '.join(preferences['favorite_themes'])}")
        
        # Add watched movies (titles and genres)
        for movie in watched_movies[:10]:  # Use top 10 most recent
            if movie.get('title'):
                text_parts.append(f"Watched: {movie['title']}")
            if movie.get('genres'):
                genres = movie['genres'] if isinstance(movie['genres'], list) else []
                if genres:
                    text_parts.append(f"Genres: {', '.join(genres)}")
        
        # Combine and generate embedding
        profile_text = ". ".join(text_parts)
        
        if not profile_text:
            # Return zero vector if no data
            return [0.0] * self.dimension
        
        return self.generate_embedding(profile_text)
    
    def chunk_long_text(self, text: str, max_tokens: int = 8000) -> List[str]:
        """
        Chunk long text into smaller pieces for embedding
        
        Args:
            text: Long text to chunk
            max_tokens: Maximum tokens per chunk
        
        Returns:
            List of text chunks
        """
        # Simple chunking by sentences
        sentences = text.split('. ')
        chunks = []
        current_chunk = []
        current_length = 0
        
        for sentence in sentences:
            sentence_length = len(sentence.split())
            
            if current_length + sentence_length > max_tokens:
                if current_chunk:
                    chunks.append('. '.join(current_chunk) + '.')
                current_chunk = [sentence]
                current_length = sentence_length
            else:
                current_chunk.append(sentence)
                current_length += sentence_length
        
        if current_chunk:
            chunks.append('. '.join(current_chunk) + '.')
        
        return chunks


# Singleton instance
_embedding_service = None

def get_embedding_service():
    """Get or create embedding service instance"""
    global _embedding_service
    if _embedding_service is None:
        try:
            _embedding_service = EmbeddingService()
        except ValueError as e:
            print(f"⚠️ Embedding service not available: {e}")
            return None
    return _embedding_service
