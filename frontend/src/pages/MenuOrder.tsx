import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  UtensilsCrossed, ShoppingCart, Minus, Plus, MapPin, Truck, X,
  CreditCard, Smartphone, Banknote, Check,
} from 'lucide-react';

interface MenuItem { id: number; name: string; description: string; category: string; selling_price_cup: number; is_available: boolean; }
interface CartItem { recipe_id: number; name: string; price: number; quantity: number; }
interface ConvResult { original_amount: number; converted_amount: number; from_currency: string; to_currency: string; rate: number; }

const BASE = '/api';
function headers(): HeadersInit { const h: HeadersInit = { 'Content-Type': 'application/json' }; const t = localStorage.getItem('token'); if (t) h['Authorization'] = `Bearer ${t}`; return h; }

export default function MenuOrder() {
  const { user } = useAuth();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderType, setOrderType] = useState<'dine_in' | 'delivery'>('dine_in');
  const [guestCount, setGuestCount] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [payMethod, setPayMethod] = useState<string>('transfermovil');
  const [payCurrency, setPayCurrency] = useState('CUP');
  const [tmRef, setTmRef] = useState('');
  const [tmPhone, setTmPhone] = useState('');
  const [orderResult, setOrderResult] = useState<any>(null);
  const [conversion, setConversion] = useState<ConvResult | null>(null);
  const [rates, setRates] = useState<any>(null);

  useEffect(() => { loadMenu(); loadRates(); }, []);

  const loadMenu = async () => {
    const res = await fetch(`${BASE}/menu/`);
    if (res.ok) setMenu(await res.json());
    setLoading(false);
  };

  const loadRates = async () => {
    const res = await fetch(`${BASE}/currency/rates`);
    if (res.ok) setRates(await res.json());
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.recipe_id === item.id);
      if (existing) return prev.map(c => c.recipe_id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { recipe_id: item.id, name: item.name, price: item.selling_price_cup, quantity: 1 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(c => c.recipe_id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter(c => c.quantity > 0));
  };

  const total = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  const convertTotal = async (currency: string) => {
    setPayCurrency(currency);
    if (currency === 'CUP') { setConversion(null); return; }
    const res = await fetch(`${BASE}/currency/convert`, {
      method: 'POST', headers: headers(),
      body: JSON.stringify({ amount: total, from_currency: 'CUP', to_currency: currency }),
    });
    if (res.ok) setConversion(await res.json());
  };

  const submitOrder = async () => {
    if (!user) return;
    // Create order
    const orderRes = await fetch(`${BASE}/menu/orders`, {
      method: 'POST', headers: headers(),
      body: JSON.stringify({
        order_type: orderType, items: cart.map(c => ({ recipe_id: c.recipe_id, quantity: c.quantity })),
        guest_count: guestCount, delivery_address: deliveryAddress || null,
        delivery_phone: deliveryPhone || null,
      }),
    });
    if (!orderRes.ok) return;
    const order = await orderRes.json();

    // Pay
    const payRes = await fetch(`${BASE}/menu/orders/${order.id}/pay`, {
      method: 'POST', headers: headers(),
      body: JSON.stringify({
        method: payMethod, currency: payCurrency,
        transfermovil_ref: tmRef || null, transfermovil_phone: tmPhone || null,
      }),
    });
    if (payRes.ok) {
      setOrderResult(await payRes.json());
      setCart([]);
    }
  };

  const categories = [...new Set(menu.map(m => m.category))];

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-brand-gold animate-pulse text-lg">Cargando menú...</div></div>;

  if (orderResult) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
        <Check className="w-8 h-8 text-green-400" />
      </div>
      <h2 className="font-display text-2xl font-bold text-brand-gold mb-2">¡Pedido Confirmado!</h2>
      <p className="text-gray-400 mb-4">Tu pago ha sido procesado</p>
      <div className="card text-left">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-gray-500">Método:</span>
          <span className="text-white">{orderResult.method === 'transfermovil' ? 'Transfermóvil' : orderResult.method === 'cash' ? 'Efectivo' : 'Tarjeta'}</span>
          <span className="text-gray-500">Total:</span>
          <span className="text-brand-gold font-bold">{orderResult.amount_paid} {orderResult.currency}</span>
          {orderResult.currency !== 'CUP' && <>
            <span className="text-gray-500">En CUP:</span>
            <span className="text-white">${orderResult.amount_cup}</span>
          </>}
        </div>
      </div>
      <button onClick={() => { setOrderResult(null); setShowCheckout(false); }} className="btn-primary mt-4">Nuevo Pedido</button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <UtensilsCrossed className="w-8 h-8 text-brand-gold" />
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-gold">Menú</h1>
          <p className="text-gray-400 text-sm">Seleccione sus platos y realice su pedido</p>
        </div>
      </div>

      {/* Order type toggle */}
      <div className="flex gap-3 mb-6">
        <button onClick={() => setOrderType('dine_in')} className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${orderType === 'dine_in' ? 'border-brand-gold bg-brand-gold/10 text-brand-gold' : 'border-gray-700 text-gray-500'}`}>
          <MapPin className="w-4 h-4" /> En el Restaurante
        </button>
        <button onClick={() => setOrderType('delivery')} className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${orderType === 'delivery' ? 'border-brand-gold bg-brand-gold/10 text-brand-gold' : 'border-gray-700 text-gray-500'}`}>
          <Truck className="w-4 h-4" /> Entrega a Domicilio
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Items */}
        <div className="lg:col-span-2 space-y-6">
          {categories.map(cat => (
            <div key={cat}>
              <h2 className="text-lg font-bold text-brand-orange mb-3 border-b border-gray-800 pb-1">{cat}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {menu.filter(m => m.category === cat).map(item => (
                  <div key={item.id} className="card hover:border-brand-gold/30 transition cursor-pointer" onClick={() => addToCart(item)}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-white font-medium">{item.name}</h3>
                        <p className="text-gray-500 text-xs mt-1">{item.description}</p>
                      </div>
                      <div className="text-brand-gold font-bold ml-3">${item.selling_price_cup.toFixed(2)}</div>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <span className="text-xs text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded">+ Agregar</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Cart */}
        <div className="lg:col-span-1">
          <div className="card sticky top-20">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="w-5 h-5 text-brand-gold" />
              <h2 className="text-lg font-bold text-brand-gold">Tu Pedido</h2>
            </div>

            {cart.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">Agrega platos del menú</p>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {cart.map(c => (
                    <div key={c.recipe_id} className="flex items-center justify-between bg-brand-dark rounded-lg p-2">
                      <div className="flex-1">
                        <span className="text-white text-sm">{c.name}</span>
                        <span className="text-gray-500 text-xs ml-2">${c.price.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(c.recipe_id, -1)} className="text-gray-400 hover:text-white"><Minus className="w-4 h-4" /></button>
                        <span className="text-white font-medium w-6 text-center">{c.quantity}</span>
                        <button onClick={() => updateQty(c.recipe_id, 1)} className="text-gray-400 hover:text-white"><Plus className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>

                {orderType === 'dine_in' && (
                  <div className="mb-3">
                    <label className="text-xs text-gray-400">Cantidad de personas</label>
                    <input type="number" min={1} value={guestCount} onChange={e => setGuestCount(parseInt(e.target.value) || 1)} className="input-field !py-2" />
                  </div>
                )}

                {orderType === 'delivery' && (
                  <div className="mb-3 space-y-2">
                    <div><label className="text-xs text-gray-400">Dirección de entrega</label>
                    <input value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} className="input-field !py-2" placeholder="Calle, #, municipio" /></div>
                    <div><label className="text-xs text-gray-400">Teléfono</label>
                    <input value={deliveryPhone} onChange={e => setDeliveryPhone(e.target.value)} className="input-field !py-2" placeholder="+53..." /></div>
                  </div>
                )}

                <div className="border-t border-gray-800 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-white">Total</span>
                    <span className="text-brand-gold">${total.toFixed(2)} CUP</span>
                  </div>
                </div>

                {user ? (
                  <button onClick={() => setShowCheckout(true)} className="btn-primary w-full mt-3">
                    Proceder al Pago
                  </button>
                ) : (
                  <p className="text-center text-gray-500 text-sm mt-3">
                    <a href="/login" className="text-brand-gold hover:underline">Inicia sesión</a> para realizar tu pedido
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-bold text-brand-gold">Pago</h3>
              <button onClick={() => setShowCheckout(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Método de pago</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: 'transfermovil', icon: <Smartphone className="w-5 h-5" />, label: 'Transfermóvil' },
                  { val: 'cash', icon: <Banknote className="w-5 h-5" />, label: 'Efectivo' },
                  { val: 'card', icon: <CreditCard className="w-5 h-5" />, label: 'Tarjeta' },
                ].map(m => (
                  <button key={m.val} onClick={() => setPayMethod(m.val)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition text-sm ${payMethod === m.val ? 'border-brand-gold bg-brand-gold/10 text-brand-gold' : 'border-gray-700 text-gray-500'}`}>
                    {m.icon}<span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {payMethod === 'transfermovil' && (
              <div className="mb-4 space-y-2">
                <div className="bg-brand-dark rounded-lg p-3 text-xs text-gray-400">
                  <p className="text-brand-gold font-bold mb-1">Transfermóvil</p>
                  <p>Envíe el pago al número del restaurante y luego ingrese la referencia</p>
                </div>
                <div><label className="text-xs text-gray-400">Número de referencia</label>
                <input value={tmRef} onChange={e => setTmRef(e.target.value)} className="input-field !py-2" placeholder="Ref. de transferencia" /></div>
                <div><label className="text-xs text-gray-400">Su teléfono</label>
                <input value={tmPhone} onChange={e => setTmPhone(e.target.value)} className="input-field !py-2" placeholder="+53..." /></div>
              </div>
            )}

            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Moneda</p>
              <div className="flex flex-wrap gap-2">
                {['CUP', 'USD', 'EUR', 'MLC', 'CAD'].map(c => (
                  <button key={c} onClick={() => convertTotal(c)}
                    className={`px-3 py-1 rounded-full text-sm border transition ${payCurrency === c ? 'border-brand-gold text-brand-gold' : 'border-gray-700 text-gray-500'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-brand-dark rounded-lg p-3 mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Subtotal CUP</span>
                <span className="text-white">${total.toFixed(2)}</span>
              </div>
              {conversion && payCurrency !== 'CUP' && (
                <>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Tasa {payCurrency}</span>
                    <span className="text-gray-400">{rates?.rates?.[payCurrency]} CUP = 1 {payCurrency}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-gray-700 pt-2">
                    <span className="text-white">Total en {payCurrency}</span>
                    <span className="text-brand-gold">{rates?.symbols?.[payCurrency]}{conversion.converted_amount.toFixed(2)}</span>
                  </div>
                </>
              )}
              {payCurrency === 'CUP' && (
                <div className="flex justify-between text-lg font-bold border-t border-gray-700 pt-2">
                  <span className="text-white">Total</span>
                  <span className="text-brand-gold">${total.toFixed(2)} CUP</span>
                </div>
              )}
            </div>

            <button onClick={submitOrder} className="btn-primary w-full" disabled={payMethod === 'transfermovil' && !tmRef}>
              Confirmar Pago
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
