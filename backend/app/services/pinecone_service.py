"""
Pinecone Vector Database Service
Handles vector storage and similarity search for movies
"""
from typing import List, Dict, Optional, Tuple
from pinecone import Pinecone, ServerlessSpec
from ..config import settings

class PineconeService:
    """Service for interacting with Pinecone vector database"""
    
    def __init__(self):
        """Initialize Pinecone client and index"""
        if not settings.pinecone_api_key:
            raise ValueError("PINECONE_API_KEY is required. Set it in .env file")
        
        # Initialize Pinecone client
        self.pc = Pinecone(api_key=settings.pinecone_api_key)
        self.index_name = settings.pinecone_index_name
        self.dimension = settings.embedding_dimension
        self.cloud, self.region = self._parse_environment(settings.pinecone_environment)
        
        # Get or create index
        self._ensure_index_exists()
        self.index = self.pc.Index(self.index_name)
    
    def _ensure_index_exists(self):
        """Create index if it doesn't exist"""
        existing_indexes = [index.name for index in self.pc.list_indexes()]
        
        if self.index_name not in existing_indexes:
            print(f"Creating Pinecone index: {self.index_name}")
            self.pc.create_index(
                name=self.index_name,
                dimension=self.dimension,
                metric='cosine',
                spec=ServerlessSpec(
                    cloud=self.cloud,
                    region=self.region
                )
            )
            print(f"✓ Index {self.index_name} created successfully")
        else:
            print(f"✓ Using existing index: {self.index_name}")

    def _parse_environment(self, env_value: str) -> Tuple[str, str]:
        """Return (cloud, region) for Pinecone serverless index"""
        default_cloud = 'aws'
        default_region = 'us-east-1'

        if not env_value:
            return default_cloud, default_region

        normalized = env_value.strip().lower()
        if not normalized:
            return default_cloud, default_region

        parts = normalized.split('-')
        # If the last token is a known cloud, peel it off, else assume default cloud
        known_clouds = {'aws', 'gcp', 'azure'}
        if parts[-1] in known_clouds:
            cloud = parts[-1]
            region = '-'.join(parts[:-1]) or default_region
        else:
            cloud = default_cloud
            region = normalized

        return cloud, region
    
    def upsert_movie(
        self, 
        movie_id: int, 
        embedding: List[float], 
        metadata: Dict
    ) -> Dict:
        """
        Upsert a single movie vector to Pinecone
        
        Args:
            movie_id: Unique movie identifier
            embedding: Vector embedding (1536 dimensions)
            metadata: Movie metadata (title, genres, year, etc.)
        
        Returns:
            Upsert response from Pinecone
        """
        vector_id = f"movie_{movie_id}"
        
        response = self.index.upsert(
            vectors=[(vector_id, embedding, metadata)]
        )
        
        return response
    
    def upsert_movies_batch(
        self, 
        movies: List[Tuple[int, List[float], Dict]]
    ) -> Dict:
        """
        Upsert multiple movie vectors in batch
        
        Args:
            movies: List of (movie_id, embedding, metadata) tuples
        
        Returns:
            Batch upsert response
        """
        vectors = [
            (f"movie_{movie_id}", embedding, metadata)
            for movie_id, embedding, metadata in movies
        ]
        
        response = self.index.upsert(vectors=vectors)
        return response
    
    def search_similar_movies(
        self,
        query_embedding: List[float],
        top_k: int = 10,
        filter_dict: Optional[Dict] = None
    ) -> List[Dict]:
        """
        Search for similar movies using vector similarity
        
        Args:
            query_embedding: Query vector (1536 dimensions)
            top_k: Number of results to return
            filter_dict: Metadata filters (e.g., {"genre": "Action", "year": {"$gte": 2020}})
        
        Returns:
            List of similar movies with scores
        """
        query_params = {
            "vector": query_embedding,
            "top_k": top_k,
            "include_metadata": True
        }
        
        if filter_dict:
            query_params["filter"] = filter_dict
        
        results = self.index.query(**query_params)
        
        # Format results
        formatted_results = []
        for match in results.matches:
            formatted_results.append({
                "id": match.id,
                "score": match.score,
                "metadata": match.metadata
            })
        
        return formatted_results
    
    def search_hybrid(
        self,
        query_embedding: List[float],
        user_embedding: Optional[List[float]] = None,
        top_k: int = 10,
        filter_dict: Optional[Dict] = None,
        user_weight: float = 0.3,
        query_weight: float = 0.7
    ) -> List[Dict]:
        """
        Hybrid search combining query and user profile vectors
        
        Args:
            query_embedding: Query vector
            user_embedding: User profile vector (optional)
            top_k: Number of results
            filter_dict: Metadata filters
            user_weight: Weight for user profile (default 0.3)
            query_weight: Weight for query (default 0.7)
        
        Returns:
            List of personalized recommendations
        """
        if user_embedding:
            # Blend query and user vectors
            blended_vector = [
                query_weight * q + user_weight * u
                for q, u in zip(query_embedding, user_embedding)
            ]
        else:
            blended_vector = query_embedding
        
        return self.search_similar_movies(
            query_embedding=blended_vector,
            top_k=top_k,
            filter_dict=filter_dict
        )
    
    def upsert_user_profile(
        self,
        user_id: int,
        profile_embedding: List[float],
        metadata: Dict
    ) -> Dict:
        """
        Upsert user profile vector
        
        Args:
            user_id: Unique user identifier
            profile_embedding: User profile vector
            metadata: User metadata (preferences, watch history, etc.)
        
        Returns:
            Upsert response
        """
        vector_id = f"user_{user_id}"
        
        response = self.index.upsert(
            vectors=[(vector_id, profile_embedding, metadata)]
        )
        
        return response
    
    def get_user_profile(self, user_id: int) -> Optional[Dict]:
        """
        Retrieve user profile vector
        
        Args:
            user_id: User identifier
        
        Returns:
            User profile data or None
        """
        vector_id = f"user_{user_id}"
        
        try:
            result = self.index.fetch(ids=[vector_id])
            if vector_id in result.vectors:
                return {
                    "id": vector_id,
                    "values": result.vectors[vector_id].values,
                    "metadata": result.vectors[vector_id].metadata
                }
        except Exception as e:
            print(f"Error fetching user profile: {e}")
        
        return None
    
    def delete_movie(self, movie_id: int) -> Dict:
        """Delete a movie vector"""
        vector_id = f"movie_{movie_id}"
        return self.index.delete(ids=[vector_id])
    
    def delete_user_profile(self, user_id: int) -> Dict:
        """Delete a user profile vector"""
        vector_id = f"user_{user_id}"
        return self.index.delete(ids=[vector_id])
    
    def get_index_stats(self) -> Dict:
        """Get index statistics"""
        return self.index.describe_index_stats()


# Singleton instance
_pinecone_service = None

def get_pinecone_service():
    """Get or create pinecone service instance"""
    global _pinecone_service
    if _pinecone_service is None:
        try:
            _pinecone_service = PineconeService()
        except (ValueError, Exception) as e:
            print(f"⚠️ Pinecone service not available: {e}")
            return None
    return _pinecone_service
