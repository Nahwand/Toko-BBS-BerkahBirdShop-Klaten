import { useState } from 'react';
import styles from '../styles/App.module.css';

export default function RestockLogPage({ restockLogs }) {
  const [search, setSearch] = useState('');
  const filtered = restockLogs.filter(r =>
    r.product_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.user_nama?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex gap-2 mb-4 items-center">
        <input id="restock-log-search" name="restock-log-search" className={`${styles.inp} max-w-[280px]`}
          placeholder="🔍 Cari produk / user..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <span className="ml-auto text-xs text-gray-400">{filtered.length} entri restock</span>
      </div>
      <div className="table-wrap bg-white dark:bg-[#1a2a1a] rounded-xl border border-bbs-border dark:border-[#2d4a2d] overflow-auto">
        <table className="w-full border-collapse" style={{ minWidth: 650 }}>
          <thead>
            <tr>{["Waktu", "Produk", "Stok Sebelum", "Ditambah", "Stok Sesudah", "Oleh", "Catatan"].map(h => <th key={h} className={styles.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="bg-white dark:bg-[#1a2a1a] hover:bg-green-50 dark:hover:bg-[#1f2d1a] transition-colors">
                <td className={`${styles.td} whitespace-nowrap`}>
                  <div className="text-xs">{new Date(r.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</div>
                  <div className="text-[10px] text-gray-400">{new Date(r.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</div>
                </td>
                <td className={styles.td}><strong>{r.product_name}</strong></td>
                <td className={`${styles.td} text-center text-gray-400`}>{r.qty_before} {r.unit}</td>
                <td className={`${styles.td} text-center`}>
                  <span className="bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full font-extrabold text-xs">+{r.qty_added}</span>
                </td>
                <td className={`${styles.td} text-center`}>
                  <strong className="text-bbs-green">{r.qty_after} {r.unit}</strong>
                </td>
                <td className={styles.td}>
                  <div className="text-xs font-bold">{r.user_nama}</div>
                  <div className="text-[10px] text-gray-400">{r.user_role}</div>
                </td>
                <td className={`${styles.td} text-[11px] text-gray-500`}>{r.catatan || "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className={`${styles.td} text-center text-gray-300 py-8`}>Belum ada riwayat restock</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
