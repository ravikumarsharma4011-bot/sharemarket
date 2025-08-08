import { withSessionApi } from "@/lib/session";

export default withSessionApi(async function handler(req, res, session){
  try{
    const token = session?.access_token || null;
    res.json({ ok:true, session: { access_token: token } });
  }catch(e){
    res.status(500).json({ ok:false, error: e?.message || String(e) });
  }
});
