# ⚡ Quick Deploy Guide - Streamify

## 🎯 Deploy in 15 Minutes

### Prerequisites
- ✅ AWS credentials updated (ap-south-1)
- ✅ GitHub account
- ✅ Render.com account (free)
- ✅ Netlify account (free)

---

## Step 1: Push Code to GitHub (2 min)

```powershell
cd c:\Project\vectorDB\streamify

# Initialize git if not already done
git init
git add .
git commit -m "Initial deployment setup"

# Create GitHub repo and push
# Visit: https://github.com/new
# Then:
git remote add origin https://github.com/YOUR_USERNAME/streamify.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend to Render (5 min)

1. **Go to Render.com** → https://render.com
2. Click **"New +"** → **"Web Service"**
3. **Connect GitHub** → Select `streamify` repository
4. **Configure:**
   - Name: `streamify-backend`
   - Root Directory: `backend`
   - Runtime: `Python 3`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

5. **Add Environment Variables:**
   ```
   DATABASE_HOSTNAME=<your-database-host>
   DATABASE_PORT=5432
   DATABASE_NAME=streamify
   DATABASE_USERNAME=<your-db-user>
   DATABASE_PASSWORD=<your-db-password>
   SECRET_KEY=<generate-random-string>
   AWS_REGION=ap-south-1
   AWS_ACCESS_KEY_ID=AKIAUS3E6WA233HXVUIG
   AWS_SECRET_ACCESS_KEY=<your-secret>
   TMDB_API_KEY=<your-tmdb-key>
   PINECONE_API_KEY=<your-pinecone-key>
   OPENAI_API_KEY=<your-openai-key>
   ```

6. Click **"Create Web Service"**
7. **Wait 5-10 minutes** for deployment
8. **Copy your backend URL**: `https://streamify-backend.onrender.com`

---

## Step 3: Deploy Frontend to Netlify (5 min)

### Option A: Netlify CLI (Recommended)

```powershell
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Navigate to frontend
cd c:\Project\vectorDB\streamify\streamify-frontend

# Build for web
npx expo export --platform web

# Deploy
netlify deploy --prod --dir=dist
```

### Option B: Netlify Dashboard

1. **Go to Netlify** → https://netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. **Connect GitHub** → Select `streamify` repository
4. **Configure:**
   - Base directory: `streamify-frontend`
   - Build command: `npx expo export --platform web`
   - Publish directory: `streamify-frontend/dist`
   - Environment variables: `EXPO_PUBLIC_API_URL=https://streamify-backend.onrender.com`

5. Click **"Deploy site"**
6. **Wait 3-5 minutes** for deployment
7. **Your site is live!** `https://YOUR-SITE.netlify.app`

---

## Step 4: Update Frontend API URL (2 min)

1. **In Netlify Dashboard:**
   - Site Settings → Environment Variables
   - Add: `EXPO_PUBLIC_API_URL` = `https://streamify-backend.onrender.com`

2. **Redeploy:**
   - Deploys → Trigger deploy → Deploy site

---

## Step 5: Test Your Deployment (1 min)

### Test Backend
```bash
curl https://streamify-backend.onrender.com/health
```

### Test Frontend
Visit: `https://YOUR-SITE.netlify.app`

---

## 🎉 You're Live!

- **Frontend**: `https://YOUR-SITE.netlify.app`
- **Backend API**: `https://streamify-backend.onrender.com`
- **API Docs**: `https://streamify-backend.onrender.com/docs`

---

## 🔧 Common Issues

### Backend won't start?
- Check Render logs for errors
- Verify all environment variables are set
- Ensure database is accessible

### Frontend can't connect to backend?
- Verify `EXPO_PUBLIC_API_URL` is set correctly
- Check CORS settings in backend
- Look at browser console for errors

### Database connection failed?
- Use Render's free PostgreSQL: New → PostgreSQL
- Or use your AWS RDS endpoint
- Ensure security group allows Render IPs

---

## 💡 Pro Tips

1. **Free Database**: Use Render's PostgreSQL (free for 90 days)
2. **Custom Domain**: Add in Netlify → Domain Settings
3. **Auto-Deploy**: Enabled by default on git push
4. **Monitoring**: Check Render/Netlify dashboards for logs

---

**Need Help?** Check `DEPLOYMENT_GUIDE.md` for detailed instructions.
