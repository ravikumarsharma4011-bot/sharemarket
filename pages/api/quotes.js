import { withSessionApi } from "@/lib/session";
import { getKite } from "@/lib/kite";

export default withSessionApi(async function handler(req, res, session){
  try{
    const access_token = session?.access_token;
    if(!access_token) return res.status(401).json({ ok:false, error: "Not logged in" });
    const instruments = (req.query.instruments || '').split(',').filter(Boolean);
    if(!instruments.length) return res.json({ ok:true, quotes: {} });
    const k = getKite(access_token);
    const quotes = await k.getQuote(instruments);
    res.json({ ok:true, quotes });
  }catch(e){
    res.status(500).json({ ok:false, error: e.message });
  }
});
