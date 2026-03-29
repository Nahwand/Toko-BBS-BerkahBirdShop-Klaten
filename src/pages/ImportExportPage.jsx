import React, { useRef } from 'react';
import styles from '../styles/App.module.css';
import Spin from '../components/Spin';
import { MONTHS } from '../utils/constants';

export default function ImportExportPage({
  exportExcel, exportingTitle, handleImport, importingState, importLog, rptMonth, rptYear,
}) {
  const fileRef = useRef();
  return (
    <div className="excel-grid">

      {/* IMPORT — di kiri (desktop) / atas (mobile) */}
      <div>
        <div className={styles.card}>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#1a4a1a", marginBottom: 4 }}>📤 Import dari Excel</div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>Upload .xlsx untuk update data produk massal</div>
          <div style={{ background: "#f8fdf8", borderRadius: 12, padding: "20px", marginBottom: 14, border: "2px dashed #b8d4b8", textAlign: "center", opacity: importingState ? 0.6 : 1, pointerEvents: importingState ? "none" : "auto" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{importingState ? "⏳" : "📂"}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: importingState ? "#2d7a2d" : "#333", marginBottom: 14 }}>
              {importingState ? importingState : "Pilih File Excel"}
            </div>
            <input id="import-file" name="import-file" type="file" accept=".xlsx,.xls" ref={fileRef} onChange={handleImport} style={{ display: "none" }} />
            <button className={`${styles.btn} ${styles.btnprimary}`} style={{ padding: "10px 24px" }}
              onClick={() => fileRef.current.click()} disabled={!!importingState}>
              {importingState ? <Spin size={16} color="#fff" /> : "📤 Upload File"}
            </button>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "#fff8e1", borderRadius: 10, border: "1px solid #fde68a" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>📄 Download Template</div>
              <div style={{ fontSize: 11, color: "#888" }}>Format kolom yang benar</div>
            </div>
            <button className={`${styles.btn} ${styles.btnwarning}`} style={{ padding: "8px 14px" }} onClick={() => exportExcel("template")}>⬇ Unduh</button>
          </div>
          {importLog.length > 0 && (
            <div style={{ marginTop: 12, background: "#f0fdf4", borderRadius: 10, padding: "12px 14px", border: "1px solid #bbf7d0" }}>
              {importLog.map((l, i) => <div key={i} style={{ fontSize: 12, color: "#333", marginBottom: 3 }}>{l}</div>)}
            </div>
          )}
        </div>
      </div>

      {/* EXPORT — di kanan (desktop) / bawah (mobile) */}
      <div className={styles.card}>
        <div style={{ fontWeight: 800, fontSize: 15, color: "#1a4a1a", marginBottom: 4 }}>📥 Export ke Excel</div>
        <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>Unduh data ke file .xlsx</div>
        {[
          { label: "📦 Semua Data", sub: "4 sheet sekaligus", type: "all", color: "primary" },
          { label: "📈 Laporan Bulanan", sub: `${MONTHS[rptMonth]} ${rptYear}`, type: "laporan", color: "blue" },
          { label: "📋 Transaksi", sub: "Riwayat transaksi", type: "transaksi", color: "outline" },
          { label: "📦 Produk", sub: "Daftar produk", type: "produk", color: "outline" },
          { label: "📊 Stok", sub: "Status stok", type: "stok", color: "outline" },
          { label: "🤝 Supplier", sub: "Data supplier", type: "supplier", color: "outline" },
        ].map((e) => (
          <div key={e.type} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: "1px solid #f0f5f0" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{e.label}</div>
              <div style={{ fontSize: 11, color: "#aaa" }}>{e.sub}</div>
            </div>
            <button className={`${styles.btn} ${styles['btn' + e.color]}`} style={{ flexShrink: 0, minWidth: 100 }}
              onClick={() => exportExcel(e.type)} disabled={exportingTitle === e.type}>
              {exportingTitle === e.type ? "⏳..." : "Download"}
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
