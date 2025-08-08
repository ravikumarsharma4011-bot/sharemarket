import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Diag(){
  const [status, setStatus] = useState(null);
  const [login, setLogin] = useState(null);
  const [error, setError] = useState("");
  useEffect(()=>{
    (async ()=>{
      try{
        const s = await axios.get('/api/auth/status'); setStatus(s.data);
      }catch(e){ setError("status: " + (e.message)); }
      try{
        const l = await axios.get('/api/auth/login'); setLogin(l.data);
      }catch(e){ setError(prev => (prev ? prev + " | " : "") + "login: " + (e.response?.data?.error || e.message)); }
    })();
  },[]);
  return (
    <div className="container">
      <h1>Diagnostics</h1>
      <div className="card"><pre>{JSON.stringify({ status }, null, 2)}</pre></div>
      <div className="card"><pre>{JSON.stringify({ login }, null, 2)}</pre></div>
      {error && <div className="card"><b>Error:</b> {error}</div>}
      <a className="btn" href="/">← Back</a>
    </div>
  );
}
