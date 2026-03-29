import styles from '../styles/App.module.css';
import Badge from '../components/Badge';
import { CATS, fmt } from '../utils/constants';

export default function ProdukPage({
  filtProd, suppliers, searchProd, setSearchProd, filterCat, setFilterCat,
  setProdForm, setProdImage, setProdModal, delProd,
}) {
  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <input id="produk-search" name="produk-search" className={`${styles.inp} max-w-[250px]`}
          placeholder="🔍 Cari produk..." value={searchProd} onChange={(e) => setSearchProd(e.target.value)} />
        <select id="produk-cat" name="produk-cat" className={`${styles.inp} w-[150px]`} value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          {CATS.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button className="ml-auto px-4 py-1.5 rounded-lg text-xs font-bold bg-[#2d7a2d] text-white border-none cursor-pointer"
          onClick={() => { setProdForm({ name: "", category: "Pakan Jadi", unit: "", price: "", stock: "", min_stock: "", supplier_id: "", jenis: "", varian: "" }); setProdImage(null); setProdModal("add"); }}>
          + Tambah Produk
        </button>
      </div>
      <div className="bg-white dark:bg-[#1a2a1a] rounded-xl border border-[#e4ede4] dark:border-[#2d4a2d] overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>{["Foto", "Nama", "Kategori", "Jenis", "Varian", "Satuan", "Harga", "Stok", "Min", "Supplier", "Aksi"].map(h => <th key={h} className={styles.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtProd.map((p) => {
              const s = suppliers.find((s) => s.id === p.supplier_id);
              return (
                <tr key={p.id} className={p.stock <= p.min_stock ? "bg-amber-50 dark:bg-amber-900/10" : ""}>
                  <td className={styles.td}>
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} className="w-11 h-11 object-cover rounded-lg border border-gray-200" />
                      : <div className="w-11 h-11 bg-gray-100 dark:bg-[#243424] rounded-lg flex items-center justify-center text-lg">📦</div>
                    }
                  </td>
                  <td className={styles.td}><strong>{p.name}</strong></td>
                  <td className={styles.td}><Badge cat={p.category} /></td>
                  <td className={styles.td}><span className="text-xs text-gray-500">{p.jenis || "—"}</span></td>
                  <td className={styles.td}><span className="text-xs text-gray-500">{p.varian || "—"}</span></td>
                  <td className={styles.td}>{p.unit}</td>
                  <td className={styles.td}><strong className="text-[#2d7a2d]">{fmt(p.price)}</strong></td>
                  <td className={styles.td}><strong className={`text-base ${p.stock <= p.min_stock ? "text-orange-600" : "text-gray-800 dark:text-gray-200"}`}>{p.stock}</strong></td>
                  <td className={styles.td}>{p.min_stock}</td>
                  <td className={styles.td}><span className="text-[11px] text-gray-500">{s?.name || "—"}</span></td>
                  <td className={styles.td}>
                    <div className="flex gap-1">
                      <button className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[#2d7a2d] text-[#2d7a2d] bg-transparent cursor-pointer"
                        onClick={() => { setProdForm({ name: p.name, category: p.category, unit: p.unit, price: String(p.price), stock: String(p.stock), min_stock: String(p.min_stock), supplier_id: String(p.supplier_id || ""), jenis: p.jenis || "", varian: p.varian || "" }); setProdImage(null); setProdModal(p); }}>Edit</button>
                      <button className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#dc3545] text-white border-none cursor-pointer" onClick={() => delProd(p.id)}>Hapus</button>
                    </div>
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
