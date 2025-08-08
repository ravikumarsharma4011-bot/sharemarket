# NSE Top Gainers (Last 1 Hour)

A ready-to-deploy **Next.js** site that lists **Top 50 NSE gainers over the last 60 minutes** with an **industry filter**.
It supports **Demo (mock)** and **Live** modes. Live mode is designed to work with a Zerodha **Kite Connect** app.

See full instructions inside this README after you unzip.

## Quick Start
1) `npm install`
2) `npm run dev`
3) Open http://localhost:3000

For deployment on Vercel:
- Add env vars: `KITE_API_KEY`, `KITE_API_SECRET`, `USE_LIVE` (true/false)
- Set Kite redirect URL to `/api/kite/callback`
- Flip `USE_LIVE=true` when you wire the real data fetching in `/api/top-gainers/route.ts`
