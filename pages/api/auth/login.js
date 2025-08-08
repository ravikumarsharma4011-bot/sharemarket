import { withSessionApi } from "@/lib/session";
import { getKite } from "@/lib/kite";
export default withSessionApi(async function handler(req, res, session){
  try{
    const apiKey = process.env.KITE_API_KEY;
    const apiSecret = process.env.KITE_API_SECRET;
    if(!apiKey) return res.status(500).json({ ok:false, error: "KITE_API_KEY is missing on the server" });
    if(!apiSecret) return res.status(500).json({ ok:false, error: "KITE_API_SECRET is missing on the server" });
    const k = getKite();
    const url = k.getLoginURL();
    if(!url || typeof url !== 'string' || url.indexOf(apiKey) === -1){
      return res.status(500).json({ ok:false, error: "Kite SDK did not produce a login URL. Check Redirect URL in the Kite console." });
    }
    res.status(200).json({ ok:true, url });
  }catch(e){ res.status(500).json({ ok:false, error: e.message }); }
});
