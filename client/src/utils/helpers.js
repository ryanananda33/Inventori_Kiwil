// =============================================================================
// utils/helpers.js — Utility functions
// =============================================================================

/** Format angka ke Rupiah */
export function formatRupiah(amount) {
  if (amount == null) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

/** Format tanggal ke format Indonesia */
export function formatTanggal(dateStr, withTime = true) {
  if (!dateStr) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime && { hour: '2-digit', minute: '2-digit' }),
  }).format(new Date(dateStr));
}

/** Format tanggal ke YYYY-MM-DD (untuk input[type=date]) */
export function toInputDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().split('T')[0];
}

/** Hitung status stok */
export function getStockStatus(stokSaatIni, stokMinimum) {
  if (stokSaatIni === 0) return 'habis';
  if (stokSaatIni <= stokMinimum) return 'kritis';
  if (stokSaatIni <= stokMinimum * 1.5) return 'rendah';
  return 'aman';
}

/** Ambil pesan error dari response axios */
export function getErrorMessage(err) {
  return (
    err?.response?.data?.message ||
    err?.message ||
    'Terjadi kesalahan. Coba lagi.'
  );
}

/** Export data ke CSV */
export function exportToCsv(filename, headers, rows) {
  const escape = (val) => {
    if (val == null) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csv = [
    headers.map(escape).join(','),
    ...rows.map((row) => row.map(escape).join(',')),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Kelompokkan transaksi per tanggal (untuk grafik) */
export function groupTransactionsByDate(transactions, days = 7) {
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    const dateStr = d.toISOString().split('T')[0];

    const masuk  = transactions
      .filter((t) => t.tipe_transaksi === 'MASUK'  && t.tanggal_transaksi?.startsWith(dateStr))
      .reduce((sum, t) => sum + Number(t.jumlah), 0);
    const keluar = transactions
      .filter((t) => t.tipe_transaksi === 'KELUAR' && t.tanggal_transaksi?.startsWith(dateStr))
      .reduce((sum, t) => sum + Number(t.jumlah), 0);

    result.push({ label, masuk, keluar });
  }
  return result;
}

