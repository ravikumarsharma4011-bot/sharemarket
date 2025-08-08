import { NextRequest, NextResponse } from 'next/server'
import { getCookie } from '@/lib/cookies'

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

function generateMock(limit = 50): Row[] {
  const base: [string,string,string][] = [
    ['RELIANCE','Reliance Industries','Oil & Gas'],
    ['TCS','Tata Consultancy Services','IT & Software'],
    ['HDFCBANK','HDFC Bank','Banks'],
    ['ICICI BANK','ICICI Bank','Banks'],
    ['LT','Larsen & Toubro','Capital Goods'],
    ['ITC','ITC','FMCG'],
    ['SBIN','State Bank of India','Banks'],
    ['MARUTI','Maruti Suzuki','Auto & Auto Ancillaries'],
    ['SUNPHARMA','Sun Pharma','Pharma & Healthcare'],
    ['ULTRACEMCO','UltraTech Cement','Cement & Materials'],
    ['BHARTIARTL','Bharti Airtel','Telecom'],
    ['NTPC','NTPC','Power & Utilities'],
    ['POWERGRID','Power Grid','Power & Utilities'],
    ['INFY','Infosys','IT & Software'],
    ['HCLTECH','HCLTech','IT & Software'],
  ]
  const rows: Row[] = []
  for (let i=0;i<limit;i++) {
    const [sym, nm, ind] = base[i % base.length]
    const basePrice = Math.random()*2000 + 100
    const ch = (Math.random()*6 - 1)
    const last = parseFloat((basePrice*(1+ch/100)).toFixed(2))
    const prev = parseFloat(basePrice.toFixed(2))
    const volume = Math.floor(Math.random()*5_000_000 + 50_000)
    rows.push({ symbol: sym, name: nm, industry: ind, last, prev, change_pct: parseFloat(ch.toFixed(2)), volume, updated_at: new Date().toISOString() })
  }
  rows.sort((a,b)=>b.change_pct-a.change_pct)
  return rows.slice(0, limit)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 50)
  const industry = searchParams.get('industry')

  const useLive = process.env.USE_LIVE === 'true'
  const token = getCookie('kite_access_token')

  let data: Row[] = []
  if (useLive && token) {
    // TODO: Replace with real computation using Kite Historical minute API
    // See README and comments for guidance.
    data = generateMock(limit)
  } else {
    data = generateMock(limit)
  }

  const filtered = industry && industry !== 'All' ? data.filter(r => (r.industry||'').toLowerCase() === industry.toLowerCase()) : data
  return NextResponse.json({ timestamp: new Date().toISOString(), universe: 'NSE', window_minutes: 60, data: filtered.slice(0, limit) })
}
