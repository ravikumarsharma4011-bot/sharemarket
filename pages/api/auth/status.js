import { withSessionApi } from "@/lib/session";

export default withSessionApi(async function handler(req, res, session){
  res.json({ ok:true, session: { access_token: session.get("access_token") || null } });
});
