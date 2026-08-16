import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import type { Reservation, CancelInfo } from '../types';
import {
  CalendarDays,
  Clock,
  UtensilsCrossed,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Info,
} from 'lucide-react';

const statusLabels: Record<string, { label: string; color: string }> = {
  pending_payment: { label: 'Pendiente de Pago', color: 'text-yellow-400' },
  confirmed: { label: 'Confirmada', color: 'text-green-400' },
  cancelled: { label: 'Cancelada', color: 'text-red-400' },
  completed: { label: 'Completada', color: 'text-gray-400' },
};

export default function MyReservations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<number | null>(null);
  const [cancelInfo, setCancelInfo] = useState<CancelInfo | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadReservations();
  }, [user, navigate]);

  const loadReservations = async () => {
    try {
      const data = await api.myReservations();
      setReservations(data);
    } catch {
      setError('Error al cargar reservaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = async (id: number) => {
    setCancelTarget(id);
    setCancelInfo(null);
    try {
      const info = await api.cancelInfo(id);
      setCancelInfo(info);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await api.cancelReservation(cancelTarget);
      setCancelTarget(null);
      setCancelInfo(null);
      await loadReservations();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cancelar');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-brand-gold animate-pulse text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-brand-gold mb-8">
        Mis Reservaciones
      </h1>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 underline">
            Cerrar
          </button>
        </div>
      )}

      {reservations.length === 0 ? (
        <div className="card text-center py-12">
          <UtensilsCrossed className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">No tiene reservaciones aún.</p>
          <button onClick={() => navigate('/reservar')} className="btn-primary">
            Hacer una Reservación
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((res) => {
            const st = statusLabels[res.status] || {
              label: res.status,
              color: 'text-gray-400',
            };
            return (
              <div key={res.id} className="card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-bold text-lg">
                        Reservación #{res.id}
                      </span>
                      <span className={`text-sm font-medium ${st.color}`}>
                        {st.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-4 h-4" />
                        {new Date(res.date + 'T12:00').toLocaleDateString('es-ES', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {res.time_slot?.label}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-brand-gold font-bold text-xl">
                      ${res.total_amount.toFixed(2)}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {res.guest_count} comensal(es) · {res.lunch_package?.name}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {res.reservation_tables.map((rt) => (
                    <span
                      key={rt.id}
                      className="bg-brand-dark text-brand-gold-light text-xs px-3 py-1 rounded-full border border-brand-gold/20"
                    >
                      {rt.table?.name} ({rt.table?.capacity}p)
                    </span>
                  ))}
                </div>

                {res.status === 'cancelled' && (
                  <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-3 text-sm">
                    <div className="flex items-center gap-2 text-red-400 mb-1">
                      <XCircle className="w-4 h-4" />
                      Cancelada{' '}
                      {res.cancelled_by && `por ${res.cancelled_by}`}
                    </div>
                    {res.refund_amount > 0 && (
                      <p className="text-gray-400">
                        Reembolso: ${res.refund_amount.toFixed(2)} | Penalización:{' '}
                        {res.penalty_percentage}%
                      </p>
                    )}
                  </div>
                )}

                {res.status === 'confirmed' && (
                  <button
                    onClick={() => handleCancelClick(res.id)}
                    className="mt-2 text-red-400 hover:text-red-300 text-sm flex items-center gap-1 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Cancelar Reservación
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel modal */}
      {cancelTarget && cancelInfo && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <h3 className="font-display text-xl font-bold text-brand-gold mb-4">
              Cancelar Reservación
            </h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Horas restantes</span>
                <span className="text-white">{cancelInfo.hours_remaining}h</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Penalización</span>
                <span className="text-red-400 font-bold">
                  {cancelInfo.penalty_percentage}% (${cancelInfo.penalty_amount.toFixed(2)})
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Reembolso</span>
                <span className="text-green-400 font-bold">
                  {cancelInfo.refund_percentage}% (${cancelInfo.refund_amount.toFixed(2)})
                </span>
              </div>
            </div>

            {!cancelInfo.can_cancel_online && (
              <div className="bg-brand-orange/10 border border-brand-orange/30 rounded-lg p-3 mb-4 flex items-start gap-2">
                <Info className="w-5 h-5 text-brand-orange flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300">{cancelInfo.message}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCancelTarget(null);
                  setCancelInfo(null);
                }}
                className="btn-secondary flex-1"
              >
                Mantener
              </button>
              {cancelInfo.can_cancel_online && (
                <button
                  onClick={confirmCancel}
                  disabled={cancelling}
                  className="btn-danger flex-1"
                >
                  {cancelling ? 'Cancelando...' : 'Confirmar Cancelación'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
