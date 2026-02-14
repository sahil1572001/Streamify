# 🚀 AWS EC2 Free Tier Deployment Guide

## Complete guide to deploy Streamify on AWS EC2 (Ubuntu 22.04)

---

## 📋 Prerequisites

- AWS Account with free tier eligibility
- AWS CLI installed (optional)
- Your AWS credentials:
  - AWS_REGION: `ap-south-1`
  - AWS_ACCESS_KEY_ID: `AKIAUS3E6WA233HXVUIG`
  - AWS_SECRET_ACCESS_KEY: (your secret key)
- GitHub repository with your code
- Required API keys:
  - TMDB API Key
  - Pinecone API Key
  - OpenAI API Key

---

## 🖥️ Step 1: Launch EC2 Instance (Free Tier)

### Via AWS Console

1. **Sign in to AWS Console**
   - Navigate to EC2 Dashboard
   - Region: `ap-south-1` (Mumbai)

2. **Launch Instance**
   - Click "Launch Instance"
   - **Name**: `streamify-server`

3. **Choose AMI**
   - Select: **Ubuntu Server 22.04 LTS (HVM), SSD Volume Type**
   - Architecture: **64-bit (x86)**
   - ✅ Free tier eligible

4. **Choose Instance Type**
   - Select: **t2.micro** (1 vCPU, 1 GB RAM)
   - ✅ Free tier eligible (750 hours/month)

5. **Key Pair**
   - Create new key pair or use existing
   - Name: `streamify-key`
   - Type: RSA
   - Format: `.pem` (for SSH) or `.ppk` (for PuTTY)
   - **Download and save securely**

6. **Network Settings**
   - Create security group: `streamify-sg`
   - Allow SSH (port 22) from your IP
   - Allow HTTP (port 80) from anywhere (0.0.0.0/0)
   - Allow HTTPS (port 443) from anywhere (0.0.0.0/0)
   - Allow Custom TCP (port 8000) from anywhere (for testing)

7. **Configure Storage**
   - Size: **30 GB** (free tier: up to 30 GB)
   - Volume Type: **General Purpose SSD (gp3)**

8. **Launch Instance**
   - Click "Launch Instance"
   - Wait for instance to be in "Running" state
   - Note the **Public IPv4 address**

### Security Group Rules

| Type | Protocol | Port Range | Source | Description |
|------|----------|------------|--------|-------------|
| SSH | TCP | 22 | Your IP | SSH access |
| HTTP | TCP | 80 | 0.0.0.0/0 | Web traffic |
| HTTPS | TCP | 443 | 0.0.0.0/0 | Secure web traffic |
| Custom TCP | TCP | 8000 | 0.0.0.0/0 | Backend API (testing) |

---

## 🔐 Step 2: Connect to EC2 Instance

### Using SSH (Linux/Mac/Windows PowerShell)

```bash
# Set permissions on key file (Linux/Mac)
chmod 400 streamify-key.pem

# Connect to instance
ssh -i streamify-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

### Using PuTTY (Windows)

1. Open PuTTY
2. Host Name: `ubuntu@YOUR_EC2_PUBLIC_IP`
3. Port: 22
4. Connection → SSH → Auth → Browse for `.ppk` file
5. Click "Open"

---

## 📦 Step 3: Initial Server Setup

Once connected to your EC2 instance:

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Download setup script
wget https://raw.githubusercontent.com/YOUR_USERNAME/streamify/main/deploy/ec2-setup.sh

# Make executable
chmod +x ec2-setup.sh

# Run setup script
./ec2-setup.sh
```

**Or manually run the setup:**

```bash
# Update system packages
sudo apt-get update
sudo apt-get upgrade -y

# Install Python 3.11
sudo apt-get install -y software-properties-common
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt-get update
sudo apt-get install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Nginx
sudo apt-get install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Install Git
sudo apt-get install -y git build-essential libpq-dev
```

---

## 🗄️ Step 4: Test RDS Connection

```bash
# Install PostgreSQL client (already done in Step 3)
sudo apt-get install -y postgresql-client

# Test connection to RDS
psql -h YOUR_RDS_ENDPOINT \
     -U postgres \
     -d streamify \
     -c "SELECT version();"

# Enter your RDS master password when prompted
```

**If connection fails:**
- Check RDS security group allows EC2 security group
- Verify RDS endpoint is correct
- Ensure RDS instance is "Available" status
- Check VPC settings (EC2 and RDS should be in same VPC)

---

## 📥 Step 5: Clone Repository

```bash
# Create application directory
sudo mkdir -p /var/www/streamify
sudo chown -R ubuntu:ubuntu /var/www/streamify

# Clone your repository
cd /var/www
git clone https://github.com/YOUR_USERNAME/streamify.git
cd streamify
```

---

## 🔧 Step 6: Configure Backend

```bash
# Navigate to backend
cd /var/www/streamify/backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file
nano .env
```

**Add the following to `.env`:**

```bash
# Database Configuration (AWS RDS)
DATABASE_HOSTNAME=streamify-db.xxxxx.ap-south-1.rds.amazonaws.com
DATABASE_PORT=5432
DATABASE_NAME=streamify
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_rds_master_password

# JWT Configuration
SECRET_KEY=your-super-secret-key-change-this-in-production-make-it-long-and-random
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AWS Configuration
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIAUS3E6WA233HXVUIG
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_KEY_HERE

# TMDB API
TMDB_API_KEY=your_tmdb_api_key_here
TMDB_LANGUAGE=en-US

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=streamify-movies

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
EMBEDDING_MODEL=text-embedding-ada-002
EMBEDDING_DIMENSION=1536
```

**Save and exit** (Ctrl+X, Y, Enter)

```bash
# Run database migrations (if using Alembic)
alembic upgrade head

# Seed initial data
python -m app.seed_data

# Test backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Test in browser:** `http://YOUR_EC2_IP:8000/docs`

Press `Ctrl+C` to stop the test server.

---

## 🎨 Step 7: Configure Frontend

```bash
# Navigate to frontend
cd /var/www/streamify/streamify-frontend

# Install dependencies
npm install

# Create production environment file
nano .env.production
```

**Add the following:**

```bash
EXPO_PUBLIC_API_URL=http://YOUR_EC2_PUBLIC_IP
```

**Save and exit**

```bash
# Build for web
npx expo export --platform web

# Copy build to Nginx directory
sudo mkdir -p /var/www/streamify/frontend-build
sudo cp -r dist/* /var/www/streamify/frontend-build/
sudo chown -R www-data:www-data /var/www/streamify/frontend-build
```

---

## 🌐 Step 8: Configure Nginx

```bash
# Copy Nginx configuration
sudo cp /var/www/streamify/deploy/nginx.conf /etc/nginx/sites-available/streamify

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/streamify /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## 🔄 Step 9: Setup Backend as System Service

```bash
# Copy systemd service file
sudo cp /var/www/streamify/deploy/streamify-backend.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable streamify-backend

# Start service
sudo systemctl start streamify-backend

# Check status
sudo systemctl status streamify-backend
```

---

## ✅ Step 10: Verify Deployment

### Test Backend API
```bash
curl http://YOUR_EC2_PUBLIC_IP/health
curl http://YOUR_EC2_PUBLIC_IP/api/movies
```

### Test Frontend
Open browser: `http://YOUR_EC2_PUBLIC_IP`

### Check Logs
```bash
# Backend logs
sudo journalctl -u streamify-backend -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🔒 Step 11: Security Hardening (Optional but Recommended)

### Setup Firewall (UFW)
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Setup SSL with Let's Encrypt (Free)
```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate (requires domain name)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is configured automatically
```

### Secure PostgreSQL
```bash
# Edit PostgreSQL config
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Change peer to md5 for local connections
# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## 🔄 Step 12: Deployment Updates

### Update Backend
```bash
cd /var/www/streamify
git pull origin main

cd backend
source venv/bin/activate
pip install -r requirements.txt

# Restart service
sudo systemctl restart streamify-backend
```

### Update Frontend
```bash
cd /var/www/streamify
git pull origin main

cd streamify-frontend
npm install
npx expo export --platform web

sudo cp -r dist/* /var/www/streamify/frontend-build/
sudo systemctl restart nginx
```

---

## 📊 Monitoring & Maintenance

### Check Service Status
```bash
sudo systemctl status streamify-backend
sudo systemctl status nginx
sudo systemctl status postgresql
```

### View Logs
```bash
# Backend logs
sudo journalctl -u streamify-backend -n 100 --no-pager

# Nginx access logs
sudo tail -100 /var/log/nginx/access.log

# Nginx error logs
sudo tail -100 /var/log/nginx/error.log
```

### Database Backup
```bash
# Create backup
sudo -u postgres pg_dump streamify > backup_$(date +%Y%m%d).sql

# Restore backup
sudo -u postgres psql streamify < backup_20260214.sql
```

### Disk Space Monitoring
```bash
df -h
du -sh /var/www/streamify/*
```

---

## 💰 Cost Optimization (Free Tier)

### EC2 Free Tier Limits
- **750 hours/month** of t2.micro instance (enough for 24/7 operation)
- **30 GB** of EBS storage
- **15 GB** of bandwidth out
- **1 GB** of bandwidth in

### Tips to Stay in Free Tier
1. Use only 1 t2.micro instance
2. Stop instance when not needed (saves hours)
3. Monitor bandwidth usage
4. Use CloudWatch free tier for monitoring
5. Clean up old logs and temporary files

### Monitor Usage
- AWS Console → Billing Dashboard → Free Tier Usage

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check logs
sudo journalctl -u streamify-backend -n 50

# Check if port 8000 is in use
sudo lsof -i :8000

# Test manually
cd /var/www/streamify/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend not loading
```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx configuration
sudo nginx -t

# Check file permissions
ls -la /var/www/streamify/frontend-build/
```

### Database connection failed
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -h localhost -U streamify_user -d streamify

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Out of memory
```bash
# Check memory usage
free -h

# Add swap space (if needed)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 🎉 Success Checklist

- [ ] EC2 instance running (t2.micro)
- [ ] Security group configured correctly
- [ ] PostgreSQL database created and accessible
- [ ] Backend API running on port 8000
- [ ] Frontend built and served by Nginx
- [ ] Nginx configured as reverse proxy
- [ ] Backend systemd service enabled
- [ ] Application accessible via public IP
- [ ] AWS credentials configured
- [ ] All API keys added to .env
- [ ] Database seeded with initial data

---

## 📞 Quick Commands Reference

```bash
# Restart all services
sudo systemctl restart streamify-backend nginx postgresql

# View all logs
sudo journalctl -u streamify-backend -f

# Update application
cd /var/www/streamify && git pull && sudo systemctl restart streamify-backend

# Check disk space
df -h

# Check memory
free -h

# Check running processes
ps aux | grep python
ps aux | grep nginx
```

---

## 🌐 Access Your Application

- **Frontend**: `http://YOUR_EC2_PUBLIC_IP`
- **Backend API**: `http://YOUR_EC2_PUBLIC_IP/api/`
- **API Docs**: `http://YOUR_EC2_PUBLIC_IP/docs`
- **Health Check**: `http://YOUR_EC2_PUBLIC_IP/health`

---

**Deployment Date**: February 14, 2026  
**Instance Type**: AWS EC2 t2.micro (Free Tier)  
**Region**: ap-south-1 (Mumbai)  
**Status**: Production Ready ✅
