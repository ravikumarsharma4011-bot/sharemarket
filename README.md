# NSE Top Gainers (Last 1 Hour) — No Alias Edition

This build removes the `@/*` alias and uses **relative imports** everywhere,
and fixes the CSS import path. It should deploy on Vercel without config.

## Deploy
1) Upload these files (unzipped) to your GitHub repo **root** (so `app/` and `package.json` are visible).
2) On Vercel: New Project → import repo → Framework: **Next.js** → Deploy.
3) (Optional) Add env vars later: `KITE_API_KEY`, `KITE_API_SECRET`, `USE_LIVE`.
