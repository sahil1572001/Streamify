# 🔧 Critical Security Fixes - Implementation Guide

## Priority 0 Fixes (Implement Immediately)

### Fix 1: Secure Secret Key Configuration

**File:** `backend/app/config.py`

Replace lines 23-24:
```python
# BEFORE (INSECURE)
secret_key: str = "your-secret-key-here"
algorithm: str = "HS256"
```

```python
# AFTER (SECURE)
secret_key: str
algorithm: str = "HS256"

def __init__(self, **kwargs):
    super().__init__(**kwargs)
    # Validate secret key
    if not self.secret_key or len(self.secret_key) < 32:
        raise ValueError(
            "SECRET_KEY must be set in .env file with at least 32 characters. "
            "Generate one with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
        )
```

**Generate secure key:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Add to `.env`:
```
SECRET_KEY=<generated-key-here>
```

---

### Fix 2: Add Role-Based Access Control

**File:** `backend/app/models/user.py`

Add role field after line 14:
```python
is_active = Column(Boolean, server_default='TRUE', nullable=False)
role = Column(String, server_default='user', nullable=False)  # 'user' or 'admin'
```

**File:** `backend/app/auth.py`

Add after line 83:
```python
async def get_current_admin_user(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    """Get the current admin user."""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=403, 
            detail="Admin privileges required"
        )
    return current_user
```

**File:** `backend/app/routers/movies.py`

Update lines 97-108:
```python
# BEFORE
async def create_movie(
    movie: MovieCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

# AFTER
from ..auth import get_current_admin_user

async def create_movie(
    movie: MovieCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)  # Admin only
):
```

Apply same change to:
- `update_movie()` (line 110)
- `delete_movie()` (line 130)

---

### Fix 3: Replace Print Statements with Proper Logging

**File:** `backend/app/auth.py`

Add at top:
```python
import logging
logger = logging.getLogger(__name__)
```

Replace lines 52-74:
```python
# BEFORE
print(f"🔐 Validating token: {token[:30]}...")
print(f"✅ Token decoded - User ID: {user_id}")
print(f"❌ No user_id in token payload")
print(f"❌ JWT decode error: {str(e)}")
print(f"❌ User not found in database: {token_data.id}")
print(f"✅ User authenticated: {user.email}")

# AFTER
logger.debug("Validating authentication token")
logger.debug(f"Token decoded - User ID: {user_id}")
logger.warning("No user_id in token payload")
logger.error(f"JWT decode error: {str(e)}")
logger.warning(f"User not found: {token_data.id}")
logger.info(f"User authenticated: {current_user.id}")  # Don't log email
```

**Apply to all files with print statements:**
- `backend/app/routers/watchlist.py`
- `backend/app/routers/search.py`
- `backend/app/routers/auth.py`
- `backend/app/services/pinecone_service.py`
- `backend/app/services/embedding_service.py`

---

### Fix 4: Add Rate Limiting

**Install dependency:**
```bash
pip install slowapi
```

**File:** `backend/requirements.txt`
Add:
```
slowapi
```

**File:** `backend/app/main.py`

Add after imports:
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)
```

Add after app creation (line 12):
```python
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

**File:** `backend/app/routers/auth.py`

Add to login endpoint (line 105):
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post('/login', response_model=schemas.Token)
@limiter.limit("5/minute")  # Max 5 attempts per minute
def login(
    request: Request,  # Add Request parameter
    user_credentials: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
```

Add to register endpoint (line 82):
```python
@router.post('/register', response_model=schemas.UserResponse)
@limiter.limit("3/hour")  # Max 3 registrations per hour per IP
def create_user(
    request: Request,  # Add Request parameter
    user: schemas.UserCreate, 
    db: Session = Depends(get_db)
):
```

---

### Fix 5: Add Password Strength Validation

**File:** `backend/app/routers/auth.py`

Add helper function after imports:
```python
import re

def validate_password_strength(password: str) -> None:
    """Validate password meets security requirements"""
    if len(password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters long"
        )
    if not re.search(r"[A-Z]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one uppercase letter"
        )
    if not re.search(r"[a-z]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one lowercase letter"
        )
    if not re.search(r"\d", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one number"
        )
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one special character"
        )
```

Update register function (line 82):
```python
@router.post('/register', response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Validate password strength
    validate_password_strength(user.password)  # Add this line
    
    # Check if user already exists
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    ...
```

---

## Priority 1 Fixes (Implement Within 1 Week)

### Fix 6: Environment-Based Configuration

**File:** `backend/app/config.py`

Add after line 50:
```python
# Environment Configuration
environment: str = "development"  # development, staging, production

# CORS Configuration
cors_origins: str = "http://localhost:8081,http://127.0.0.1:8081"

# Rate Limiting
rate_limit_enabled: bool = True
```

**File:** `backend/app/main.py`

Update CORS (line 17):
```python
# BEFORE
allow_origins=["http://localhost:8081", "http://127.0.0.1:8081", "http://localhost:19006"]

# AFTER
allow_origins=settings.cors_origins.split(",") if settings.cors_origins else ["*"]
```

---

### Fix 7: Improved Error Handling

**File:** `backend/app/routers/search.py`

Update error handling (line 135-142):
```python
except Exception as e:
    logger.error(f"Semantic search error: {str(e)}", exc_info=True)
    
    # Don't expose internal errors in production
    if settings.environment == "production":
        raise HTTPException(
            status_code=500,
            detail="Search service temporarily unavailable"
        )
    else:
        raise HTTPException(
            status_code=500,
            detail=f"Search failed: {str(e)}"
        )
```

---

### Fix 8: Input Validation

**File:** `backend/app/routers/movies.py`

Add validation (line 28-30):
```python
# Apply filters
if genre:
    # Validate genre input (alphanumeric and spaces only)
    if not re.match(r'^[a-zA-Z0-9\s\-]+$', genre):
        raise HTTPException(400, "Invalid genre format")
    query = query.filter(cast(Movie.genres, String).ilike(f"%{genre}%"))
```

---

### Fix 9: Enhanced Health Check

**File:** `backend/app/main.py`

Replace health check (line 41-43):
```python
@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Comprehensive health check"""
    try:
        from datetime import datetime
        
        # Check database connection
        db.execute("SELECT 1")
        db_status = "healthy"
        
        # Check Pinecone (optional)
        pinecone_status = "not_configured"
        try:
            from .services.pinecone_service import get_pinecone_service
            pc = get_pinecone_service()
            if pc:
                pc.get_index_stats()
                pinecone_status = "healthy"
        except Exception:
            pinecone_status = "unavailable"
        
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "services": {
                "database": db_status,
                "pinecone": pinecone_status
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="Service unhealthy"
        )
```

---

## Database Migration

Create migration for role field:

```bash
# Install alembic if not already
pip install alembic

# Initialize alembic
alembic init alembic

# Create migration
alembic revision -m "add_user_role_field"
```

**File:** `alembic/versions/xxx_add_user_role_field.py`
```python
def upgrade():
    op.add_column('users', sa.Column('role', sa.String(), server_default='user', nullable=False))

def downgrade():
    op.drop_column('users', 'role')
```

Run migration:
```bash
alembic upgrade head
```

---

## Testing After Fixes

Run the test suite:
```bash
python backend/test_production_readiness.py
```

Expected results:
- ✅ All authentication tests pass
- ✅ Rate limiting blocks excessive requests
- ✅ Invalid passwords rejected
- ✅ Admin endpoints protected
- ✅ No sensitive data in logs

---

## Production Deployment Checklist

Before deploying:

1. **Environment Variables**
   ```bash
   SECRET_KEY=<64-char-random-string>
   ENVIRONMENT=production
   CORS_ORIGINS=https://yourdomain.com
   DATABASE_URL=<production-db>
   LOG_LEVEL=INFO
   ```

2. **Security Headers**
   - Enable HTTPS
   - Set secure cookie flags
   - Add CSP headers

3. **Monitoring**
   - Set up error tracking (Sentry)
   - Configure log aggregation
   - Add performance monitoring

4. **Backup**
   - Database backup schedule
   - Disaster recovery plan

---

## Quick Fix Script

Run this to apply basic fixes:

```bash
# Generate secure secret key
python -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(32))" >> .env

# Install dependencies
pip install slowapi

# Run database migration
alembic upgrade head

# Test the application
python test_production_readiness.py
```

---

**Status:** Ready to implement  
**Estimated Time:** 4-6 hours  
**Priority:** CRITICAL - Do not deploy without these fixes
