"""
Movie Embedding Ingestion Script
Generates embeddings for all movies and uploads them to Pinecone
"""
import sys
import time
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.movie import Movie
from app.services.embedding_service import EmbeddingService
from app.services.pinecone_service import PineconeService
from app.config import settings

def ingest_movies_to_pinecone(batch_size: int = 50, start_from: int = 0):
    """
    Ingest all movies from PostgreSQL to Pinecone with embeddings
    
    Args:
        batch_size: Number of movies to process in each batch
        start_from: Movie ID to start from (for resuming)
    """
    print("=" * 80)
    print("🚀 MOVIE EMBEDDING INGESTION SCRIPT")
    print("=" * 80)
    
    # Initialize services
    try:
        print("\n📡 Initializing services...")
        embedding_service = EmbeddingService()
        pinecone_service = PineconeService()
        print("✓ Services initialized successfully")
    except ValueError as e:
        print(f"❌ Error initializing services: {e}")
        print("\nPlease ensure the following environment variables are set:")
        print("  - OPENAI_API_KEY")
        print("  - PINECONE_API_KEY")
        sys.exit(1)
    
    # Get database session
    db: Session = SessionLocal()
    
    try:
        # Get total movie count
        total_movies = db.query(Movie).filter(Movie.id >= start_from).count()
        print(f"\n📊 Total movies to process: {total_movies}")
        print(f"📦 Batch size: {batch_size}")
        print(f"🎬 Starting from movie ID: {start_from}")
        
        if total_movies == 0:
            print("\n⚠️  No movies found in database!")
            return
        
        # Process movies in batches
        processed = 0
        failed = 0
        start_time = time.time()
        
        offset = 0
        while True:
            # Fetch batch of movies
            movies = db.query(Movie).filter(Movie.id >= start_from).offset(offset).limit(batch_size).all()
            
            if not movies:
                break
            
            print(f"\n{'='*80}")
            print(f"Processing batch {offset // batch_size + 1} ({len(movies)} movies)...")
            print(f"{'='*80}")
            
            batch_vectors = []
            
            for movie in movies:
                try:
                    print(f"\n🎬 Processing: {movie.title} (ID: {movie.id})")
                    
                    # Prepare movie data for embedding
                    movie_data = {
                        'title': movie.title,
                        'description': movie.description or '',
                        'genres': movie.genres or [],
                        'director': movie.director,
                        'cast': movie.cast or [],
                        'tags': []  # Can add tags later
                    }
                    
                    # Generate embedding
                    print("  ⚡ Generating embedding...")
                    embedding = embedding_service.generate_movie_embedding(movie_data)
                    
                    # Prepare metadata for Pinecone
                    metadata = {
                        'movie_id': movie.id,
                        'tmdb_id': movie.tmdb_id,
                        'title': movie.title,
                        'genres': movie.genres or [],
                        'year': movie.release_year,
                        'rating': float(movie.rating) if movie.rating else 0.0,
                        'content_type': movie.content_type or 'movie',
                        'language': movie.language or 'en',
                        'popularity': float(movie.popularity_score) if movie.popularity_score else 0.0
                    }
                    
                    # Add to batch
                    batch_vectors.append((movie.id, embedding, metadata))
                    
                    print(f"  ✓ Embedding generated ({len(embedding)} dimensions)")
                    processed += 1
                    
                except Exception as e:
                    print(f"  ❌ Error processing movie {movie.id}: {e}")
                    failed += 1
                    continue
            
            # Upload batch to Pinecone
            if batch_vectors:
                try:
                    print(f"\n📤 Uploading batch to Pinecone ({len(batch_vectors)} vectors)...")
                    response = pinecone_service.upsert_movies_batch(batch_vectors)
                    print(f"  ✓ Batch uploaded successfully")
                    print(f"  📊 Upserted count: {response.get('upserted_count', 'N/A')}")
                except Exception as e:
                    print(f"  ❌ Error uploading batch: {e}")
                    failed += len(batch_vectors)
            
            # Progress update
            elapsed = time.time() - start_time
            rate = processed / elapsed if elapsed > 0 else 0
            remaining = total_movies - processed - failed
            eta = remaining / rate if rate > 0 else 0
            
            print(f"\n📈 Progress:")
            print(f"  ✓ Processed: {processed}/{total_movies} ({processed/total_movies*100:.1f}%)")
            print(f"  ❌ Failed: {failed}")
            print(f"  ⏱️  Elapsed: {elapsed:.1f}s")
            print(f"  🚀 Rate: {rate:.2f} movies/sec")
            print(f"  ⏳ ETA: {eta/60:.1f} minutes")
            
            offset += batch_size
            
            # Small delay to avoid rate limits
            time.sleep(0.5)
        
        # Final summary
        total_time = time.time() - start_time
        print(f"\n{'='*80}")
        print("✅ INGESTION COMPLETE!")
        print(f"{'='*80}")
        print(f"📊 Final Statistics:")
        print(f"  ✓ Successfully processed: {processed}")
        print(f"  ❌ Failed: {failed}")
        print(f"  ⏱️  Total time: {total_time/60:.2f} minutes")
        print(f"  🚀 Average rate: {processed/total_time:.2f} movies/sec")
        
        # Get Pinecone index stats
        try:
            stats = pinecone_service.get_index_stats()
            print(f"\n📊 Pinecone Index Stats:")
            print(f"  Total vectors: {stats.get('total_vector_count', 'N/A')}")
            print(f"  Dimension: {stats.get('dimension', 'N/A')}")
        except Exception as e:
            print(f"\n⚠️  Could not fetch index stats: {e}")
        
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()
        print(f"\n{'='*80}")
        print("🏁 Script finished")
        print(f"{'='*80}\n")

def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Ingest movie embeddings to Pinecone')
    parser.add_argument('--batch-size', type=int, default=50, help='Batch size for processing')
    parser.add_argument('--start-from', type=int, default=0, help='Movie ID to start from')
    
    args = parser.parse_args()
    
    ingest_movies_to_pinecone(
        batch_size=args.batch_size,
        start_from=args.start_from
    )

if __name__ == "__main__":
    main()
