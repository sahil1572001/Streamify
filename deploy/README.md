# 🚀 Streamify Deployment Scripts

This directory contains all deployment scripts and configurations for AWS EC2 deployment.

## 📁 Files Overview

| File | Description |
|------|-------------|
| `EC2_DEPLOYMENT_GUIDE.md` | Complete step-by-step deployment guide |
| `quick-deploy-ec2.sh` | Automated deployment script (recommended) |
| `ec2-setup.sh` | System setup script |
| `backend-setup.sh` | Backend configuration script |
| `frontend-setup.sh` | Frontend build script |
| `nginx.conf` | Nginx configuration for reverse proxy |
| `streamify-backend.service` | Systemd service file for backend |

## 🎯 Quick Start (Recommended)

### 1. Launch EC2 Instance
- **Type**: t2.micro (Free Tier)
- **AMI**: Ubuntu Server 22.04 LTS
- **Storage**: 30 GB
- **Region**: ap-south-1 (Mumbai)
- **Security Group**: Allow ports 22, 80, 443, 8000

### 2. Connect to EC2
```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

### 3. Run Quick Deploy Script
```bash
# Download the script
wget https://raw.githubusercontent.com/YOUR_USERNAME/streamify/main/deploy/quick-deploy-ec2.sh

# Make executable
chmod +x quick-deploy-ec2.sh

# Run deployment
./quick-deploy-ec2.sh
```

### 4. Configure API Keys
```bash
nano /var/www/streamify/backend/.env
```

Update these values:
- `AWS_SECRET_ACCESS_KEY`
- `TMDB_API_KEY`
- `PINECONE_API_KEY`
- `OPENAI_API_KEY`

### 5. Restart Backend
```bash
sudo systemctl restart streamify-backend
```

### 6. Access Your App
- **Frontend**: `http://YOUR_EC2_IP`
- **API Docs**: `http://YOUR_EC2_IP/docs`

## 📖 Detailed Instructions

For complete step-by-step instructions, see: **[EC2_DEPLOYMENT_GUIDE.md](EC2_DEPLOYMENT_GUIDE.md)**

## 🔧 Manual Deployment

If you prefer manual deployment:

1. Run `ec2-setup.sh` - Install system dependencies
2. Clone your repository to `/var/www/streamify`
3. Run `backend-setup.sh` - Setup backend
4. Run `frontend-setup.sh` - Build frontend
5. Copy `nginx.conf` to `/etc/nginx/sites-available/`
6. Copy `streamify-backend.service` to `/etc/systemd/system/`
7. Enable and start services

## 🐛 Troubleshooting

### Check Service Status
```bash
sudo systemctl status streamify-backend
sudo systemctl status nginx
```

### View Logs
```bash
# Backend logs
sudo journalctl -u streamify-backend -f

# Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Restart Services
```bash
sudo systemctl restart streamify-backend
sudo systemctl restart nginx
```

## 🔄 Update Deployment

```bash
cd /var/www/streamify
git pull origin main

# Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart streamify-backend

# Update frontend
cd ../streamify-frontend
npm install
npx expo export --platform web
sudo cp -r dist/* /var/www/streamify/frontend-build/
sudo systemctl restart nginx
```

## 💰 Cost Estimate (Free Tier)

- **EC2 t2.micro**: Free for 750 hours/month (12 months)
- **30 GB EBS**: Free tier included
- **15 GB Bandwidth**: Free tier included
- **Total**: $0/month (within free tier limits)

## 🔒 Security Recommendations

1. **Restrict SSH**: Only allow your IP in security group
2. **Setup SSL**: Use Let's Encrypt for HTTPS
3. **Enable Firewall**: Configure UFW
4. **Regular Updates**: Keep system packages updated
5. **Strong Passwords**: Use strong database passwords
6. **Environment Variables**: Never commit `.env` files

## 📞 Support

For issues or questions:
1. Check `EC2_DEPLOYMENT_GUIDE.md` troubleshooting section
2. Review service logs
3. Verify security group settings
4. Check AWS free tier usage limits

---

**Last Updated**: February 14, 2026  
**Tested On**: Ubuntu Server 22.04 LTS, AWS EC2 t2.micro
