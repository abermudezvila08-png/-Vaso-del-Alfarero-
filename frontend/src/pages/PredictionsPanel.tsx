import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, BarChart3,
  Package, DollarSign, Activity,
} from 'lucide-react';

interface Demand {
  recipe_name: string; recipe_id: number; avg_daily_sales: number;
  predicted_next_week: number; trend: string; confidence: number;
}
interface Alert {
  ingredient_id: number; ingredient_name: string; current_stock: number;
  min_stock: number; days_until_depletion: number; reorder_recommended: number;
  urgency: string;
}
interface Report {
  demand_predictions: Demand[];
  inventory_alerts: Alert[];
  estimated_weekly_revenue: number;
  estimated_weekly_cost: number;
  estimated_weekly_profit: number;
}

const BASE = '/api';
function headers(): HeadersInit { const h: HeadersInit = { 'Content-Type': 'application/json' }; const t = localStorage.getItem('token'); if (t) h['Authorization'] = `Bearer ${t}`; return h; }

export default function PredictionsPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    loadReport();
  }, [user, navigate]);

  const loadReport = async () => {
    const res = await fetch(`${BASE}/predictions/report`, { headers: headers() });
    if (res.ok) setReport(await res.json());
    setLoading(false);
  };

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-brand-gold animate-pulse text-lg">Cargando predicciones...</div></div>;

  if (!report) return <div className="text-center py-16 text-gray-500"><BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>No hay datos suficientes para predicciones</p></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <BarChart3 className="w-8 h-8 text-brand-gold" />
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-gold">Predicciones y Análisis</h1>
          <p className="text-gray-400 text-sm">Pronósticos de demanda, inventario y rentabilidad</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card border-green-700/30">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            <span className="text-gray-400 text-sm">Ingreso Semanal Est.</span>
          </div>
          <div className="text-2xl font-bold text-green-400">${report.estimated_weekly_revenue.toFixed(2)}</div>
        </div>
        <div className="card border-brand-orange/30">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-brand-orange" />
            <span className="text-gray-400 text-sm">Costo Semanal Est.</span>
          </div>
          <div className="text-2xl font-bold text-brand-orange">${report.estimated_weekly_cost.toFixed(2)}</div>
        </div>
        <div className="card border-brand-gold/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-brand-gold" />
            <span className="text-gray-400 text-sm">Ganancia Semanal Est.</span>
          </div>
          <div className="text-2xl font-bold text-brand-gold">${report.estimated_weekly_profit.toFixed(2)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demand Predictions */}
        <div className="card">
          <h2 className="text-lg font-bold text-brand-gold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" /> Pronóstico de Demanda
          </h2>
          {report.demand_predictions.length > 0 ? (
            <div className="space-y-3">
              {report.demand_predictions.map((d, i) => (
                <div key={i} className="bg-brand-dark rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{d.recipe_name}</span>
                    <div className="flex items-center gap-2">
                      <TrendIcon trend={d.trend} />
                      <span className={`text-xs px-2 py-0.5 rounded ${d.trend === 'up' ? 'bg-green-900/30 text-green-400' : d.trend === 'down' ? 'bg-red-900/30 text-red-400' : 'bg-gray-800 text-gray-400'}`}>
                        {d.trend === 'up' ? 'Subiendo' : d.trend === 'down' ? 'Bajando' : 'Estable'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500 block text-xs">Promedio/día</span>
                      <span className="text-white">{d.avg_daily_sales}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-xs">Semana próx.</span>
                      <span className="text-brand-gold font-medium">{d.predicted_next_week}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-xs">Confianza</span>
                      <div className="flex items-center gap-1">
                        <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-gold rounded-full" style={{ width: `${d.confidence * 100}%` }} />
                        </div>
                        <span className="text-gray-400 text-xs">{Math.round(d.confidence * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay datos históricos de ventas para generar predicciones</p>
          )}
        </div>

        {/* Inventory Alerts */}
        <div className="card">
          <h2 className="text-lg font-bold text-brand-gold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" /> Alertas de Inventario
          </h2>
          {report.inventory_alerts.length > 0 ? (
            <div className="space-y-3">
              {report.inventory_alerts.map((a, i) => (
                <div key={i} className={`rounded-lg p-3 border ${a.urgency === 'critical' ? 'bg-red-900/10 border-red-700/30' : a.urgency === 'warning' ? 'bg-yellow-900/10 border-yellow-700/30' : 'bg-brand-dark border-gray-800'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {a.urgency === 'critical' && <AlertTriangle className="w-4 h-4 text-red-400" />}
                      {a.urgency === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-400" />}
                      <span className="text-white font-medium">{a.ingredient_name}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${a.urgency === 'critical' ? 'bg-red-900/30 text-red-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                      {a.urgency === 'critical' ? 'CRÍTICO' : 'ALERTA'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500 block text-xs">Stock actual</span>
                      <span className={a.urgency === 'critical' ? 'text-red-400' : 'text-yellow-400'}>{a.current_stock}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-xs">Días restantes</span>
                      <span className="text-white">{a.days_until_depletion.toFixed(1)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-xs">Reabastecer</span>
                      <span className="text-brand-gold">{a.reorder_recommended.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-10 h-10 mx-auto mb-2 text-green-400 opacity-60" />
              <p className="text-green-400">Sin alertas — inventario en buen estado</p>
            </div>
          )}
        </div>
      </div>

      {/* Methodology Note */}
      <div className="card mt-6 border-gray-800">
        <h3 className="text-sm font-bold text-gray-400 mb-2">Metodología de Predicción</h3>
        <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
          <li>Media móvil de 30 días con análisis de tendencia por mitades</li>
          <li>Alertas de inventario basadas en velocidad de consumo promedio</li>
          <li>Recomendación de reabastecimiento: consumo semanal × 1.2 (20% buffer)</li>
          <li>Confianza basada en cantidad de datos históricos disponibles</li>
          <li>Para mejorar predicciones: registrar ventas diarias consistentemente</li>
        </ul>
      </div>
    </div>
  );
}
