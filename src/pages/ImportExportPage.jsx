import { useRef } from 'react';
import styles from '../styles/App.module.css';
import Spin from '../components/Spin';
import { MONTHS } from '../utils/constants';

export default function ImportExportPage({ exportExcel, exportingTitle, handleImport, importingState, importLog, rptMonth, rptYear }) {
  const fileRef = useRef();
  const exportItems = [
    { label: "📦 Semua Data", sub: "4 sheet sekaligus", type: "all", cls: "bg-bbs-green text-white" },
    { label: "📈 Laporan Bulanan", sub: `${MONTHS[rptMonth]} ${rptYear}`, type: "laporan", cls: "bg-[#1565c0] text-white" },
    { label: "📋 Transaksi", sub: "Riwayat transaksi", type: "transaksi", cls: "border border-bbs-green text-bbs-green bg-transparent" },
    { label: "📦 Produk", sub: "Daftar produk", type: "produk", cls: "border border-bbs-green text-bbs-green bg-transparent" },
    { label: "📊 Stok", sub: "Status stok", type: "stok", cls: "border border-bbs-green text-bbs-green bg-transparent" },
    { label: "🤝 Supplier", sub: "Data supplier", type: "supplier", cls: "border border-bbs-green text-bbs-green bg-transparent" },
  ];

  return (
    <div className="excel-grid">
      {/* IMPORT */}
      <div className={styles.card}>
        <div className="text-[15px] font-extrabold text-bbs-green-dark dark:text-[#a8e063] mb-1">📤 Import dari Excel</div>
        <div className="text-xs text-gray-400 mb-4">Upload .xlsx untuk update data produk massal</div>
        <div className={`bg-[#f8fdf8] dark:bg-[#1e2e1e] rounded-xl p-5 mb-3.5 border-2 border-dashed border-[#b8d4b8] dark:border-[#3a5a3a] text-center transition-opacity ${importingState ? 'opacity-60 pointer-events-none' : ''}`}>
          <div className="text-3xl mb-2">{importingState ? "⏳" : "📂"}</div>
          <div className={`text-[13px] font-extrabold mb-3.5 ${importingState ? "text-bbs-green" : "text-gray-700 dark:text-gray-300"}`}>
            {importingState || "Pilih File Excel"}
          </div>
          <input id="import-file" name="import-file" type="file" accept=".xlsx,.xls" ref={fileRef} onChange={handleImport} className="hidden" />
          <button className="px-6 py-2.5 rounded-lg font-bold text-sm bg-bbs-green text-white border-none cursor-pointer disabled:opacity-50"
            onClick={() => fileRef.current.click()} disabled={!!importingState}>
            {importingState ? <Spin size={16} color="#fff" /> : "📤 Upload File"}
          </button>
        </div>
        <div className="flex justify-between items-center p-3.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700">
          <div>
            <div className="text-[13px] font-bold text-gray-700 dark:text-gray-300">📄 Download Template</div>
            <div className="text-[11px] text-gray-400">Format kolom yang benar</div>
          </div>
          <button className="px-3.5 py-2 rounded-lg text-xs font-bold bg-[#f59e0b] text-white border-none cursor-pointer" onClick={() => exportExcel("template")}>⬇ Unduh</button>
        </div>
        {importLog.length > 0 && (
          <div className="mt-3 bg-green-50 dark:bg-green-900/20 rounded-xl p-3.5 border border-green-200 dark:border-green-700">
            {importLog.map((l, i) => <div key={i} className="text-xs text-gray-700 dark:text-gray-300 mb-0.5">{l}</div>)}
          </div>
        )}
      </div>

      {/* EXPORT */}
      <div className={styles.card}>
        <div className="text-[15px] font-extrabold text-bbs-green-dark dark:text-[#a8e063] mb-1">📥 Export ke Excel</div>
        <div className="text-xs text-gray-400 mb-4">Unduh data ke file .xlsx</div>
        {exportItems.map((e) => (
          <div key={e.type} className="flex justify-between items-center py-3 border-b border-[#f0f5f0] dark:border-[#243424]">
            <div>
              <div className="text-[13px] font-bold text-gray-800 dark:text-gray-200">{e.label}</div>
              <div className="text-[11px] text-gray-400">{e.sub}</div>
            </div>
            <button className={`px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer min-w-[100px] ${e.cls} disabled:opacity-50`}
              onClick={() => exportExcel(e.type)} disabled={exportingTitle === e.type}>
              {exportingTitle === e.type ? "⏳..." : "Download"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
