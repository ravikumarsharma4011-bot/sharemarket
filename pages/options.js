import { useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import axios from 'axios';

const SYMBOLS = [
  { label: 'NIFTY', value: 'NIFTY' },
  { label: 'HDFC', value: 'HDFC' },
  { label: 'TATAMOTORS', value: 'TATAMOTORS' },
  { label: 'TATASTEEL', value: 'TATASTEEL' },
  { label: 'ICICIBANK', value: 'ICICIBANK' },
];

function dateOnly(x){ try { return String(x).split('T')[0]; } catch { return x; } }

function FocusPanel({ base, expiryKey, strikes, mapByStrike }){
  const defaultAnchor = (base==='NIFTY' && dateOnly(expiryKey)==='2025-08-14') ? 24350 :
    (strikes[Math.floor(strikes.length/2)] || null);
  const [anchor, setAnchor] = useState(defaultAnchor);
  const [q, setQ] = useState({});
  const timerRef = useRef(null);

  const stepStrikes = useMemo(()=>{
    if(!strikes?.length || !anchor) return { ce:[], pe:[] };
    const sorted = [...strikes].sort((a,b)=>a-b);
    const ce = sorted.filter(s=> s>=anchor).slice(0,4);
    const pes = sorted.filter(s=> s<=anchor).slice(-4).reverse();
    return { ce, pe: pes };
  },[strikes, anchor]);

  const instruments = useMemo(()=>{
    const out = [];
    for(const s of stepStrikes.ce){
      const ce = mapByStrike[`${s}-CE`];
      if(ce) out.push(`NFO:${ce.tradingsymbol}`);
    }
    for(const s of stepStrikes.pe){
      const pe = mapByStrike[`${s}-PE`];
      if(pe) out.push(`NFO:${pe.tradingsymbol}`);
    }
    return out;
  },[stepStrikes, mapByStrike]);

  async function fetchQuotes(){
    if(!instruments.length) return;
    try{
      const { data } = await axios.get('/api/quotes', { params:{ instruments: instruments.join(',') } });
      setQ(data.quotes || {});
    }catch(e){}
  }

  useEffect(()=>{
    fetchQuotes();
    if(timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(fetchQuotes, 180000); // 3 minutes
    return ()=> timerRef.current && clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instruments.join(',')]);

  function cell(inst){
    if(!inst) return '-';
    const key = `NFO:${inst.tradingsymbol}`;
    const qt = q[key];
    if(!qt) return '-';
    const ltp = qt.last_price;
    let bid = qt?.depth?.buy?.[0]?.price || null;
    let ask = qt?.depth?.sell?.[0]?.price || null;
    let bq = qt?.depth?.buy?.[0]?.quantity || null;
    let aq = qt?.depth?.sell?.[0]?.quantity || null;
    let show = (typeof ltp === 'number' && ltp>0) ? ltp : null;
    if(show===null){
      if(bid && ask) show = ((bid+ask)/2).toFixed(2);
      else if(qt?.ohlc?.close) show = qt.ohlc.close;
    }
    return (
      <div>
        <div><b>{show ?? '-'}</b></div>
        <div className="muted" style={{fontSize:12}}>B {bid ?? '-'} ({bq ?? '-'}) | A {ask ?? '-'} ({aq ?? '-'})</div>
      </div>
    );
  }

  const rows = (
    <div className="grid" style={{gridTemplateColumns:'1fr 1fr 1fr', gap:8}}>
      <div className="muted">CALLS</div><div className="muted">STRIKE</div><div className="muted">PUTS</div>
      {Array.from({length: Math.max(stepStrikes.ce.length, stepStrikes.pe.length)}).map((_,i)=>{
        const sCE = stepStrikes.ce[i];
        const sPE = stepStrikes.pe[i];
        const ce = mapByStrike[`${sCE}-CE`];
        const pe = mapByStrike[`${sPE}-PE`];
        return (
          <div className="row" key={i} style={{display:'contents'}}>
            <div className="card">{cell(ce)}</div>
            <div className="card" style={{textAlign:'center', fontWeight:700}}>{sCE ?? sPE ?? '-'}</div>
            <div className="card">{cell(pe)}</div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="card">
      <h3>Focused View (±4 from anchor)</h3>
      <div className="controls">
        <label>Anchor strike
          <input type="number" value={anchor || ''} onChange={e=> setAnchor(Number(e.target.value)||'')} />
        </label>
        <div className="muted" style={{alignSelf:'end'}}>Auto-refresh every 3 minutes</div>
      </div>
      {rows}
    </div>
  );
}

export default function Options(){
  const [base, setBase] = useState('NIFTY');
  const [expiries, setExpiries] = useState([]);
  const [expiry, setExpiry] = useState('');
  const [strikes, setStrikes] = useState([]);
  const [chain, setChain] = useState([]);
  const [note, setNote] = useState('');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    price:'', quantity:'', side:'BUY', product: process.env.NEXT_PUBLIC_DEFAULT_PRODUCT || 'NRML', order_type: process.env.NEXT_PUBLIC_DEFAULT_ORDER_TYPE || 'LIMIT'
  });

  const mapByStrike = useMemo(()=>{
    const by = {};
    for(const i of chain){ by[`${i.strike}-${i.instrument_type}`]=i; }
    return by;
  },[chain]);

  useEffect(()=>{ fetchChain(base); },[base]);
  useEffect(()=>{ if(expiry) fetchChain(base, expiry); },[expiry, base]);

  async function fetchChain(b,e){
    const { data } = await axios.get('/api/options/chain',{ params:{ base:b, expiry:e } });
    setNote(data.note || '');
    setStrikes(data.strikes||[]);
    setExpiries(data.expiries||[]);
    setExpiry((data.chosenExpiry && data.chosenExpiry.split('T')[0]) || (e && String(e).split('T')[0]) || (data.expiries?.[0] && String(data.expiries[0]).split('T')[0]) || '');
    setChain(data.chain||[]);
  }

  function pick(strike, type){
    const inst = mapByStrike[`${strike}-${type}`];
    if(!inst) return;
    setSelected(inst);
    setForm(f=>({...f, price: inst.last_price || '', quantity: inst.lot_size || '' }));
  }

  async function placeOrder(){
    if(!selected) return alert('Pick a strike first');
    const body = {
      exchange: 'NFO',
      tradingsymbol: selected.tradingsymbol,
      transaction_type: form.side,
      quantity: Number(form.quantity),
      price: Number(form.price),
      product: form.product,
      order_type: form.order_type,
      validity: 'DAY',
    };
    try{
      const { data } = await axios.post('/api/orders', body);
      alert('Order placed: ' + JSON.stringify(data, null, 2));
    }catch(e){
      alert('Order error: ' + (e.response?.data?.error || e.message));
    }
  }

  return (
    <div className="container">
      <div className="header">
        <Link href="/" className="btn outline">← Back</Link>
        <h1>Options Trading</h1>
      </div>

      <div className="controls">
        <label>Symbol
          <select value={base} onChange={e=>setBase(e.target.value)}>
            {SYMBOLS.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
        <label>Expiry (filtered to today → 2025-08-14)
          <select value={expiry} onChange={e=>setExpiry(e.target.value)}>
            {expiries.map(x=> {const d=dateOnly(x); return <option key={d} value={d}>{d}</option>;})}
          </select>
        </label>
      </div>

      {note ? <div className="card"><b>Note:</b> {note}</div> : null}

      <div className="grid two">
        <div className="card">
          <h3>Option Chain (NFO)</h3>
          <div className="chain">
            <div className="row head"><div>CE</div><div>Strike</div><div>PE</div></div>
            {strikes.length ? strikes.map(s=>{
              const ce = mapByStrike[`${s}-CE`];
              const pe = mapByStrike[`${s}-PE`];
              return (
                <div className="row" key={s}>
                  <div className={"cell " + (ce ? "clickable" : "")} onClick={()=> pick(s,'CE')}>
                    {ce ? ((ce.last_price ?? '-') ) : '-'}
                  </div>
                  <div className="cell strike">{s}</div>
                  <div className={"cell " + (pe ? "clickable" : "")} onClick={()=> pick(s,'PE')}>
                    {pe ? ((pe.last_price ?? '-') ) : '-'}
                  </div>
                </div>
              );
            }) : <div className="cell">No strikes in the selected window.</div>}
          </div>
        </div>

        <div className="card">
          <h3>Order</h3>
          {selected ? (
            <div className="order">
              <div className="muted">Chosen: <b>{selected.tradingsymbol}</b></div>
              <div className="form">
                <label>Side
                  <select value={form.side} onChange={e=>setForm({...form, side:e.target.value})}>
                    <option>BUY</option><option>SELL</option>
                  </select>
                </label>
                <label>Quantity (lots multiple)
                  <input type="number" value={form.quantity} onChange={e=>setForm({...form, quantity:e.target.value})} />
                </label>
                <label>Price
                  <input type="number" value={form.price} onChange={e=>setForm({...form, price:e.target.value})} />
                </label>
                <label>Product
                  <select value={form.product} onChange={e=>setForm({...form, product:e.target.value})}>
                    <option>NRML</option><option>MIS</option>
                  </select>
                </label>
                <label>Order Type
                  <select value={form.order_type} onChange={e=>setForm({...form, order_type:e.target.value})}>
                    <option>LIMIT</option><option>MARKET</option>
                  </select>
                </label>
                <button className="btn" onClick={placeOrder}>Place Order</button>
              </div>
            </div>
          ) : <div className="muted">Pick a CE/PE cell from the chain to prefill.</div>}
        </div>
      </div>

      <FocusPanel base={base} expiryKey={expiry} strikes={strikes} mapByStrike={mapByStrike} />
    </div>
  );
}
