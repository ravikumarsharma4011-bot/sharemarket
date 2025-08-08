import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Home(){
  const [session, setSession] = useState(null);
  useEffect(()=>{ axios.get('/api/auth/status').then(r=>setSession(r.data.session)); },[]);

  async function login(){
    const { data } = await axios.get('/api/auth/login');
    const win = window.open(data.url, 'kite_login', 'width=600,height=800');
    window.addEventListener('message', (e)=>{
      if(e.data?.type==='kite_login_ok'){ window.location.reload(); }
    });
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
        <button className="btn" onClick={login}>Login with Zerodha</button>
      )}
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
      </div>
    </div>
  );
}
