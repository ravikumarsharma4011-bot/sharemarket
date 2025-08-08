import { getIronSession } from "iron-session";

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

export function withSessionApi(handler){
  return async (req, res) => {
    const session = await getIronSession(req, res, sessionOptions);
    return handler(req, res, session);
  };
}
