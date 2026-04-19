import { useState } from 'react';
import styles from '../styles/App.module.css';
import { fmt, TODAY } from '../utils/constants';

export default function RiwayatPage({
  filtHist, histSearch, setHistSearch, filterDate, setFilterDate,
  filterDateEnd, setFilterDateEnd,
  setHistReceipt, totalCount, page, setPage, totalPages,
}) {
  const [exporting, setExporting] = useState(false);

  const exportTransaksi = async () => {
    setExporting(true);
    try {
      const XL = await import('xlsx');
      const wb = XL.utils.book_new();
      XL.utils.book_append_sheet(wb, XL.utils.json_to_sheet(
        filtHist.map((t) => ({
          ID: t.trx_code, Tanggal: t.date, Pelanggan: t.customer,
          Item: (t.items || []).map((i) => `${i.product_name}(${i.qty})`).join("; "),
          Total: t.total, Pembayaran: t.payment, Kembalian: t.change_amt,
        }))
      ), "Transaksi");
      XL.writeFile(wb, `BBS_transaksi_${TODAY}.xlsx`);
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  const pageNums = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
    .reduce((acc, n, i, arr) => { if (i > 0 && n - arr[i - 1] > 1) acc.push('...'); acc.push(n); return acc; }, []);

  const hasFilter = filterDate || filterDateEnd || histSearch;

  return (
    <div>
      <div className="flex gap-2 mb-4 items-center flex-wrap">
        <input id="riwayat-search" name="riwayat-search" className={`${styles.inp} max-w-[230px]`}
          placeholder="🔍 ID / pelanggan..." value={histSearch} onChange={(e) => setHistSearch(e.target.value)} />
        {/* Filter range tanggal */}
        <div className="flex items-center gap-1.5">
          <input id="riwayat-date-start" name="riwayat-date-start" className={`${styles.inp} w-[145px]`} type="date"
            value={filterDate} onChange={(e) => setFilterDate(e.target.value)} title="Dari tanggal" />
          <span className="text-xs text-gray-400">s/d</span>
          <input id="riwayat-date-end" name="riwayat-date-end" className={`${styles.inp} w-[145px]`} type="date"
            value={filterDateEnd} onChange={(e) => setFilterDateEnd(e.target.value)} title="Sampai tanggal" />
        </div>
        {hasFilter && (
          <button className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#e8f0e8] text-bbs-green border-none cursor-pointer"
            onClick={() => { setFilterDate(""); setFilterDateEnd(""); setHistSearch(""); }}>
            ✕ Reset Filter
          </button>
        )}
        <button className="ml-auto px-4 py-1.5 rounded-lg text-xs font-bold bg-[#1565c0] text-white border-none cursor-pointer disabled:opacity-50"
          onClick={exportTransaksi} disabled={exporting}>
          {exporting ? "⏳..." : "📥 Export Excel"}
        </button>
      </div>

      <div className="table-wrap bg-white rounded-xl border border-bbs-border overflow-auto">
        <table className="w-full border-collapse" style={{ minWidth: 650 }}>
          <thead>
            <tr>{["ID", "Tanggal", "Pelanggan", "Item", "Total", "Bayar", "Kembalian"].map(h => <th key={h} className={styles.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtHist.map((t) => (
              <tr key={t.id} onClick={() => setHistReceipt(t)}
                className="cursor-pointer bg-white hover:bg-green-50 transition-colors">
                <td className={styles.td}><strong className="text-bbs-green">{t.trx_code}</strong></td>
                <td className={styles.td}>{t.date}</td>
                <td className={styles.td}>{t.customer}</td>
                <td className={styles.td}>{(t.items || []).map((i, idx) => <div key={idx} className="text-[10px] text-gray-500">{i.product_name} ×{i.qty}</div>)}</td>
                <td className={styles.td}><strong className="text-bbs-green">{fmt(t.total)}</strong></td>
                <td className={styles.td}>{fmt(t.payment)}</td>
                <td className={styles.td}>{fmt(t.change_amt)}</td>
              </tr>
            ))}
            {filtHist.length === 0 && (
              <tr><td colSpan={7} className={`${styles.td} text-center text-gray-300 py-8`}>Tidak ada transaksi</td></tr>
            )}
          </tbody>
        </table>

        <div className="px-4 py-3 border-t border-bbs-border flex justify-between items-center flex-wrap gap-2">
          <span className="text-[13px] text-gray-400">{totalCount} transaksi · halaman {page} dari {totalPages || 1}</span>
          <div className="flex items-center gap-1.5">
            {[{ label: '«', action: () => setPage(1), disabled: page === 1 },
              { label: '‹', action: () => setPage(p => Math.max(1, p - 1)), disabled: page === 1 }].map((b, i) => (
              <button key={i} onClick={b.action} disabled={b.disabled}
                className="px-3 py-1 text-xs font-bold rounded-lg bg-[#e8f0e8] text-bbs-green border-none cursor-pointer disabled:opacity-40">
                {b.label}
              </button>
            ))}
            {pageNums.map((n, i) => n === '...'
              ? <span key={`e${i}`} className="text-xs text-gray-400 px-1">…</span>
              : <button key={n} onClick={() => setPage(n)}
                  className={`px-2.5 py-1 text-xs rounded-lg border cursor-pointer font-bold ${page === n ? 'bg-bbs-green text-white border-bbs-green' : 'bg-white text-gray-700 border-gray-200'}`}>
                  {n}
                </button>
            )}
            {[{ label: '›', action: () => setPage(p => Math.min(totalPages, p + 1)), disabled: page === totalPages || totalPages === 0 },
              { label: '»', action: () => setPage(totalPages), disabled: page === totalPages || totalPages === 0 }].map((b, i) => (
              <button key={i} onClick={b.action} disabled={b.disabled}
                className="px-3 py-1 text-xs font-bold rounded-lg bg-[#e8f0e8] text-bbs-green border-none cursor-pointer disabled:opacity-40">
                {b.label}
              </button>
            ))}
          </div>
          <strong className="text-[13px] text-bbs-green">Total: {fmt(filtHist.reduce((s, t) => s + t.total, 0))}</strong>
        </div>
      </div>
    </div>
  );
}
