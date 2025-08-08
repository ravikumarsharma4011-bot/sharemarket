import { withSessionApi } from "@/lib/session";
export default withSessionApi(async function handler(req, res, session){
  try{
    session.access_token = null;
    await session.save();
    await session.destroy();
  }catch{}
  res.json({ ok:true });
});
