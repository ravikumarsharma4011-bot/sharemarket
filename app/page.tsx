'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Settings, Link as LinkIcon, AlertCircle } from 'lucide-react'
import { Card, CardContent, Button, Input, Label, Select } from '../components/ui'

type Row = { symbol: string; name?: string; industry?: string; last: number; prev?: number; change_pct: number; volume?: number; updated_at?: string }
const DEFAULT_INDUSTRIES = ['All','Banks','Financial Services','IT & Software','Oil & Gas','Metals & Mining','Pharma & Healthcare','FMCG','Auto & Auto Ancillaries','Power & Utilities','Cement & Materials','Telecom','Real Estate','Media & Entertainment',]
const formatNumber=(n?:number)=> n==null||Number.isNaN(n)?'-':n.toLocaleString(undefined,{maximumFractionDigits:2})
const formatPct=(n?:number)=> n==null||Number.isNaN(n)?'-':`${n.toFixed(2)}%`
function generateMockRow(i:number): Row {
  const names:[string,string,string][]= [['RELIANCE','Reliance Industries','Oil & Gas'],['TCS','Tata Consultancy Services','IT & Software'],['HDFCBANK','HDFC Bank','Banks'],['ICICIBANK','ICICI Bank','Banks'],['LT','Larsen & Toubro','Capital Goods'],['ITC','ITC','FMCG'],['SBIN','State Bank of India','Banks'],['MARUTI','Maruti Suzuki','Auto & Auto Ancillaries'],['SUNPHARMA','Sun Pharma','Pharma & Healthcare'],['ULTRACEMCO','UltraTech Cement','Cement & Materials'],['BHARTIARTL','Bharti Airtel','Telecom'],['NTPC','NTPC','Power & Utilities'],['POWERGRID','Power Grid','Power & Utilities'],['INFY','Infosys','IT & Software'],['HCLTECH','HCLTech','IT & Software'],]
  const [sym,nm,ind]=names[i%names.length]; const base=Math.random()*2000+100; const ch=parseFloat((Math.random()*6-1).toFixed(2))
  const last=parseFloat((base*(1+ch/100)).toFixed(2)); const prev=parseFloat(base.toFixed(2)); const vol=Math.floor(Math.random()*5_000_000+50_000)
  return { symbol:sym, name:nm, industry:ind, last, prev, change_pct:ch, volume:vol, updated_at:new Date().toISOString() }
}
const generateMock=(limit=50)=> Array.from({length:limit},(_,i)=>generateMockRow(i)).sort((a,b)=>b.change_pct-a.change_pct)
export default function Page(){
  const [useMock,setUseMock]=useState<boolean>(()=> (typeof window!=='undefined'?(localStorage.getItem('nseUseMock')??'true')==='true':true))
  const [industry,setIndustry]=useState('All'); const [limit,setLimit]=useState(50); const [refreshSec,setRefreshSec]=useState(60)
  const [loading,setLoading]=useState(false); const [error,setError]=useState(''); const [rows,setRows]=useState<Row[]>([])
  const industries=useMemo(()=>['All',...new Set([...DEFAULT_INDUSTRIES.filter(i=>i!=='All'),...Array.from(new Set(rows.map(r=>r.industry).filter(Boolean))) as string[]])],[rows])
  useEffect(()=>{localStorage.setItem('nseUseMock',String(useMock))},[useMock])
  async function fetchData(){ setLoading(true); setError(''); try{ let data:Row[]=[]
    if(useMock){ data=generateMock(limit)} else { const url=new URL('/api/top-gainers',window.location.origin); url.searchParams.set('limit',String(limit)); if(industry!=='All') url.searchParams.set('industry',industry); const res=await fetch(url.toString(),{cache:'no-store'}); if(!res.ok) throw new Error(`API ${res.status}`); const j=await res.json(); data=Array.isArray(j?.data)?j.data:[] }
    let next=data.filter(r=>typeof r.change_pct==='number').sort((a,b)=>b.change_pct-a.change_pct); if(industry!=='All') next=next.filter(r=>(r.industry||'').toLowerCase()===industry.toLowerCase()); setRows(next.slice(0,limit))
  }catch(e:any){ setError(e?.message||'Failed to load data'); setRows([])} finally{ setLoading(false)}}
  useEffect(()=>{fetchData()},[industry,limit,useMock]); useEffect(()=>{ if(!refreshSec) return; const id=setInterval(fetchData,refreshSec*1000); return ()=>clearInterval(id)},[refreshSec,useMock,industry,limit])
  return (<div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.35}} className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div><h1 className="text-2xl font-bold">NSE Top Gainers (Last 1 Hour)</h1><p className="text-sm text-gray-500">Top 50 across all industries • Auto-refresh {refreshSec}s • Window: 60 minutes</p></div>
        <div className="grid grid-cols-2 md:flex gap-2 md:items-center">
          <div className="flex flex-col min-w-[220px]"><Label>Industry</Label><Select value={industry} onChange={(v)=>setIndustry(v)}>{industries.map(ind=><option key={ind} value={ind}>{ind}</option>)}</Select></div>
          <div className="flex flex-col w-[120px]"><Label>Limit</Label><Select value={String(limit)} onChange={(v)=>setLimit(parseInt(v))}>{[10,20,30,40,50].map(n=><option key={n} value={String(n)}>{n}</option>)}</Select></div>
          <div className="flex flex-col w-[160px]"><Label>Refresh (sec)</Label><Select value={String(refreshSec)} onChange={(v)=>setRefreshSec(parseInt(v))}>{[15,30,60,120,300].map(n=><option key={n} value={String(n)}>{n}</option>)}</Select></div>
          <Button onClick={fetchData} className="flex items-center gap-2"><RefreshCw className="w-4 h-4"/> Refresh</Button>
        </div>
      </div>
      <Card><CardContent className="p-0 overflow-x-auto">{error&&<div className="p-4 text-red-600 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4"/>{error}</div>}
        <table className="w-full text-sm table-sticky"><thead><tr className="text-left"><th className="p-3">#</th><th className="p-3">Symbol</th><th className="p-3">Name</th><th className="p-3">Industry</th><th className="p-3 text-right">Last</th><th className="p-3 text-right">Prev (−60m)</th><th className="p-3 text-right">Change</th><th className="p-3 text-right">Volume</th><th className="p-3">Updated</th></tr></thead>
          <tbody>{rows.length===0?(<tr><td colSpan={9} className="p-6 text-center">{loading?'Loading…':'No data'}</td></tr>):rows.map((r,idx)=>{const up=(r.change_pct??0)>=0;return(<tr key={`${r.symbol}-${idx}`} className="border-b last:border-none"><td className="p-3">{idx+1}</td><td className="p-3 font-semibold">{r.symbol}</td><td className="p-3">{r.name||''}</td><td className="p-3">{r.industry||''}</td><td className="p-3 text-right">{formatNumber(r.last)}</td><td className="p-3 text-right">{formatNumber(r.prev)}</td><td className={`p-3 text-right font-semibold ${up?'text-green-600':'text-red-600'}`}>{formatPct(r.change_pct)}</td><td className="p-3 text-right">{formatNumber(r.volume)}</td><td className="p-3 text-xs">{r.updated_at?new Date(r.updated_at).toLocaleTimeString():''}</td></tr>)})}</tbody>
        </table></CardContent></Card>
      <Card><CardContent><div className="flex items-center gap-2 mb-2"><Settings className="w-5 h-5"/><h2 className="font-semibold">Data Source</h2></div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="flex flex-col"><Label>Mode</Label><Select value={useMock?'mock':'live'} onChange={(v)=>setUseMock(v==='mock')}><option value="mock">Demo (mock data)</option><option value="live">Live (use API)</option></Select><p className="text-xs text-gray-500 mt-1">Use demo mode now; switch to Live after wiring your backend.</p></div>
          <div className="flex flex-col md:col-span-2"><Label>How it works</Label><p className="text-sm text-gray-600 flex items-center gap-1"><LinkIcon className="w-4 h-4"/> Frontend calls <code>/api/top-gainers</code>, which uses your token set by <code>/api/kite/callback</code>.</p></div>
        </div></CardContent></Card>
      <div className="text-xs text-gray-500">Built with Next.js + Tailwind. Switch Mode to Live after completing auth.</div>
    </motion.div></div>)
}
