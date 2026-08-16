import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-black">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-brand-dark border-t border-gray-800 py-6 text-center text-gray-500 text-sm">
        <p>© 2024 La Mesa Dorada — Sistema de Reservaciones</p>
        <p className="mt-1 text-xs text-gray-600">Todos los derechos reservados</p>
      </footer>
    </div>
  );
}
