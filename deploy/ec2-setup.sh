#!/bin/bash

# Streamify EC2 Setup Script
# This script sets up the complete environment on an AWS EC2 instance (Ubuntu 22.04)

set -e

echo "🚀 Starting Streamify EC2 Setup..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Python 3.11
echo "🐍 Installing Python 3.11..."
sudo apt-get install -y software-properties-common
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt-get update
sudo apt-get install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL Client (for connecting to RDS)
echo "🐘 Installing PostgreSQL client..."
sudo apt-get install -y postgresql-client

# Install Nginx
echo "🌐 Installing Nginx..."
sudo apt-get install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Install Git
echo "📚 Installing Git..."
sudo apt-get install -y git

# Install additional dependencies
echo "📦 Installing additional dependencies..."
sudo apt-get install -y build-essential libpq-dev curl wget

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /var/www/streamify
sudo chown -R ubuntu:ubuntu /var/www/streamify

# Note: Database will be on AWS RDS
echo "📝 Note: Using AWS RDS for PostgreSQL database"
echo "   Make sure you have created an RDS instance and noted the endpoint"

echo "✅ EC2 setup complete!"
echo ""
echo "Next steps:"
echo "1. Setup AWS RDS PostgreSQL instance (see RDS_SETUP_GUIDE.md)"
echo "2. Clone your repository to /var/www/streamify"
echo "3. Update backend/.env with RDS endpoint and credentials"
echo "4. Run the backend setup script: ./deploy/backend-setup.sh"
echo "5. Run the frontend setup script: ./deploy/frontend-setup.sh"
echo "6. Configure Nginx: sudo cp deploy/nginx.conf /etc/nginx/sites-available/streamify"
echo "7. Enable site: sudo ln -s /etc/nginx/sites-available/streamify /etc/nginx/sites-enabled/"
echo "8. Restart Nginx: sudo systemctl restart nginx"
