export function getKite(access_token){
  // Resolve KiteConnect in a way that works across CJS/ESM builds without extra ESLint plugins.
  const mod = require('kiteconnect');
  const KiteConnectCtor = mod.KiteConnect || mod.default || mod;

  const api_key = process.env.KITE_API_KEY;
  if(!api_key) throw new Error("KITE_API_KEY missing");

  const kite = new KiteConnectCtor({ api_key });
  if(access_token) kite.setAccessToken(access_token);
  return kite;
}
