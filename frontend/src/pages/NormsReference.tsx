import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen, Search, Calculator, Scale,
} from 'lucide-react';

interface Norm {
  ingredient: string; category: string;
  cuban_portion_g: number | null; european_portion_g: number | null; asian_portion_g: number | null;
  effective_portion_g: number; norm_source: string; unit: string; notes: string;
}
interface PriceAdj {
  ingredient_name: string; norm_portion_g: number; actual_portion_g: number;
  ratio: number; base_cost: number; adjusted_cost: number; difference_pct: number;
}

const BASE = '/api';
function headers(): HeadersInit { const h: HeadersInit = { 'Content-Type': 'application/json' }; const t = localStorage.getItem('token'); if (t) h['Authorization'] = `Bearer ${t}`; return h; }

export default function NormsReference() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [norms, setNorms] = useState<Norm[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  // Price calculator
  const [calcIngredient, setCalcIngredient] = useState('Huevo frito');
  const [calcActual, setCalcActual] = useState('75');
  const [calcCost, setCalcCost] = useState('0.50');
  const [calcResult, setCalcResult] = useState<PriceAdj | null>(null);

  useEffect(() => {
    if (!user || (user.role !== 'staff' && user.role !== 'admin')) { navigate('/'); return; }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    const [normsRes, catsRes] = await Promise.all([
      fetch(`${BASE}/norms/`, { headers: headers() }),
      fetch(`${BASE}/norms/categories`, { headers: headers() }),
    ]);
    if (normsRes.ok) setNorms(await normsRes.json());
    if (catsRes.ok) setCategories(await catsRes.json());
    setLoading(false);
  };

  const loadByCategory = async (cat: string) => {
    setSelectedCat(cat);
    const url = cat ? `${BASE}/norms/?category=${encodeURIComponent(cat)}` : `${BASE}/norms/`;
    const res = await fetch(url, { headers: headers() });
    if (res.ok) setNorms(await res.json());
  };

  const calculatePrice = async () => {
    const res = await fetch(
      `${BASE}/norms/price-adjustment?ingredient_name=${encodeURIComponent(calcIngredient)}&actual_portion_g=${calcActual}&base_cost=${calcCost}`,
      { headers: headers() }
    );
    if (res.ok) setCalcResult(await res.json());
  };

  const filtered = norms.filter(n =>
    n.ingredient.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-brand-gold animate-pulse text-lg">Cargando...</div></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <BookOpen className="w-8 h-8 text-brand-gold" />
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-gold">Normas de Porciones</h1>
          <p className="text-gray-400 text-sm">Prioridad: Cubana (NC) → Europea (EU) → Asiática (AS)</p>
        </div>
      </div>

      {/* Price Calculator */}
      <div className="card border-brand-gold/20 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-brand-gold" />
          <h2 className="text-lg font-bold text-brand-gold">Calculadora de Ajuste de Precio</h2>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Si la norma dice 50g y tu ingrediente real pesa 75g, ¿cuál es el costo ajustado?
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-gray-400">Ingrediente</label>
            <input value={calcIngredient} onChange={e => setCalcIngredient(e.target.value)} className="input-field !py-2" placeholder="Ej: Huevo frito" />
          </div>
          <div>
            <label className="text-xs text-gray-400">Porción Real (g)</label>
            <input type="number" value={calcActual} onChange={e => setCalcActual(e.target.value)} className="input-field !py-2" />
          </div>
          <div>
            <label className="text-xs text-gray-400">Costo Base ($)</label>
            <input type="number" step="0.01" value={calcCost} onChange={e => setCalcCost(e.target.value)} className="input-field !py-2" />
          </div>
          <div className="flex items-end">
            <button onClick={calculatePrice} className="btn-primary !py-2 w-full">Calcular</button>
          </div>
        </div>

        {calcResult && (
          <div className="mt-4 bg-brand-dark rounded-lg p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500 block">Norma</span>
                <span className="text-white font-bold">{calcResult.norm_portion_g}g</span>
              </div>
              <div>
                <span className="text-gray-500 block">Real</span>
                <span className="text-white font-bold">{calcResult.actual_portion_g}g</span>
              </div>
              <div>
                <span className="text-gray-500 block">Costo Base</span>
                <span className="text-white font-bold">${calcResult.base_cost.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Costo Ajustado</span>
                <span className="text-brand-gold font-bold text-lg">${calcResult.adjusted_cost.toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Scale className="w-4 h-4 text-brand-orange" />
              <span className="text-sm text-gray-300">
                Ratio: {calcResult.ratio}x — Diferencia: <span className={calcResult.difference_pct > 0 ? 'text-red-400' : 'text-green-400'}>{calcResult.difference_pct > 0 ? '+' : ''}{calcResult.difference_pct}%</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar ingrediente..." className="input-field !pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => loadByCategory('')} className={`px-3 py-1 rounded-full text-sm border transition ${!selectedCat ? 'border-brand-gold text-brand-gold' : 'border-gray-700 text-gray-500 hover:border-gray-600'}`}>
            Todas
          </button>
          {categories.map(c => (
            <button key={c} onClick={() => loadByCategory(c)} className={`px-3 py-1 rounded-full text-sm border transition ${selectedCat === c ? 'border-brand-gold text-brand-gold' : 'border-gray-700 text-gray-500 hover:border-gray-600'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Norms Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-500 text-sm py-3 px-3">Ingrediente</th>
              <th className="text-left text-gray-500 text-sm py-3 px-3">Categoría</th>
              <th className="text-center text-gray-500 text-sm py-3 px-3">
                <span className="text-brand-gold">NC Cuba</span>
              </th>
              <th className="text-center text-gray-500 text-sm py-3 px-3">
                <span className="text-blue-400">EU Europa</span>
              </th>
              <th className="text-center text-gray-500 text-sm py-3 px-3">
                <span className="text-green-400">AS Asia</span>
              </th>
              <th className="text-center text-gray-500 text-sm py-3 px-3">Efectiva</th>
              <th className="text-left text-gray-500 text-sm py-3 px-3">Fuente</th>
              <th className="text-left text-gray-500 text-sm py-3 px-3">Notas</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((n, i) => (
              <tr key={i} className="border-b border-gray-800/50 hover:bg-brand-dark/50">
                <td className="py-3 px-3 text-white font-medium">{n.ingredient}</td>
                <td className="py-3 px-3 text-gray-400 text-sm">{n.category}</td>
                <td className="py-3 px-3 text-center">
                  {n.cuban_portion_g != null ? <span className="text-brand-gold font-medium">{n.cuban_portion_g}{n.unit}</span> : <span className="text-gray-700">—</span>}
                </td>
                <td className="py-3 px-3 text-center">
                  {n.european_portion_g != null ? <span className="text-blue-400">{n.european_portion_g}{n.unit}</span> : <span className="text-gray-700">—</span>}
                </td>
                <td className="py-3 px-3 text-center">
                  {n.asian_portion_g != null ? <span className="text-green-400">{n.asian_portion_g}{n.unit}</span> : <span className="text-gray-700">—</span>}
                </td>
                <td className="py-3 px-3 text-center text-white font-bold">{n.effective_portion_g}{n.unit}</td>
                <td className="py-3 px-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${n.norm_source.includes('NC') ? 'bg-brand-gold/10 text-brand-gold' : n.norm_source.includes('EU') ? 'bg-blue-400/10 text-blue-400' : n.norm_source.includes('ASIA') ? 'bg-green-400/10 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                    {n.norm_source}
                  </span>
                </td>
                <td className="py-3 px-3 text-gray-500 text-xs max-w-[200px] truncate">{n.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
