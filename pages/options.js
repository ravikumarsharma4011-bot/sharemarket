import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const SYMBOLS = [
  { label: 'NIFTY', value: 'NIFTY' },
  { label: 'HDFC', value: 'HDFC' },
  { label: 'TATAMOTORS', value: 'TATAMOTORS' },
  { label: 'TATASTEEL', value: 'TATASTEEL' },
  { label: 'ICICIBANK', value: 'ICICIBANK' },
];

export default function Options(){
  const [base, setBase] = useState('NIFTY');
  const [expiries, setExpiries] = useState([]);
  const [expiry, setExpiry] = useState('');
  const [strikes, setStrikes] = useState([]);
  const [chain, setChain] = useState([]);
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
  useEffect(()=>{ if(expiry) fetchChain(base, expiry); },[expiry]);

  async function fetchChain(b,e){
    const { data } = await axios.get('/api/options/chain',{ params:{ base:b, expiry:e } });
    setStrikes(data.strikes||[]);
    setExpiries(data.expiries||[]);
    setExpiry(e || data.expiries?.[0] || '');
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
        <a href="/" className="btn outline">← Back</a>
        <h1>Options Trading</h1>
      </div>

      <div className="controls">
        <label>Symbol
          <select value={base} onChange={e=>setBase(e.target.value)}>
            {SYMBOLS.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
        <label>Expiry
          <select value={expiry} onChange={e=>setExpiry(e.target.value)}>
            {expiries.map(x=> <option key={x} value={x}>{x}</option>)}
          </select>
        </label>
      </div>

      <div className="grid two">
        <div className="card">
          <h3>Option Chain (NFO)</h3>
          <div className="chain">
            <div className="row head"><div>CE</div><div>Strike</div><div>PE</div></div>
            {strikes.map(s=>{
              const ce = mapByStrike[`${s}-CE`];
              const pe = mapByStrike[`${s}-PE`];
              return (
                <div className="row" key={s}>
                  <div className={"cell " + (ce ? "clickable" : "")} onClick={()=> pick(s,'CE')}>
                    {ce ? (ce.last_price || '-') : '-'}
                  </div>
                  <div className="cell strike">{s}</div>
                  <div className={"cell " + (pe ? "clickable" : "")} onClick={()=> pick(s,'PE')}>
                    {pe ? (pe.last_price || '-') : '-'}
                  </div>
                </div>
              );
            })}
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
    </div>
  );
}
