import { withSessionApi } from "@/lib/session";
import { getKite } from "@/lib/kite";

function chunk(arr, size){ const out=[]; for(let i=0;i<arr.length;i+=size) out.push(arr.slice(i,i+size)); return out; }
function keyOf(d){ const x = new Date(d); return x.toISOString().split('T')[0]; } // YYYY-MM-DD

export default withSessionApi(async function handler(req, res, session){
  try{
    const base = req.query.base || 'NIFTY';
    const expiryParamRaw = req.query.expiry || ''; // may be ISO with time or just date
    const expiryParam = String(expiryParamRaw).split('T')[0]; // normalize to YYYY-MM-DD
    const access_token = session?.access_token;
    if(!access_token) return res.status(401).json({ ok:false, error: "Not logged in" });

    const now = new Date();
    const cutoff = new Date('2025-08-14T23:59:59.999Z');

    const k = getKite(access_token);
    const all = await k.getInstruments();

    const filteredAll = all
      .filter(i => i.exchange==='NFO' && i.segment==='NFO-OPT' && i.name===base)
      .map(i => ({ ...i, expiry_key: keyOf(i.expiry) }));

    const allKeys = Array.from(new Set(filteredAll.map(i => i.expiry_key))).sort((a,b)=> new Date(a) - new Date(b));

    const todayKey = new Date(now.toISOString().split('T')[0]);
    const windowKeys = allKeys.filter(k => {
      const d = new Date(k);
      return d >= todayKey && d <= cutoff;
    });

    if(windowKeys.length === 0){
      return res.json({ ok:true, strikes: [], expiries: [], chain: [], note: "No expiries between today and 2025-08-14" });
    }

    const chosenKey = (expiryParam && windowKeys.includes(expiryParam)) ? expiryParam : windowKeys[0];

    let chain = filteredAll.filter(i => i.expiry_key === chosenKey);

    const strikes = Array.from(new Set(chain.map(i => i.strike))).sort((a,b)=>a-b);

    const ids = chain.map(i => `${i.exchange}:${i.tradingsymbol}`);
    let quotes = {};
    for(const part of chunk(ids, 200)){
      if(part.length===0) continue;
      const q = await k.getQuote(part);
      quotes = { ...quotes, ...q };
    }
    chain = chain.map(i => {
      const key = `${i.exchange}:${i.tradingsymbol}`;
      const q = quotes[key];
      const last_price = (q && typeof q.last_price === 'number') ? q.last_price : null;
      return { ...i, last_price };
    });

    res.json({ ok:true, strikes, expiries: windowKeys, chain, chosenExpiry: chosenKey });
  }catch(e){
    res.status(500).json({ ok:false, error: e.message });
  }
});
