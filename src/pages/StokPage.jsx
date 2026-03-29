import React from 'react';
import styles from '../styles/App.module.css';
import Badge from '../components/Badge';
import { CATS } from '../utils/constants';

export default function StokPage({
  filtProd, searchProd, setSearchProd, filterCat, setFilterCat,
  isSuperAdmin, exportExcel, setRestockModal, setRestockQty,
}) {
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
        <input id="stok-search" name="stok-search" className={styles.inp} style={{ maxWidth: 250 }} placeholder="🔍 Cari produk..."
          value={searchProd} onChange={(e) => setSearchProd(e.target.value)} />
        <select id="stok-filter-cat" name="stok-filter-cat" className={styles.inp} style={{ width: 150 }} value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          {CATS.map((c) => <option key={c}>{c}</option>)}
        </select>
        {isSuperAdmin && (
          <button className={`${styles.btn} ${styles.btnblue}`} style={{ marginLeft: "auto" }} onClick={() => exportExcel("stok")}>
            📥 Export Stok
          </button>
        )}
      </div>
      <div className="table-wrap" style={{ background: "#fff", borderRadius: 12, border: "1px solid #e4ede4", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
          <thead>
            <tr>
              {["Foto", "Nama Produk", "Kategori", "Satuan", "Stok", "Min", "Status", "Aksi"].map((h) => (
                <th key={h} className={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...filtProd].sort((a, b) => a.stock / a.min_stock - b.stock / b.min_stock).map((p) => {
              const st = p.stock === 0 ? "Habis" : p.stock <= p.min_stock ? "Menipis" : "Aman";
              return (
                <tr key={p.id} style={{ background: p.stock === 0 ? "#fff5f5" : p.stock <= p.min_stock ? "#fffaf0" : "#fff" }}>
                  <td className={styles.td}>
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8, border: "1px solid #ddd" }} />
                      : <div style={{ width: 44, height: 44, background: "#f0f0f0", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📦</div>
                    }
                  </td>
                  <td className={styles.td}><strong>{p.name}</strong></td>
                  <td className={styles.td}><Badge cat={p.category} /></td>
                  <td className={styles.td}>{p.unit}</td>
                  <td className={styles.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <strong style={{ fontSize: 16 }}>{p.stock}</strong>
                      <div style={{ flex: 1, height: 6, background: "#eee", borderRadius: 3, maxWidth: 80 }}>
                        <div style={{ height: "100%", borderRadius: 3, width: `${Math.min(100, (p.stock / (p.min_stock * 3)) * 100)}%`, background: p.stock === 0 ? "#dc2626" : p.stock <= p.min_stock ? "#ea580c" : "#16a34a" }} />
                      </div>
                    </div>
                  </td>
                  <td className={styles.td}>{p.min_stock}</td>
                  <td className={styles.td}>
                    <span className={`${styles.stChip} ${styles['stChip' + st]}`}>{st}</span>
                  </td>
                  <td className={styles.td}>
                    <button className={`${styles.btn} ${styles.btnwarning}`} style={{ padding: "5px 12px", fontSize: 11 }}
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
