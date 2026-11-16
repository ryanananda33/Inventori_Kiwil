// pages/Items.jsx — Manajemen Inventori (CRUD Barang)
// - Pencarian, filter kategori
// - Modal tambah/edit (admin only)
// - Indikator peringatan stok rendah
// - Kasir hanya bisa lihat (tidak ada tombol tambah/edit/hapus)

import { useState, useMemo } from 'react';
import {
  Plus, Search, Pencil, Trash2, AlertTriangle,
  ChevronDown, Package, Filter,
} from 'lucide-react';
import { useItems } from '../hooks/useItems.js';
import { useSuppliers } from '../hooks/useSuppliers.js';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from '../components/common/Modal.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import { formatRupiah, getStockStatus, getErrorMessage } from '../utils/helpers.js';
import toast from 'react-hot-toast';

const SATUAN_OPTIONS = ['pcs', 'gram', 'liter', 'dus'];
const STATUS_BADGE = {
  habis:  <span className="badge-red">Habis</span>,
  kritis: <span className="badge-red">Kritis</span>,
  rendah: <span className="badge-yellow">Rendah</span>,
  aman:   <span className="badge-green">Aman</span>,
};

const EMPTY_FORM = {
  kode_barang:'', nama_barang:'', kategori:'', satuan:'pcs',
  stok_saat_ini:0, stok_minimum:0, harga_beli:'', supplier_id:'',
};

export default function Items() {
  const { isAdmin }   = useAuth();
  const { items, loading, createItem, updateItem, deleteItem } = useItems();
  const { suppliers } = useSuppliers();

  const [search, setSearch]           = useState('');
  const [filterKat, setFilterKat]     = useState('');
  const [modalOpen, setModalOpen]     = useState(false);
  const [editItem, setEditItem]       = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [formErrors, setFormErrors]   = useState({});
  const [saving, setSaving]           = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]       = useState(false);

  // Kategori unik untuk filter
  const categories = useMemo(
    () => [...new Set(items.map((i) => i.kategori).filter(Boolean))],
    [items]
  );

  // Filter + search
  const filtered = useMemo(() => {
    return items.filter((it) => {
      const matchSearch =
        !search ||
        it.nama_barang.toLowerCase().includes(search.toLowerCase()) ||
        it.kode_barang.toLowerCase().includes(search.toLowerCase());
      const matchKat = !filterKat || it.kategori === filterKat;
      return matchSearch && matchKat;
    });
  }, [items, search, filterKat]);

  const openAdd = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      kode_barang:   item.kode_barang,
      nama_barang:   item.nama_barang,
      kategori:      item.kategori || '',
      satuan:        item.satuan,
      stok_saat_ini: item.stok_saat_ini,
      stok_minimum:  item.stok_minimum,
      harga_beli:    item.harga_beli,
      supplier_id:   item.supplier_id || '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validateForm = () => {
    const e = {};
    if (!form.kode_barang.trim()) e.kode_barang = 'Kode barang wajib diisi.';
    if (!form.nama_barang.trim()) e.nama_barang = 'Nama barang wajib diisi.';
    if (!form.satuan) e.satuan = 'Satuan wajib dipilih.';
    if (form.harga_beli === '' || isNaN(form.harga_beli)) e.harga_beli = 'Harga beli wajib diisi.';
    if (Number(form.stok_saat_ini) < 0) e.stok_saat_ini = 'Stok tidak boleh negatif.';
    if (Number(form.stok_minimum) < 0) e.stok_minimum = 'Stok minimum tidak boleh negatif.';
    return e;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        stok_saat_ini: Number(form.stok_saat_ini),
        stok_minimum:  Number(form.stok_minimum),
        harga_beli:    Number(form.harga_beli),
        supplier_id:   form.supplier_id || null,
      };
      if (editItem) await updateItem(editItem.id, payload);
      else          await createItem(payload);
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
      await deleteItem(deleteTarget.id);
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
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Inventori</h1>
          <p className="text-sm text-gray-400">{items.length} item bahan baku terdaftar</p>
        </div>
        {isAdmin && (
          <button onClick={openAdd} className="btn-primary">
            <Plus size={16} /> Tambah Item
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card py-3 px-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau kode barang…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>
          <div className="relative">
            <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={filterKat}
              onChange={(e) => setFilterKat(e.target.value)}
              className="input-field pl-9 pr-8 w-48 appearance-none"
            >
              <option value="">Semua Kategori</option>
              {categories.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
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
            <Package size={40} className="mb-3 opacity-30" />
            <p className="text-sm">Tidak ada item yang cocok.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-gray-100">
                <tr>
                  {['Kode', 'Nama Barang', 'Kategori', 'Satuan', 'Stok', 'Min.', 'Harga Beli', 'Supplier', 'Status', ...(isAdmin ? ['Aksi'] : [])].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const status = getStockStatus(item.stok_saat_ini, item.stok_minimum);
                  const isLow  = status !== 'aman';
                  return (
                    <tr key={item.id}
                      className={`border-b border-gray-50 hover:bg-slate-50 transition-colors
                                  ${isLow ? 'bg-orange-50/30' : ''}`}>
                      <td className="py-3 px-4 font-mono text-xs text-gray-500">{item.kode_barang}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {isLow && <AlertTriangle size={14} className="text-amber-500 shrink-0" />}
                          <span className="font-medium text-slate-800">{item.nama_barang}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{item.kategori || '-'}</td>
                      <td className="py-3 px-4">
                        <span className="badge-blue">{item.satuan}</span>
                      </td>
                      <td className={`py-3 px-4 font-semibold ${isLow ? 'text-red-600' : 'text-slate-800'}`}>
                        {item.stok_saat_ini}
                      </td>
                      <td className="py-3 px-4 text-gray-400">{item.stok_minimum}</td>
                      <td className="py-3 px-4 text-gray-600">{formatRupiah(item.harga_beli)}</td>
                      <td className="py-3 px-4 text-gray-400 text-xs">{item.nama_supplier || '-'}</td>
                      <td className="py-3 px-4">{STATUS_BADGE[status]}</td>
                      {isAdmin && (
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button onClick={() => openEdit(item)}
                              className="p-1.5 rounded-lg hover:bg-primary-50 text-gray-400
                                         hover:text-primary-600 transition-colors"
                              title="Edit">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => setDeleteTarget(item)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400
                                         hover:text-red-600 transition-colors"
                              title="Hapus">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah/Edit */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? 'Edit Item' : 'Tambah Item Baru'}
        size="lg"
      >
        <form onSubmit={handleSave} noValidate className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Kode Barang */}
            <div>
              <label className="form-label">Kode Barang *</label>
              <input {...fld('kode_barang')} className={`input-field ${formErrors.kode_barang?'border-red-400':''}`} placeholder="cth. KPI-001" />
              {formErrors.kode_barang && <p className="text-xs text-red-500 mt-1">{formErrors.kode_barang}</p>}
            </div>
            {/* Nama Barang */}
            <div>
              <label className="form-label">Nama Barang *</label>
              <input {...fld('nama_barang')} className={`input-field ${formErrors.nama_barang?'border-red-400':''}`} placeholder="cth. Kopi Robusta" />
              {formErrors.nama_barang && <p className="text-xs text-red-500 mt-1">{formErrors.nama_barang}</p>}
            </div>
            {/* Kategori */}
            <div>
              <label className="form-label">Kategori</label>
              <input {...fld('kategori')} className="input-field" placeholder="cth. Kopi, Susu, Mie…" />
            </div>
            {/* Satuan */}
            <div>
              <label className="form-label">Satuan *</label>
              <select {...fld('satuan')} className={`input-field ${formErrors.satuan?'border-red-400':''}`}>
                {SATUAN_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {/* Stok Saat Ini — hanya saat create */}
            {!editItem && (
              <div>
                <label className="form-label">Stok Awal</label>
                <input type="number" min="0" {...fld('stok_saat_ini')}
                  className={`input-field ${formErrors.stok_saat_ini?'border-red-400':''}`} />
                {formErrors.stok_saat_ini && <p className="text-xs text-red-500 mt-1">{formErrors.stok_saat_ini}</p>}
              </div>
            )}
            {/* Stok Minimum */}
            <div>
              <label className="form-label">Stok Minimum</label>
              <input type="number" min="0" {...fld('stok_minimum')}
                className={`input-field ${formErrors.stok_minimum?'border-red-400':''}`} />
              {formErrors.stok_minimum && <p className="text-xs text-red-500 mt-1">{formErrors.stok_minimum}</p>}
            </div>
            {/* Harga Beli */}
            <div>
              <label className="form-label">Harga Beli (Rp) *</label>
              <input type="number" min="0" step="100" {...fld('harga_beli')}
                className={`input-field ${formErrors.harga_beli?'border-red-400':''}`} placeholder="85000" />
              {formErrors.harga_beli && <p className="text-xs text-red-500 mt-1">{formErrors.harga_beli}</p>}
            </div>
            {/* Supplier */}
            <div>
              <label className="form-label">Supplier</label>
              <select {...fld('supplier_id')} className="input-field">
                <option value="">— Pilih Supplier —</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.nama_supplier}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-outline" disabled={saving}>
              Batal
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Menyimpan…' : (editItem ? 'Simpan Perubahan' : 'Tambah Item')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Item"
        message={`Apakah Anda yakin ingin menghapus "${deleteTarget?.nama_barang}"? Tindakan ini tidak dapat dibatalkan.`}
        loading={deleting}
      />
    </div>
  );
}

