export default function handler(req, res){
  const flags = {
    NODE_ENV: process.env.NODE_ENV,
    has_KITE_API_KEY: !!process.env.KITE_API_KEY,
    has_KITE_API_SECRET: !!process.env.KITE_API_SECRET,
    has_SESSION_PASSWORD: !!process.env.SESSION_PASSWORD,
    session_password_len: (process.env.SESSION_PASSWORD || "").length,
    now: new Date().toISOString(),
  };
  res.status(200).json({ ok:true, flags });
}
