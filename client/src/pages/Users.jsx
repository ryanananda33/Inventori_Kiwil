// pages/Users.jsx — Kelola User (admin only)

import { useState, useEffect, useCallback } from 'react';
import { Users, Trash2, ShieldCheck, RefreshCw, Plus } from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from '../components/common/Modal.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import { formatTanggal, getErrorMessage } from '../utils/helpers.js';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState({ nama_lengkap:'', username:'', password:'', role:'kasir' });
  const [formErrors, setFormErrors] = useState({});

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users');
      setUsers(data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const validate = () => {
    const e = {};
    if (!form.nama_lengkap.trim()) e.nama_lengkap = 'Nama wajib diisi.';
    if (!form.username.trim()) e.username = 'Username wajib diisi.';
    else if (!/^[a-zA-Z0-9]{3,50}$/.test(form.username)) e.username = 'Username 3-50 karakter alfanumerik.';
    if (!form.password) e.password = 'Password wajib diisi.';
    else if (form.password.length < 8) e.password = 'Password minimal 8 karakter.';
    else if (!/[a-zA-Z]/.test(form.password) || !/[0-9]/.test(form.password))
      e.password = 'Password harus mengandung huruf dan angka.';
    return e;
  };

  const handleCreate = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setSaving(true);
    try {
      await api.post('/auth/register', form);
      toast.success('User berhasil dibuat!');
      setModalOpen(false);
      setForm({ nama_lengkap:'', username:'', password:'', role:'kasir' });
      fetchUsers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${deleteTarget.id}`);
      toast.success('User berhasil dihapus.');
      setUsers((p) => p.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const fld = (name) => ({
    value: form[name],
    onChange: (e) => { setForm((p)=>({...p,[name]:e.target.value})); setFormErrors((p)=>({...p,[name]:''})); },
  });

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kelola User</h1>
          <p className="text-sm text-gray-400">{users.length} user terdaftar</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchUsers} className="btn-outline"><RefreshCw size={15}/> Refresh</button>
          <button onClick={()=>setModalOpen(true)} className="btn-primary"><Plus size={15}/> Tambah User</button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-gray-100">
              <tr>
                {['Nama', 'Username', 'Role', 'Bergabung', 'Aksi'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-amber-400
                                      flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {u.nama_lengkap?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-800">{u.nama_lengkap}</span>
                      {u.id === me?.id && <span className="badge-blue">Saya</span>}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-500 font-mono text-xs">{u.username}</td>
                  <td className="py-3 px-4">
                    {u.role === 'admin'
                      ? <span className="badge-orange flex items-center gap-1 w-fit"><ShieldCheck size={11}/>Admin</span>
                      : <span className="badge-blue">Kasir</span>}
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{formatTanggal(u.created_at, false)}</td>
                  <td className="py-3 px-4">
                    {u.id !== me?.id && (
                      <button onClick={() => setDeleteTarget(u)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                        title="Hapus user">
                        <Trash2 size={14}/>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Tambah User */}
      <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title="Tambah User Baru" size="md">
        <form onSubmit={handleCreate} noValidate className="space-y-4">
          <div>
            <label className="form-label">Nama Lengkap *</label>
            <input {...fld('nama_lengkap')} className={`input-field ${formErrors.nama_lengkap?'border-red-400':''}`} placeholder="Budi Santoso"/>
            {formErrors.nama_lengkap && <p className="text-xs text-red-500 mt-1">{formErrors.nama_lengkap}</p>}
          </div>
          <div>
            <label className="form-label">Username *</label>
            <input {...fld('username')} className={`input-field ${formErrors.username?'border-red-400':''}`} placeholder="budisantoso"/>
            {formErrors.username && <p className="text-xs text-red-500 mt-1">{formErrors.username}</p>}
          </div>
          <div>
            <label className="form-label">Password * <span className="text-xs text-gray-400">(min. 8 karakter, huruf + angka)</span></label>
            <input type="password" {...fld('password')} className={`input-field ${formErrors.password?'border-red-400':''}`} placeholder="••••••••"/>
            {formErrors.password && <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>}
          </div>
          <div>
            <label className="form-label">Role</label>
            <select {...fld('role')} className="input-field">
              <option value="kasir">Kasir</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={()=>setModalOpen(false)} className="btn-outline" disabled={saving}>Batal</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Membuat…' : 'Buat User'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget} onClose={()=>setDeleteTarget(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Hapus User"
        message={`Hapus user "${deleteTarget?.username}"? Tindakan ini tidak dapat dibatalkan.`}
      />
    </div>
  );
}

