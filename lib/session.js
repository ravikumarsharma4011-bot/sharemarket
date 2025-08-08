import { ironSession } from "iron-session/edge";

export const sessionOptions = {
  cookieName: "sharemarket0607_session",
  password: process.env.SESSION_PASSWORD,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    httpOnly: true,
    path: "/",
  },
};

export function withSessionRoute(handler){
  return async function(req, res){
    const session = await ironSession(sessionOptions)(req, res);
    return handler(req, res, session);
  };
}

// Edge-friendly helper
export function withSessionApi(handler){
  return async (req, res) => {
    const session = await ironSession(sessionOptions)(req, res);
    return handler(req, res, session);
  };
}
