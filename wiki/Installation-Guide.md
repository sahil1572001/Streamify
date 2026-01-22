# Installation Guide

Complete guide to install and set up Streamify on your local machine.

## Prerequisites

### Required Software
- **Python 3.11+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **PostgreSQL 14+** - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/downloads/)

### Required Accounts
- **GitHub Account** - For repository access
- **OpenAI Account** - For embeddings API ([Sign up](https://platform.openai.com/))
- **Pinecone Account** - For vector database ([Sign up](https://www.pinecone.io/))

## Installation Steps

### 1. Clone Repository

```bash
git clone https://github.com/sahil1572001/streamify.git
cd streamify
```

### 2. Backend Setup

#### Install Python Dependencies

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

#### Configure Environment Variables

Create `.env` file in `backend/` directory:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/streamify

# JWT Authentication
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your-openai-api-key

# Pinecone Configuration
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=streamify-movies

# Optional: TMDb API
TMDB_API_KEY=your-tmdb-api-key
```

#### Setup Database

```bash
# Create PostgreSQL database
createdb streamify

# Run migrations
alembic upgrade head

# Seed initial data (optional)
python -m app.seed_data
```

### 3. Frontend Setup

```bash
cd streamify-frontend
npm install
```

Create `.env` file in `streamify-frontend/` directory:

```env
REACT_APP_API_URL=http://localhost:8000
```

### 4. Pinecone Setup

1. Log in to [Pinecone Console](https://app.pinecone.io/)
2. Create a new index:
   - **Name**: `streamify-movies`
   - **Dimensions**: `1536` (for OpenAI ada-002)
   - **Metric**: `cosine`
   - **Environment**: Select your region

### 5. Verify Installation

#### Start Backend

```bash
cd backend
.\venv\Scripts\activate  # Windows
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Visit: http://localhost:8000/docs

#### Start Frontend

```bash
cd streamify-frontend
npm start
```

Visit: http://localhost:3000

## Quick Start Scripts

### Windows

Use the provided batch scripts:

```bash
# Terminal 1 - Backend
.\start-backend.bat

# Terminal 2 - Frontend
.\start-frontend.bat
```

### Linux/Mac

Create shell scripts:

**start-backend.sh**
```bash
#!/bin/bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**start-frontend.sh**
```bash
#!/bin/bash
cd streamify-frontend
npm start
```

Make executable:
```bash
chmod +x start-backend.sh start-frontend.sh
```

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql -U postgres -d streamify
```

### Port Already in Use

```bash
# Windows - Kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

### Python Package Issues

```bash
# Upgrade pip
python -m pip install --upgrade pip

# Clear cache and reinstall
pip cache purge
pip install -r requirements.txt --force-reinstall
```

### Node Module Issues

```bash
# Clear cache
npm cache clean --force

# Delete and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

- [Quick Start Guide](Quick-Start.md) - Get started with basic features
- [Configuration Guide](Configuration.md) - Advanced configuration options
- [Development Setup](Development-Setup.md) - Set up development environment

## Getting Help

If you encounter issues:
1. Check [Common Issues](Common-Issues.md)
2. Search [GitHub Issues](https://github.com/sahil1572001/streamify/issues)
3. Create a new issue with detailed error logs
