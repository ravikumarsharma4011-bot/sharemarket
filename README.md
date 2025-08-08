# sharemarket0607

Production-ready Next.js app (Vercel) using Zerodha Kite Connect.

## Env Vars (Vercel)
- `SESSION_PASSWORD` (>=32 chars)
- `KITE_API_KEY`
- `KITE_API_SECRET`
- `NEXT_PUBLIC_DEFAULT_PRODUCT=NRML`
- `NEXT_PUBLIC_DEFAULT_ORDER_TYPE=LIMIT`

## Auth Redirect
Set in Kite console:
- `https://<your-domain>/api/auth/callback`
