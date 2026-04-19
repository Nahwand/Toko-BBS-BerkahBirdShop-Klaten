import { useState } from 'react';
import styles from '../styles/App.module.css';
import Badge from '../components/Badge';
import { TODAY } from '../utils/constants';

const PER_PAGE = 20;

export default function StokPage({
  filtProd, searchProd, setSearchProd, filterCat, setFilterCat, kategoris,
  isSuperAdmin, setRestockModal, setRestockQty,
}) {
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const catList = ["Semua", ...(kategoris || []).map(k => k.nama)];
  const sorted = [...filtProd].sort((a, b) => a.stock / (a.min_stock || 1) - b.stock / (b.min_stock || 1));
  const totalPages = Math.ceil(sorted.length / PER_PAGE);
  const paged = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSearch = (v) => { setSearchProd(v); setPage(1); };
  const handleCat = (v) => { setFilterCat(v); setPage(1); };

  const exportStok = async () => {
    setExporting(true);
    try {
      const XL = await import('xlsx');
      const wb = XL.utils.book_new();
      XL.utils.book_append_sheet(wb, XL.utils.json_to_sheet(
        filtProd.map((p) => ({
          Nama: p.name, Kategori: p.category, Stok: p.stock, Min: p.min_stock,
          Status: p.stock === 0 ? "Habis" : p.stock <= p.min_stock ? "Menipis" : "Aman",
        }))
      ), "Stok");
      XL.writeFile(wb, `BBS_stok_${TODAY}.xlsx`);
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };
  return (
    <div>
      <div className="flex gap-2 mb-4 items-center">
        <input id="stok-search" name="stok-search" className={`${styles.inp} max-w-[250px]`}
          placeholder="🔍 Cari produk..." value={searchProd} onChange={(e) => handleSearch(e.target.value)} />
        <select id="stok-cat" name="stok-cat" className={`${styles.inp} w-[150px]`} value={filterCat} onChange={(e) => handleCat(e.target.value)}>
          {catList.map((c) => <option key={c}>{c}</option>)}
        </select>
        {isSuperAdmin && (
          <button className="ml-auto px-4 py-1.5 rounded-lg text-xs font-bold bg-[#1565c0] text-white border-none cursor-pointer disabled:opacity-50"
            onClick={exportStok} disabled={exporting}>
            {exporting ? "⏳..." : "📥 Export Stok"}
          </button>
        )}
      </div>
      <div className="table-wrap bg-white  rounded-xl border border-bbs-border  overflow-auto">
        <table className="w-full border-collapse" style={{ minWidth: 600 }}>
          <thead>
            <tr>{["Foto", "Nama Produk", "Kategori", "Satuan", "Stok", "Min", "Status", "Aksi"].map(h => <th key={h} className={styles.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {paged.map((p) => {
              const st = p.stock === 0 ? "Habis" : p.stock <= p.min_stock ? "Menipis" : "Aman";
              const rowBg = p.stock === 0 ? "bg-red-50 " : p.stock <= p.min_stock ? "bg-amber-50 " : "bg-white ";
              return (
                <tr key={p.id} className={rowBg}>
                  <td className={styles.td}>
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} className="w-11 h-11 object-cover rounded-lg border border-gray-200" />
                      : <div className="w-11 h-11 bg-gray-100  rounded-lg flex items-center justify-center text-lg">📦</div>
                    }
                  </td>
                  <td className={styles.td}><strong>{p.name}</strong></td>
                  <td className={styles.td}><Badge cat={p.category} /></td>
                  <td className={styles.td}>{p.unit}</td>
                  <td className={styles.td}>
                    <div className="flex items-center gap-2">
                      <strong className="text-base">{p.stock}</strong>
                      <div className="flex-1 h-1.5 bg-gray-200  rounded-full max-w-[80px]">
                        <div className={`h-full rounded-full ${p.stock === 0 ? 'bg-red-500' : p.stock <= p.min_stock ? 'bg-orange-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(100, (p.stock / (p.min_stock * 3)) * 100)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className={styles.td}>{p.min_stock}</td>
                  <td className={styles.td}>
                    <span className={`${styles.stChip} ${styles['stChip' + st]}`}>{st}</span>
                  </td>
                  <td className={styles.td}>
                    <button className="px-3 py-1 text-[11px] font-bold bg-[#f59e0b] text-white rounded-lg border-none cursor-pointer"
                      onClick={() => { setRestockModal(p); setRestockQty(""); }}>
                      + Restock
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-bbs-border flex justify-between items-center flex-wrap gap-2 bg-white rounded-b-xl">
          <span className="text-[13px] text-gray-400">{filtProd.length} produk · halaman {page} dari {totalPages}</span>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPage(1)} disabled={page === 1} className="px-3 py-1 text-xs font-bold rounded-lg bg-[#e8f0e8] text-bbs-green border-none cursor-pointer disabled:opacity-40">«</button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-xs font-bold rounded-lg bg-[#e8f0e8] text-bbs-green border-none cursor-pointer disabled:opacity-40">‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
              .reduce((acc, n, i, arr) => { if (i > 0 && n - arr[i - 1] > 1) acc.push('...'); acc.push(n); return acc; }, [])
              .map((n, i) => n === '...'
                ? <span key={`e${i}`} className="text-xs text-gray-400 px-1">…</span>
                : <button key={n} onClick={() => setPage(n)}
                    className={`px-2.5 py-1 text-xs rounded-lg border cursor-pointer font-bold ${page === n ? 'bg-bbs-green text-white border-bbs-green' : 'bg-white text-gray-700 border-gray-200'}`}>{n}</button>
              )}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 text-xs font-bold rounded-lg bg-[#e8f0e8] text-bbs-green border-none cursor-pointer disabled:opacity-40">›</button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-3 py-1 text-xs font-bold rounded-lg bg-[#e8f0e8] text-bbs-green border-none cursor-pointer disabled:opacity-40">»</button>
          </div>
        </div>
      )}
    </div>
  );
}
