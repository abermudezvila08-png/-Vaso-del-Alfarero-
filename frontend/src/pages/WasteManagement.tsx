import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Trash2, Plus, BarChart3 } from 'lucide-react';

interface Ingredient { id: number; name: string; unit: string; current_stock: number; }
interface WasteEntry { id: number; ingredient_name: string; quantity: number; unit: string; cause: string; cause_label: string; cost_lost: number; notes: string; recorded_at: string; }
interface WasteReport { total_waste_cost: number; total_incidents: number; by_cause: any[]; top_wasted_ingredients: any[]; }

const BASE = '/api';
function headers(): HeadersInit { const h: HeadersInit = { 'Content-Type': 'application/json' }; const t = localStorage.getItem('token'); if (t) h['Authorization'] = `Bearer ${t}`; return h; }

const CAUSES = [
  { value: 'expired', label: 'Caducado' },
  { value: 'damaged', label: 'Dañado' },
  { value: 'overproduction', label: 'Sobreproducción' },
  { value: 'preparation', label: 'Preparación' },
  { value: 'customer_return', label: 'Devolución del cliente' },
  { value: 'storage', label: 'Error de almacenamiento' },
  { value: 'other', label: 'Otro' },
];

export default function WasteManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<WasteEntry[]>([]);
  const [report, setReport] = useState<WasteReport | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ingredient_id: '', quantity: '', cause: 'expired', notes: '' });

  useEffect(() => {
    if (!user || (user.role !== 'staff' && user.role !== 'admin')) { navigate('/'); return; }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    const [e, r, i] = await Promise.all([
      fetch(`${BASE}/waste/`, { headers: headers() }),
      fetch(`${BASE}/waste/report`, { headers: headers() }),
      fetch(`${BASE}/inventory/ingredients`, { headers: headers() }),
    ]);
    if (e.ok) setEntries(await e.json());
    if (r.ok) setReport(await r.json());
    if (i.ok) setIngredients(await i.json());
    setLoading(false);
  };

  const handleAdd = async () => {
    const res = await fetch(`${BASE}/waste/`, {
      method: 'POST', headers: headers(),
      body: JSON.stringify({
        ingredient_id: parseInt(form.ingredient_id),
        quantity: parseFloat(form.quantity),
        cause: form.cause,
        notes: form.notes,
      }),
    });
    if (res.ok) { setShowAdd(false); setForm({ ingredient_id: '', quantity: '', cause: 'expired', notes: '' }); loadData(); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-brand-gold animate-pulse text-lg">Cargando...</div></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Trash2 className="w-8 h-8 text-red-400" />
          <div>
            <h1 className="font-display text-3xl font-bold text-brand-gold">Mermas y Desperdicios</h1>
            <p className="text-gray-400 text-sm">Registro y análisis de pérdidas</p>
          </div>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary !py-2 !px-4 flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Registrar Merma
        </button>
      </div>

      {/* Report Summary */}
      {report && user?.role === 'admin' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="card border-red-700/30">
            <span className="text-gray-400 text-sm">Costo Total Merma</span>
            <div className="text-2xl font-bold text-red-400">${report.total_waste_cost.toFixed(2)}</div>
            <span className="text-gray-600 text-xs">{report.total_incidents} incidentes</span>
          </div>
          <div className="card">
            <span className="text-gray-400 text-sm">Por Causa</span>
            <div className="mt-2 space-y-1">
              {report.by_cause.map((c, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-gray-300">{c.cause_label}</span>
                  <span className="text-red-400">${c.total_cost.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <span className="text-gray-400 text-sm">Top Ingredientes</span>
            <div className="mt-2 space-y-1">
              {report.top_wasted_ingredients.map((t, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-gray-300">{t.ingredient_name}</span>
                  <span className="text-red-400">${t.total_cost.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Entries list */}
      <div className="space-y-2">
        {entries.map(e => (
          <div key={e.id} className="card !py-3 flex items-center justify-between">
            <div>
              <span className="text-white font-medium">{e.ingredient_name}</span>
              <span className="text-gray-500 text-sm ml-2">{e.quantity}{e.unit}</span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded bg-red-900/20 text-red-400">{e.cause_label}</span>
              {e.notes && <span className="text-gray-600 text-xs ml-2">{e.notes}</span>}
            </div>
            <div className="text-right">
              <div className="text-red-400 font-medium">-${e.cost_lost.toFixed(2)}</div>
              <div className="text-gray-600 text-xs">{e.recorded_at.slice(0, 10)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <h3 className="font-display text-xl font-bold text-brand-gold mb-4">Registrar Merma</h3>
            <div className="space-y-3">
              <div><label className="text-xs text-gray-400">Ingrediente</label>
                <select value={form.ingredient_id} onChange={e => setForm({...form, ingredient_id: e.target.value})} className="input-field !py-2">
                  <option value="">Seleccionar...</option>
                  {ingredients.map(i => <option key={i.id} value={i.id}>{i.name} ({i.current_stock}{i.unit} en stock)</option>)}
                </select>
              </div>
              <div><label className="text-xs text-gray-400">Cantidad</label>
                <input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="input-field !py-2" /></div>
              <div><label className="text-xs text-gray-400">Causa</label>
                <select value={form.cause} onChange={e => setForm({...form, cause: e.target.value})} className="input-field !py-2">
                  {CAUSES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div><label className="text-xs text-gray-400">Notas</label>
                <input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="input-field !py-2" placeholder="Detalles adicionales" /></div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleAdd} className="btn-primary flex-1" disabled={!form.ingredient_id || !form.quantity}>Registrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
