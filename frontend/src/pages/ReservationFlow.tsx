import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import type { TimeSlot, Table, LunchPackage } from '../types';
import {
  CalendarDays,
  Clock,
  UtensilsCrossed,
  CreditCard,
  Check,
  ChevronRight,
  Users,
  MapPin,
  AlertTriangle,
  Shield,
} from 'lucide-react';

type Step = 'date' | 'time' | 'tables' | 'package' | 'confirm' | 'done';

export default function ReservationFlow() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('date');
  const [selectedDate, setSelectedDate] = useState('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTables, setSelectedTables] = useState<number[]>([]);
  const [packages, setPackages] = useState<LunchPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<LunchPackage | null>(null);
  const [guestCount, setGuestCount] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [reservationId, setReservationId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  const today = new Date();
  today.setDate(today.getDate() + 1);
  const minDate = today.toISOString().split('T')[0];

  const handleDateSelect = async () => {
    if (!selectedDate) return;
    setLoading(true);
    setError('');
    try {
      const slots = await api.timeSlots();
      setTimeSlots(slots);
      setStep('time');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar horarios');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = async (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setLoading(true);
    setError('');
    try {
      const available = await api.availableTables(selectedDate, slot.id);
      setTables(available);
      setStep('tables');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar mesas');
    } finally {
      setLoading(false);
    }
  };

  const toggleTable = (id: number) => {
    setSelectedTables((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleTablesConfirm = async () => {
    if (selectedTables.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const pkgs = await api.packages();
      setPackages(pkgs);
      setStep('package');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar paquetes');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !selectedPackage || !acceptedPolicy) return;

    setLoading(true);
    setError('');
    try {
      const reservation = await api.createReservation({
        date: selectedDate,
        time_slot_id: selectedSlot.id,
        table_ids: selectedTables,
        lunch_package_id: selectedPackage.id,
        guest_count: guestCount,
        notes,
      });

      const confirmed = await api.payReservation(reservation.id);
      setReservationId(confirmed.id);
      setStep('done');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear reservación');
    } finally {
      setLoading(false);
    }
  };

  const totalCapacity = tables
    .filter((t) => selectedTables.includes(t.id))
    .reduce((sum, t) => sum + t.capacity, 0);

  const totalAmount = selectedPackage ? selectedPackage.price * guestCount : 0;

  const steps: { key: Step; label: string; icon: typeof CalendarDays }[] = [
    { key: 'date', label: 'Fecha', icon: CalendarDays },
    { key: 'time', label: 'Horario', icon: Clock },
    { key: 'tables', label: 'Mesas', icon: UtensilsCrossed },
    { key: 'package', label: 'Paquete', icon: CreditCard },
    { key: 'confirm', label: 'Confirmar', icon: Check },
  ];

  const stepOrder: Step[] = ['date', 'time', 'tables', 'package', 'confirm', 'done'];
  const currentIdx = stepOrder.indexOf(step);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Stepper */}
      <div className="flex items-center justify-center mb-10 overflow-x-auto pb-2">
        {steps.map(({ key, label, icon: Icon }, i) => {
          const idx = stepOrder.indexOf(key);
          const isActive = idx === currentIdx;
          const isDone = idx < currentIdx;
          return (
            <div key={key} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isDone
                      ? 'bg-brand-gold border-brand-gold text-brand-black'
                      : isActive
                      ? 'border-brand-orange text-brand-orange'
                      : 'border-gray-700 text-gray-600'
                  }`}
                >
                  {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span
                  className={`text-xs mt-1 hidden sm:block ${
                    isActive ? 'text-brand-orange' : isDone ? 'text-brand-gold' : 'text-gray-600'
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`w-8 sm:w-16 h-0.5 mx-1 ${
                    idx < currentIdx ? 'bg-brand-gold' : 'bg-gray-700'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Step: Date */}
      {step === 'date' && (
        <div className="card max-w-lg mx-auto text-center">
          <CalendarDays className="w-12 h-12 text-brand-gold mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-brand-gold mb-2">
            Seleccione la Fecha
          </h2>
          <p className="text-gray-400 mb-6">Elija el día de su reservación</p>
          <input
            type="date"
            min={minDate}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input-field text-center text-lg mb-6"
          />
          <button
            onClick={handleDateSelect}
            disabled={!selectedDate || loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? 'Cargando...' : 'Continuar'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Step: Time Slot */}
      {step === 'time' && (
        <div className="card max-w-lg mx-auto">
          <div className="text-center mb-6">
            <Clock className="w-12 h-12 text-brand-gold mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-brand-gold mb-2">
              Elija el Horario
            </h2>
            <p className="text-gray-400">
              Fecha seleccionada:{' '}
              <span className="text-white font-medium">
                {new Date(selectedDate + 'T12:00').toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </p>
          </div>
          <div className="space-y-3">
            {timeSlots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => handleSlotSelect(slot)}
                disabled={loading}
                className="w-full card !p-4 hover:border-brand-gold transition-colors text-left flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-brand-orange" />
                  <span className="text-white font-medium">{slot.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-brand-gold transition-colors" />
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep('date')}
            className="mt-4 text-gray-500 hover:text-brand-gold text-sm transition-colors"
          >
            ← Cambiar fecha
          </button>
        </div>
      )}

      {/* Step: Tables */}
      {step === 'tables' && (
        <div className="card">
          <div className="text-center mb-6">
            <UtensilsCrossed className="w-12 h-12 text-brand-gold mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-brand-gold mb-2">
              Seleccione sus Mesas
            </h2>
            <p className="text-gray-400">
              Horario: <span className="text-white font-medium">{selectedSlot?.label}</span>
            </p>
          </div>

          {tables.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-brand-orange mx-auto mb-3" />
              <p className="text-gray-400">No hay mesas disponibles para este horario.</p>
              <button
                onClick={() => setStep('time')}
                className="mt-4 text-brand-gold hover:underline text-sm"
              >
                Elegir otro horario
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {tables.map((table) => {
                  const selected = selectedTables.includes(table.id);
                  return (
                    <button
                      key={table.id}
                      onClick={() => toggleTable(table.id)}
                      className={`card !p-4 text-left transition-all ${
                        selected
                          ? 'border-brand-gold bg-brand-gold/10'
                          : 'hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-semibold">{table.name}</span>
                        {selected && <Check className="w-5 h-5 text-brand-gold" />}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" /> {table.capacity} personas
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" /> {table.location}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedTables.length > 0 && (
                <div className="bg-brand-dark rounded-lg p-4 mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">
                      {selectedTables.length} mesa(s) seleccionada(s)
                    </p>
                    <p className="text-brand-gold font-medium">
                      Capacidad total: {totalCapacity} personas
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('time')}
                  className="btn-secondary flex-1"
                >
                  ← Atrás
                </button>
                <button
                  onClick={handleTablesConfirm}
                  disabled={selectedTables.length === 0 || loading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {loading ? 'Cargando...' : 'Continuar'}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step: Package */}
      {step === 'package' && (
        <div className="card">
          <div className="text-center mb-6">
            <CreditCard className="w-12 h-12 text-brand-gold mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-brand-gold mb-2">
              Seleccione Paquete
            </h2>
            <p className="text-gray-400">Elija el paquete de almuerzo para su reservación</p>
          </div>

          <div className="space-y-4 mb-6">
            {packages.map((pkg) => {
              const selected = selectedPackage?.id === pkg.id;
              return (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`w-full card !p-5 text-left transition-all ${
                    selected
                      ? 'border-brand-gold bg-brand-gold/10'
                      : 'hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-bold text-lg">{pkg.name}</span>
                    <span className="text-brand-gold font-bold text-xl">
                      ${pkg.price.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">{pkg.description}</p>
                  {selected && (
                    <div className="mt-3 flex items-center gap-1 text-brand-gold text-sm">
                      <Check className="w-4 h-4" /> Seleccionado
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {selectedPackage && (
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">
                Número de Comensales
              </label>
              <input
                type="number"
                min={1}
                max={totalCapacity || 20}
                value={guestCount}
                onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="input-field w-32"
              />
              <p className="text-sm text-gray-500 mt-1">
                Capacidad máxima de las mesas seleccionadas: {totalCapacity}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep('tables')} className="btn-secondary flex-1">
              ← Atrás
            </button>
            <button
              onClick={() => setStep('confirm')}
              disabled={!selectedPackage}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              Revisar y Confirmar
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Step: Confirm */}
      {step === 'confirm' && (
        <form onSubmit={handleConfirm}>
          <div className="card mb-6">
            <h2 className="font-display text-2xl font-bold text-brand-gold mb-6 text-center">
              Confirmar Reservación
            </h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center py-3 border-b border-gray-800">
                <span className="text-gray-400">Fecha</span>
                <span className="text-white font-medium">
                  {new Date(selectedDate + 'T12:00').toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-800">
                <span className="text-gray-400">Horario</span>
                <span className="text-white font-medium">{selectedSlot?.label}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-800">
                <span className="text-gray-400">Mesa(s)</span>
                <span className="text-white font-medium">
                  {tables
                    .filter((t) => selectedTables.includes(t.id))
                    .map((t) => t.name)
                    .join(', ')}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-800">
                <span className="text-gray-400">Paquete</span>
                <span className="text-white font-medium">{selectedPackage?.name}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-800">
                <span className="text-gray-400">Comensales</span>
                <span className="text-white font-medium">{guestCount}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-800">
                <span className="text-gray-400">Precio por persona</span>
                <span className="text-white font-medium">
                  ${selectedPackage?.price.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-brand-gold font-bold text-lg">Total a Prepagar</span>
                <span className="text-brand-gold font-bold text-2xl">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">
                Notas adicionales (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field"
                rows={2}
                placeholder="Alergias, celebraciones, preferencias..."
              />
            </div>
          </div>

          {/* Cancellation Policy Agreement */}
          <div className="card mb-6 border-brand-orange/30">
            <div className="flex items-start gap-3 mb-4">
              <Shield className="w-6 h-6 text-brand-orange flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-white font-bold mb-2">
                  Política de Cancelación — Lea antes de confirmar
                </h3>
                <div className="text-sm text-gray-400 space-y-2">
                  <p>
                    • <span className="text-green-400">Más de 24h antes</span>: Reembolso del 100%.
                  </p>
                  <p>
                    • <span className="text-yellow-400">24 a 20 horas antes</span>: Penalización del 10%.
                  </p>
                  <p>
                    • <span className="text-brand-orange">19 a 12 horas antes</span>: Penalización del 20%.
                  </p>
                  <p>
                    • <span className="text-red-400">11 a 0 horas antes</span>: Penalización del 45%.
                  </p>
                  <p className="pt-2 border-t border-gray-700">
                    Dentro de las últimas 24 horas, solo el administrador del restaurante
                    puede procesar cancelaciones (presencial o por teléfono).
                    La mesa se bloquea únicamente después de completar el prepago.
                  </p>
                </div>
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedPolicy}
                onChange={(e) => setAcceptedPolicy(e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 text-brand-gold focus:ring-brand-gold bg-brand-dark"
              />
              <span className="text-white text-sm">
                He leído y acepto la política de cancelación y las condiciones del prepago.
              </span>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep('package')}
              className="btn-secondary flex-1"
            >
              ← Atrás
            </button>
            <button
              type="submit"
              disabled={!acceptedPolicy || loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? 'Procesando...' : `Pagar $${totalAmount.toFixed(2)} y Confirmar`}
              <CreditCard className="w-5 h-5" />
            </button>
          </div>
        </form>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <div className="card max-w-lg mx-auto text-center">
          <div className="bg-green-900/30 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="font-display text-2xl font-bold text-brand-gold mb-2">
            ¡Reservación Confirmada!
          </h2>
          <p className="text-gray-400 mb-6">
            Su reservación #{reservationId} ha sido confirmada y el pago procesado exitosamente.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/mis-reservaciones')}
              className="btn-primary"
            >
              Ver Mis Reservaciones
            </button>
            <button
              onClick={() => navigate('/')}
              className="btn-secondary"
            >
              Ir al Inicio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
