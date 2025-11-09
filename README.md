# Elphie UI - Frontend

Real-time equity analysis dashboard frontend for GitHub Pages deployment.

## Overview

This is the frontend component of Elphie UI, designed to be deployed to GitHub Pages and connect to a backend WebSocket API running on Railway (or any other hosting platform).

## Architecture

- **Frontend**: React + Vite (deployed to GitHub Pages)
- **Backend**: Go WebSocket API (deployed to Railway)
- **Communication**: WebSocket connection for real-time data streaming

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. The app will run on `http://localhost:5174` and connect to `ws://localhost:5174/ws` by default (for local backend testing).

## Deployment to GitHub Pages

### Prerequisites

1. Create a new GitHub repository (e.g., `kevin1chun.github.io` or a project repo)
2. Copy all files from this `elphie-frontend/` directory to your new repository

### Configuration Steps

1. **Update WebSocket URL**:
   - Edit `.env.production` and replace with your Railway backend URL:
     ```
     VITE_WS_URL=wss://your-actual-railway-app.up.railway.app/ws
     ```

2. **Add GitHub Secret**:
   - Go to your GitHub repository settings
   - Navigate to: Settings → Secrets and variables → Actions
   - Add a new repository secret:
     - Name: `VITE_WS_URL`
     - Value: `wss://your-actual-railway-app.up.railway.app/ws`

3. **Enable GitHub Pages**:
   - Go to: Settings → Pages
   - Source: GitHub Actions
   - Save

4. **Update vite.config.js** (if using a project repo):
   - If deploying to `username.github.io/repo-name`, update the base path:
     ```javascript
     export default defineConfig({
       base: '/repo-name/',  // Add this line
       plugins: [react()],
     })
     ```

5. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial frontend deployment"
   git push origin main
   ```

6. **Monitor Deployment**:
   - Go to the "Actions" tab in your GitHub repository
   - Watch the "Deploy to GitHub Pages" workflow run
   - Once complete, your site will be available at:
     - User site: `https://username.github.io`
     - Project site: `https://username.github.io/repo-name`

## Features

- **Real-time candlestick charts** with intraday trading data
- **Dark pool metrics** visualization (VWAP, volume, largest transactions)
- **ISO classification** (bid/ask/unknown)
- **Historical date selection** for viewing past trading days
- **Live streaming** for current trading session

## Environment Variables

- `VITE_WS_URL`: WebSocket URL for backend connection (required for production)
  - Format: `wss://your-backend.up.railway.app/ws`
  - Falls back to `ws://${window.location.host}/ws` for local development

## Tech Stack

- React 19.1.0
- Vite 7.0.4
- Material-UI (@mui/material 7.3.1)
- TradingView Lightweight Charts (5.0.8)
- Day.js (1.11.12)

## Build for Production

To build locally:

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Troubleshooting

### WebSocket connection fails

1. Check that your Railway backend is running
2. Verify the WebSocket URL in `.env.production` or GitHub secrets
3. Ensure SSL is configured on Railway (required for `wss://` from GitHub Pages)
4. Check browser console for CORS or mixed content errors

### GitHub Pages not updating

1. Check the Actions tab for deployment status
2. Verify GitHub Pages is enabled in repository settings
3. Clear browser cache
4. Wait 2-3 minutes for CDN propagation

### Mixed content errors

If you see mixed content errors, ensure you're using `wss://` (not `ws://`) for the WebSocket URL when deploying to GitHub Pages (which uses HTTPS).
