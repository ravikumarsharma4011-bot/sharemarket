import { withIronSessionApiRoute } from "iron-session/next";

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
  return withIronSessionApiRoute(async (req, res) => {
    // Pass req.session to handler
    return handler(req, res, req.session);
  }, sessionOptions);
}
