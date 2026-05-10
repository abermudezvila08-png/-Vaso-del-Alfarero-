import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Menu, X, UtensilsCrossed, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [gestionOpen, setGestionOpen] = useState(false);

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
                    <Link to="/menu" className="text-gray-300 hover:text-brand-gold transition-colors">
                      Menú
                    </Link>
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
                {user.role === 'admin' && (
                  <Link to="/dashboard" className="text-gray-300 hover:text-brand-gold transition-colors">
                    Dashboard
                  </Link>
                )}
                {isStaff && (
                  <div className="relative">
                    <button onClick={() => setGestionOpen(!gestionOpen)} className="text-gray-300 hover:text-brand-gold transition-colors flex items-center gap-1">
                      Gestión <ChevronDown className={`w-3 h-3 transition-transform ${gestionOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {gestionOpen && (
                      <div className="absolute right-0 top-full mt-1 bg-brand-card border border-gray-700 rounded-lg py-1 min-w-[180px] shadow-xl z-50">
                        <Link to="/inventario" onClick={() => setGestionOpen(false)} className="block px-4 py-2 text-sm text-gray-300 hover:bg-brand-dark hover:text-brand-gold">Inventario</Link>
                        <Link to="/recetas" onClick={() => setGestionOpen(false)} className="block px-4 py-2 text-sm text-gray-300 hover:bg-brand-dark hover:text-brand-gold">Recetas y Costos</Link>
                        <Link to="/normas" onClick={() => setGestionOpen(false)} className="block px-4 py-2 text-sm text-gray-300 hover:bg-brand-dark hover:text-brand-gold">Normas de Porciones</Link>
                        <Link to="/mermas" onClick={() => setGestionOpen(false)} className="block px-4 py-2 text-sm text-gray-300 hover:bg-brand-dark hover:text-brand-gold">Mermas</Link>
                        {user.role === 'admin' && <Link to="/costos-operativos" onClick={() => setGestionOpen(false)} className="block px-4 py-2 text-sm text-gray-300 hover:bg-brand-dark hover:text-brand-gold">Costos Operativos</Link>}
                        {user.role === 'admin' && <Link to="/proveedores" onClick={() => setGestionOpen(false)} className="block px-4 py-2 text-sm text-gray-300 hover:bg-brand-dark hover:text-brand-gold">Proveedores</Link>}
                        {user.role === 'admin' && <Link to="/predicciones" onClick={() => setGestionOpen(false)} className="block px-4 py-2 text-sm text-gray-300 hover:bg-brand-dark hover:text-brand-gold">Predicciones</Link>}
                      </div>
                    )}
                  </div>
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
                  <Link to="/menu" onClick={() => setOpen(false)} className="block text-gray-300 hover:text-brand-gold">
                    Menú
                  </Link>
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
              {user.role === 'admin' && (
                <Link to="/dashboard" onClick={() => setOpen(false)} className="block text-gray-300 hover:text-brand-gold">
                  Dashboard
                </Link>
              )}
              {isStaff && (
                <>
                  <div className="border-t border-gray-800 pt-2 mt-2">
                    <p className="text-xs text-gray-600 mb-1">Gestión</p>
                    <Link to="/inventario" onClick={() => setOpen(false)} className="block text-gray-300 hover:text-brand-gold text-sm py-1">Inventario</Link>
                    <Link to="/recetas" onClick={() => setOpen(false)} className="block text-gray-300 hover:text-brand-gold text-sm py-1">Recetas y Costos</Link>
                    <Link to="/normas" onClick={() => setOpen(false)} className="block text-gray-300 hover:text-brand-gold text-sm py-1">Normas de Porciones</Link>
                    <Link to="/mermas" onClick={() => setOpen(false)} className="block text-gray-300 hover:text-brand-gold text-sm py-1">Mermas</Link>
                    {user.role === 'admin' && <Link to="/costos-operativos" onClick={() => setOpen(false)} className="block text-gray-300 hover:text-brand-gold text-sm py-1">Costos Operativos</Link>}
                    {user.role === 'admin' && <Link to="/proveedores" onClick={() => setOpen(false)} className="block text-gray-300 hover:text-brand-gold text-sm py-1">Proveedores</Link>}
                    {user.role === 'admin' && <Link to="/predicciones" onClick={() => setOpen(false)} className="block text-gray-300 hover:text-brand-gold text-sm py-1">Predicciones</Link>}
                  </div>
                </>
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
