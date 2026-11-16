// components/common/ProtectedRoute.jsx
// Redirect ke /login jika belum autentikasi.
// TIDAK menggunakan localStorage — cek dari AuthContext (cookie server-side).

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent
                          rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Memuat…</p>
        </div>
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

