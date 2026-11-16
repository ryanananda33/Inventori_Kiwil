// App.jsx — Routing utama + Protected Routes + Layout

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import AdminRoute     from './components/common/AdminRoute.jsx';
import Layout         from './components/layout/Layout.jsx';

import Login        from './pages/Login.jsx';
import Dashboard    from './pages/Dashboard.jsx';
import Items        from './pages/Items.jsx';
import Suppliers    from './pages/Suppliers.jsx';
import Transactions from './pages/Transactions.jsx';
import Reports      from './pages/Reports.jsx';
import UsersPage    from './pages/Users.jsx';

export default function App() {
  return (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              borderRadius: '10px',
              fontSize: '14px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            },
            success: { iconTheme: { primary: '#f97316', secondary: '#fff' } },
          }}
        />

        <Routes>
          {/* Publik */}
          <Route path="/login" element={<Login />} />

          {/* Protected — semua route di dalam sini butuh autentikasi */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>

              {/* Admin & Kasir */}
              <Route index         element={<Dashboard />} />
              <Route path="items"  element={<Items />} />
              <Route path="transactions" element={<Transactions />} />

              {/* Admin only */}
              <Route path="suppliers" element={
                <AdminRoute><Suppliers /></AdminRoute>
              } />
              <Route path="reports" element={
                <AdminRoute><Reports /></AdminRoute>
              } />
              <Route path="users" element={
                <AdminRoute><UsersPage /></AdminRoute>
              } />

            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
