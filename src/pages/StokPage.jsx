import styles from '../styles/App.module.css';
import Badge from '../components/Badge';
import { CATS } from '../utils/constants';

export default function StokPage({
  filtProd, searchProd, setSearchProd, filterCat, setFilterCat,
  isSuperAdmin, exportExcel, setRestockModal, setRestockQty,
}) {
  return (
    <div>
      <div className="flex gap-2 mb-4 items-center">
        <input id="stok-search" name="stok-search" className={`${styles.inp} max-w-[250px]`}
          placeholder="🔍 Cari produk..." value={searchProd} onChange={(e) => setSearchProd(e.target.value)} />
        <select id="stok-cat" name="stok-cat" className={`${styles.inp} w-[150px]`} value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          {CATS.map((c) => <option key={c}>{c}</option>)}
        </select>
        {isSuperAdmin && (
          <button className="ml-auto px-4 py-1.5 rounded-lg text-xs font-bold bg-[#1565c0] text-white border-none cursor-pointer" onClick={() => exportExcel("stok")}>
            📥 Export Stok
          </button>
        )}
      </div>
      <div className="table-wrap bg-white dark:bg-[#1a2a1a] rounded-xl border border-[#e4ede4] dark:border-[#2d4a2d] overflow-auto">
        <table className="w-full border-collapse" style={{ minWidth: 600 }}>
          <thead>
            <tr>{["Foto", "Nama Produk", "Kategori", "Satuan", "Stok", "Min", "Status", "Aksi"].map(h => <th key={h} className={styles.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {[...filtProd].sort((a, b) => a.stock / a.min_stock - b.stock / b.min_stock).map((p) => {
              const st = p.stock === 0 ? "Habis" : p.stock <= p.min_stock ? "Menipis" : "Aman";
              const rowBg = p.stock === 0 ? "bg-red-50 dark:bg-red-900/10" : p.stock <= p.min_stock ? "bg-amber-50 dark:bg-amber-900/10" : "";
              return (
                <tr key={p.id} className={rowBg}>
                  <td className={styles.td}>
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} className="w-11 h-11 object-cover rounded-lg border border-gray-200" />
                      : <div className="w-11 h-11 bg-gray-100 dark:bg-[#243424] rounded-lg flex items-center justify-center text-lg">📦</div>
                    }
                  </td>
                  <td className={styles.td}><strong>{p.name}</strong></td>
                  <td className={styles.td}><Badge cat={p.category} /></td>
                  <td className={styles.td}>{p.unit}</td>
                  <td className={styles.td}>
                    <div className="flex items-center gap-2">
                      <strong className="text-base">{p.stock}</strong>
                      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-[#243424] rounded-full max-w-[80px]">
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
    </div>
  );
}
