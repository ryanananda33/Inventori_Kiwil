// components/layout/Sidebar.jsx
// - Menu aktif: oranye (primary-500)
// - Menu kasir disembunyikan untuk role admin-only
// - Tidak ada dangerouslySetInnerHTML

import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Truck, ArrowLeftRight,
  BarChart2, Users, FileText, LogOut, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import BrandLogo from '../common/BrandLogo.jsx';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard',       adminOnly: false },
  { to: '/items',        icon: Package,         label: 'Inventori',       adminOnly: false },
  { to: '/suppliers',    icon: Truck,           label: 'Supplier',        adminOnly: true  },
  { to: '/transactions', icon: ArrowLeftRight,  label: 'Transaksi',       adminOnly: false },
  { to: '/reports',      icon: BarChart2,       label: 'Laporan',         adminOnly: true  },
  { to: '/users',        icon: Users,           label: 'Kelola User',     adminOnly: true  },
];

export default function Sidebar({ onClose }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Berhasil logout.');
      navigate('/login');
    } catch {
      toast.error('Gagal logout.');
    }
  };

  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="flex flex-col h-full bg-white border-r border-gray-100 w-64">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <BrandLogo size="md" />
      </div>

      {/* Navigasi */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
               transition-all duration-150 ${
                isActive
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-slate-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  className={isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-600'}
                />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={14} className="text-primary-400" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info + Logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-50 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-amber-400
                          flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.nama_lengkap?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">{user?.nama_lengkap}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                     font-medium text-gray-600 hover:bg-red-50 hover:text-red-600
                     transition-colors duration-150"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}

