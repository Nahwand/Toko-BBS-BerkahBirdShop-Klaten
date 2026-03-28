import React from 'react';
import styles from '../styles/App.module.css';
import { fmt } from '../utils/constants';

export default function RiwayatPage({
  filtHist, histSearch, setHistSearch, filterDate, setFilterDate,
  exportExcel, setHistReceipt,
}) {
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input className={styles.inp} style={{ maxWidth: 230 }} placeholder="🔍 ID / pelanggan..."
          value={histSearch} onChange={(e) => setHistSearch(e.target.value)} />
        <input className={styles.inp} style={{ width: 150 }} type="date"
          value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
        {filterDate && (
          <button className={styles.btndefault} onClick={() => setFilterDate("")}>✕ Reset</button>
        )}
        <button className={`${styles.btn} ${styles.btnblue}`} style={{ marginLeft: "auto" }} onClick={() => exportExcel("transaksi")}>
          📥 Export Excel
        </button>
      </div>
      <div className="table-wrap" style={{ background: "#fff", borderRadius: 12, border: "1px solid #e4ede4", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 650 }}>
          <thead>
            <tr>
              {["ID", "Tanggal", "Pelanggan", "Item", "Total", "Bayar", "Kembalian"].map((h) => (
                <th key={h} className={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtHist.slice(0, 60).map((t) => (
              <tr key={t.id} onClick={() => setHistReceipt(t)} style={{ cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f7f0")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                <td className={styles.td}><strong style={{ color: "#2d7a2d" }}>{t.trx_code}</strong></td>
                <td className={styles.td}>{t.date}</td>
                <td className={styles.td}>{t.customer}</td>
                <td className={styles.td}>
                  {(t.items || []).map((i, idx) => (
                    <div key={idx} style={{ fontSize: 10, color: "#666" }}>{i.product_name} ×{i.qty}</div>
                  ))}
                </td>
                <td className={styles.td}><strong style={{ color: "#2d7a2d" }}>{fmt(t.total)}</strong></td>
                <td className={styles.td}>{fmt(t.payment)}</td>
                <td className={styles.td}>{fmt(t.change_amt)}</td>
              </tr>
            ))}
            {filtHist.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.td} style={{ textAlign: "center", color: "#bbb", padding: 32 }}>Tidak ada transaksi</td>
              </tr>
            )}
          </tbody>
        </table>
        <div style={{ padding: "11px 16px", borderTop: "1px solid #e4ede4", display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <span style={{ color: "#888" }}>{filtHist.length} transaksi</span>
          <strong style={{ color: "#2d7a2d" }}>Total: {fmt(filtHist.reduce((s, t) => s + t.total, 0))}</strong>
        </div>
      </div>
    </div>
  );
}
