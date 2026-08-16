import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck } from 'lucide-react';

export default function StaffLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { access_token } = await api.staffLogin({
        email,
        password,
        company_code: companyCode,
      });
      await login(access_token);
      navigate('/staff');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="card max-w-md w-full border-brand-orange/30">
        <div className="text-center mb-6">
          <ShieldCheck className="w-10 h-10 text-brand-orange mx-auto mb-3" />
          <h1 className="font-display text-2xl font-bold text-brand-orange">Acceso Personal</h1>
          <p className="text-gray-400 text-sm mt-1">
            Autenticación de doble factor requerida
          </p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="personal@restaurante.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Código de Empresa</label>
            <input
              type="password"
              value={companyCode}
              onChange={(e) => setCompanyCode(e.target.value)}
              className="input-field"
              placeholder="Código variable de empresa"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full !bg-brand-orange hover:!bg-brand-orange-light">
            {loading ? 'Verificando...' : 'Acceder'}
          </button>
        </form>

        <div className="mt-6 p-3 bg-brand-dark rounded-lg">
          <p className="text-gray-500 text-xs text-center">
            Este acceso es exclusivo para personal autorizado del restaurante.
            Se requiere autenticación con correo, contraseña y código de empresa.
          </p>
        </div>
      </div>
    </div>
  );
}
