import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ChefHat, DollarSign, Plus, AlertTriangle, Scale, Info,
} from 'lucide-react';

interface RecipeIngredient {
  id: number; ingredient_id: number; norm_quantity: number; actual_quantity: number; unit: string;
  ingredient?: { id: number; name: string; category: string; unit: string; unit_cost: number };
  cost_contribution: number;
}
interface Recipe {
  id: number; name: string; category: string; description: string; servings: number;
  preparation_time_min: number; ingredient_cost: number; operating_cost_share: number;
  total_cost: number; selling_price: number; profit_margin: number; is_active: boolean;
  ingredients: RecipeIngredient[];
}
interface CostBreakdown {
  recipe_name: string; ingredient_costs: { ingredient: string; norm_qty: number; actual_qty: number; unit: string; unit_cost: number; line_cost: number }[];
  total_ingredient_cost: number; operating_cost_per_dish: number; total_production_cost: number;
  profit_margin_pct: number; profit_amount: number; selling_price: number;
  norm_adjustments: { ingredient: string; norm_qty: number; actual_qty: number; ratio: number; cost_impact: number; norm_source: string }[];
}

const BASE = '/api';
function headers(): HeadersInit { const h: HeadersInit = { 'Content-Type': 'application/json' }; const t = localStorage.getItem('token'); if (t) h['Authorization'] = `Bearer ${t}`; return h; }

export default function RecipeManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<number | null>(null);
  const [breakdown, setBreakdown] = useState<CostBreakdown | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    if (!user || (user.role !== 'staff' && user.role !== 'admin')) { navigate('/'); return; }
    loadRecipes();
  }, [user, navigate]);

  const loadRecipes = async () => {
    const res = await fetch(`${BASE}/recipes/`, { headers: headers() });
    if (res.ok) setRecipes(await res.json());
    setLoading(false);
  };

  const viewBreakdown = async (id: number) => {
    setSelectedRecipe(id);
    const res = await fetch(`${BASE}/recipes/${id}/cost-breakdown`, { headers: headers() });
    if (res.ok) { setBreakdown(await res.json()); setShowBreakdown(true); }
  };

  const recalculateAll = async () => {
    await fetch(`${BASE}/recipes/recalculate-all`, { method: 'POST', headers: headers() });
    loadRecipes();
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-brand-gold animate-pulse text-lg">Cargando...</div></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <ChefHat className="w-8 h-8 text-brand-gold" />
          <div>
            <h1 className="font-display text-3xl font-bold text-brand-gold">Recetas y Costos</h1>
            <p className="text-gray-400 text-sm">Gestión de recetas con cálculo de costos automático</p>
          </div>
        </div>
        {user?.role === 'admin' && (
          <button onClick={recalculateAll} className="btn-secondary !py-2 !px-4 text-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> Recalcular Todo
          </button>
        )}
      </div>

      {/* Info banner about cost formula */}
      <div className="card border-brand-gold/20 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-brand-gold mt-0.5 shrink-0" />
          <div className="text-sm text-gray-300">
            <strong className="text-brand-gold">Fórmula de Precio:</strong>{' '}
            Precio de Venta = (Costo Ingredientes + Costos Operativos por plato) × (1 + 30% lucro).
            Los costos operativos incluyen agua, electricidad, gas, salarios, alquiler y mantenimiento.
            El ajuste de norma refleja la diferencia entre la porción estándar (NC/EU/AS) y la porción real utilizada.
          </div>
        </div>
      </div>

      {/* Recipe Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {recipes.map(r => (
          <div key={r.id} className="card hover:border-brand-gold/30 transition-all cursor-pointer" onClick={() => viewBreakdown(r.id)}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-white">{r.name}</h3>
                <span className="text-xs text-gray-500">{r.category} · {r.preparation_time_min} min</span>
              </div>
              <div className="text-right">
                <div className="text-brand-gold font-bold text-xl">${r.selling_price.toFixed(2)}</div>
                <div className="text-xs text-gray-500">precio venta</div>
              </div>
            </div>

            <p className="text-gray-400 text-sm mb-4">{r.description}</p>

            {/* Cost breakdown mini */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Costo ingredientes</span>
                <span className="text-white">${r.ingredient_cost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Gastos operativos</span>
                <span className="text-white">${r.operating_cost_share.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-800 pt-2 flex justify-between text-gray-400">
                <span>Costo total</span>
                <span className="text-brand-orange">${r.total_cost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Margen +{r.profit_margin}%</span>
                <span className="text-green-400 font-medium">${(r.selling_price - r.total_cost).toFixed(2)}</span>
              </div>
            </div>

            {/* Ingredients */}
            {r.ingredients.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-800">
                <span className="text-xs text-gray-500 block mb-2">Ingredientes:</span>
                <div className="flex flex-wrap gap-1">
                  {r.ingredients.map(ri => (
                    <span key={ri.id} className="text-xs bg-brand-dark px-2 py-0.5 rounded text-gray-300">
                      {ri.ingredient?.name || `#${ri.ingredient_id}`}
                      {ri.norm_quantity !== ri.actual_quantity && (
                        <Scale className="w-3 h-3 inline ml-1 text-brand-orange" />
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {recipes.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <ChefHat className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No hay recetas registradas</p>
        </div>
      )}

      {/* Cost Breakdown Modal */}
      {showBreakdown && breakdown && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowBreakdown(false)}>
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-xl font-bold text-brand-gold mb-1">{breakdown.recipe_name}</h3>
            <p className="text-gray-500 text-sm mb-4">Desglose completo de costos</p>

            {/* Ingredient costs table */}
            <div className="mb-4">
              <h4 className="text-sm font-bold text-gray-400 mb-2">Ingredientes</h4>
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-800">
                  <th className="text-left py-2 text-gray-500">Ingrediente</th>
                  <th className="text-right py-2 text-gray-500">Norma</th>
                  <th className="text-right py-2 text-gray-500">Real</th>
                  <th className="text-right py-2 text-gray-500">$/u</th>
                  <th className="text-right py-2 text-gray-500">Costo</th>
                </tr></thead>
                <tbody>
                  {breakdown.ingredient_costs.map((ic, i) => (
                    <tr key={i} className="border-b border-gray-800/50">
                      <td className="py-2 text-white">{ic.ingredient}</td>
                      <td className="py-2 text-right text-gray-400">{ic.norm_qty}{ic.unit}</td>
                      <td className="py-2 text-right">
                        <span className={ic.actual_qty !== ic.norm_qty ? 'text-brand-orange' : 'text-white'}>
                          {ic.actual_qty}{ic.unit}
                        </span>
                      </td>
                      <td className="py-2 text-right text-gray-400">${ic.unit_cost.toFixed(4)}</td>
                      <td className="py-2 text-right text-brand-gold">${ic.line_cost.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Norm adjustments */}
            {breakdown.norm_adjustments.length > 0 && (
              <div className="bg-brand-orange/5 border border-brand-orange/20 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Scale className="w-4 h-4 text-brand-orange" />
                  <span className="text-brand-orange font-bold text-sm">Ajustes de Norma</span>
                </div>
                {breakdown.norm_adjustments.map((na, i) => (
                  <div key={i} className="text-sm text-gray-300 flex justify-between">
                    <span>{na.ingredient}: {na.norm_qty}→{na.actual_qty}{' '}({na.norm_source})</span>
                    <span className={na.cost_impact > 0 ? 'text-red-400' : 'text-green-400'}>
                      {na.cost_impact > 0 ? '+' : ''}${na.cost_impact.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Total breakdown */}
            <div className="space-y-2 text-sm border-t border-gray-800 pt-4">
              <div className="flex justify-between"><span className="text-gray-400">Total ingredientes</span><span className="text-white">${breakdown.total_ingredient_cost.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Costo operativo/plato</span><span className="text-white">${breakdown.operating_cost_per_dish.toFixed(2)}</span></div>
              <div className="flex justify-between border-t border-gray-700 pt-2"><span className="text-gray-400 font-bold">Costo producción</span><span className="text-brand-orange font-bold">${breakdown.total_production_cost.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Margen +{breakdown.profit_margin_pct}%</span><span className="text-green-400">+${breakdown.profit_amount.toFixed(2)}</span></div>
              <div className="flex justify-between border-t border-gray-700 pt-2"><span className="text-brand-gold font-bold text-lg">PRECIO DE VENTA</span><span className="text-brand-gold font-bold text-lg">${breakdown.selling_price.toFixed(2)}</span></div>
            </div>

            <button onClick={() => setShowBreakdown(false)} className="btn-secondary w-full mt-4">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
