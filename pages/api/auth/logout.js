import { withSessionApi } from "@/lib/session";
export default withSessionApi(async function handler(req, res, session){
  session.destroy();
  res.json({ ok:true });
});
