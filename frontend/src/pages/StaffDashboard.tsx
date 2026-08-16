import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import type { Reservation } from '../types';
import {
  CalendarDays,
  Clock,
  Users,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
} from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending_payment: { label: 'Pendiente', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  confirmed: { label: 'Confirmada', color: 'text-green-400', bg: 'bg-green-400/10' },
  cancelled: { label: 'Cancelada', color: 'text-red-400', bg: 'bg-red-400/10' },
  completed: { label: 'Completada', color: 'text-gray-400', bg: 'bg-gray-400/10' },
};

export default function StaffDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
      navigate('/');
      return;
    }
    loadReservations();
  }, [user, navigate, dateFilter]);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const data = await api.allReservations(dateFilter || undefined);
      setReservations(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: reservations.length,
    confirmed: reservations.filter((r) => r.status === 'confirmed').length,
    cancelled: reservations.filter((r) => r.status === 'cancelled').length,
    revenue: reservations
      .filter((r) => r.status === 'confirmed')
      .reduce((sum, r) => sum + r.paid_amount, 0),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-orange">
            Panel de Personal
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Gestión de reservaciones del restaurante
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-gray-500" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input-field !w-auto"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-gray-500 hover:text-brand-gold text-sm"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', value: stats.total, icon: CalendarDays, color: 'text-brand-gold' },
          { label: 'Confirmadas', value: stats.confirmed, icon: CheckCircle, color: 'text-green-400' },
          { label: 'Canceladas', value: stats.cancelled, icon: XCircle, color: 'text-red-400' },
          { label: 'Ingresos', value: `$${stats.revenue.toFixed(2)}`, icon: CreditCard, color: 'text-brand-orange' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card !p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">{label}</span>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Reservations list */}
      {loading ? (
        <div className="text-center py-12 text-brand-gold animate-pulse">Cargando...</div>
      ) : reservations.length === 0 ? (
        <div className="card text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No hay reservaciones para mostrar.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-500 text-sm py-3 px-4">#</th>
                <th className="text-left text-gray-500 text-sm py-3 px-4">Cliente</th>
                <th className="text-left text-gray-500 text-sm py-3 px-4">Fecha</th>
                <th className="text-left text-gray-500 text-sm py-3 px-4">Horario</th>
                <th className="text-left text-gray-500 text-sm py-3 px-4">Mesas</th>
                <th className="text-left text-gray-500 text-sm py-3 px-4">
                  <Users className="w-4 h-4 inline" />
                </th>
                <th className="text-left text-gray-500 text-sm py-3 px-4">Monto</th>
                <th className="text-left text-gray-500 text-sm py-3 px-4">Estado</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((res) => {
                const st = statusConfig[res.status] || statusConfig.completed;
                return (
                  <tr
                    key={res.id}
                    className="border-b border-gray-800/50 hover:bg-brand-dark/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-400 text-sm">{res.id}</td>
                    <td className="py-3 px-4">
                      <p className="text-white text-sm font-medium">{res.user?.name}</p>
                      <p className="text-gray-500 text-xs">{res.user?.email}</p>
                    </td>
                    <td className="py-3 px-4 text-white text-sm">
                      {new Date(res.date + 'T12:00').toLocaleDateString('es-ES', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-white text-sm">
                      {res.time_slot?.label}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {res.reservation_tables.map((rt) => (
                          <span
                            key={rt.id}
                            className="text-xs bg-brand-dark text-brand-gold-light px-2 py-0.5 rounded"
                          >
                            {rt.table?.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-white text-sm">{res.guest_count}</td>
                    <td className="py-3 px-4 text-brand-gold font-medium text-sm">
                      ${res.total_amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${st.color} ${st.bg}`}
                      >
                        {st.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
