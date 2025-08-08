import { useEffect, useState } from 'react';
import Link from 'next/link';
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

  async function logout(){
    try{ await axios.get('/api/auth/logout'); }catch{}
    window.location.reload();
  }

  return (
    <div className="container">
      <h1>sharemarket0607</h1>
      <p className="muted">Vercel-ready • Zerodha Kite Connect</p>
      {session?.access_token ? (
        <div className="card">
          <h3>Logged in</h3>
          <Link className="btn" href="/options">Go to Options Trading</Link>
          <div style={{marginTop:10}}>
            <button className="btn outline" onClick={logout}>Logout</button>
          </div>
        </div>
      ) : (
        <button className="btn" onClick={login} disabled={busy}>{busy ? "Connecting..." : "Login with Zerodha"}</button>
      )}
      {err && <p className="muted" style={{color:'#ffb3b3'}}>{err}</p>}

      <div className="grid" style={{marginTop:16}}>
        <div className="card">
          <h3>Symbols</h3>
          <ul>
            <li>NIFTY (Index Options)</li>
            <li>HDFC, TATAMOTORS, TATASTEEL, ICICIBANK (Stock Options)</li>
          </ul>
        </div>
        <div className="card">
          <h3>Defaults</h3>
          <p>Product: <b>{process.env.NEXT_PUBLIC_DEFAULT_PRODUCT||'NRML'}</b> • Order Type: <b>{process.env.NEXT_PUBLIC_DEFAULT_ORDER_TYPE||'LIMIT'}</b></p>
        </div>
        <div className="card">
          <h3>Diagnostics</h3>
          <Link className="btn outline" href="/diag">Open /diag</Link>
        </div>
      </div>
    </div>
  );
}
