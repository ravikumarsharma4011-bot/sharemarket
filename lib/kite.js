import { KiteConnect } from "kiteconnect";

export function getKite(access_token){
  const k = new KiteConnect({ api_key: process.env.KITE_API_KEY });
  if(access_token) k.setAccessToken(access_token);
  return k;
}
