import { withSessionApi } from "@/lib/session";
import { getKite } from "@/lib/kite";

async function coreHandler(req, res, session){
  try{
    const { request_token, status } = req.query || {};
    if(!request_token || String(request_token).length < 10){
      return res.status(400).send(`Auth failed: \`request_token\` should be minimum 10 characters in length. Status=${status || 'unknown'}`);
    }
    const apiSecret = process.env.KITE_API_SECRET;
    if(!apiSecret){ return res.status(500).send("Auth failed: KITE_API_SECRET not set on server."); }
    const k = getKite();
    const data = await k.generateSession(request_token, apiSecret);
    if(!data?.access_token){ return res.status(500).send("Auth failed: generateSession returned no access_token."); }
    session.access_token = data.access_token;
    await session.save();
    res.send(`<script>window.opener && window.opener.postMessage({type:'kite_login_ok'},'*');window.close();</script>Logged in.`);
  }catch(e){ res.status(500).send("Auth failed: " + (e?.message || String(e))); }
}
export default withSessionApi(coreHandler);
