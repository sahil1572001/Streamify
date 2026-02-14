# 🚀 Streamify Deployment Guide

## Overview
This guide covers deploying the Streamify full-stack application with AWS integration.

---

## 📋 Prerequisites

### Required Services
1. **AWS Account** - For S3, RDS (optional), and other AWS services
2. **Render.com Account** - For backend API hosting (free tier available)
3. **Netlify Account** - For frontend web hosting (free tier available)
4. **PostgreSQL Database** - AWS RDS or managed PostgreSQL service
5. **Pinecone Account** - For vector search
6. **OpenAI Account** - For embeddings
7. **TMDB Account** - For movie data

### API Keys & Credentials
- ✅ AWS Access Key ID: `AKIAUS3E6WA233HXVUIG`
- ✅ AWS Secret Access Key: (configured)
- ✅ AWS Region: `ap-south-1`
- 🔑 TMDB API Key
- 🔑 Pinecone API Key
- 🔑 OpenAI API Key
- 🔑 Database credentials

---

## 🎯 Deployment Strategy

### Architecture
```
Frontend (Netlify) → Backend API (Render) → PostgreSQL Database
                                         ↓
                                    AWS Services (S3, etc.)
                                         ↓
                                    Pinecone (Vector DB)
                                         ↓
                                    OpenAI (Embeddings)
```

---

## 🔧 Step 1: Database Setup

### Option A: AWS RDS (Recommended for Production)

1. **Create RDS PostgreSQL Instance**
   ```bash
   # Via AWS Console or CLI
   aws rds create-db-instance \
     --db-instance-identifier streamify-db \
     --db-instance-class db.t3.micro \
     --engine postgres \
     --master-username streamify_admin \
     --master-user-password YOUR_STRONG_PASSWORD \
     --allocated-storage 20 \
     --region ap-south-1
   ```

2. **Configure Security Group**
   - Allow inbound traffic on port 5432 from Render.com IP ranges
   - Or allow from anywhere (0.0.0.0/0) for testing (not recommended for production)

3. **Note Database Endpoint**
   - Example: `streamify-db.xxxxx.ap-south-1.rds.amazonaws.com`

### Option B: Managed PostgreSQL (Alternative)
- Use Render.com PostgreSQL (free tier: 90 days)
- Use Supabase PostgreSQL (free tier available)
- Use ElephantSQL (free tier: 20MB)

---

## 🚀 Step 2: Backend Deployment (Render.com)

### Method 1: Using Render Dashboard (Recommended)

1. **Sign up/Login to Render.com**
   - Visit: https://render.com

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `streamify` repository
   - Root Directory: `backend`

3. **Configure Build Settings**
   - **Name**: `streamify-backend`
   - **Region**: Choose closest to your users
   - **Branch**: `main` or `master`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

4. **Add Environment Variables**
   ```
   DATABASE_HOSTNAME=your-rds-endpoint.ap-south-1.rds.amazonaws.com
   DATABASE_PORT=5432
   DATABASE_NAME=streamify
   DATABASE_USERNAME=streamify_admin
   DATABASE_PASSWORD=your_strong_password
   
   SECRET_KEY=generate-a-strong-secret-key-here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   
   AWS_REGION=ap-south-1
   AWS_ACCESS_KEY_ID=AKIAUS3E6WA233HXVUIG
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   
   TMDB_API_KEY=your_tmdb_api_key
   
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_ENVIRONMENT=us-east-1-aws
   PINECONE_INDEX_NAME=streamify-movies
   
   OPENAI_API_KEY=your_openai_api_key
   EMBEDDING_MODEL=text-embedding-ada-002
   EMBEDDING_DIMENSION=1536
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Note your backend URL: `https://streamify-backend.onrender.com`

### Method 2: Using Render Blueprint (render.yaml)

1. **Push render.yaml to repository**
   ```bash
   cd c:\Project\vectorDB\streamify
   git add backend/render.yaml
   git commit -m "Add Render deployment config"
   git push
   ```

2. **Create from Blueprint**
   - In Render Dashboard: "New +" → "Blueprint"
   - Connect repository and select `backend/render.yaml`
   - Configure environment variables
   - Deploy

---

## 🌐 Step 3: Frontend Deployment (Netlify)

### Prepare Frontend for Web Build

1. **Build Expo Web Version**
   ```powershell
   cd c:\Project\vectorDB\streamify\streamify-frontend
   
   # Install dependencies
   npm install
   
   # Export for web
   npx expo export --platform web
   ```

2. **Create netlify.toml**
   ```toml
   [build]
     command = "npx expo export --platform web"
     publish = "dist"
   
   [build.environment]
     NODE_VERSION = "18"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

### Deploy to Netlify

#### Method 1: Netlify CLI (Recommended)

1. **Install Netlify CLI**
   ```powershell
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```powershell
   netlify login
   ```

3. **Deploy**
   ```powershell
   cd c:\Project\vectorDB\streamify\streamify-frontend
   
   # Build for production
   npx expo export --platform web
   
   # Deploy
   netlify deploy --prod --dir=dist
   ```

4. **Configure Environment Variables**
   - In Netlify Dashboard → Site Settings → Environment Variables
   - Add: `EXPO_PUBLIC_API_URL=https://streamify-backend.onrender.com`

#### Method 2: Netlify Dashboard

1. **Sign up/Login to Netlify**
   - Visit: https://netlify.com

2. **Deploy Site**
   - Drag and drop the `dist` folder
   - Or connect GitHub repository

3. **Configure Build Settings**
   - **Build command**: `npx expo export --platform web`
   - **Publish directory**: `dist`
   - **Environment variables**: `EXPO_PUBLIC_API_URL=https://streamify-backend.onrender.com`

---

## 🗄️ Step 4: Database Migration & Seeding

### Run Migrations

1. **Connect to Backend Shell** (Render Dashboard)
   - Go to your web service → "Shell" tab
   
2. **Run Alembic Migrations** (if using Alembic)
   ```bash
   alembic upgrade head
   ```

3. **Seed Initial Data**
   ```bash
   python -m app.seed_data
   ```

### Alternative: Local Migration with Remote DB

```powershell
cd c:\Project\vectorDB\streamify\backend

# Set environment variables to point to production DB
$env:DATABASE_HOSTNAME="your-rds-endpoint.ap-south-1.rds.amazonaws.com"
$env:DATABASE_PORT="5432"
$env:DATABASE_NAME="streamify"
$env:DATABASE_USERNAME="streamify_admin"
$env:DATABASE_PASSWORD="your_password"

# Activate virtual environment
.\venv\Scripts\activate

# Run migrations
alembic upgrade head

# Seed data
python -m app.seed_data
```

---

## 🔐 Step 5: AWS Services Configuration

### S3 Bucket Setup (for media storage)

1. **Create S3 Bucket**
   ```bash
   aws s3 mb s3://streamify-media --region ap-south-1
   ```

2. **Configure CORS**
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```

3. **Set Bucket Policy** (for public read)
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::streamify-media/*"
       }
     ]
   }
   ```

### Pinecone Index Setup

1. **Create Pinecone Index**
   ```python
   import pinecone
   
   pinecone.init(api_key="your_api_key", environment="us-east-1-aws")
   
   pinecone.create_index(
       name="streamify-movies",
       dimension=1536,
       metric="cosine"
   )
   ```

---

## ✅ Step 6: Testing Deployment

### Test Backend API

1. **Health Check**
   ```bash
   curl https://streamify-backend.onrender.com/health
   ```

2. **API Documentation**
   - Visit: `https://streamify-backend.onrender.com/docs`

3. **Test Endpoints**
   ```bash
   # Get movies
   curl https://streamify-backend.onrender.com/api/movies
   
   # Test authentication
   curl -X POST https://streamify-backend.onrender.com/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"testpass123"}'
   ```

### Test Frontend

1. **Visit Deployed Site**
   - URL: `https://your-site-name.netlify.app`

2. **Test Features**
   - ✅ User signup/login
   - ✅ Browse movies
   - ✅ Search functionality
   - ✅ Watchlist
   - ✅ Vision board

3. **Check Browser Console**
   - Verify API calls are going to production backend
   - Check for CORS errors (should be none)

---

## 🔄 Step 7: Continuous Deployment

### Auto-Deploy on Git Push

1. **Render (Backend)**
   - Auto-deploys on push to `main` branch
   - Configure in Render Dashboard → Settings → Build & Deploy

2. **Netlify (Frontend)**
   - Auto-deploys on push to `main` branch
   - Configure in Netlify Dashboard → Site Settings → Build & Deploy

### Manual Deployment

```powershell
# Backend (via git push)
cd c:\Project\vectorDB\streamify
git add .
git commit -m "Update backend"
git push origin main

# Frontend (via Netlify CLI)
cd streamify-frontend
npx expo export --platform web
netlify deploy --prod --dir=dist
```

---

## 📊 Monitoring & Logs

### Backend Logs (Render)
- Dashboard → Your Service → Logs tab
- Real-time log streaming
- Filter by severity

### Frontend Logs (Netlify)
- Dashboard → Your Site → Functions/Deploy logs
- Build logs for debugging

### Database Monitoring (AWS RDS)
- CloudWatch metrics
- Performance Insights
- Query monitoring

---

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend CORS middleware allows frontend domain
   - Update `app/main.py` CORS origins

2. **Database Connection Failed**
   - Check RDS security group rules
   - Verify credentials in environment variables
   - Test connection from Render shell

3. **Environment Variables Not Loading**
   - Restart Render service after adding variables
   - Check variable names match exactly

4. **Build Failures**
   - Check build logs in Render/Netlify
   - Verify all dependencies in requirements.txt/package.json
   - Check Python/Node version compatibility

5. **API Calls Failing**
   - Verify `EXPO_PUBLIC_API_URL` in frontend
   - Check backend is running: visit `/health` endpoint
   - Inspect network tab in browser DevTools

---

## 💰 Cost Estimation

### Free Tier Usage
- **Render**: Free tier (750 hours/month)
- **Netlify**: Free tier (100GB bandwidth/month)
- **AWS RDS**: Free tier (12 months, db.t3.micro)
- **Pinecone**: Free tier (1 index, 100K vectors)
- **OpenAI**: Pay-as-you-go (~$0.0001/1K tokens)

### Estimated Monthly Cost (After Free Tier)
- **Render**: $7/month (Starter plan)
- **Netlify**: $0-19/month (based on usage)
- **AWS RDS**: $15-30/month (db.t3.micro)
- **Pinecone**: $70/month (Standard plan)
- **OpenAI**: $10-50/month (based on usage)
- **Total**: ~$100-200/month

---

## 🔒 Security Checklist

- [ ] Use strong SECRET_KEY for JWT
- [ ] Enable HTTPS only (Render/Netlify provide free SSL)
- [ ] Restrict CORS to specific domains in production
- [ ] Use environment variables for all secrets
- [ ] Enable RDS encryption at rest
- [ ] Set up AWS IAM roles with least privilege
- [ ] Implement rate limiting on API endpoints
- [ ] Regular security updates for dependencies
- [ ] Enable Render/Netlify DDoS protection
- [ ] Set up monitoring and alerts

---

## 📞 Support & Resources

- **Render Docs**: https://render.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **AWS RDS Docs**: https://docs.aws.amazon.com/rds
- **Expo Web Docs**: https://docs.expo.dev/workflow/web
- **FastAPI Deployment**: https://fastapi.tiangolo.com/deployment

---

## 🎉 Next Steps

1. Set up custom domain (optional)
2. Configure CDN for static assets
3. Implement caching strategy (Redis)
4. Set up monitoring (Sentry, LogRocket)
5. Configure backup strategy for database
6. Implement CI/CD pipeline
7. Load test the application
8. Set up staging environment

---

**Deployment Date**: February 14, 2026  
**Status**: Ready for Production ✅
