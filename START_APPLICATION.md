# 🚀 Streamify Application Startup Guide

## Quick Start Commands

### Option 1: Using Batch Files (Recommended for Windows)

#### Start Backend
```bash
# From project root directory
start-backend.bat
```

#### Start Frontend
```bash
# From project root directory (in a new terminal)
start-frontend.bat
```

---

### Option 2: Manual Commands

#### Backend Startup
```powershell
# Navigate to backend directory
cd c:\Project\vectorDB\streamify\backend

# Activate virtual environment
.\venv\Scripts\activate

# Seed initial data (optional - run once)
python -m app.seed_data

# Start FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Backend will be available at:** `http://localhost:8000`  
**API Documentation:** `http://localhost:8000/docs`

---

#### Frontend Startup
```powershell
# Navigate to frontend directory
cd c:\Project\vectorDB\streamify\streamify-frontend

# Start React development server
npm start
```

**Frontend will be available at:** `http://localhost:3000` (or the port shown in terminal)

---

## 📋 Pre-Startup Checklist

### First Time Setup

1. **PostgreSQL Database**
   - ✅ PostgreSQL service is running
   - ✅ Database `streamify` exists
   - ✅ 876 movies loaded

2. **Backend Dependencies**
   ```powershell
   cd backend
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Frontend Dependencies**
   ```powershell
   cd streamify-frontend
   npm install
   ```

4. **Environment Variables**
   - Ensure `.env` file exists in `backend/` directory
   - Required variables:
     - `DATABASE_HOSTNAME=localhost`
     - `DATABASE_PORT=5432`
     - `DATABASE_NAME=streamify`
     - `DATABASE_USERNAME=postgres`
     - `DATABASE_PASSWORD=<your_password>`
     - `SECRET_KEY=<your_secret_key>`
     - `TMDB_API_KEY=<optional>`
     - `PINECONE_API_KEY=<optional>`
     - `OPENAI_API_KEY=<optional>`

---

## 🔧 Development Workflow

### Starting Both Services

**Terminal 1 - Backend:**
```powershell
cd c:\Project\vectorDB\streamify
.\start-backend.bat
```

**Terminal 2 - Frontend:**
```powershell
cd c:\Project\vectorDB\streamify
.\start-frontend.bat
```

---

## 🧪 Testing the Setup

### 1. Test Backend Health
```powershell
# Check if backend is running
curl http://localhost:8000/health
```

### 2. Test API Documentation
Open in browser: `http://localhost:8000/docs`

### 3. Test Frontend
Open in browser: `http://localhost:3000`

### 4. Test Database Connection
```powershell
cd backend
.\venv\Scripts\python.exe -c "from app.database import engine; print('✅ Database connected!' if engine else '❌ Connection failed')"
```

---

## 📊 Application URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | React web application |
| **Backend API** | http://localhost:8000 | FastAPI REST API |
| **API Docs (Swagger)** | http://localhost:8000/docs | Interactive API documentation |
| **API Docs (ReDoc)** | http://localhost:8000/redoc | Alternative API documentation |

---

## 🛑 Stopping the Application

### Stop Backend
- Press `Ctrl + C` in the backend terminal

### Stop Frontend
- Press `Ctrl + C` in the frontend terminal

---

## 🐛 Troubleshooting

### Backend Issues

**Problem: Port 8000 already in use**
```powershell
# Find and kill process using port 8000
netstat -ano | findstr :8000
taskkill /PID <process_id> /F
```

**Problem: Database connection failed**
```powershell
# Check PostgreSQL service
Get-Service -Name postgresql*

# Test connection
cd backend
.\venv\Scripts\python.exe test_postgres_env.py
```

**Problem: Module not found errors**
```powershell
cd backend
.\venv\Scripts\activate
pip install -r requirements.txt
```

---

### Frontend Issues

**Problem: Port 3000 already in use**
- The app will prompt to use a different port (usually 3001)
- Or manually specify port:
  ```powershell
  $env:PORT=3001; npm start
  ```

**Problem: npm dependencies missing**
```powershell
cd streamify-frontend
rm -rf node_modules package-lock.json
npm install
```

**Problem: CORS errors**
- Ensure backend is running on port 8000
- Check frontend API base URL configuration

---

## 🔄 Database Management

### View Database Contents
```powershell
cd backend
.\venv\Scripts\python.exe display_movies.py
```

### Reset Database
```powershell
# Drop and recreate database
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "DROP DATABASE IF EXISTS streamify;"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE streamify;"

# Run migrations
cd backend
.\venv\Scripts\activate
alembic upgrade head

# Reseed data
python -m app.seed_data
```

---

## 📦 Production Deployment

### Backend (FastAPI)
```powershell
# Install production dependencies
pip install gunicorn

# Run with gunicorn
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend (React)
```powershell
# Build for production
cd streamify-frontend
npm run build

# Serve build folder with a static server
npx serve -s build -p 3000
```

---

## 💡 Tips

1. **Hot Reload**: Both backend and frontend support hot reload during development
2. **Logs**: Check terminal output for errors and debugging information
3. **API Testing**: Use the Swagger UI at `/docs` for testing API endpoints
4. **Database**: PostgreSQL must be running before starting the backend
5. **Environment**: Always activate the virtual environment before running backend commands

---

## 📞 Support

- Check `README.md` for project overview
- Review `ARCHITECTURE.md` for system design
- See `PRODUCTION_READINESS_AUDIT.md` for deployment guidelines

---

**Last Updated:** January 28, 2026  
**Status:** ✅ Backend Running | ✅ Database Connected | ✅ 876 Movies Loaded
