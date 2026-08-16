import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Wallet, Plus, Droplets, Zap, Flame, Users, Building2, Wrench, MoreHorizontal,
} from 'lucide-react';

interface OpCost {
  id: number; month: number; year: number;
  water_cost: number; electricity_cost: number; gas_cost: number;
  salary_cost: number; rent_cost: number; maintenance_cost: number;
  other_costs: number; total: number; notes: string;
}

const BASE = '/api';
function headers(): HeadersInit { const h: HeadersInit = { 'Content-Type': 'application/json' }; const t = localStorage.getItem('token'); if (t) h['Authorization'] = `Bearer ${t}`; return h; }

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function OperatingCosts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [costs, setCosts] = useState<OpCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    month: new Date().getMonth() + 1, year: new Date().getFullYear(),
    water_cost: '', electricity_cost: '', gas_cost: '', salary_cost: '',
    rent_cost: '', maintenance_cost: '', other_costs: '', notes: '',
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    loadCosts();
  }, [user, navigate]);

  const loadCosts = async () => {
    const res = await fetch(`${BASE}/recipes/operating-costs/`, { headers: headers() });
    if (res.ok) setCosts(await res.json());
    setLoading(false);
  };

  const handleAdd = async () => {
    const body = {
      month: form.month, year: form.year, notes: form.notes,
      water_cost: parseFloat(form.water_cost) || 0,
      electricity_cost: parseFloat(form.electricity_cost) || 0,
      gas_cost: parseFloat(form.gas_cost) || 0,
      salary_cost: parseFloat(form.salary_cost) || 0,
      rent_cost: parseFloat(form.rent_cost) || 0,
      maintenance_cost: parseFloat(form.maintenance_cost) || 0,
      other_costs: parseFloat(form.other_costs) || 0,
    };
    const res = await fetch(`${BASE}/recipes/operating-costs/`, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
    if (res.ok) { setShowAdd(false); loadCosts(); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-brand-gold animate-pulse text-lg">Cargando...</div></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Wallet className="w-8 h-8 text-brand-gold" />
          <div>
            <h1 className="font-display text-3xl font-bold text-brand-gold">Costos Operativos</h1>
            <p className="text-gray-400 text-sm">Agua, electricidad, gas, salarios, alquiler y más</p>
          </div>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary !py-2 !px-4 flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Nuevo Mes
        </button>
      </div>

      {costs.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No hay costos operativos registrados</p>
          <p className="text-sm">Registra los gastos mensuales para calcular precios de platos</p>
        </div>
      ) : (
        <div className="space-y-4">
          {costs.map(c => (
            <div key={c.id} className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">{MONTHS[c.month - 1]} {c.year}</h3>
                <div className="text-2xl font-bold text-brand-gold">${c.total.toFixed(2)}</div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                <CostItem icon={<Droplets className="w-4 h-4" />} label="Agua" amount={c.water_cost} color="text-blue-400" />
                <CostItem icon={<Zap className="w-4 h-4" />} label="Electricidad" amount={c.electricity_cost} color="text-yellow-400" />
                <CostItem icon={<Flame className="w-4 h-4" />} label="Gas" amount={c.gas_cost} color="text-orange-400" />
                <CostItem icon={<Users className="w-4 h-4" />} label="Salarios" amount={c.salary_cost} color="text-green-400" />
                <CostItem icon={<Building2 className="w-4 h-4" />} label="Alquiler" amount={c.rent_cost} color="text-purple-400" />
                <CostItem icon={<Wrench className="w-4 h-4" />} label="Mantenimiento" amount={c.maintenance_cost} color="text-gray-400" />
                <CostItem icon={<MoreHorizontal className="w-4 h-4" />} label="Otros" amount={c.other_costs} color="text-gray-500" />
              </div>
              {c.notes && <p className="text-gray-500 text-xs mt-3">{c.notes}</p>}
              <div className="mt-3 text-xs text-gray-500">
                Costo por plato (est. 900 platos/mes): <span className="text-brand-gold font-medium">${(c.total / 900).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-xl font-bold text-brand-gold mb-4">Registrar Costos del Mes</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-400">Mes</label>
                <select value={form.month} onChange={e => setForm({...form, month: parseInt(e.target.value)})} className="input-field !py-2">
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div><label className="text-xs text-gray-400">Año</label><input type="number" value={form.year} onChange={e => setForm({...form, year: parseInt(e.target.value)})} className="input-field !py-2" /></div>
              <div><label className="text-xs text-gray-400 flex items-center gap-1"><Droplets className="w-3 h-3 text-blue-400" /> Agua</label><input type="number" value={form.water_cost} onChange={e => setForm({...form, water_cost: e.target.value})} className="input-field !py-2" /></div>
              <div><label className="text-xs text-gray-400 flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-400" /> Electricidad</label><input type="number" value={form.electricity_cost} onChange={e => setForm({...form, electricity_cost: e.target.value})} className="input-field !py-2" /></div>
              <div><label className="text-xs text-gray-400 flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" /> Gas</label><input type="number" value={form.gas_cost} onChange={e => setForm({...form, gas_cost: e.target.value})} className="input-field !py-2" /></div>
              <div><label className="text-xs text-gray-400 flex items-center gap-1"><Users className="w-3 h-3 text-green-400" /> Salarios</label><input type="number" value={form.salary_cost} onChange={e => setForm({...form, salary_cost: e.target.value})} className="input-field !py-2" /></div>
              <div><label className="text-xs text-gray-400 flex items-center gap-1"><Building2 className="w-3 h-3 text-purple-400" /> Alquiler</label><input type="number" value={form.rent_cost} onChange={e => setForm({...form, rent_cost: e.target.value})} className="input-field !py-2" /></div>
              <div><label className="text-xs text-gray-400 flex items-center gap-1"><Wrench className="w-3 h-3" /> Mantenimiento</label><input type="number" value={form.maintenance_cost} onChange={e => setForm({...form, maintenance_cost: e.target.value})} className="input-field !py-2" /></div>
              <div><label className="text-xs text-gray-400">Otros gastos</label><input type="number" value={form.other_costs} onChange={e => setForm({...form, other_costs: e.target.value})} className="input-field !py-2" /></div>
              <div className="col-span-2"><label className="text-xs text-gray-400">Notas</label><input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="input-field !py-2" /></div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleAdd} className="btn-primary flex-1">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CostItem({ icon, label, amount, color }: { icon: React.ReactNode; label: string; amount: number; color: string }) {
  return (
    <div className="bg-brand-dark rounded-lg p-2 text-center">
      <div className={`flex items-center justify-center gap-1 mb-1 ${color}`}>{icon}<span className="text-xs">{label}</span></div>
      <div className="text-white font-medium text-sm">${amount.toFixed(0)}</div>
    </div>
  );
}
