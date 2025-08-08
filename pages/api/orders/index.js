import { withSessionApi } from "@/lib/session";
import { getKite } from "@/lib/kite";

function roundToTick(price, tick){ const p = Math.round(price / tick) * tick; return Number(p.toFixed(2)); }
function ensureMultiple(val, lot){ const q = Math.max(lot, Math.round(val/lot)*lot); return q; }

export default withSessionApi(async function handler(req, res, session){
  if(req.method !== 'POST') return res.status(405).json({ ok:false, error: 'Method not allowed' });
  try{
    const access_token = session?.access_token;
    if(!access_token) return res.status(401).json({ ok:false, error: "Not logged in" });

    const {
      exchange='NFO', tradingsymbol, transaction_type='BUY',
      quantity=0, price=0, product=process.env.NEXT_PUBLIC_DEFAULT_PRODUCT || 'NRML',
      order_type=process.env.NEXT_PUBLIC_DEFAULT_ORDER_TYPE || 'LIMIT', validity='DAY'
    } = req.body;

    if(!tradingsymbol) throw new Error('tradingsymbol required');
    if(!quantity || quantity<=0) throw new Error('quantity must be > 0');

    const k = getKite(access_token);
    const all = await k.getInstruments();
    const inst = all.find(i => i.exchange===exchange && i.tradingsymbol===tradingsymbol);
    if(!inst) throw new Error('Instrument not found: ' + tradingsymbol);

    const tick = Number(inst.tick_size || 0.05);
    const lot = Number(inst.lot_size || 1);
    const adjQty = ensureMultiple(Number(quantity), lot);
    const adjPrice = roundToTick(Number(price), tick);

    const order = await k.placeOrder('regular', {
      exchange, tradingsymbol, transaction_type, quantity: adjQty, price: adjPrice,
      product, order_type, validity
    });
    res.json({ ok:true, order, adjusted:{ quantity: adjQty, price: adjPrice, tick, lot } });
  }catch(e){
    res.status(400).json({ ok:false, error: e.message });
  }
});
