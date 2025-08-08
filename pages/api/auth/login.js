import { withSessionApi } from "@/lib/session";
import { getKite } from "@/lib/kite";

export default withSessionApi(async function handler(req, res, session){
  try{
    const k = getKite();
    const url = k.getLoginURL();
    res.status(200).json({ ok:true, url });
  }catch(e){
    res.status(500).json({ ok:false, error: e.message });
  }
});
