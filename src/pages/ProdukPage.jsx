import React from 'react';
import styles from '../styles/App.module.css';
import Badge from '../components/Badge';
import { CATS, fmt } from '../utils/constants';

export default function ProdukPage({
  filtProd, suppliers, searchProd, setSearchProd, filterCat, setFilterCat,
  setProdForm, setProdImage, setProdModal, delProd,
}) {
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input id="produk-search" name="produk-search" className={styles.inp} style={{ maxWidth: 250 }} placeholder="🔍 Cari produk..."
          value={searchProd} onChange={(e) => setSearchProd(e.target.value)} />
        <select id="produk-filter-cat" name="produk-filter-cat" className={styles.inp} style={{ width: 150 }} value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          {CATS.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button className={`${styles.btn} ${styles.btnprimary}`} style={{ marginLeft: "auto" }}
          onClick={() => {
            setProdForm({ name: "", category: "Pakan Jadi", unit: "", price: "", stock: "", min_stock: "", supplier_id: "", jenis: "", varian: "" });
            setProdImage(null);
            setProdModal("add");
          }}>
          + Tambah Produk
        </button>
      </div>
      <div className={styles.card} style={{ padding: 0, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Foto", "Nama", "Kategori", "Jenis", "Varian", "Satuan", "Harga", "Stok", "Min", "Supplier", "Aksi"].map((h) => (
                <th key={h} className={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtProd.map((p) => {
              const s = suppliers.find((s) => s.id === p.supplier_id);
              return (
                <tr key={p.id} style={{ background: p.stock <= p.min_stock ? "#fffaf0" : "#fff" }}>
                  <td className={styles.td}>
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8, border: "1px solid #ddd" }} />
                      : <div style={{ width: 44, height: 44, background: "#f0f0f0", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📦</div>
                    }
                  </td>
                  <td className={styles.td}><strong>{p.name}</strong></td>
                  <td className={styles.td}><Badge cat={p.category} /></td>
                  <td className={styles.td}><span style={{ fontSize: 12, color: "#555" }}>{p.jenis || "—"}</span></td>
                  <td className={styles.td}><span style={{ fontSize: 12, color: "#555" }}>{p.varian || "—"}</span></td>
                  <td className={styles.td}>{p.unit}</td>
                  <td className={styles.td}><strong style={{ color: "#2d7a2d" }}>{fmt(p.price)}</strong></td>
                  <td className={styles.td}><strong style={{ color: p.stock <= p.min_stock ? "#e65100" : "#333", fontSize: 15 }}>{p.stock}</strong></td>
                  <td className={styles.td}>{p.min_stock}</td>
                  <td className={styles.td}><span style={{ fontSize: 11, color: "#666" }}>{s?.name || "—"}</span></td>
                  <td className={styles.td}>
                    <div style={{ display: "flex", gap: 5 }}>
                      <button className={`${styles.btn} ${styles.btnoutline}`} style={{ padding: "4px 10px", fontSize: 11 }}
                        onClick={() => {
                          setProdForm({ name: p.name, category: p.category, unit: p.unit, price: String(p.price), stock: String(p.stock), min_stock: String(p.min_stock), supplier_id: String(p.supplier_id || ""), jenis: p.jenis || "", varian: p.varian || "" });
                          setProdImage(null);
                          setProdModal(p);
                        }}>Edit</button>
                      <button className={`${styles.btn} ${styles.btndanger}`} style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => delProd(p.id)}>Hapus</button>
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
