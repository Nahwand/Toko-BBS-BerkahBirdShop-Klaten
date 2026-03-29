import styles from '../styles/App.module.css';
import { fmt } from '../utils/constants';

export default function RiwayatPage({
  filtHist, histSearch, setHistSearch, filterDate, setFilterDate,
  exportExcel, setHistReceipt, totalCount, page, setPage, totalPages,
}) {
  const pageNums = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
    .reduce((acc, n, i, arr) => { if (i > 0 && n - arr[i - 1] > 1) acc.push('...'); acc.push(n); return acc; }, []);

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <input id="riwayat-search" name="riwayat-search" className={`${styles.inp} max-w-[230px]`}
          placeholder="🔍 ID / pelanggan..." value={histSearch} onChange={(e) => setHistSearch(e.target.value)} />
        <input id="riwayat-date" name="riwayat-date" className={`${styles.inp} w-[150px]`} type="date"
          value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
        {filterDate && (
          <button className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#e8f0e8] text-[#2d7a2d] border-none cursor-pointer" onClick={() => setFilterDate("")}>✕ Reset</button>
        )}
        <button className="ml-auto px-4 py-1.5 rounded-lg text-xs font-bold bg-[#1565c0] text-white border-none cursor-pointer" onClick={() => exportExcel("transaksi")}>
          📥 Export Excel
        </button>
      </div>

      <div className="table-wrap bg-white dark:bg-[#1a2a1a] rounded-xl border border-[#e4ede4] dark:border-[#2d4a2d] overflow-auto">
        <table className="w-full border-collapse" style={{ minWidth: 650 }}>
          <thead>
            <tr>{["ID", "Tanggal", "Pelanggan", "Item", "Total", "Bayar", "Kembalian"].map(h => <th key={h} className={styles.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtHist.map((t) => (
              <tr key={t.id} onClick={() => setHistReceipt(t)}
                className="cursor-pointer hover:bg-green-50 dark:hover:bg-[#1f2d1a] transition-colors">
                <td className={styles.td}><strong className="text-[#2d7a2d]">{t.trx_code}</strong></td>
                <td className={styles.td}>{t.date}</td>
                <td className={styles.td}>{t.customer}</td>
                <td className={styles.td}>{(t.items || []).map((i, idx) => <div key={idx} className="text-[10px] text-gray-500">{i.product_name} ×{i.qty}</div>)}</td>
                <td className={styles.td}><strong className="text-[#2d7a2d]">{fmt(t.total)}</strong></td>
                <td className={styles.td}>{fmt(t.payment)}</td>
                <td className={styles.td}>{fmt(t.change_amt)}</td>
              </tr>
            ))}
            {filtHist.length === 0 && (
              <tr><td colSpan={7} className={`${styles.td} text-center text-gray-300 py-8`}>Tidak ada transaksi</td></tr>
            )}
          </tbody>
        </table>

        <div className="px-4 py-3 border-t border-[#e4ede4] dark:border-[#2d4a2d] flex justify-between items-center flex-wrap gap-2">
          <span className="text-[13px] text-gray-400">{totalCount} transaksi · halaman {page} dari {totalPages || 1}</span>
          <div className="flex items-center gap-1.5">
            {[{ label: '«', action: () => setPage(1), disabled: page === 1 },
              { label: '‹', action: () => setPage(p => Math.max(1, p - 1)), disabled: page === 1 }].map((b, i) => (
              <button key={i} onClick={b.action} disabled={b.disabled}
                className="px-3 py-1 text-xs font-bold rounded-lg bg-[#e8f0e8] dark:bg-[#2d4a2d] text-[#2d7a2d] dark:text-[#a8e063] border-none cursor-pointer disabled:opacity-40">
                {b.label}
              </button>
            ))}
            {pageNums.map((n, i) => n === '...'
              ? <span key={`e${i}`} className="text-xs text-gray-400 px-1">…</span>
              : <button key={n} onClick={() => setPage(n)}
                  className={`px-2.5 py-1 text-xs rounded-lg border cursor-pointer font-bold ${page === n ? 'bg-[#2d7a2d] text-white border-[#2d7a2d]' : 'bg-white dark:bg-[#1e2e1e] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#3a5a3a]'}`}>
                  {n}
                </button>
            )}
            {[{ label: '›', action: () => setPage(p => Math.min(totalPages, p + 1)), disabled: page === totalPages || totalPages === 0 },
              { label: '»', action: () => setPage(totalPages), disabled: page === totalPages || totalPages === 0 }].map((b, i) => (
              <button key={i} onClick={b.action} disabled={b.disabled}
                className="px-3 py-1 text-xs font-bold rounded-lg bg-[#e8f0e8] dark:bg-[#2d4a2d] text-[#2d7a2d] dark:text-[#a8e063] border-none cursor-pointer disabled:opacity-40">
                {b.label}
              </button>
            ))}
          </div>
          <strong className="text-[13px] text-[#2d7a2d]">Total: {fmt(filtHist.reduce((s, t) => s + t.total, 0))}</strong>
        </div>
      </div>
    </div>
  );
}
