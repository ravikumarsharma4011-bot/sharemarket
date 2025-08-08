import { withSessionApi } from "@/lib/session";
import { getKite } from "@/lib/kite";

export default withSessionApi(async function handler(req, res, session){
  try{
    const { request_token } = req.query;
    if(!request_token) return res.status(400).send("Missing request_token");

    const k = getKite();
    const data = await k.generateSession(request_token, process.env.KITE_API_SECRET);
    session.set("access_token", data.access_token);
    await session.save();
    res.send(`<script>window.opener && window.opener.postMessage({type:'kite_login_ok'},'*');window.close();</script>Logged in.`);
  }catch(e){
    res.status(500).send("Auth failed: " + e.message);
  }
});
