# Elphie UI Setup for kevinchun.com

This repository hosts the Elphie UI frontend on GitHub Pages, accessible at:
- https://kevin1chun.github.io
- https://kevinchun.com (custom domain)

## Backend Configuration

**Railway Backend URL**: `https://dancer-go-production.up.railway.app`
**WebSocket URL**: `wss://dancer-go-production.up.railway.app/ws`

This URL is configured in `.env.production`.

## Deployment

### Prerequisites

1. **GitHub Pages is enabled** in repository settings
   - Settings → Pages → Source: **GitHub Actions**

2. **WebSocket URL is configured** in `.env.production`
   - Already set to: `wss://dancer-go-production.up.railway.app/ws`
   - No GitHub secrets needed - URL is hardcoded in the file

### Deploy to GitHub Pages

Simply push to the `main` branch:

```bash
git add .
git commit -m "Update elphie UI"
git push origin main
```

GitHub Actions will automatically:
1. Build the React app
2. Deploy to GitHub Pages
3. Site will be live in 2-3 minutes

### Monitor Deployment

- Go to **Actions** tab to see deployment status
- Green checkmark = successful deployment
- Red X = check logs for errors

## Local Development

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The app will run on `http://localhost:5174`.

**Local WebSocket**: By default, it will try to connect to `ws://localhost:5174/ws` (proxied to `localhost:8080`).

**Connect to Railway Backend** (for testing with production data):
```bash
# Create local override
echo "VITE_WS_URL=wss://dancer-go-production.up.railway.app/ws" > .env.development.local

# Run dev server
npm run dev
```

### Build for Production

```bash
npm run build
```

Built files will be in `dist/` directory.

## Custom Domain (kevinchun.com)

The `CNAME` file contains `kevinchun.com`, which tells GitHub Pages to serve this site at that domain.

**DNS Configuration** (already set up):
- CNAME record pointing `kevinchun.com` → `kevin1chun.github.io`

## Architecture

```
┌──────────────────────┐
│   kevinchun.com      │
│   (GitHub Pages)     │
│                      │
│   React + Vite       │
│   Static Hosting     │
└──────────┬───────────┘
           │
           │ WebSocket (wss://)
           │
           ▼
┌──────────────────────────────────┐
│   Railway Backend                │
│   dancer-go-production           │
│                                  │
│   Go WebSocket API               │
│   Real-time market data          │
└──────────────────────────────────┘
```

## Environment Variables

### Production (.env.production)
```bash
VITE_WS_URL=wss://dancer-go-production.up.railway.app/ws
```

**Note**: The WebSocket URL is hardcoded in `.env.production` and committed to the repository. No GitHub secrets are required for deployment.

## Testing

### 1. Test Backend Health

```bash
curl https://dancer-go-production.up.railway.app/
```

Expected response:
```json
{"status":"ok","message":"Elphie WebSocket API - connect to /ws"}
```

### 2. Test WebSocket Connection

Open browser console on kevinchun.com:

```javascript
const ws = new WebSocket('wss://dancer-go-production.up.railway.app/ws');
ws.onopen = () => console.log('Connected to Railway backend!');
ws.onmessage = (e) => console.log('Received:', JSON.parse(e.data));
```

### 3. Test Frontend

1. Visit https://kevinchun.com
2. Open DevTools → Console
3. Look for: "WebSocket connection established"
4. Select a trading date
5. Chart should load with real-time data

## Troubleshooting

### WebSocket Connection Fails

Check:
- ✓ Railway backend is running: `curl https://dancer-go-production.up.railway.app/`
- ✓ URL in `.env.production` is correct
- ✓ Using `wss://` (not `ws://`)
- ✓ `.env.production` file is committed to repository

### GitHub Pages Shows Old Site

- Check Actions tab for deployment status
- Wait 2-3 minutes for CDN propagation
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Clear browser cache

### Build Fails

- Check Actions logs for specific error
- Verify `package.json` dependencies
- Ensure Node.js version compatibility (20.x)

### Custom Domain Not Working

- Verify `CNAME` file contains `kevinchun.com`
- Check DNS settings (CNAME record)
- Wait for DNS propagation (up to 24 hours)

## Files Structure

```
kevin1chun.github.io/
├── .github/
│   └── workflows/
│       └── deploy-pages.yml    # Auto-deployment workflow
├── src/
│   ├── components/             # React components
│   ├── hooks/                  # Custom React hooks
│   ├── services/
│   │   └── websocketService.js # WebSocket connection (configurable URL)
│   ├── App.jsx
│   └── main.jsx
├── public/                     # Static assets
├── backup/                     # Backup of old site
├── .env.production             # Production WebSocket URL
├── .env.example                # Template
├── CNAME                       # Custom domain
├── index.html
├── package.json
├── vite.config.js
├── SETUP.md                    # This file
├── DEPLOYMENT.md               # Detailed deployment guide
└── README.md                   # Frontend documentation
```

## Updating the Site

### Update Content

```bash
# Make changes to src/
git add .
git commit -m "Update content"
git push origin main
# GitHub Actions auto-deploys
```

### Update Backend URL

If Railway backend URL changes:

1. Update `.env.production`:
   ```bash
   VITE_WS_URL=wss://new-url.railway.app/ws
   ```

2. Commit and push:
   ```bash
   git add .env.production
   git commit -m "Update Railway backend URL"
   git push origin main
   ```

GitHub Actions will automatically redeploy with the new URL.

## Backup

Old site files are saved in `backup/` directory:
- `index.html` - Weight calculator
- `IMG_*.png` - Image
- `README.md` - Old readme
- `CNAME` - Custom domain (also restored to root)

## Support

- **Frontend Issues**: Check GitHub Actions logs
- **Backend Issues**: Check Railway logs at railway.app
- **WebSocket Issues**: Check browser DevTools → Console + Network (WS tab)

## Next Steps

1. ✅ Files are set up
2. ✅ WebSocket URL configured in `.env.production`
3. ⏳ Verify GitHub Pages is enabled (Source: GitHub Actions)
4. ⏳ Push to deploy
5. ⏳ Visit https://kevinchun.com to test

---

**Live Site**: https://kevinchun.com
**Backend**: https://dancer-go-production.up.railway.app
**Repository**: https://github.com/kevin1chun/kevin1chun.github.io
