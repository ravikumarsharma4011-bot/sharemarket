import { withSessionApi } from "@/lib/session";
import { getKite } from "@/lib/kite";

function chunk(arr, size){ const out=[]; for(let i=0;i<arr.length;i+=size) out.push(arr.slice(i,i+size)); return out; }

export default withSessionApi(async function handler(req, res, session){
  try{
    const base = req.query.base || 'NIFTY';
    const expiry = req.query.expiry;
    const access_token = session?.access_token;
    if(!access_token) return res.status(401).json({ ok:false, error: "Not logged in" });

    const k = getKite(access_token);
    const all = await k.getInstruments();
    const filtered = all.filter(i => i.exchange==='NFO' && i.segment==='NFO-OPT' && i.name===base);
    const strikes = Array.from(new Set(filtered.map(i => i.strike))).sort((a,b)=>a-b);
    const expiries = Array.from(new Set(filtered.map(i => i.expiry))).sort((a,b)=> new Date(a)-new Date(b));
    const chosen = expiry || expiries[0];
    let chain = filtered.filter(i => i.expiry===chosen);

    // Fetch LTP quotes for these instruments (batch to avoid size limits)
    const ids = chain.map(i => `${i.exchange}:${i.tradingsymbol}`);
    let quotes = {};
    for(const part of chunk(ids, 200)){
      const q = await k.getQuote(part);
      quotes = { ...quotes, ...q };
    }
    chain = chain.map(i => {
      const key = `${i.exchange}:${i.tradingsymbol}`;
      const q = quotes[key];
      const last_price = q?.last_price ?? q?.last_price === 0 ? q.last_price : null;
      return { ...i, last_price };
    });

    res.json({ ok:true, strikes, expiries, chain });
  }catch(e){
    res.status(500).json({ ok:false, error: e.message });
  }
});
