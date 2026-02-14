#!/bin/bash

# Frontend Setup Script for EC2

set -e

echo "🎨 Setting up Streamify Frontend..."

# Navigate to frontend directory
cd /var/www/streamify/streamify-frontend

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Create production environment file
echo "📝 Creating production environment file..."
cat > .env.production << EOF
EXPO_PUBLIC_API_URL=http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8000
EOF

echo "🔨 Building frontend for web..."
npx expo export --platform web

# Create build directory for Nginx
echo "📁 Preparing build for Nginx..."
sudo mkdir -p /var/www/streamify/frontend-build
sudo cp -r dist/* /var/www/streamify/frontend-build/
sudo chown -R www-data:www-data /var/www/streamify/frontend-build

echo "✅ Frontend setup complete!"
echo ""
echo "Frontend built and ready to serve via Nginx"
echo "Access your app at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
