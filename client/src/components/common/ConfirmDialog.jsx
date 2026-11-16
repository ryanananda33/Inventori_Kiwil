// components/common/ConfirmDialog.jsx — Dialog konfirmasi hapus

import { AlertTriangle } from 'lucide-react';
import Modal from './Modal.jsx';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, loading }) {
  return (
    <Modal open={open} onClose={onClose} title="" size="sm">
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div className="p-3 rounded-full bg-red-100">
          <AlertTriangle size={28} className="text-red-500" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{message}</p>
        </div>
        <div className="flex gap-3 w-full">
          <button onClick={onClose} className="btn-outline flex-1" disabled={loading}>
            Batal
          </button>
          <button onClick={onConfirm} className="btn-danger flex-1" disabled={loading}>
            {loading ? 'Menghapus…' : 'Hapus'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

