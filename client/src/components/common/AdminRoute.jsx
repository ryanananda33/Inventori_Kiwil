// components/common/AdminRoute.jsx
// Kembalikan 403-like page jika user bukan admin.

import { useAuth } from '../../context/AuthContext.jsx';
import { ShieldOff } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminRoute({ children }) {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="p-4 rounded-full bg-red-100">
          <ShieldOff size={40} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Akses Ditolak</h2>
        <p className="text-gray-500 max-w-sm text-sm">
          Halaman ini hanya dapat diakses oleh <strong>Admin</strong>.
          Anda login sebagai <strong>Kasir</strong>.
        </p>
        <Link to="/" className="btn-primary text-sm">Kembali ke Dashboard</Link>
      </div>
    );
  }

  return children;
}

