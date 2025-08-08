import { withSessionApi } from "@/lib/session";
import { getKite } from "@/lib/kite";
export default withSessionApi(async function handler(req, res, session){
  try{
    const access_token = session?.access_token;
    if(!access_token) return res.status(401).json({ ok:false, error:"Not logged in" });
    if(req.method !== 'POST') return res.status(405).json({ ok:false, error:'Use POST' });
    const k = getKite(access_token);
    const order = await k.placeOrder('regular', {
      exchange: req.body.exchange || 'NFO',
      tradingsymbol: req.body.tradingsymbol,
      transaction_type: req.body.transaction_type || 'BUY',
      quantity: req.body.quantity,
      price: req.body.price,
      product: req.body.product || 'NRML',
      order_type: req.body.order_type || 'LIMIT',
      validity: req.body.validity || 'DAY',
    });
    res.json({ ok:true, order });
  }catch(e){ res.status(500).json({ ok:false, error: e.message }); }
});
