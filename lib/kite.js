import { KiteConnect } from "kiteconnect";
export function getKite(access_token){
  const api_key = process.env.KITE_API_KEY;
  if(!api_key) throw new Error("KITE_API_KEY missing");
  const kite = new KiteConnect({ api_key });
  if(access_token) kite.setAccessToken(access_token);
  return kite;
}
