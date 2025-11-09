# Elphie UI Deployment Guide

Complete guide for deploying Elphie UI with Railway backend and GitHub Pages frontend.

## Architecture Overview

```
┌─────────────────────┐         WebSocket (wss://)         ┌──────────────────────┐
│   GitHub Pages      │ ────────────────────────────────▶ │   Railway            │
│   (Frontend)        │                                    │   (Backend)          │
│                     │                                    │                      │
│ - React + Vite      │                                    │ - Go WebSocket API   │
│ - Static hosting    │                                    │ - Auto SSL/HTTPS     │
│ - HTTPS enabled     │                                    │ - Port: $PORT        │
└─────────────────────┘                                    └──────────────────────┘
        │                                                            │
        │                                                            │
        └─────────── connects to wss://app.railway.app/ws ──────────┘
```

## Part 1: Deploy Backend to Railway

### Step 1: Prepare the Backend Repository

The backend is ready to deploy from this repository (`dancer-go`). The key files are:
- `railway.toml` - Railway build configuration
- `cmd/elphie/web/server.go` - WebSocket API (frontend serving removed)
- Environment variables - Required for deployment

### Step 2: Create Railway Project

1. **Sign up for Railway**: https://railway.app
2. **Create new project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Authorize Railway to access your GitHub
   - Select the `dancer-go` repository

### Step 3: Configure Environment Variables

In Railway dashboard, add these environment variables:

**Required:**
```
POLYGON_API_KEY=your_polygon_api_key_here
```

**ClickHouse Cloud (if using):**
```
CLICKHOUSE_ADDR=your-clickhouse-instance.clickhouse.cloud:9440
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=your_password_here
```

**Optional:**
```
DISCORD_WEBHOOK_URL=your_discord_webhook_url_here
```

### Step 4: Deploy

1. Railway will automatically detect the `railway.toml` and build
2. Monitor the deployment logs in Railway dashboard
3. Once deployed, Railway will provide a URL like: `elphie-production.up.railway.app`

### Step 5: Test the Backend

Test the health endpoint:
```bash
curl https://your-app.railway.app/
# Should return: {"status":"ok","message":"Elphie WebSocket API - connect to /ws"}
```

Test WebSocket connection:
```javascript
// In browser console
const ws = new WebSocket('wss://your-app.railway.app/ws');
ws.onopen = () => console.log('Connected!');
ws.onmessage = (e) => console.log('Message:', e.data);
```

### Railway Notes:

- **Port**: Railway automatically sets `PORT` environment variable (your app uses this)
- **SSL**: Railway provides automatic SSL/TLS (supports `wss://`)
- **Domain**: You can add a custom domain in Railway settings
- **Logs**: View real-time logs in Railway dashboard
- **Cost**: ~$5/month or free tier with credits

---

## Part 2: Deploy Frontend to GitHub Pages

### Step 1: Create Frontend Repository

Option A: User site (kevin1chun.github.io)
```bash
# Create a new repo named: kevin1chun.github.io
# Copy frontend files to this repo
```

Option B: Project site (kevin1chun.github.io/elphie-ui)
```bash
# Create a new repo named: elphie-ui
# Copy frontend files to this repo
```

### Step 2: Copy Frontend Files

Copy everything from the `elphie-frontend/` directory to your new repository:

```bash
cd /path/to/new/repo
cp -r /path/to/dancer-go/elphie-frontend/* .
```

Files you should have:
```
.
├── .github/
│   └── workflows/
│       └── deploy-pages.yml
├── src/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   │   └── websocketService.js  (updated with configurable URL)
│   ├── App.jsx
│   └── main.jsx
├── public/
├── .env.example
├── .env.production  (update this!)
├── index.html
├── package.json
├── vite.config.js   (update if using project site)
└── README.md
```

### Step 3: Update Configuration

1. **Update `.env.production`**:
   ```bash
   # Replace with your actual Railway URL
   VITE_WS_URL=wss://your-actual-app.up.railway.app/ws
   ```

2. **Update `vite.config.js`** (only if using project site):
   ```javascript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
     base: '/elphie-ui/',  // Add this line for project site
     plugins: [react()],
   })
   ```

   **Skip this step if deploying to user site (username.github.io)**

### Step 4: Configure GitHub Repository

1. **Add GitHub Secret**:
   - Go to: Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `VITE_WS_URL`
   - Value: `wss://your-actual-app.up.railway.app/ws`

2. **Enable GitHub Pages**:
   - Go to: Settings → Pages
   - Source: **GitHub Actions** (not "Deploy from a branch")
   - Save

### Step 5: Push and Deploy

```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

### Step 6: Monitor Deployment

1. Go to the "Actions" tab in GitHub
2. Watch "Deploy to GitHub Pages" workflow
3. Once complete (green checkmark), your site is live!

**URLs:**
- User site: `https://kevin1chun.github.io`
- Project site: `https://kevin1chun.github.io/elphie-ui`

---

## Testing the Full Stack

### 1. Check Backend Health
```bash
curl https://your-app.railway.app/
```

### 2. Test WebSocket Connection
Open browser console on your GitHub Pages site:
```javascript
// Should see WebSocket connection logs
// Check Network tab → WS filter
```

### 3. Verify Data Flow

1. Open the GitHub Pages site
2. Open browser DevTools → Console
3. Look for: "WebSocket connection established"
4. Select a trading date
5. Should see: "WebSocket received analysis_history"
6. Chart should render with data

---

## Troubleshooting

### Backend Issues

**Problem**: Build fails on Railway
- Check `railway.toml` exists in repo root
- Verify Go version compatibility (1.24+)
- Check Railway build logs for errors

**Problem**: Backend crashes on startup
- Verify `POLYGON_API_KEY` is set
- Check Railway logs for error messages
- Ensure ClickHouse credentials are correct (if using)

### Frontend Issues

**Problem**: WebSocket connection fails
```
Error: WebSocket connection to 'wss://...' failed
```

Solutions:
1. Verify Railway backend is running
2. Check Railway URL is correct in `.env.production` and GitHub secret
3. Ensure using `wss://` (not `ws://`) for HTTPS sites
4. Check CORS - Railway should allow all origins (already configured)

**Problem**: GitHub Pages shows 404
- Verify GitHub Pages is enabled in settings
- Check "Source" is set to "GitHub Actions"
- Wait 2-3 minutes for deployment
- Check Actions tab for workflow status

**Problem**: GitHub Actions fails
- Check `VITE_WS_URL` secret is set correctly
- Verify `deploy-pages.yml` is in `.github/workflows/`
- Check Actions logs for specific error

**Problem**: Site loads but no data
- Check browser console for errors
- Verify WebSocket URL in Network tab
- Test backend directly with curl
- Check Railway logs for backend errors

### Mixed Content Errors

If you see:
```
Mixed Content: The page at 'https://...' was loaded over HTTPS,
but attempted to connect to the insecure WebSocket endpoint 'ws://...'
```

**Fix**: Update `.env.production` to use `wss://` instead of `ws://`

---

## Updating the Deployment

### Update Backend
```bash
# In dancer-go repo
git add .
git commit -m "Update backend"
git push origin main
# Railway auto-deploys
```

### Update Frontend
```bash
# In frontend repo
git add .
git commit -m "Update frontend"
git push origin main
# GitHub Actions auto-deploys
```

---

## Port Configuration

### Railway Backend
- **Internal port**: Uses `$PORT` environment variable (Railway sets this automatically)
- **External port**: 443 (HTTPS/WSS) - Railway handles SSL termination
- **Your code**: Listens on `os.Getenv("PORT")` with fallback to 8080

### WebSocket Protocol
- WebSocket uses the **same port** as HTTP/HTTPS
- `ws://` → port 80 (HTTP)
- `wss://` → port 443 (HTTPS)
- Railway automatically handles the routing

### Example Flow
```
Client connects to: wss://your-app.railway.app/ws (port 443)
         ↓
Railway SSL termination
         ↓
Routes to your Go app: localhost:$PORT (e.g., 8080)
         ↓
Your code serves: /ws endpoint
```

---

## Cost Estimation

### Railway
- **Free tier**: $5 credit/month (enough for testing)
- **Pro plan**: ~$5-10/month for small apps
- **Usage-based**: Charged for actual usage (CPU/RAM/bandwidth)

### GitHub Pages
- **Free**: Unlimited for public repositories
- **Bandwidth**: 100GB/month soft limit
- **Build minutes**: 2,000/month for free accounts

**Total estimated cost**: $0-10/month depending on usage

---

## Production Checklist

Before going to production:

- [ ] Railway backend is deployed and healthy
- [ ] Environment variables are set (POLYGON_API_KEY, etc.)
- [ ] WebSocket endpoint is accessible (`/ws`)
- [ ] GitHub Pages frontend is deployed
- [ ] WebSocket URL is correctly configured
- [ ] Test on multiple browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile devices
- [ ] Set up monitoring (Railway logs, Sentry, etc.)
- [ ] Consider custom domain for Railway backend
- [ ] Consider custom domain for GitHub Pages
- [ ] Set up alerts for backend errors
- [ ] Document any API rate limits (Polygon.io)

---

## Next Steps

1. **Custom Domains**:
   - Railway: Add custom domain in Railway dashboard
   - GitHub Pages: Add custom domain in repo settings

2. **Monitoring**:
   - Railway provides built-in metrics
   - Consider adding Sentry for error tracking
   - Set up Discord webhooks for alerts (already supported)

3. **Scaling**:
   - Railway can scale vertically (more CPU/RAM)
   - Consider Redis for distributed caching
   - Use Railway's autoscaling features

4. **Security**:
   - Rotate API keys regularly
   - Use Railway's secret management
   - Consider rate limiting on WebSocket connections
   - Enable Railway's DDoS protection
