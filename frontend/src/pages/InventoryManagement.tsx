import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Package, Plus, AlertTriangle, TrendingDown, Search, Truck,
} from 'lucide-react';

interface Ingredient {
  id: number; name: string; category: string; unit: string;
  norm_cuban_g: number | null; norm_european_g: number | null; norm_asian_g: number | null;
  norm_source: string; actual_portion_g: number | null;
  current_stock: number; min_stock_alert: number; unit_cost: number;
  supplier: string; is_active: boolean; effective_norm_g: number | null; stock_status: string;
}

const BASE = '/api';
function headers(): HeadersInit {
  const h: HeadersInit = { 'Content-Type': 'application/json' };
  const t = localStorage.getItem('token');
  if (t) h['Authorization'] = `Bearer ${t}`;
  return h;
}

export default function InventoryManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Proteínas', unit: 'g', norm_cuban_g: '', norm_european_g: '', norm_asian_g: '', actual_portion_g: '', current_stock: '', min_stock_alert: '', unit_cost: '', supplier: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || (user.role !== 'staff' && user.role !== 'admin')) { navigate('/'); return; }
    loadIngredients();
  }, [user, navigate]);

  const loadIngredients = async () => {
    const res = await fetch(`${BASE}/inventory/ingredients`, { headers: headers() });
    if (res.ok) setIngredients(await res.json());
    setLoading(false);
  };

  const handleAdd = async () => {
    setError('');
    const body: Record<string, unknown> = {
      name: form.name, category: form.category, unit: form.unit, supplier: form.supplier,
      current_stock: parseFloat(form.current_stock) || 0,
      min_stock_alert: parseFloat(form.min_stock_alert) || 0,
      unit_cost: parseFloat(form.unit_cost) || 0,
    };
    if (form.norm_cuban_g) body.norm_cuban_g = parseFloat(form.norm_cuban_g);
    if (form.norm_european_g) body.norm_european_g = parseFloat(form.norm_european_g);
    if (form.norm_asian_g) body.norm_asian_g = parseFloat(form.norm_asian_g);
    if (form.actual_portion_g) body.actual_portion_g = parseFloat(form.actual_portion_g);

    const res = await fetch(`${BASE}/inventory/ingredients`, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
    if (res.ok) { setShowAdd(false); loadIngredients(); setForm({ name: '', category: 'Proteínas', unit: 'g', norm_cuban_g: '', norm_european_g: '', norm_asian_g: '', actual_portion_g: '', current_stock: '', min_stock_alert: '', unit_cost: '', supplier: '' }); }
    else { const b = await res.json(); setError(b.detail || 'Error'); }
  };

  const filtered = ingredients.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()));

  const stockColor = (s: string) => {
    if (s === 'out_of_stock') return 'text-red-500';
    if (s === 'critical') return 'text-red-400';
    if (s === 'warning') return 'text-yellow-400';
    return 'text-green-400';
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-brand-gold animate-pulse text-lg">Cargando...</div></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-brand-gold" />
          <div>
            <h1 className="font-display text-3xl font-bold text-brand-gold">Inventario</h1>
            <p className="text-gray-400 text-sm">Gestión de ingredientes y stock</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="input-field !pl-9 !w-48" />
          </div>
          {user?.role === 'admin' && (
            <button onClick={() => setShowAdd(true)} className="btn-primary !py-2 !px-4 flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Agregar
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {ingredients.filter(i => i.stock_status !== 'ok').length > 0 && (
        <div className="card border-red-700/30 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-red-400 font-bold">Alertas de Stock</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {ingredients.filter(i => i.stock_status !== 'ok').map(i => (
              <span key={i.id} className={`text-xs px-3 py-1 rounded-full border ${i.stock_status === 'critical' || i.stock_status === 'out_of_stock' ? 'border-red-700 text-red-400' : 'border-yellow-700 text-yellow-400'}`}>
                {i.name}: {i.current_stock}{i.unit} (mín: {i.min_stock_alert})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-500 text-sm py-3 px-3">Ingrediente</th>
              <th className="text-left text-gray-500 text-sm py-3 px-3">Categoría</th>
              <th className="text-left text-gray-500 text-sm py-3 px-3">Norma</th>
              <th className="text-left text-gray-500 text-sm py-3 px-3">Porción Real</th>
              <th className="text-left text-gray-500 text-sm py-3 px-3">Stock</th>
              <th className="text-left text-gray-500 text-sm py-3 px-3">Costo/u</th>
              <th className="text-left text-gray-500 text-sm py-3 px-3">Fuente</th>
              <th className="text-left text-gray-500 text-sm py-3 px-3">Proveedor</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(i => (
              <tr key={i.id} className="border-b border-gray-800/50 hover:bg-brand-dark/50">
                <td className="py-3 px-3 text-white font-medium">{i.name}</td>
                <td className="py-3 px-3 text-gray-400 text-sm">{i.category}</td>
                <td className="py-3 px-3 text-sm">
                  <div className="space-y-0.5">
                    {i.norm_cuban_g != null && <span className="text-brand-gold">NC: {i.norm_cuban_g}{i.unit}</span>}
                    {i.norm_european_g != null && <span className="text-blue-400 block">EU: {i.norm_european_g}{i.unit}</span>}
                    {i.norm_asian_g != null && <span className="text-green-400 block">AS: {i.norm_asian_g}{i.unit}</span>}
                  </div>
                </td>
                <td className="py-3 px-3 text-white text-sm">
                  {i.actual_portion_g != null ? (
                    <span>
                      {i.actual_portion_g}{i.unit}
                      {i.effective_norm_g && i.actual_portion_g !== i.effective_norm_g && (
                        <span className={`ml-1 text-xs ${i.actual_portion_g > i.effective_norm_g ? 'text-brand-orange' : 'text-green-400'}`}>
                          ({i.actual_portion_g > i.effective_norm_g ? '+' : ''}{Math.round((i.actual_portion_g / i.effective_norm_g - 1) * 100)}%)
                        </span>
                      )}
                    </span>
                  ) : '—'}
                </td>
                <td className="py-3 px-3">
                  <span className={`font-medium text-sm ${stockColor(i.stock_status)}`}>
                    {i.current_stock.toLocaleString()}{i.unit}
                  </span>
                </td>
                <td className="py-3 px-3 text-brand-gold text-sm">${i.unit_cost.toFixed(4)}</td>
                <td className="py-3 px-3 text-xs">
                  <span className={`px-2 py-0.5 rounded ${i.norm_source.includes('NC') ? 'bg-brand-gold/10 text-brand-gold' : i.norm_source.includes('EU') ? 'bg-blue-400/10 text-blue-400' : 'bg-gray-700 text-gray-400'}`}>
                    {i.norm_source.split(' ')[0]}
                  </span>
                </td>
                <td className="py-3 px-3 text-gray-400 text-sm flex items-center gap-1">
                  <Truck className="w-3 h-3" /> {i.supplier || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-xl font-bold text-brand-gold mb-4">Nuevo Ingrediente</h3>
            {error && <div className="bg-red-900/30 border border-red-700 text-red-300 px-3 py-2 rounded mb-3 text-sm">{error}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="text-xs text-gray-400">Nombre</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field !py-2" /></div>
              <div><label className="text-xs text-gray-400">Categoría</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input-field !py-2">
                  {['Proteínas','Carbohidratos','Vegetales','Sopas','Postres','Bebidas','Salsas','Ingredientes','Otros'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="text-xs text-gray-400">Unidad</label>
                <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="input-field !py-2">
                  <option value="g">g</option><option value="ml">ml</option><option value="pieza">pieza</option>
                </select>
              </div>
              <div><label className="text-xs text-gray-400">Norma Cubana (g)</label><input type="number" value={form.norm_cuban_g} onChange={e => setForm({...form, norm_cuban_g: e.target.value})} className="input-field !py-2" /></div>
              <div><label className="text-xs text-gray-400">Norma Europea (g)</label><input type="number" value={form.norm_european_g} onChange={e => setForm({...form, norm_european_g: e.target.value})} className="input-field !py-2" /></div>
              <div><label className="text-xs text-gray-400">Norma Asiática (g)</label><input type="number" value={form.norm_asian_g} onChange={e => setForm({...form, norm_asian_g: e.target.value})} className="input-field !py-2" /></div>
              <div><label className="text-xs text-gray-400">Porción Real (g)</label><input type="number" value={form.actual_portion_g} onChange={e => setForm({...form, actual_portion_g: e.target.value})} className="input-field !py-2" /></div>
              <div><label className="text-xs text-gray-400">Stock Actual</label><input type="number" value={form.current_stock} onChange={e => setForm({...form, current_stock: e.target.value})} className="input-field !py-2" /></div>
              <div><label className="text-xs text-gray-400">Stock Mínimo</label><input type="number" value={form.min_stock_alert} onChange={e => setForm({...form, min_stock_alert: e.target.value})} className="input-field !py-2" /></div>
              <div><label className="text-xs text-gray-400">Costo/unidad ($)</label><input type="number" step="0.0001" value={form.unit_cost} onChange={e => setForm({...form, unit_cost: e.target.value})} className="input-field !py-2" /></div>
              <div><label className="text-xs text-gray-400">Proveedor</label><input value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} className="input-field !py-2" /></div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleAdd} disabled={!form.name} className="btn-primary flex-1">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
