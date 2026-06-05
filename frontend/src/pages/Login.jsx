import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login }     = useAuth();
  const navigate      = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form);
      navigate(user.role === 'admin' ? '/dashboard' : '/payment');
    } catch (err) {
      setError(err.response?.data?.message || 'Email atau password salah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500">
          <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 800 600">
            {[
              [100,300],[220,280],[340,310],[460,290],[580,305],[700,285],
              [160,380],[280,360],[400,385],[520,370],[640,380],
            ].map(([x,y], i) => (
              <g key={i} transform={`translate(${x},${y})`}>
                <polygon points="0,-30 35,0 -35,0" fill="white" />
                <rect x="-25" y="0" width="50" height="35" fill="white" />
                <rect x="-8" y="15" width="16" height="20" fill="#3B82F6" />
              </g>
            ))}
            <rect x="0" y="440" width="800" height="20" fill="white" opacity="0.3" />
            <rect x="0" y="500" width="800" height="20" fill="white" opacity="0.3" />  
          </svg>
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
              <Home size={32} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-3">RT Management</h1>
            <p className="text-blue-100 text-lg leading-relaxed">
              Sistem administrasi modern untuk pengelolaan<br />
              rukun tetangga yang lebih efisien
            </p>
          </div>
          <div className="space-y-4">
            {[
              ['Kelola penghuni & rumah dengan mudah'],
              ['Monitor pembayaran iuran bulanan'],
              ['Laporan keuangan real-time'],
            ].map(([text], i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs">✓</span>
                </div>
                <span className="text-blue-100">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <Home size={20} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900">RT Management</p>
              <p className="text-xs text-gray-500">Sistem Administrasi RT</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Selamat Datang</h2>
          <p className="text-gray-500 mb-8">Masuk ke akun Anda untuk melanjutkan</p>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-5 text-red-700 text-sm">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                className="input-field w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm outline-none focus:ring-0 focus:border-blue-500"
                placeholder="admin@rt.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field pr-10 w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm outline-none focus:ring-0 focus:border-blue-500"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="w-full py-2.5 text-base bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg shadow-sm transition duration-200" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Masuk...
                </span>
              ) : 'Masuk'}
            </button>
          </form>

          <div className="mt-8 p-4 bg-gray-100 rounded-xl shadow-md">
            <p className="text-xs text-gray-500 font-medium mb-2">Demo Akun:</p>
            <div className="space-y-1 text-xs text-gray-600">
              <p><span className="font-medium">Admin:</span> admin@rt.com / password</p>
              <p><span className="font-medium">Penghuni:</span> budi@rt.com / password</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}