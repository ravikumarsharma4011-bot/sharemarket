# sharemarket0607 — Vercel-ready (Zerodha Options)

This build is designed for **Vercel** (serverless). It removes the custom Express server and uses **Next.js API routes** and **iron-session** cookies for auth/session. Live data uses **polling** (Vercel doesn't support persistent WebSockets).

## Deploy (Vercel)
1) Push to GitHub
2) Import the repo in Vercel
3) Set Environment Variables:
   - `KITE_API_KEY`
   - `KITE_API_SECRET`
   - `KITE_REDIRECT_URL` → `https://<your-domain>.vercel.app/api/auth/callback` (must be whitelisted in your Kite app)
   - `SESSION_PASSWORD` → random 32+ chars
   - `NEXT_PUBLIC_DEFAULT_PRODUCT=NRML`
   - `NEXT_PUBLIC_DEFAULT_ORDER_TYPE=LIMIT`
4) Redeploy

## Usage
- Visit `/` → Login with Zerodha (popup). After success it closes and reloads.
- Go to `/options` → Interactive chain → click CE/PE to prefill order form → place **NRML + LIMIT** orders by default.

## Built-in hardening (based on our previous errors)
- Force **NFO** for options instruments
- Auto **tick-size rounding** & **lot-size enforcement**
- Defaults to **NRML + LIMIT**
- Graceful auth/session using encrypted cookie (no filesystem)
- Defensive checks for `tradingsymbol`, quantity > 0, instrument presence
- All API calls wrapped with error responses

> If you need **true live ticks**, use a push service (Ably/Pusher) or a small external Node worker hosting the ticker, then feed updates to the app. For most flows, 1–2s polling of `/api/quotes` works fine.

MIT © 2025
