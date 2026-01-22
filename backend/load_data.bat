@echo off
echo ============================================================
echo STREAMIFY - TMDB Data Loader
echo ============================================================
echo.
echo This script will load movies and TV shows from TMDB API
echo into your database (AWS RDS or local PostgreSQL)
echo.
echo Make sure you have:
echo   1. Configured .env file with database credentials
echo   2. Added your TMDB_API_KEY to .env file
echo   3. Installed dependencies: pip install -r requirements.txt
echo.
pause

cd /d "%~dp0"
call venv\Scripts\activate
python -m app.load_tmdb_data
pause
