"""
Load movie embeddings into Pinecone
Handles large datasets efficiently with batching and progress tracking
"""
import asyncio
import time
from app.database import SessionLocal
from app.models import Movie
from app.services.embedding_service import get_embedding_service
from app.services.pinecone_service import get_pinecone_service

async def load_movie_embeddings(batch_size=50, start_from=0):
    """Generate and store embeddings for all movies"""
    db = SessionLocal()
    
    try:
        embedder = get_embedding_service()
        pinecone = get_pinecone_service()
        
        if not embedder or not pinecone:
            print("❌ Services not available")
            return
        
        # Get all movies
        total_movies = db.query(Movie).count()
        
        print(f"\n{'='*70}")
        print(f"📽️  LOADING MOVIE EMBEDDINGS TO PINECONE")
        print(f"{'='*70}")
        print(f"Total movies in database: {total_movies}")
        print(f"Batch size: {batch_size}")
        print(f"Starting from movie: {start_from}")
        print(f"{'='*70}\n")
        
        # Get movies in batches
        movies = db.query(Movie).offset(start_from).all()
        
        vectors_to_upsert = []
        processed = start_from
        failed = 0
        start_time = time.time()
        
        for i, movie in enumerate(movies, 1):
            try:
                # Create movie data
                movie_data = {
                    'title': movie.title,
                    'description': movie.description,
                    'genres': movie.genres,
                    'director': movie.director,
                    'cast': movie.cast,
                    'tags': movie.tags
                }
                
                # Generate embedding
                embedding = embedder.generate_movie_embedding(movie_data)
                
                # Prepare vector for Pinecone
                vector_id = f"movie_{movie.id}"
                vectors_to_upsert.append({
                    'id': vector_id,
                    'values': embedding,
                    'metadata': {
                        'movie_id': movie.id,
                        'title': movie.title,
                        'genres': movie.genres or [],
                        'rating': movie.rating
                    }
                })
                
                processed += 1
                
                # Show progress every 10 movies
                if i % 10 == 0:
                    elapsed = time.time() - start_time
                    rate = i / elapsed
                    remaining = (total_movies - processed) / rate if rate > 0 else 0
                    print(f"  [{processed}/{total_movies}] {movie.title}")
                    print(f"    ⏱️  Rate: {rate:.1f} movies/sec | ETA: {remaining:.0f}s")
                
                # Upsert in batches
                if len(vectors_to_upsert) >= batch_size:
                    print(f"    📤 Upserting {len(vectors_to_upsert)} vectors to Pinecone...")
                    pinecone.index.upsert(vectors=vectors_to_upsert)
                    vectors_to_upsert = []
                    print(f"    ✅ Batch uploaded")
                
            except Exception as e:
                print(f"  ⚠️  Error processing movie {movie.id}: {str(e)[:80]}")
                failed += 1
                continue
        
        # Upsert remaining vectors
        if vectors_to_upsert:
            print(f"\n  📤 Upserting final {len(vectors_to_upsert)} vectors to Pinecone...")
            pinecone.index.upsert(vectors=vectors_to_upsert)
            print(f"  ✅ Final batch uploaded")
        
        elapsed = time.time() - start_time
        
        print(f"\n{'='*70}")
        print(f"✅ MOVIE EMBEDDINGS LOADED SUCCESSFULLY!")
        print(f"{'='*70}")
        print(f"📊 Summary:")
        print(f"   Total processed: {processed}")
        print(f"   Successfully loaded: {processed - failed}")
        print(f"   Failed: {failed}")
        print(f"   Time elapsed: {elapsed:.1f}s")
        print(f"   Average rate: {processed/elapsed:.1f} movies/sec")
        print(f"{'='*70}\n")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    
    batch_size = 50
    start_from = 0
    
    # Allow command line arguments
    if len(sys.argv) > 1:
        batch_size = int(sys.argv[1])
    if len(sys.argv) > 2:
        start_from = int(sys.argv[2])
    
    asyncio.run(load_movie_embeddings(batch_size=batch_size, start_from=start_from))
