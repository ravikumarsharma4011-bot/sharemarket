import { NextRequest, NextResponse } from 'next/server'
import { getCookie } from '../../../lib/cookies'

type Row = {
  symbol: string
  name?: string
  industry?: string
  last: number
  prev?: number
  change_pct: number
  volume?: number
  updated_at?: string
}

/** Start with a small universe to respect rate limits; expand later. */
const UNIVERSE: Array<{ symbol: string; name: string; industry: string }> = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', industry: 'Oil & Gas' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', industry: 'IT & Software' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', industry: 'Banks' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', industry: 'Banks' },
  { symbol: 'SBIN', name: 'State Bank of India', industry: 'Banks' },
  { symbol: 'INFY', name: 'Infosys', industry: 'IT & Software' },
  { symbol: 'LT', name: 'Larsen & Toubro', industry: 'Capital Goods' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', industry: 'Telecom' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki', industry: 'Auto & Auto Ancillaries' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharma', industry: 'Pharma & Healthcare' },
]

const KITE_API = 'https://api.kite.trade'
const headers = (apiKey: string, accessToken: string) => ({
  'X-Kite-Version': '3',
  'Authorization': `token ${apiKey}:${accessToken}`,
})

function formatKiteIST(d: Date) {
  // Output: YYYY-MM-DD HH:MM:SS in Asia/Kolkata (required by Kite Historical API)
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find(p => p.type === t)!.value;
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}

async function getQuoteLtp(apiKey: string, token: string, symbol: string) {
  const url = new URL(`${KITE_API}/quote`)
  url.searchParams.set('i', `NSE:${symbol}`)
  const res = await fetch(url, { headers: headers(apiKey, token), cache: 'no-store' })
  const json = await res.json()
  const q = json?.data?.[`NSE:${symbol}`]
  if (!q) throw new Error(`No quote for ${symbol} (status ${res.status})`)
  return { last: q.last_price as number, volume: q.volume as number | undefined, instrument_token: q.instrument_token as number }
}

async function getMinutePriceAt(apiKey: string, token: string, instrument_token: number, now: Date) {
  const to = new Date(now); to.setSeconds(0,0)
  const from = new Date(to.getTime() - 75 * 60 * 1000) // 75m window to cover target
  const url = new URL(`${KITE_API}/instruments/historical/${instrument_token}/minute`)
  url.searchParams.set('from', formatKiteIST(from))
  url.searchParams.set('to',   formatKiteIST(to))
  const res = await fetch(url, { headers: headers(apiKey, token), cache: 'no-store' })
  const json = await res.json()
  const candles: Array<[string, number, number, number, number, number]> = json?.data?.candles || []
  if (!candles.length) throw new Error(`No candles for token ${instrument_token} (status ${res.status})`)
  const targetTs = to.getTime() - 60 * 60 * 1000
  let closest = candles[0]
  let mdiff = Number.MAX_SAFE_INTEGER
  for (const c of candles) {
    const ts = new Date(c[0]).getTime()
    const d = Math.abs(ts - targetTs)
    if (d < mdiff) { mdiff = d; closest = c }
  }
  return closest[4] as number // close
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const industryFilter = searchParams.get('industry') || 'All'
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 50)

  const accessToken = getCookie('kite_access_token')
  const apiKey = process.env.KITE_API_KEY
  const useLive = process.env.USE_LIVE === 'true'

  if (!useLive) return NextResponse.json({ live:false, reason:'USE_LIVE=false', data:[] })
  if (!apiKey)   return NextResponse.json({ live:false, reason:'missing_api_key', data:[] }, { status:500 })
  if (!accessToken) return NextResponse.json({ live:false, reason:'no_access_token', data:[] }, { status:401 })

  const now = new Date(); now.setSeconds(0,0)
  const universe = UNIVERSE.filter(u => industryFilter === 'All' || u.industry.toLowerCase() === industryFilter.toLowerCase())
  const CONCURRENCY = 4
  const out: Row[] = []
  const errors: Array<{symbol:string; error:string}> = []

  for (let i=0; i<universe.length; i+=CONCURRENCY) {
    const batch = universe.slice(i, i+CONCURRENCY)
    const results = await Promise.allSettled(batch.map(async u => {
      const q = await getQuoteLtp(apiKey, accessToken, u.symbol)
      const prev = await getMinutePriceAt(apiKey, accessToken, q.instrument_token, now)
      const change_pct = prev ? ((q.last - prev) / prev) * 100 : 0
      const row: Row = {
        symbol: u.symbol, name: u.name, industry: u.industry,
        last: q.last, prev, change_pct: parseFloat(change_pct.toFixed(2)),
        volume: q.volume, updated_at: now.toISOString()
      }
      return row
    }))
    results.forEach((r, idx) => {
      const sym = batch[idx].symbol
      if (r.status === 'fulfilled') out.push(r.value)
      else errors.push({ symbol: sym, error: (r as any).reason?.message || String((r as any).reason) })
    })
  }

  out.sort((a,b) => (b.change_pct ?? 0) - (a.change_pct ?? 0))
  return NextResponse.json({
    live: true,
    timestamp: new Date().toISOString(),
    window_minutes: 60,
    count: out.length,
    errors,
    data: out.slice(0, limit)
  })
}
