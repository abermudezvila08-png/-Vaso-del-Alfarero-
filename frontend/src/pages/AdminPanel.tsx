import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import type { Reservation, CancelInfo } from '../types';
import {
  Shield,
  CalendarDays,
  Clock,
  XCircle,
  AlertTriangle,
  Info,
  Search,
} from 'lucide-react';

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);
  const [cancelInfo, setCancelInfo] = useState<CancelInfo | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
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

  const handleCancelClick = async (res: Reservation) => {
    setCancelTarget(res);
    setCancelReason('');
    setCancelInfo(null);
    try {
      const info = await api.cancelInfo(res.id);
      setCancelInfo(info);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  };

  const confirmAdminCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    setError('');
    try {
      await api.adminCancel(cancelTarget.id, cancelReason);
      setCancelTarget(null);
      setCancelInfo(null);
      setSuccess(`Reservación #${cancelTarget.id} cancelada exitosamente.`);
      await loadReservations();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cancelar');
    } finally {
      setCancelling(false);
    }
  };

  const activeReservations = reservations.filter(
    (r) => r.status === 'confirmed' || r.status === 'pending_payment'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-brand-gold" />
          <div>
            <h1 className="font-display text-3xl font-bold text-brand-gold">
              Panel de Administrador
            </h1>
            <p className="text-gray-400 text-sm">
              Gestión avanzada · Cancelaciones de último momento
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-500" />
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
              Todas
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 underline">×</button>
        </div>
      )}

      {success && (
        <div className="bg-green-900/30 border border-green-700 text-green-300 px-4 py-3 rounded-lg mb-6 text-sm">
          {success}
        </div>
      )}

      {/* Info box */}
      <div className="card border-brand-gold/20 mb-8">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-brand-gold flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-400">
            Como administrador, usted es el único que puede cancelar reservaciones dentro
            de las últimas 24 horas antes de la hora de la reservación. Las cancelaciones
            aplican la penalización correspondiente según el tiempo restante.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-brand-gold animate-pulse">Cargando...</div>
      ) : activeReservations.length === 0 ? (
        <div className="card text-center py-12">
          <CalendarDays className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No hay reservaciones activas.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeReservations.map((res) => (
            <div key={res.id} className="card hover:border-gray-700 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-white font-bold">#{res.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      res.status === 'confirmed'
                        ? 'bg-green-400/10 text-green-400'
                        : 'bg-yellow-400/10 text-yellow-400'
                    }`}>
                      {res.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Cliente</p>
                      <p className="text-white">{res.user?.name}</p>
                      <p className="text-gray-400 text-xs">{res.user?.email}</p>
                      <p className="text-gray-400 text-xs">{res.user?.phone}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Reservación</p>
                      <p className="text-white flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {new Date(res.date + 'T12:00').toLocaleDateString('es-ES', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-white flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {res.time_slot?.label}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Detalles</p>
                      <p className="text-white">{res.guest_count} comensales</p>
                      <p className="text-brand-gold font-bold">
                        ${res.paid_amount.toFixed(2)}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {res.reservation_tables.map((rt) => (
                          <span
                            key={rt.id}
                            className="text-xs bg-brand-dark text-brand-gold-light px-2 py-0.5 rounded"
                          >
                            {rt.table?.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <button
                    onClick={() => handleCancelClick(res)}
                    className="btn-danger !py-2 !px-4 text-sm flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admin Cancel Modal */}
      {cancelTarget && cancelInfo && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full border-red-700/30">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <h3 className="font-display text-xl font-bold text-white">
                Cancelación Administrativa
              </h3>
            </div>

            <div className="bg-brand-dark rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-400 mb-1">
                Reservación #{cancelTarget.id} — {cancelTarget.user?.name}
              </p>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <p className="text-gray-500 text-xs">Horas restantes</p>
                  <p className="text-white font-bold">{cancelInfo.hours_remaining}h</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Penalización</p>
                  <p className="text-red-400 font-bold">
                    {cancelInfo.penalty_percentage}% (${cancelInfo.penalty_amount.toFixed(2)})
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Reembolso al cliente</p>
                  <p className="text-green-400 font-bold">
                    ${cancelInfo.refund_amount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Compensación restaurante</p>
                  <p className="text-brand-orange font-bold">
                    ${cancelInfo.penalty_amount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">
                Motivo de cancelación
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="input-field"
                rows={2}
                placeholder="Motivo de la cancelación..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCancelTarget(null);
                  setCancelInfo(null);
                }}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={confirmAdminCancel}
                disabled={cancelling}
                className="btn-danger flex-1"
              >
                {cancelling ? 'Procesando...' : 'Confirmar Cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
