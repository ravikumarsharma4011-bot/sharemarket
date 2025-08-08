let KiteConnectCtor;
try {
  // Try named export (newer builds)
  const mod = await import('kiteconnect');
  KiteConnectCtor = mod.KiteConnect || mod.default || mod;
} catch (e) {
  // Fallback to require for CJS environments
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('kiteconnect');
  KiteConnectCtor = mod.KiteConnect || mod.default || mod;
}
export function getKite(access_token){
  const api_key = process.env.KITE_API_KEY;
  if(!api_key) throw new Error("KITE_API_KEY missing");
  const kite = new KiteConnectCtor({ api_key });
  if(access_token) kite.setAccessToken(access_token);
  return kite;
}
