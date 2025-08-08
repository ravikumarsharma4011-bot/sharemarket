# NSE Top Gainers (Last 1 Hour) — with Zerodha Login
Includes a Login with Zerodha flow and prior fixes (no aliases).

## Env vars (Vercel → Project → Settings → Environment Variables)
- KITE_API_KEY
- KITE_API_SECRET
- KITE_REDIRECT_URL  (e.g. https://YOUR.vercel.app/api/kite/callback)
- USE_LIVE=false

## Routes
- /api/kite/login → redirects to Zerodha login
- /api/kite/callback → exchanges request_token → access_token, stores secure cookie
- /api/kite/status → returns { ok: boolean }
- /api/top-gainers → mock data for now; set USE_LIVE=true + wire real fetch

Upload contents to repo root and deploy on Vercel (Next.js).
