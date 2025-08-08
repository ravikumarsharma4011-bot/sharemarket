import { withSessionApi } from "@/lib/session";
import { getKite } from "@/lib/kite";

export default withSessionApi(async function handler(req, res, session){
  try{
    const base = req.query.base || 'NIFTY';
    const expiry = req.query.expiry;
    const access_token = session.get("access_token");
    if(!access_token) return res.status(401).json({ ok:false, error: "Not logged in" });

    const k = getKite(access_token);
    const all = await k.getInstruments();
    const filtered = all.filter(i => i.exchange==='NFO' && i.segment==='NFO-OPT' && i.name===base);
    const strikes = Array.from(new Set(filtered.map(i => i.strike))).sort((a,b)=>a-b);
    const expiries = Array.from(new Set(filtered.map(i => i.expiry))).sort((a,b)=> new Date(a)-new Date(b));
    const chosen = expiry || expiries[0];
    const chain = filtered.filter(i => i.expiry===chosen);
    res.json({ ok:true, strikes, expiries, chain });
  }catch(e){
    res.status(500).json({ ok:false, error: e.message });
  }
});
