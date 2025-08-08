import { NextRequest, NextResponse } from 'next/server'
import { getCookie } from '../../../../lib/cookies'

const KITE_API = 'https://api.kite.trade'
const h = (k: string, t: string) => ({ 'X-Kite-Version': '3', 'Authorization': `token ${k}:${t}` })

function formatKiteIST(d: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find(p => p.type === t)!.value;
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const symbol = url.searchParams.get('symbol') || 'SBIN'

    const apiKey = process.env.KITE_API_KEY!
    const token  = getCookie('kite_access_token')
    if (!apiKey || !token) return NextResponse.json({ ok:false, error:'missing apiKey or access token' }, { status:400 })

    // 1) Quote (LTP + instrument_token)
    const qUrl = new URL(`${KITE_API}/quote`)
    qUrl.searchParams.set('i', `NSE:${symbol}`)
    const qRes = await fetch(qUrl, { headers: h(apiKey, token), cache: 'no-store' })
    const qJson = await qRes.json()
    const entry = qJson?.data?.[`NSE:${symbol}`]
    if (!qRes.ok || !entry) {
      return NextResponse.json({ ok:false, step:'quote', status:qRes.status, body:qJson }, { status: qRes.status || 500 })
    }

    // 2) Historical minute (~last 75 min window)
    const now = new Date(); now.setSeconds(0,0)
    const from = new Date(now.getTime() - 75*60*1000)
    const hUrl = new URL(`${KITE_API}/instruments/historical/${entry.instrument_token}/minute`)
    hUrl.searchParams.set('from', formatKiteIST(from))
    hUrl.searchParams.set('to',   formatKiteIST(now))
    const hRes = await fetch(hUrl, { headers: h(apiKey, token), cache: 'no-store' })
    const hJson = await hRes.json()

    return NextResponse.json({
      ok: true,
      symbol,
      quote_status: qRes.status,
      quote_sample: { last_price: entry.last_price, volume: entry.volume, instrument_token: entry.instrument_token },
      hist_status: hRes.status,
      hist_len: hJson?.data?.candles?.length || 0,
      hist_sample: hJson?.data?.candles?.slice(-3) || [],
    })
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message || String(e) }, { status:500 })
  }
}
