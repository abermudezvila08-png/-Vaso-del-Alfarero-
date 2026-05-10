import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Menu, X, UtensilsCrossed } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setOpen(false);
  };

  const isStaff = user?.role === 'staff' || user?.role === 'admin';

  return (
    <nav className="bg-brand-dark border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <UtensilsCrossed className="w-7 h-7 text-brand-gold" />
            <span className="font-display text-xl font-bold text-brand-gold tracking-wide">
              La Mesa Dorada
            </span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                {!isStaff && (
                  <>
                    <Link to="/reservar" className="text-gray-300 hover:text-brand-gold transition-colors">
                      Reservar
                    </Link>
                    <Link to="/mis-reservaciones" className="text-gray-300 hover:text-brand-gold transition-colors">
                      Mis Reservaciones
                    </Link>
                  </>
                )}
                {isStaff && (
                  <Link to="/staff" className="text-gray-300 hover:text-brand-gold transition-colors">
                    Panel de Personal
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-gray-300 hover:text-brand-gold transition-colors">
                    Administración
                  </Link>
                )}
                <span className="text-gray-500 text-sm">|</span>
                <span className="text-brand-gold-light text-sm">{user.name}</span>
                <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-300 hover:text-brand-gold transition-colors">
                  Iniciar Sesión
                </Link>
                <Link to="/registro" className="btn-primary text-sm !py-2 !px-4">
                  Registrarse
                </Link>
                <Link to="/staff-login" className="text-gray-500 hover:text-brand-gold transition-colors text-sm">
                  Personal
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden text-gray-300" onClick={() => setOpen(!open)}>
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-brand-dark border-t border-gray-800 px-4 py-4 space-y-3">
          {user ? (
            <>
              <p className="text-brand-gold-light text-sm font-medium">{user.name}</p>
              {!isStaff && (
                <>
                  <Link to="/reservar" onClick={() => setOpen(false)} className="block text-gray-300 hover:text-brand-gold">
                    Reservar
                  </Link>
                  <Link to="/mis-reservaciones" onClick={() => setOpen(false)} className="block text-gray-300 hover:text-brand-gold">
                    Mis Reservaciones
                  </Link>
                </>
              )}
              {isStaff && (
                <Link to="/staff" onClick={() => setOpen(false)} className="block text-gray-300 hover:text-brand-gold">
                  Panel de Personal
                </Link>
              )}
              {user.role === 'admin' && (
                <Link to="/admin" onClick={() => setOpen(false)} className="block text-gray-300 hover:text-brand-gold">
                  Administración
                </Link>
              )}
              <button onClick={handleLogout} className="text-red-400 text-sm">
                Cerrar Sesión
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)} className="block text-gray-300 hover:text-brand-gold">
                Iniciar Sesión
              </Link>
              <Link to="/registro" onClick={() => setOpen(false)} className="block text-gray-300 hover:text-brand-gold">
                Registrarse
              </Link>
              <Link to="/staff-login" onClick={() => setOpen(false)} className="block text-gray-500 hover:text-brand-gold text-sm">
                Acceso Personal
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
