// pages/Suppliers.jsx — Manajemen Supplier (admin only untuk CUD)

import { useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, Truck } from 'lucide-react';
import { useSuppliers } from '../hooks/useSuppliers.js';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from '../components/common/Modal.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import { formatTanggal, getErrorMessage } from '../utils/helpers.js';
import toast from 'react-hot-toast';

const EMPTY_FORM = { nama_supplier: '', kontak: '', alamat: '' };

export default function Suppliers() {
  const { isAdmin } = useAuth();
  const { suppliers, loading, createSupplier, updateSupplier, deleteSupplier } = useSuppliers();

  const [search, setSearch]           = useState('');
  const [modalOpen, setModalOpen]     = useState(false);
  const [editItem, setEditItem]       = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [formErrors, setFormErrors]   = useState({});
  const [saving, setSaving]           = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]       = useState(false);

  const filtered = useMemo(() =>
    suppliers.filter((s) =>
      !search || s.nama_supplier.toLowerCase().includes(search.toLowerCase())
    ), [suppliers, search]);

  const openAdd = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setEditItem(s);
    setForm({ nama_supplier: s.nama_supplier, kontak: s.kontak || '', alamat: s.alamat || '' });
    setFormErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e = {};
    if (!form.nama_supplier.trim()) e.nama_supplier = 'Nama supplier wajib diisi.';
    return e;
  };

  const handleSave = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setSaving(true);
    try {
      if (editItem) await updateSupplier(editItem.id, form);
      else          await createSupplier(form);
      setModalOpen(false);
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
      await deleteSupplier(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const fld = (name) => ({
    value: form[name],
    onChange: (e) => {
      setForm((p) => ({ ...p, [name]: e.target.value }));
      setFormErrors((p) => ({ ...p, [name]: '' }));
    },
  });

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Supplier</h1>
          <p className="text-sm text-gray-400">{suppliers.length} supplier terdaftar</p>
        </div>
        {isAdmin && (
          <button onClick={openAdd} className="btn-primary">
            <Plus size={16} /> Tambah Supplier
          </button>
        )}
      </div>

      {/* Search */}
      <div className="card py-3 px-4">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama supplier…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
      </div>

      {/* Tabel */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <Truck size={40} className="mb-3 opacity-30" />
            <p className="text-sm">Tidak ada supplier ditemukan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-gray-100">
                <tr>
                  {['Nama Supplier', 'Kontak', 'Alamat', 'Terdaftar', ...(isAdmin ? ['Aksi'] : [])].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-800">{s.nama_supplier}</td>
                    <td className="py-3 px-4 text-gray-500">{s.kontak || '-'}</td>
                    <td className="py-3 px-4 text-gray-400 text-xs max-w-xs truncate">{s.alamat || '-'}</td>
                    <td className="py-3 px-4 text-gray-400 text-xs">{formatTanggal(s.created_at, false)}</td>
                    {isAdmin && (
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(s)}
                            className="p-1.5 rounded-lg hover:bg-primary-50 text-gray-400 hover:text-primary-600 transition-colors"
                            title="Edit">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setDeleteTarget(s)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                            title="Hapus">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editItem ? 'Edit Supplier' : 'Tambah Supplier'} size="md">
        <form onSubmit={handleSave} noValidate className="space-y-4">
          <div>
            <label className="form-label">Nama Supplier *</label>
            <input {...fld('nama_supplier')}
              className={`input-field ${formErrors.nama_supplier ? 'border-red-400' : ''}`}
              placeholder="PT Kopi Nusantara" />
            {formErrors.nama_supplier && <p className="text-xs text-red-500 mt-1">{formErrors.nama_supplier}</p>}
          </div>
          <div>
            <label className="form-label">Kontak</label>
            <input {...fld('kontak')} className="input-field" placeholder="08xxxxxxxxxx" />
          </div>
          <div>
            <label className="form-label">Alamat</label>
            <textarea {...fld('alamat')} rows={3} className="input-field resize-none" placeholder="Jl. Contoh No. 1, Kota" />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-outline" disabled={saving}>Batal</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Menyimpan…' : (editItem ? 'Simpan Perubahan' : 'Tambah Supplier')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Hapus Supplier"
        message={`Hapus supplier "${deleteTarget?.nama_supplier}"?`}
      />
    </div>
  );
}

