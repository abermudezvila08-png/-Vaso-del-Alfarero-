import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Truck, Plus, Package, Check, FileText } from 'lucide-react';

interface SupplierData { id: number; name: string; contact_person: string; phone: string; email: string; address: string; notes: string; }
interface Ingredient { id: number; name: string; unit: string; }
interface PO { id: number; supplier_name: string; status: string; total_amount: number; ordered_at: string; items: any[]; }

const BASE = '/api';
function headers(): HeadersInit { const h: HeadersInit = { 'Content-Type': 'application/json' }; const t = localStorage.getItem('token'); if (t) h['Authorization'] = `Bearer ${t}`; return h; }

export default function SupplierManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [orders, setOrders] = useState<PO[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showAddPO, setShowAddPO] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ name: '', contact_person: '', phone: '', email: '', address: '' });
  const [poForm, setPoForm] = useState({ supplier_id: '', items: [{ ingredient_id: '', quantity: '', unit_price: '' }], notes: '' });

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    const [s, o, i] = await Promise.all([
      fetch(`${BASE}/suppliers/`, { headers: headers() }),
      fetch(`${BASE}/suppliers/purchase-orders`, { headers: headers() }),
      fetch(`${BASE}/inventory/ingredients`, { headers: headers() }),
    ]);
    if (s.ok) setSuppliers(await s.json());
    if (o.ok) setOrders(await o.json());
    if (i.ok) setIngredients(await i.json());
    setLoading(false);
  };

  const addSupplier = async () => {
    const res = await fetch(`${BASE}/suppliers/`, { method: 'POST', headers: headers(), body: JSON.stringify(supplierForm) });
    if (res.ok) { setShowAddSupplier(false); loadData(); }
  };

  const addPO = async () => {
    const items = poForm.items.filter(i => i.ingredient_id && i.quantity).map(i => ({
      ingredient_id: parseInt(i.ingredient_id), quantity: parseFloat(i.quantity), unit_price: parseFloat(i.unit_price) || 0,
    }));
    const res = await fetch(`${BASE}/suppliers/purchase-orders`, {
      method: 'POST', headers: headers(),
      body: JSON.stringify({ supplier_id: parseInt(poForm.supplier_id), items, notes: poForm.notes }),
    });
    if (res.ok) { setShowAddPO(false); loadData(); }
  };

  const receivePO = async (id: number) => {
    const res = await fetch(`${BASE}/suppliers/purchase-orders/${id}/receive`, { method: 'POST', headers: headers() });
    if (res.ok) loadData();
  };

  const addPOItem = () => {
    setPoForm(f => ({ ...f, items: [...f.items, { ingredient_id: '', quantity: '', unit_price: '' }] }));
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-brand-gold animate-pulse text-lg">Cargando...</div></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Truck className="w-8 h-8 text-brand-gold" />
          <div>
            <h1 className="font-display text-3xl font-bold text-brand-gold">Proveedores</h1>
            <p className="text-gray-400 text-sm">Gestión de proveedores y órdenes de compra</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddSupplier(true)} className="btn-secondary !py-2 !px-3 text-sm flex items-center gap-1"><Plus className="w-3 h-3" /> Proveedor</button>
          <button onClick={() => setShowAddPO(true)} className="btn-primary !py-2 !px-3 text-sm flex items-center gap-1"><FileText className="w-3 h-3" /> Orden de Compra</button>
        </div>
      </div>

      {/* Suppliers */}
      <h2 className="text-lg font-bold text-brand-orange mb-3">Proveedores</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {suppliers.map(s => (
          <div key={s.id} className="card">
            <h3 className="text-white font-bold">{s.name}</h3>
            {s.contact_person && <p className="text-gray-400 text-sm">{s.contact_person}</p>}
            {s.phone && <p className="text-gray-500 text-xs">{s.phone}</p>}
            {s.email && <p className="text-gray-500 text-xs">{s.email}</p>}
            {s.address && <p className="text-gray-600 text-xs mt-1">{s.address}</p>}
          </div>
        ))}
      </div>

      {/* Purchase Orders */}
      <h2 className="text-lg font-bold text-brand-orange mb-3">Órdenes de Compra</h2>
      <div className="space-y-3">
        {orders.map(po => (
          <div key={po.id} className="card">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-white font-medium">OC #{po.id}</span>
                <span className="text-gray-400 text-sm ml-2">{po.supplier_name}</span>
                <span className={`ml-2 text-xs px-2 py-0.5 rounded ${po.status === 'received' ? 'bg-green-900/20 text-green-400' : po.status === 'pending' ? 'bg-yellow-900/20 text-yellow-400' : 'bg-gray-800 text-gray-400'}`}>
                  {po.status === 'received' ? 'Recibida' : po.status === 'pending' ? 'Pendiente' : po.status}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-brand-gold font-bold">${po.total_amount.toFixed(2)}</span>
                {po.status === 'pending' && (
                  <button onClick={() => receivePO(po.id)} className="text-xs bg-green-900/20 text-green-400 px-2 py-1 rounded flex items-center gap-1">
                    <Check className="w-3 h-3" /> Recibir
                  </button>
                )}
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {po.items.map((it: any, i: number) => (
                <span key={i}>{it.ingredient_name} ({it.quantity}{it.received_quantity ? `/${it.received_quantity}` : ''}) {i < po.items.length - 1 ? '• ' : ''}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Supplier Modal */}
      {showAddSupplier && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <h3 className="font-display text-xl font-bold text-brand-gold mb-4">Nuevo Proveedor</h3>
            <div className="space-y-2">
              <input value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} className="input-field !py-2" placeholder="Nombre de la empresa" />
              <input value={supplierForm.contact_person} onChange={e => setSupplierForm({...supplierForm, contact_person: e.target.value})} className="input-field !py-2" placeholder="Persona de contacto" />
              <div className="grid grid-cols-2 gap-2">
                <input value={supplierForm.phone} onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})} className="input-field !py-2" placeholder="Teléfono" />
                <input value={supplierForm.email} onChange={e => setSupplierForm({...supplierForm, email: e.target.value})} className="input-field !py-2" placeholder="Email" />
              </div>
              <input value={supplierForm.address} onChange={e => setSupplierForm({...supplierForm, address: e.target.value})} className="input-field !py-2" placeholder="Dirección" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowAddSupplier(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={addSupplier} className="btn-primary flex-1">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Add PO Modal */}
      {showAddPO && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-xl font-bold text-brand-gold mb-4">Nueva Orden de Compra</h3>
            <div className="space-y-3">
              <div><label className="text-xs text-gray-400">Proveedor</label>
                <select value={poForm.supplier_id} onChange={e => setPoForm({...poForm, supplier_id: e.target.value})} className="input-field !py-2">
                  <option value="">Seleccionar...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400">Artículos</label>
                {poForm.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-2 mt-1">
                    <select value={item.ingredient_id} onChange={e => { const items = [...poForm.items]; items[idx].ingredient_id = e.target.value; setPoForm({...poForm, items}); }} className="input-field !py-1 text-sm">
                      <option value="">Ingrediente</option>
                      {ingredients.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                    <input type="number" value={item.quantity} onChange={e => { const items = [...poForm.items]; items[idx].quantity = e.target.value; setPoForm({...poForm, items}); }} className="input-field !py-1 text-sm" placeholder="Cantidad" />
                    <input type="number" step="0.01" value={item.unit_price} onChange={e => { const items = [...poForm.items]; items[idx].unit_price = e.target.value; setPoForm({...poForm, items}); }} className="input-field !py-1 text-sm" placeholder="Precio unit." />
                  </div>
                ))}
                <button onClick={addPOItem} className="text-xs text-brand-gold mt-1">+ Agregar artículo</button>
              </div>
              <input value={poForm.notes} onChange={e => setPoForm({...poForm, notes: e.target.value})} className="input-field !py-2" placeholder="Notas" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowAddPO(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={addPO} className="btn-primary flex-1">Crear Orden</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
