// pages/Reports.jsx — Laporan & Ekspor (admin only)
// - Stok opname + rekap transaksi berdasarkan rentang tanggal
// - Export CSV (custom) dan Export PDF (jspdf + jspdf-autotable)
// - Kop "Warkop Kiwil Inventory" di PDF

import { useState, useCallback } from 'react';
import {
  FileText, Download, FileSpreadsheet, RefreshCw,
  TrendingUp, TrendingDown, Package, AlertTriangle,
} from 'lucide-react';
import api from '../services/api.js';
import {
  formatRupiah, formatTanggal, toInputDate, exportToCsv, getErrorMessage,
} from '../utils/helpers.js';
import toast from 'react-hot-toast';

export default function Reports() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');
  const [report, setReport]       = useState(null);
  const [loading, setLoading]     = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate)   params.append('end_date', endDate);
      const { data } = await api.get(`/reports/summary?${params}`);
      setReport(data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  // ── Export CSV ────────────────────────────────────────────────────────────
  const handleExportCsv = () => {
    if (!report) return;

    // Sheet 1: Stok Opname
    exportToCsv(
      `stok-opname-${Date.now()}.csv`,
      ['Kode Barang', 'Nama Barang', 'Kategori', 'Satuan', 'Stok Saat Ini',
       'Stok Minimum', 'Harga Beli', 'Nilai Stok', 'Supplier', 'Status'],
      report.stok_opname.map((i) => [
        i.kode_barang, i.nama_barang, i.kategori || '', i.satuan,
        i.stok_saat_ini, i.stok_minimum, i.harga_beli, i.nilai_stok,
        i.nama_supplier || '', i.status_stok,
      ])
    );
    toast.success('File CSV berhasil diunduh.');
  };

  // ── Export PDF ────────────────────────────────────────────────────────────
  const handleExportPdf = async () => {
    if (!report) return;

    try {
      // Dynamic import untuk code splitting
      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();

      // ── KOP ─────────────────────────────────────────────────────────────
      doc.setFillColor(249, 115, 22);        // primary-500 orange
      doc.rect(0, 0, pageW, 22, 'F');

      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text('WARKOP KIWIL — LAPORAN INVENTORI', pageW / 2, 10, { align: 'center' });

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      const periodeStr = startDate || endDate
        ? `Periode: ${startDate || '—'} s.d. ${endDate || '—'}`
        : 'Semua Periode';
      doc.text(periodeStr, pageW / 2, 17, { align: 'center' });

      doc.setTextColor(0, 0, 0);

      // ── Statistik ───────────────────────────────────────────────────────
      const stats = report.statistik_stok;
      const txStats = report.statistik_transaksi;
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('RINGKASAN', 14, 30);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      const statLines = [
        `Total Item: ${stats.total_item}`,
        `Nilai Total Stok: ${formatRupiah(stats.total_nilai_stok)}`,
        `Item Aman: ${stats.item_aman}   |   Item Stok Rendah: ${stats.item_stok_rendah}   |   Item Habis: ${stats.item_habis}`,
        `Total Transaksi: ${txStats.total_transaksi}   |   Total Unit Masuk: ${txStats.total_unit_masuk}   |   Total Unit Keluar: ${txStats.total_unit_keluar}`,
      ];
      statLines.forEach((line, i) => doc.text(line, 14, 36 + i * 5));

      // ── Tabel Stok Opname ───────────────────────────────────────────────
      doc.setFont(undefined, 'bold');
      doc.setFontSize(10);
      doc.text('STOK OPNAME', 14, 60);

      autoTable(doc, {
        startY: 63,
        head: [['Kode', 'Nama Barang', 'Kategori', 'Satuan', 'Stok', 'Min', 'Harga Beli', 'Nilai Stok', 'Status']],
        body: report.stok_opname.map((i) => [
          i.kode_barang, i.nama_barang, i.kategori || '-', i.satuan,
          i.stok_saat_ini, i.stok_minimum,
          formatRupiah(i.harga_beli), formatRupiah(i.nilai_stok),
          i.status_stok,
        ]),
        theme: 'striped',
        headStyles: { fillColor: [249, 115, 22], textColor: 255, fontSize: 8 },
        bodyStyles: { fontSize: 7.5 },
        alternateRowStyles: { fillColor: [255, 247, 237] },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 8) {
            const val = data.cell.raw;
            if (val === 'HABIS')  data.cell.styles.textColor = [220, 38, 38];
            if (val === 'KRITIS' || val === 'RENDAH') data.cell.styles.textColor = [202, 138, 4];
            if (val === 'AMAN')   data.cell.styles.textColor = [22, 163, 74];
          }
        },
      });

      // ── Tabel Rekap Transaksi ───────────────────────────────────────────
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFont(undefined, 'bold');
      doc.setFontSize(10);
      doc.text('REKAP TRANSAKSI PER ITEM', 14, finalY);

      autoTable(doc, {
        startY: finalY + 3,
        head: [['Kode', 'Nama Barang', 'Satuan', 'Total Masuk', 'Total Keluar', 'Jml Transaksi']],
        body: report.rekap_transaksi.map((i) => [
          i.kode_barang, i.nama_barang, i.satuan,
          i.total_masuk, i.total_keluar, i.jumlah_transaksi,
        ]),
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 8 },
        bodyStyles: { fontSize: 7.5 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      // Footer
      const pCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text(
          `Dicetak pada ${new Date().toLocaleString('id-ID')}  —  Halaman ${i}/${pCount}  —  Warkop Kiwil Inventory`,
          pageW / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' }
        );
      }

      doc.save(`laporan-warkop-kiwil-${Date.now()}.pdf`);
      toast.success('File PDF berhasil diunduh.');
    } catch (err) {
      toast.error('Gagal membuat PDF: ' + err.message);
    }
  };

  // Status badge
  const StatusBadge = ({ status }) => {
    const map = {
      AMAN:   'badge-green',
      RENDAH: 'badge-yellow',
      KRITIS: 'badge-yellow',
      HABIS:  'badge-red',
    };
    return <span className={map[status] || 'badge-blue'}>{status}</span>;
  };

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Laporan & Ekspor</h1>
          <p className="text-sm text-gray-400">Stok opname dan rekap transaksi</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCsv} disabled={!report} className="btn-outline">
            <FileSpreadsheet size={15} /> Export CSV
          </button>
          <button onClick={handleExportPdf} disabled={!report} className="btn-primary">
            <FileText size={15} /> Export PDF
          </button>
        </div>
      </div>

      {/* Filter Tanggal */}
      <div className="card py-4 px-5">
        <div className="flex flex-col sm:flex-row items-end gap-4">
          <div className="flex-1">
            <label className="form-label">Dari Tanggal</label>
            <input type="date" value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field" />
          </div>
          <div className="flex-1">
            <label className="form-label">Sampai Tanggal</label>
            <input type="date" value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field" />
          </div>
          <button onClick={fetchReport} disabled={loading} className="btn-primary whitespace-nowrap">
            {loading
              ? <><RefreshCw size={15} className="animate-spin"/> Memuat…</>
              : <><RefreshCw size={15}/> Tampilkan Laporan</>}
          </button>
        </div>
      </div>

      {!report && !loading && (
        <div className="card flex flex-col items-center py-20 text-gray-400 gap-3">
          <FileText size={48} className="opacity-20" />
          <p className="text-sm">Klik "Tampilkan Laporan" untuk memuat data.</p>
        </div>
      )}

      {report && (
        <>
          {/* Statistik Ringkasan */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Item', value: report.statistik_stok.total_item,         icon: Package,       color: 'bg-primary-500' },
              { label: 'Item Stok Rendah', value: report.statistik_stok.item_stok_rendah + report.statistik_stok.item_habis, icon: AlertTriangle, color: 'bg-amber-400' },
              { label: 'Total Unit Masuk',  value: report.statistik_transaksi.total_unit_masuk,  icon: TrendingUp,  color: 'bg-green-500' },
              { label: 'Total Unit Keluar', value: report.statistik_transaksi.total_unit_keluar, icon: TrendingDown, color: 'bg-red-500'   },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card flex items-center gap-4">
                <div className={`p-3 rounded-xl ${color} text-white shrink-0`}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-2xl font-bold text-slate-800">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Nilai Total Stok */}
          <div className="card bg-gradient-to-r from-primary-50 to-amber-50 border-primary-100">
            <p className="text-sm text-gray-500 mb-1">Nilai Total Stok Saat Ini</p>
            <p className="text-3xl font-bold text-primary-600">
              {formatRupiah(report.statistik_stok.total_nilai_stok)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Berdasarkan harga beli × stok saat ini</p>
          </div>

          {/* Tabel Stok Opname */}
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Stok Opname</h2>
              <span className="text-xs text-gray-400">{report.stok_opname.length} item</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-gray-100">
                  <tr>
                    {['Kode', 'Nama Barang', 'Kategori', 'Satuan', 'Stok', 'Min', 'Harga Beli', 'Nilai Stok', 'Supplier', 'Status'].map((h) => (
                      <th key={h} className="text-left py-2.5 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.stok_opname.map((item) => (
                    <tr key={item.id}
                      className={`border-b border-gray-50 hover:bg-slate-50 transition-colors
                        ${item.status_stok !== 'AMAN' ? 'bg-orange-50/30' : ''}`}>
                      <td className="py-2.5 px-4 font-mono text-xs text-gray-400">{item.kode_barang}</td>
                      <td className="py-2.5 px-4 font-medium text-slate-800">{item.nama_barang}</td>
                      <td className="py-2.5 px-4 text-gray-400">{item.kategori || '-'}</td>
                      <td className="py-2.5 px-4"><span className="badge-blue">{item.satuan}</span></td>
                      <td className={`py-2.5 px-4 font-semibold ${item.status_stok !== 'AMAN' ? 'text-red-600' : 'text-slate-800'}`}>
                        {item.stok_saat_ini}
                      </td>
                      <td className="py-2.5 px-4 text-gray-400">{item.stok_minimum}</td>
                      <td className="py-2.5 px-4 text-gray-600">{formatRupiah(item.harga_beli)}</td>
                      <td className="py-2.5 px-4 text-gray-600">{formatRupiah(item.nilai_stok)}</td>
                      <td className="py-2.5 px-4 text-gray-400 text-xs">{item.nama_supplier || '-'}</td>
                      <td className="py-2.5 px-4"><StatusBadge status={item.status_stok} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabel Rekap Transaksi */}
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Rekap Transaksi per Item</h2>
              <span className="text-xs text-gray-400">
                {startDate || endDate
                  ? `${startDate || '…'} → ${endDate || '…'}`
                  : 'Semua Periode'}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-gray-100">
                  <tr>
                    {['Kode', 'Nama Barang', 'Satuan', 'Total Masuk', 'Total Keluar', 'Jml Transaksi'].map((h) => (
                      <th key={h} className="text-left py-2.5 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.rekap_transaksi.map((item) => (
                    <tr key={item.item_id} className="border-b border-gray-50 hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4 font-mono text-xs text-gray-400">{item.kode_barang}</td>
                      <td className="py-2.5 px-4 font-medium text-slate-800">{item.nama_barang}</td>
                      <td className="py-2.5 px-4"><span className="badge-blue">{item.satuan}</span></td>
                      <td className="py-2.5 px-4">
                        <span className="flex items-center gap-1 text-green-600 font-semibold">
                          <TrendingUp size={13}/>{item.total_masuk}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="flex items-center gap-1 text-red-600 font-semibold">
                          <TrendingDown size={13}/>{item.total_keluar}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-gray-500">{item.jumlah_transaksi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

