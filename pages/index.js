import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Home(){
  const [session, setSession] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  useEffect(()=>{ axios.get('/api/auth/status').then(r=>setSession(r.data.session)).catch(()=>{}); },[]);

  async function login(){
    setErr("");
    setBusy(true);
    try{
      const res = await axios.get('/api/auth/login', { timeout: 15000 });
      const data = res.data || {};
      if(!data.ok || !data.url) throw new Error(data.error || "No login URL returned");
      const w = window.open(data.url, 'kite_login', 'width=600,height=800');
      // If pop-up is blocked, fall back to full-page redirect
      if(!w || w.closed || typeof w.closed === "undefined"){
        window.location.href = data.url;
      } else {
        window.addEventListener('message', (e)=>{
          if(e.data?.type==='kite_login_ok'){ window.location.reload(); }
        });
      }
    }catch(e){
      setErr("Login init failed: " + (e.response?.data?.error || e.message));
    }finally{
      setBusy(false);
    }
  }
  return (
    <div className="container">
      <h1>sharemarket0607</h1>
      <p className="muted">Vercel-ready • Zerodha Kite Connect</p>
      {session?.access_token ? (
        <div className="card">
          <h3>Logged in</h3>
          <a className="btn" href="/options">Go to Options Trading</a>
          <div style={{marginTop:10}}>
            <a className="btn outline" href="/api/auth/logout">Logout</a>
          </div>
        </div>
      ) : (
        <button className="btn" onClick={login} disabled={busy}>{busy ? "Connecting..." : "Login with Zerodha"}</button>
      )}
      {err && <p className="muted" style={{color:'#ffb3b3'}}>{err}</p>}
      <div className="grid">
        <div className="card">
          <h3>Symbols</h3>
          <ul>
            <li>NIFTY (Index Options)</li>
            <li>HDFC, TATAMOTORS, TATASTEEL, ICICIBANK (Stock Options)</li>
          </ul>
        </div>
        <div className="card">
          <h3>Defaults</h3>
          <p>Product: <b>{process.env.NEXT_PUBLIC_DEFAULT_PRODUCT}</b> • Order Type: <b>{process.env.NEXT_PUBLIC_DEFAULT_ORDER_TYPE}</b></p>
        </div>
        <div className="card">
          <h3>Diagnostics</h3>
          <a className="btn outline" href="/diag">Open /diag</a>
        </div>
      </div>
    </div>
  );
}
