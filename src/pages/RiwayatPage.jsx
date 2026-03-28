import React from 'react';
import styles from '../styles/App.module.css';
import { fmt } from '../utils/constants';

export default function RiwayatPage({
  filtHist, histSearch, setHistSearch, filterDate, setFilterDate,
  exportExcel, setHistReceipt,
  totalCount, page, setPage, totalPages, perPage,
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
            {filtHist.map((t) => (
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

        {/* Footer: total + pagination */}
        <div style={{ padding: "11px 16px", borderTop: "1px solid #e4ede4", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <span style={{ color: "#888", fontSize: 13 }}>
            {totalCount} transaksi · halaman {page} dari {totalPages || 1}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button className={styles.btndefault} style={{ padding: "4px 12px", fontSize: 12 }}
              onClick={() => setPage(1)} disabled={page === 1}>«</button>
            <button className={styles.btndefault} style={{ padding: "4px 12px", fontSize: 12 }}
              onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹ Prev</button>
            {/* Nomor halaman */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
              .reduce((acc, n, i, arr) => {
                if (i > 0 && n - arr[i - 1] > 1) acc.push('...');
                acc.push(n);
                return acc;
              }, [])
              .map((n, i) => n === '...'
                ? <span key={`e${i}`} style={{ fontSize: 12, color: "#aaa", padding: "0 4px" }}>…</span>
                : <button key={n} onClick={() => setPage(n)}
                    style={{ padding: "4px 10px", fontSize: 12, borderRadius: 6, border: `1px solid ${page === n ? '#2d7a2d' : '#ddd'}`, background: page === n ? '#2d7a2d' : '#fff', color: page === n ? '#fff' : '#333', cursor: "pointer", fontWeight: page === n ? 700 : 400 }}>
                    {n}
                  </button>
              )}
            <button className={styles.btndefault} style={{ padding: "4px 12px", fontSize: 12 }}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}>Next ›</button>
            <button className={styles.btndefault} style={{ padding: "4px 12px", fontSize: 12 }}
              onClick={() => setPage(totalPages)} disabled={page === totalPages || totalPages === 0}>»</button>
          </div>
          <strong style={{ color: "#2d7a2d", fontSize: 13 }}>
            Total: {fmt(filtHist.reduce((s, t) => s + t.total, 0))}
          </strong>
        </div>
      </div>
    </div>
  );
}
