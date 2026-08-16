import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BarChart3, DollarSign, ShoppingCart, Package, AlertTriangle,
  TrendingUp, ChefHat, Wallet, ArrowUp, ArrowDown,
  Download, FileDown,
} from 'lucide-react';

interface Summary {
  total_revenue: number; total_orders: number; paid_orders: number; avg_order_value: number;
  total_waste_cost: number; inventory_value: number; low_stock_items: number;
  active_recipes: number; monthly_operating_cost: number; estimated_profit: number; period_days: number;
}
interface DaySale { date: string; revenue: number; cost: number; profit: number; quantity: number; }
interface RecipeSale { recipe_name: string; revenue: number; cost: number; profit: number; quantity: number; margin_pct: number; }

const BASE = '/api';
function headers(): HeadersInit { const h: HeadersInit = { 'Content-Type': 'application/json' }; const t = localStorage.getItem('token'); if (t) h['Authorization'] = `Bearer ${t}`; return h; }

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [dailySales, setDailySales] = useState<DaySale[]>([]);
  const [recipeSales, setRecipeSales] = useState<RecipeSale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    const [s, d, r] = await Promise.all([
      fetch(`${BASE}/dashboard/summary?days=30`, { headers: headers() }),
      fetch(`${BASE}/dashboard/sales-by-day?days=30`, { headers: headers() }),
      fetch(`${BASE}/dashboard/sales-by-recipe?days=30`, { headers: headers() }),
    ]);
    if (s.ok) setSummary(await s.json());
    if (d.ok) setDailySales(await d.json());
    if (r.ok) setRecipeSales(await r.json());
    setLoading(false);
  };

  const exportCSV = (type: string) => {
    window.open(`${BASE}/export/${type}/csv`, '_blank');
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-brand-gold animate-pulse text-lg">Cargando dashboard...</div></div>;

  const maxRevenue = Math.max(...dailySales.map(d => d.revenue), 1);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-brand-gold" />
          <div>
            <h1 className="font-display text-3xl font-bold text-brand-gold">Dashboard</h1>
            <p className="text-gray-400 text-sm">Últimos 30 días</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportCSV('ingredients')} className="text-xs bg-brand-dark text-gray-400 hover:text-brand-gold px-3 py-1.5 rounded-lg border border-gray-700 flex items-center gap-1">
            <FileDown className="w-3 h-3" /> Ingredientes
          </button>
          <button onClick={() => exportCSV('sales')} className="text-xs bg-brand-dark text-gray-400 hover:text-brand-gold px-3 py-1.5 rounded-lg border border-gray-700 flex items-center gap-1">
            <Download className="w-3 h-3" /> Ventas
          </button>
          <button onClick={() => exportCSV('recipes')} className="text-xs bg-brand-dark text-gray-400 hover:text-brand-gold px-3 py-1.5 rounded-lg border border-gray-700 flex items-center gap-1">
            <Download className="w-3 h-3" /> Recetas
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          <KPI icon={<DollarSign className="w-5 h-5" />} label="Ingresos" value={`$${summary.total_revenue.toFixed(0)}`} color="text-green-400" />
          <KPI icon={<TrendingUp className="w-5 h-5" />} label="Ganancia Est." value={`$${summary.estimated_profit.toFixed(0)}`} color="text-brand-gold" />
          <KPI icon={<ShoppingCart className="w-5 h-5" />} label="Pedidos" value={`${summary.paid_orders}`} color="text-blue-400" />
          <KPI icon={<Package className="w-5 h-5" />} label="Inventario" value={`$${summary.inventory_value.toFixed(0)}`} color="text-purple-400" />
          <KPI icon={<AlertTriangle className="w-5 h-5" />} label="Merma" value={`$${summary.total_waste_cost.toFixed(0)}`} color="text-red-400" />
          <KPI icon={<ChefHat className="w-5 h-5" />} label="Recetas" value={`${summary.active_recipes}`} color="text-brand-orange" />
          <KPI icon={<Wallet className="w-5 h-5" />} label="Costos Op." value={`$${summary.monthly_operating_cost.toFixed(0)}`} color="text-yellow-400" />
          <KPI icon={<DollarSign className="w-5 h-5" />} label="Ticket Prom." value={`$${summary.avg_order_value.toFixed(0)}`} color="text-cyan-400" />
          <KPI icon={<AlertTriangle className="w-5 h-5" />} label="Stock Bajo" value={`${summary.low_stock_items}`} color={summary.low_stock_items > 0 ? 'text-red-400' : 'text-green-400'} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Chart (simple bar chart using divs) */}
        <div className="card">
          <h2 className="text-lg font-bold text-brand-gold mb-4">Ventas Diarias</h2>
          <div className="flex items-end gap-[2px] h-48">
            {dailySales.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end items-center group relative">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-brand-dark border border-gray-700 rounded px-2 py-1 text-xs whitespace-nowrap z-10">
                  <div className="text-white">{d.date.slice(5)}</div>
                  <div className="text-green-400">${d.revenue.toFixed(0)}</div>
                  <div className="text-gray-400">Profit: ${d.profit.toFixed(0)}</div>
                </div>
                <div
                  className="w-full bg-brand-gold/80 rounded-t hover:bg-brand-gold transition"
                  style={{ height: `${(d.revenue / maxRevenue) * 100}%`, minHeight: '2px' }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>{dailySales[0]?.date.slice(5)}</span>
            <span>{dailySales[dailySales.length - 1]?.date.slice(5)}</span>
          </div>
        </div>

        {/* Recipe Performance */}
        <div className="card">
          <h2 className="text-lg font-bold text-brand-gold mb-4">Rendimiento por Plato</h2>
          <div className="space-y-3">
            {recipeSales.map((r, i) => {
              const maxRev = Math.max(...recipeSales.map(r => r.revenue), 1);
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-sm font-medium">{r.recipe_name}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-green-400">${r.profit.toFixed(0)}</span>
                      <span className={`flex items-center gap-0.5 ${r.margin_pct >= 25 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {r.margin_pct >= 25 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        {r.margin_pct}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-gold rounded-full" style={{ width: `${(r.revenue / maxRev) * 100}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 mt-0.5">
                    <span>{r.quantity} vendidos</span>
                    <span>${r.revenue.toFixed(0)} ingreso</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="card !p-3">
      <div className={`flex items-center gap-1.5 mb-1 ${color}`}>{icon}<span className="text-xs text-gray-500">{label}</span></div>
      <div className="text-xl font-bold text-white">{value}</div>
    </div>
  );
}
