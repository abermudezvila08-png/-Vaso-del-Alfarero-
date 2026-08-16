import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import CurrencyCalculator from './components/CurrencyCalculator';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import StaffLogin from './pages/StaffLogin';
import ReservationFlow from './pages/ReservationFlow';
import MyReservations from './pages/MyReservations';
import MenuOrder from './pages/MenuOrder';
import StaffDashboard from './pages/StaffDashboard';
import AdminPanel from './pages/AdminPanel';
import Dashboard from './pages/Dashboard';
import InventoryManagement from './pages/InventoryManagement';
import RecipeManagement from './pages/RecipeManagement';
import NormsReference from './pages/NormsReference';
import PredictionsPanel from './pages/PredictionsPanel';
import OperatingCosts from './pages/OperatingCosts';
import WasteManagement from './pages/WasteManagement';
import SupplierManagement from './pages/SupplierManagement';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Register />} />
            <Route path="/staff-login" element={<StaffLogin />} />
            <Route path="/reservar" element={<ReservationFlow />} />
            <Route path="/mis-reservaciones" element={<MyReservations />} />
            <Route path="/menu" element={<MenuOrder />} />
            <Route path="/staff" element={<StaffDashboard />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventario" element={<InventoryManagement />} />
            <Route path="/recetas" element={<RecipeManagement />} />
            <Route path="/normas" element={<NormsReference />} />
            <Route path="/predicciones" element={<PredictionsPanel />} />
            <Route path="/costos-operativos" element={<OperatingCosts />} />
            <Route path="/mermas" element={<WasteManagement />} />
            <Route path="/proveedores" element={<SupplierManagement />} />
          </Route>
        </Routes>
        <CurrencyCalculator />
      </AuthProvider>
    </BrowserRouter>
  );
}
