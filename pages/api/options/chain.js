import { withSessionApi } from "@/lib/session";
import { getKite } from "@/lib/kite";

function chunk(arr, size){ const out=[]; for(let i=0;i<arr.length;i+=size) out.push(arr.slice(i,i+size)); return out; }
function iso(d){ return new Date(d).toISOString(); }

export default withSessionApi(async function handler(req, res, session){
  try{
    const base = req.query.base || 'NIFTY';
    const expiry = req.query.expiry;
    const access_token = session?.access_token;
    if(!access_token) return res.status(401).json({ ok:false, error: "Not logged in" });

    const now = new Date();
    const cutoff = new Date('2025-08-14T23:59:59.999Z'); // inclusive through Aug 14, 2025

    const k = getKite(access_token);
    const all = await k.getInstruments();
    const filteredAll = all.filter(i => i.exchange==='NFO' && i.segment==='NFO-OPT' && i.name===base);

    // Unique expiries, sorted
    const allExpiries = Array.from(new Set(filteredAll.map(i => i.expiry))).sort((a,b)=> new Date(a)-new Date(b));

    // Keep only expiries within [now, cutoff]
    const windowExpiries = allExpiries.filter(x => {
      const d = new Date(x);
      return d >= now && d <= cutoff;
    });

    if(windowExpiries.length === 0){
      return res.json({ ok:true, strikes: [], expiries: [], chain: [], note: "No expiries between today and 2025-08-14" });
    }

    // Choose expiry: query param if within window, else nearest within window
    let chosen = expiry && windowExpiries.includes(expiry) ? expiry : windowExpiries[0];

    // Filter chain to chosen expiry
    let chain = filteredAll.filter(i => i.expiry===chosen);

    // Collect strikes for that expiry
    const strikes = Array.from(new Set(chain.map(i => i.strike))).sort((a,b)=>a-b);
    const expiries = windowExpiries;

    // Fetch quotes for chain (batch)
    const ids = chain.map(i => `${i.exchange}:${i.tradingsymbol}`);
    let quotes = {};
    for(const part of chunk(ids, 200)){
      const q = await k.getQuote(part);
      quotes = { ...quotes, ...q };
    }
    chain = chain.map(i => {
      const key = `${i.exchange}:${i.tradingsymbol}`;
      const q = quotes[key];
      const last_price = q?.last_price ?? null;
      return { ...i, last_price };
    });

    res.json({ ok:true, strikes, expiries, chain, chosenExpiry: chosen });
  }catch(e){
    res.status(500).json({ ok:false, error: e.message });
  }
});
