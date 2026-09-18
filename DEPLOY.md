# Free Deployment Guide

## Prerequisites
- GitHub account
- Vercel account (free)
- Railway account (free)

---

## Step 1: Push to GitHub

```bash
cd D:\POC_Project
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

## Step 2: Deploy Backend to Railway

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Select your repo → `backend` folder
6. Railway auto-detects Java/Spring Boot
7. Add environment variables:
   ```
   SPRING_PROFILES_ACTIVE=prod
   ```
8. Note the deployment URL (e.g., `https://backend.up.railway.app`)

---

## Step 3: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click **"New Project"**
4. Import your repo → `frontend` folder
5. Set environment variables:
   ```
   VITE_API_URL=https://backend.up.railway.app/api/extract
   VITE_SECURE_API_URL=https://backend.up.railway.app/api/extract-secure
   ```
6. Click **Deploy**

---

## Step 4: Update CORS (if needed)

If you get CORS errors, update `ExtractionController.java`:

```java
@CrossOrigin(origins = {"https://your-app.vercel.app", "http://localhost:5173"})
```

---

## Free Tier Limits

| Service | Free Limit |
|---------|------------|
| Vercel | 100GB bandwidth/month |
| Railway | 500 hours/month |
| OpenAI | Pay per use |

---

## Troubleshooting

### Backend won't start
- Check Railway logs
- Ensure Java 17 is selected
- Verify `pom.xml` is in root of backend folder

### Frontend can't connect
- Check environment variables in Vercel
- Verify backend URL is correct
- Check browser console for errors

### CORS errors
- Add Vercel URL to `@CrossOrigin` in backend
- Redeploy backend after changes
