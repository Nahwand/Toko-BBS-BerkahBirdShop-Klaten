import { useState } from 'react';
import styles from '../styles/App.module.css';
import Badge from '../components/Badge';
import { fmt, TODAY } from '../utils/constants';

const PER_PAGE = 20;

export default function ProdukPage({
  filtProd, suppliers, searchProd, setSearchProd, filterCat, setFilterCat, kategoris,
  setProdForm, setProdImage, setProdModal, delProd, currentUser,
}) {
  const isPegawai = currentUser?.role === 'pegawai';
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const catList = ["Semua", ...(kategoris || []).map(k => k.nama)];
  const totalPages = Math.ceil(filtProd.length / PER_PAGE);
  const paged = filtProd.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSearch = (v) => { setSearchProd(v); setPage(1); };
  const handleCat = (v) => { setFilterCat(v); setPage(1); };

  const exportProduk = async () => {
    setExporting(true);
    try {
      const XL = await import('xlsx');
      const wb = XL.utils.book_new();
      XL.utils.book_append_sheet(wb, XL.utils.json_to_sheet(
        filtProd.map((p) => {
          const s = suppliers.find(s => s.id === p.supplier_id);
          return { Nama: p.name, Kategori: p.category, Satuan: p.unit, Harga: p.price, Stok: p.stock, Min: p.min_stock, Supplier: s?.name || "-" };
        })
      ), "Produk");
      XL.writeFile(wb, `BBS_produk_${TODAY}.xlsx`);
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };
  return (
    <div>
      <div className="flex gap-2 mb-4 items-center">
        <input id="produk-search" name="produk-search" className={`${styles.inp} max-w-[250px]`}
          placeholder="🔍 Cari produk..." value={searchProd} onChange={(e) => handleSearch(e.target.value)} />
        <select id="produk-cat" name="produk-cat" className={`${styles.inp} w-[150px]`} value={filterCat} onChange={(e) => handleCat(e.target.value)}>
          {catList.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button className="ml-auto px-4 py-1.5 rounded-lg text-xs font-bold bg-[#1565c0] text-white border-none cursor-pointer disabled:opacity-50"
          onClick={exportProduk} disabled={exporting}>
          {exporting ? "⏳..." : "📥 Export Excel"}
        </button>
        {!isPegawai && (
          <button className="px-4 py-1.5 rounded-lg text-xs font-bold bg-bbs-green text-white border-none cursor-pointer"
            onClick={() => { setProdForm({ name: "", category: "Pakan Jadi", unit: "", price: "", stock: "", min_stock: "", supplier_id: "", jenis: "", varian: "" }); setProdImage(null); setProdModal("add"); }}>
            + Tambah Produk
          </button>
        )}
      </div>
      <div className="bg-white rounded-xl border border-bbs-border overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>{["Foto", "Nama", "Kategori", "Jenis", "Varian", "Satuan", "Harga", "Stok", "Min", "Supplier", ...(!isPegawai ? ["Aksi"] : [])].map(h => <th key={h} className={styles.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {paged.map((p) => {
              const s = suppliers.find((s) => s.id === p.supplier_id);
              return (
                <tr key={p.id} className={p.stock <= p.min_stock ? "bg-amber-50" : "bg-white"}>
                  <td className={styles.td}>
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} className="w-11 h-11 object-cover rounded-lg border border-gray-200" />
                      : <div className="w-11 h-11 bg-gray-100 rounded-lg flex items-center justify-center text-lg">📦</div>
                    }
                  </td>
                  <td className={styles.td}><strong>{p.name}</strong></td>
                  <td className={styles.td}><Badge cat={p.category} /></td>
                  <td className={styles.td}><span className="text-xs text-gray-500">{p.jenis || "—"}</span></td>
                  <td className={styles.td}><span className="text-xs text-gray-500">{p.varian || "—"}</span></td>
                  <td className={styles.td}>{p.unit}</td>
                  <td className={styles.td}><strong className="text-bbs-green">{fmt(p.price)}</strong></td>
                  <td className={styles.td}><strong className={`text-base ${p.stock <= p.min_stock ? "text-orange-600" : "text-gray-800"}`}>{p.stock}</strong></td>
                  <td className={styles.td}>{p.min_stock}</td>
                  <td className={styles.td}><span className="text-[11px] text-gray-500">{s?.name || "—"}</span></td>
                  {!isPegawai && (
                    <td className={styles.td}>
                      <div className="flex gap-1">
                        <button className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-bbs-green text-bbs-green bg-transparent cursor-pointer"
                          onClick={() => { setProdForm({ name: p.name, category: p.category, unit: p.unit, price: String(p.price), stock: String(p.stock), min_stock: String(p.min_stock), supplier_id: String(p.supplier_id || ""), jenis: p.jenis || "", varian: p.varian || "" }); setProdImage(null); setProdModal(p); }}>Edit</button>
                        <button className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#dc3545] text-white border-none cursor-pointer" onClick={() => delProd(p.id)}>Hapus</button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
            {paged.length === 0 && (
              <tr><td colSpan={11} className={`${styles.td} text-center text-gray-300 py-8`}>Tidak ada produk</td></tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-bbs-border flex justify-between items-center flex-wrap gap-2">
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
    </div>
  );
}
