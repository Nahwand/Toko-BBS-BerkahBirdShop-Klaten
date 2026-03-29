import React, { useState } from 'react';
import styles from '../styles/App.module.css';
import { fmt } from '../utils/constants';

export default function RestockLogPage({ restockLogs, products }) {
  const [search, setSearch] = useState('');

  const filtered = restockLogs.filter(r =>
    r.product_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.user_nama?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
        <input id="restock-log-search" name="restock-log-search" className={styles.inp} style={{ maxWidth: 280 }} placeholder="🔍 Cari produk / user..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <span style={{ fontSize: 12, color: "#888", marginLeft: "auto" }}>{filtered.length} entri restock</span>
      </div>
      <div className="table-wrap" style={{ background: "#fff", borderRadius: 12, border: "1px solid #e4ede4", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 650 }}>
          <thead>
            <tr>
              {["Waktu", "Produk", "Stok Sebelum", "Ditambah", "Stok Sesudah", "Oleh", "Catatan"].map(h => (
                <th key={h} className={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f0f7f0"}
                onMouseLeave={(e) => e.currentTarget.style.background = ""}>
                <td className={styles.td} style={{ whiteSpace: "nowrap" }}>
                  <div style={{ fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</div>
                  <div style={{ fontSize: 10, color: "#aaa" }}>{new Date(r.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</div>
                </td>
                <td className={styles.td}><strong>{r.product_name}</strong></td>
                <td className={styles.td} style={{ textAlign: "center", color: "#888" }}>{r.qty_before} {r.unit}</td>
                <td className={styles.td} style={{ textAlign: "center" }}>
                  <span style={{ background: "#e8f5e9", color: "#2e7d32", padding: "3px 10px", borderRadius: 20, fontWeight: 800, fontSize: 12 }}>+{r.qty_added}</span>
                </td>
                <td className={styles.td} style={{ textAlign: "center" }}>
                  <strong style={{ color: "#2d7a2d" }}>{r.qty_after} {r.unit}</strong>
                </td>
                <td className={styles.td}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{r.user_nama}</div>
                  <div style={{ fontSize: 10, color: "#aaa" }}>{r.user_role}</div>
                </td>
                <td className={styles.td} style={{ fontSize: 11, color: "#666" }}>{r.catatan || "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className={styles.td} style={{ textAlign: "center", color: "#bbb", padding: 32 }}>Belum ada riwayat restock</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
