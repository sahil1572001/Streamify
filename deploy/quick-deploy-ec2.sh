#!/bin/bash

# Quick Deploy Script for EC2
# Run this script after connecting to your EC2 instance

set -e

echo "🚀 Streamify Quick Deploy on EC2"
echo "=================================="
echo ""

# Check if running as ubuntu user
if [ "$USER" != "ubuntu" ]; then
    echo "⚠️  Please run this script as ubuntu user"
    exit 1
fi

# Get EC2 public IP
EC2_PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo "📍 EC2 Public IP: $EC2_PUBLIC_IP"
echo ""

# Step 1: System Setup
echo "Step 1/7: Installing system dependencies..."
sudo apt-get update -qq
sudo apt-get install -y software-properties-common curl wget git build-essential libpq-dev

# Install Python 3.11
echo "Installing Python 3.11..."
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt-get update -qq
sudo apt-get install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Install Node.js 18
echo "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL Client (for RDS connection)
echo "Installing PostgreSQL client..."
sudo apt-get install -y postgresql-client

# Install Nginx
echo "Installing Nginx..."
sudo apt-get install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

echo "✅ System dependencies installed"
echo ""

# Step 2: Get RDS Database Information
echo "Step 2/7: Configuring AWS RDS database connection..."
echo ""
echo "⚠️  You need an AWS RDS PostgreSQL instance."
echo "   If you haven't created one yet, see: deploy/RDS_SETUP_GUIDE.md"
echo ""
read -p "Enter your RDS endpoint (e.g., streamify.xxxxx.ap-south-1.rds.amazonaws.com): " RDS_ENDPOINT
read -p "Enter RDS database name [streamify]: " RDS_DATABASE
RDS_DATABASE=${RDS_DATABASE:-streamify}
read -p "Enter RDS username [postgres]: " RDS_USERNAME
RDS_USERNAME=${RDS_USERNAME:-postgres}
read -sp "Enter RDS password: " RDS_PASSWORD
echo ""

# Test RDS connection
echo "Testing RDS connection..."
PGPASSWORD=$RDS_PASSWORD psql -h $RDS_ENDPOINT -U $RDS_USERNAME -d postgres -c "SELECT version();" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ RDS connection successful"
else
    echo "⚠️  Could not connect to RDS. Please check your credentials and security group settings."
    echo "   Make sure EC2 security group is allowed in RDS security group."
fi
echo ""

# Step 3: Clone Repository
echo "Step 3/7: Cloning repository..."
read -p "Enter your GitHub repository URL (e.g., https://github.com/username/streamify.git): " REPO_URL

sudo mkdir -p /var/www/streamify
sudo chown -R ubuntu:ubuntu /var/www

cd /var/www
if [ -d "streamify" ]; then
    echo "Repository already exists, pulling latest changes..."
    cd streamify
    git pull
else
    git clone $REPO_URL streamify
    cd streamify
fi

echo "✅ Repository cloned"
echo ""

# Step 4: Setup Backend
echo "Step 4/7: Setting up backend..."
cd /var/www/streamify/backend

python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q

# Create .env file
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOF
DATABASE_HOSTNAME=$RDS_ENDPOINT
DATABASE_PORT=5432
DATABASE_NAME=$RDS_DATABASE
DATABASE_USERNAME=$RDS_USERNAME
DATABASE_PASSWORD=$RDS_PASSWORD

SECRET_KEY=$(openssl rand -hex 32)
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIAUS3E6WA233HXVUIG
AWS_SECRET_ACCESS_KEY=REPLACE_WITH_YOUR_SECRET_KEY

TMDB_API_KEY=REPLACE_WITH_YOUR_TMDB_KEY
TMDB_LANGUAGE=en-US

PINECONE_API_KEY=REPLACE_WITH_YOUR_PINECONE_KEY
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=streamify-movies

OPENAI_API_KEY=REPLACE_WITH_YOUR_OPENAI_KEY
EMBEDDING_MODEL=text-embedding-ada-002
EMBEDDING_DIMENSION=1536
EOF
    
    echo "⚠️  IMPORTANT: Edit /var/www/streamify/backend/.env with your actual API keys"
    echo "   Run: nano /var/www/streamify/backend/.env"
fi

# Run migrations and seed data
if [ -d "alembic" ]; then
    alembic upgrade head
fi

echo "Seeding database (this may take a few minutes)..."
python -m app.seed_data || echo "⚠️  Seeding skipped or failed"

echo "✅ Backend setup complete"
echo ""

# Step 5: Setup Frontend
echo "Step 5/7: Setting up frontend..."
cd /var/www/streamify/streamify-frontend

npm install -q

# Create production environment
cat > .env.production << EOF
EXPO_PUBLIC_API_URL=http://$EC2_PUBLIC_IP
EOF

echo "Building frontend for web..."
npx expo export --platform web

# Copy to Nginx directory
sudo mkdir -p /var/www/streamify/frontend-build
sudo cp -r dist/* /var/www/streamify/frontend-build/
sudo chown -R www-data:www-data /var/www/streamify/frontend-build

echo "✅ Frontend setup complete"
echo ""

# Step 6: Configure Nginx
echo "Step 6/7: Configuring Nginx..."
sudo cp /var/www/streamify/deploy/nginx.conf /etc/nginx/sites-available/streamify
sudo ln -sf /etc/nginx/sites-available/streamify /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl restart nginx

echo "✅ Nginx configured"
echo ""

# Step 7: Setup Backend Service
echo "Step 7/7: Setting up backend service..."
sudo cp /var/www/streamify/deploy/streamify-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable streamify-backend
sudo systemctl start streamify-backend

echo "✅ Backend service started"
echo ""

# Final status check
echo "=================================="
echo "🎉 Deployment Complete!"
echo "=================================="
echo ""
echo "📊 Service Status:"
sudo systemctl status streamify-backend --no-pager -l | head -n 5
echo ""
echo "🌐 Access your application:"
echo "   Frontend: http://$EC2_PUBLIC_IP"
echo "   Backend API: http://$EC2_PUBLIC_IP/api/"
echo "   API Docs: http://$EC2_PUBLIC_IP/docs"
echo "   Health Check: http://$EC2_PUBLIC_IP/health"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "   1. Edit API keys: nano /var/www/streamify/backend/.env"
echo "   2. Restart backend: sudo systemctl restart streamify-backend"
echo "   3. Check logs: sudo journalctl -u streamify-backend -f"
echo ""
echo "📚 For detailed instructions, see: /var/www/streamify/deploy/EC2_DEPLOYMENT_GUIDE.md"
