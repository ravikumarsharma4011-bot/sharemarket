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

/**
 * TEMP universe: start smaller to respect Kite rate limits, then grow.
 * We can later swap this with a proper NSE instruments list + industry mapping.
 */
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
  // add more as you increase your Kite credits/rate limits…
]

const KITE_API = 'https://api.kite.trade'
const headers = (apiKey: string, accessToken: string) => ({
  'X-Kite-Version': '3',
  'Authorization': `token ${apiKey}:${accessToken}`
})

/** Get instrument_token for NSE:<symbol> from /instruments? (big file).
 * To keep it simple here, we use /instruments/quote to resolve it implicitly.
 * If you want full coverage, we’ll cache NSE instruments CSV in a KV/DB.
 */
async function getQuoteLtp(apiKey: string, token: string, symbol: string) {
  const url = new URL(`${KITE_API}/quote`)
  url.searchParams.set('i', `NSE:${symbol}`)
  const res = await fetch(url, { headers: headers(apiKey, token), cache: 'no-store' })
  const json = await res.json()
  const q = json?.data?.[`NSE:${symbol}`]
  if (!q) throw new Error(`No quote for ${symbol}`)
  return { last: q.last_price as number, volume: q.volume as number | undefined, instrument_token: q.instrument_token as number }
}

async function getMinutePriceAt(apiKey: string, token: string, instrument_token: number, whenISO: string) {
  // Kite requires from <= to window; we’ll fetch ~75 minutes to ensure coverage
  const to = new Date(whenISO)
  const from = new Date(to.getTime() - 75 * 60 * 1000)
  const url = new URL(`${KITE_API}/instruments/historical/${instrument_token}/minute`)
  url.searchParams.set('from', from.toISOString().slice(0, 19) + 'Z')
  url.searchParams.set('to', to.toISOString().slice(0, 19) + 'Z')
  const res = await fetch(url, { headers: headers(apiKey, token), cache: 'no-store' })
  const json = await res.json()
  const candles: Array<[string, number, number, number, number, number]> = json?.data?.candles || []
  if (!candles.length) throw new Error('No candles')
  // find the candle closest to (when - 60m)
  const targetTs = new Date(whenISO).getTime() - 60 * 60 * 1000
  let closest = candles[0]
  let mdiff = Number.MAX_SAFE_INTEGER
  for (const c of candles) {
    const ts = new Date(c[0]).getTime()
    const d = Math.abs(ts - targetTs)
    if (d < mdiff) { mdiff = d; closest = c }
  }
  const close = closest[4] // [time, open, high, low, close, volume]
  return close as number
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const industryFilter = searchParams.get('industry') || 'All'
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 50)

  const accessToken = getCookie('kite_access_token')
  const apiKey = process.env.KITE_API_KEY
  const useLive = process.env.USE_LIVE === 'true'

  if (!useLive || !accessToken || !apiKey) {
    return NextResponse.json({
      live: false,
      reason: !useLive ? 'USE_LIVE=false' : (!accessToken ? 'no_access_token' : 'missing_api_key'),
      data: []
    })
  }

  // time “now” (trim to minute for consistency)
  const now = new Date()
  now.setSeconds(0, 0)

  // small concurrency so we don’t blow rate limits
  const CONCURRENCY = 5
  const universe = UNIVERSE.filter(u => industryFilter === 'All' || u.industry.toLowerCase() === industryFilter.toLowerCase())

  const out: Row[] = []
  let i = 0
  while (i < universe.length) {
    const batch = universe.slice(i, i + CONCURRENCY)
    const results = await Promise.allSettled(batch.map(async u => {
      const q = await getQuoteLtp(apiKey, accessToken, u.symbol)
      const prev = await getMinutePriceAt(apiKey, accessToken, q.instrument_token, now.toISOString())
      const change_pct = prev ? ((q.last - prev) / prev) * 100 : 0
      const row: Row = {
        symbol: u.symbol,
        name: u.name,
        industry: u.industry,
        last: q.last,
        prev,
        change_pct: parseFloat(change_pct.toFixed(2)),
        volume: q.volume,
        updated_at: now.toISOString()
      }
      return row
    }))
    for (const r of results) if (r.status === 'fulfilled') out.push(r.value)
    i += CONCURRENCY
  }

  out.sort((a, b) => (b.change_pct ?? 0) - (a.change_pct ?? 0))
  return NextResponse.json({
    live: true,
    timestamp: new Date().toISOString(),
    window_minutes: 60,
    count: out.length,
    data: out.slice(0, limit)
  })
}
