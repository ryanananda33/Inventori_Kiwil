// pages/Login.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import logoKiwil from '../assets/logo_kiwil.png'; // Impor logo dari folder src/assets

export default function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [form, setForm]         = useState({ username: '', password: '' });
  const [errors, setErrors]     = useState({});
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  // Jika user sudah terautentikasi, langsung arahkan ke Dashboard
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // Validasi client-side
  const validate = () => {
    const errs = {};
    if (!form.username.trim()) errs.username = 'Username wajib diisi.';
    else if (form.username.length < 3) errs.username = 'Username minimal 3 karakter.';
    if (!form.password) errs.password = 'Password wajib diisi.';
    else if (form.password.length < 8) errs.password = 'Password minimal 8 karakter.';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      await login(form.username, form.password);
      toast.success('Selamat datang kembali! ☕');
      navigate('/');
    } catch (err) {
      let msg = 'Username atau password salah.';
      if (err.code === 'ERR_NETWORK' || !err.response) {
        msg = 'Koneksi ke server backend gagal. Pastikan backend server (port 5000) sudah berjalan.';
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      }
      toast.error(msg);
      setErrors({ _form: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50
                    flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header strip */}
          <div className="h-2 bg-gradient-to-r from-primary-500 to-amber-400" />

          <div className="px-8 py-8">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <img 
                src={logoKiwil} 
                alt="Logo Warkop Kiwil" 
                className="h-20 w-auto object-contain" 
              />
            </div>

            <h1 className="text-xl font-bold text-slate-800 text-center mb-1">
              Masuk ke Sistem
            </h1>
            <p className="text-sm text-gray-400 text-center mb-6">
              Sistem Inventori Warkop Kiwil
            </p>

            {/* Error message */}
            {errors._form && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200
                            text-red-700 text-sm">
                {errors._form}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Username */}
              <div>
                <label htmlFor="username" className="form-label">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Masukkan username"
                  className={`input-field ${errors.username ? 'border-red-400 ring-1 ring-red-400' : ''}`}
                  disabled={loading}
                />
                {errors.username && (
                  <p className="mt-1 text-xs text-red-500">{errors.username}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="form-label">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Masukkan password"
                    className={`input-field pr-10 ${errors.password ? 'border-red-400 ring-1 ring-red-400' : ''}`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
                               hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                    aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-2.5 text-base"
              >
                {loading ? (
                  <><Loader2 size={18} className="animate-spin" /> Memproses…</>
                ) : (
                  <>Masuk</>
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          © 2026 Warkop Kiwil — Sistem Inventori
        </p>
      </div>
    </div>
  );
}