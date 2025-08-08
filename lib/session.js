import { getIronSession } from "iron-session";
export const sessionOptions = {
  cookieName: "sharemarket0607_session",
  password: process.env.SESSION_PASSWORD,
  cookieOptions: { secure: process.env.NODE_ENV === "production", sameSite: "lax", httpOnly: true, path: "/" },
};
export function withSessionApi(handler){
  return async (req, res) => {
    try{
      if(!process.env.SESSION_PASSWORD || (process.env.SESSION_PASSWORD||"").length < 32){
        return res.status(500).json({ ok:false, error:"SESSION_PASSWORD missing or too short" });
      }
      const session = await getIronSession(req, res, sessionOptions);
      return handler(req, res, session);
    }catch(e){
      return res.status(500).send("SESSION_INIT_ERROR: " + (e?.message || String(e)));
    }
  };
}
