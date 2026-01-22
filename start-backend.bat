@echo off
echo Starting Streamify Backend...
cd backend
call venv\Scripts\activate
python -m app.seed_data
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
