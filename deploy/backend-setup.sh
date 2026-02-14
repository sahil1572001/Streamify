#!/bin/bash

# Backend Setup Script for EC2

set -e

echo "🔧 Setting up Streamify Backend..."

# Navigate to backend directory
cd /var/www/streamify/backend

# Create virtual environment
echo "🐍 Creating Python virtual environment..."
python3.11 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
echo "📦 Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit /var/www/streamify/backend/.env with your actual credentials"
fi

# Run database migrations (if using Alembic)
if [ -d "alembic" ]; then
    echo "🗄️ Running database migrations..."
    alembic upgrade head
fi

# Seed initial data
echo "🌱 Seeding database with initial data..."
python -m app.seed_data || echo "⚠️  Seeding failed or already completed"

echo "✅ Backend setup complete!"
echo ""
echo "To start the backend manually:"
echo "  cd /var/www/streamify/backend"
echo "  source venv/bin/activate"
echo "  uvicorn app.main:app --host 0.0.0.0 --port 8000"
echo ""
echo "Or use systemd service (recommended):"
echo "  sudo systemctl start streamify-backend"
