import { NextRequest, NextResponse } from 'next/server';

const KITE_API = 'https://api.kite.trade';
const h = (k: string, t: string) => ({
  'X-Kite-Version': '3',
  'Authorization': `token ${k}:${t}`,
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const symbol = url.searchParams.get('symbol') || 'SBIN';

    const apiKey = process.env.KITE_API_KEY!;
    const token  = req.headers.get('cookie')?.match(/kite_access_token=([^;]+)/)?.[1];
    if (!apiKey || !token) return NextResponse.json({ ok:false, error:'missing apiKey or access token' }, { status: 400 });

    // 1) Quote (to get LTP + instrument_token)
    const qUrl = new URL(`${KITE_API}/quote`);
    qUrl.searchParams.set('i', `NSE:${symbol}`);
    const qRes = await fetch(qUrl, { headers: h(apiKey, token), cache: 'no-store' });
    const qJson = await qRes.json();

    // Pull the entry for NSE:symbol
    const entry = qJson?.data?.[`NSE:${symbol}`];
    if (!qRes.ok || !entry) {
      return NextResponse.json({ ok:false, step:'quote', status:qRes.status, body:qJson }, { status: qRes.status || 500 });
    }

    // 2) Historical minute (≈ last 75 minutes)
    const now = new Date();
    now.setSeconds(0,0);
    const to = now;
    const from = new Date(to.getTime() - 75*60*1000);

    const histUrl = new URL(`${KITE_API}/instruments/historical/${entry.instrument_token}/minute`);
    histUrl.searchParams.set('from', from.toISOString().slice(0,19)+'Z');
    histUrl.searchParams.set('to',   to.toISOString().slice(0,19)+'Z');

    const hRes = await fetch(histUrl, { headers: h(apiKey, token), cache: 'no-store' });
    const hJson = await hRes.json();

    return NextResponse.json({
      ok: true,
      symbol,
      quote_status: qRes.status,
      quote_sample: { last_price: entry.last_price, volume: entry.volume, instrument_token: entry.instrument_token },
      hist_status: hRes.status,
      hist_len: hJson?.data?.candles?.length || 0,
      hist_sample: hJson?.data?.candles?.slice(-3) || [],
    });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:e?.message || String(e) }, { status: 500 });
  }
}
