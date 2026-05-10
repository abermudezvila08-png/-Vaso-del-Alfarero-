import { Link } from 'react-router-dom';
import { CalendarDays, Clock, CreditCard, Shield, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-black via-brand-dark to-brand-black" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-brand-orange rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-gold rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-36 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-brand-card border-2 border-brand-gold rounded-full p-4">
              <UtensilsCrossed className="w-12 h-12 text-brand-gold" />
            </div>
          </div>
          <h1 className="font-display text-4xl sm:text-6xl font-bold text-white mb-4">
            La <span className="text-brand-gold">Mesa Dorada</span>
          </h1>
          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-8">
            Reserve su experiencia gastronómica con facilidad. Seleccione fecha, horario
            y mesa en pocos pasos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/menu" className="btn-primary text-lg">
              Ver Menú y Pedir
            </Link>
            {user ? (
              <Link to="/reservar" className="btn-secondary text-lg">
                Hacer una Reservación
              </Link>
            ) : (
              <>
                <Link to="/registro" className="btn-secondary text-lg">
                  Registrarse
                </Link>
                <Link to="/login" className="text-gray-400 hover:text-brand-gold text-lg transition">
                  Ya tengo cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-center text-brand-gold mb-12">
            ¿Cómo Funciona?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: CalendarDays, title: '1. Seleccione Fecha', desc: 'Elija el día de su reservación' },
              { icon: Clock, title: '2. Elija Horario', desc: 'Seleccione un espacio de tiempo disponible' },
              { icon: UtensilsCrossed, title: '3. Escoja su Mesa', desc: 'Elija una o varias mesas disponibles' },
              { icon: CreditCard, title: '4. Prepago', desc: 'Ingrese sus datos y confirme con el prepago' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card text-center hover:border-brand-gold transition-colors">
                <div className="bg-brand-dark rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-brand-gold/30">
                  <Icon className="w-8 h-8 text-brand-orange" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
                <p className="text-gray-400 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cancellation policy */}
      <section className="py-20 px-4 sm:px-6 bg-brand-dark">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-center text-brand-gold mb-4">
            Política de Cancelación
          </h2>
          <p className="text-center text-gray-400 mb-10">
            Transparencia total. Conozca las condiciones antes de reservar.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { time: 'Más de 24h', pct: '0%', refund: '100%', color: 'text-green-400', bg: 'border-green-400/30' },
              { time: '24 – 20h', pct: '10%', refund: '90%', color: 'text-yellow-400', bg: 'border-yellow-400/30' },
              { time: '19 – 12h', pct: '20%', refund: '80%', color: 'text-brand-orange', bg: 'border-brand-orange/30' },
              { time: '11 – 0h', pct: '45%', refund: '55%', color: 'text-red-400', bg: 'border-red-400/30' },
            ].map(({ time, pct, refund, color, bg }) => (
              <div key={time} className={`card border ${bg} text-center`}>
                <p className="text-gray-400 text-sm mb-1">Antes de la reserva</p>
                <p className="text-white font-bold text-lg mb-3">{time}</p>
                <p className={`text-2xl font-bold ${color}`}>{pct}</p>
                <p className="text-gray-500 text-xs mt-1">penalización</p>
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <p className="text-gray-400 text-sm">Reembolso: <span className="text-white font-medium">{refund}</span></p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 card border-brand-gold/20">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-brand-gold flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-400">
                <p className="text-white font-medium mb-1">Importante</p>
                <p>El conteo de 24 horas comienza exactamente 24 horas antes de la hora de su reservación.
                  Dentro de ese periodo, solo el administrador del restaurante puede procesar cancelaciones
                  (presencial o por teléfono). La mesa se bloquea únicamente después de completar el prepago.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
