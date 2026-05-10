import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import StaffLogin from './pages/StaffLogin';
import ReservationFlow from './pages/ReservationFlow';
import MyReservations from './pages/MyReservations';
import StaffDashboard from './pages/StaffDashboard';
import AdminPanel from './pages/AdminPanel';

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
            <Route path="/staff" element={<StaffDashboard />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
