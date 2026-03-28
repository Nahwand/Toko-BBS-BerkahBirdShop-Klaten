import React from 'react';
import styles from '../styles/App.module.css';

export default function SupplierPage({
  suppliers, products, exportExcel,
  setSupForm, setSupModal, delSup,
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <span style={{ fontSize: 13, color: "#666" }}>{suppliers.length} supplier</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button className={`${styles.btn} ${styles.btnblue}`} onClick={() => exportExcel("supplier")}>📥 Export</button>
          <button className={`${styles.btn} ${styles.btnprimary}`}
            onClick={() => {
              setSupForm({ name: "", contact: "", phone: "", email: "", address: "", category: "", status: "Aktif", notes: "" });
              setSupModal("add");
            }}>
            + Tambah
          </button>
        </div>
      </div>
      <div className="sup-grid">
        {suppliers.map((s) => {
          const spProds = products.filter((p) => p.supplier_id === s.id);
          return (
            <div key={s.id} className={styles.card} style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#1a4a1a" }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>👤 {s.contact}</div>
                </div>
                <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800, background: s.status === "Aktif" ? "#e8f5e9" : "#fee2e2", color: s.status === "Aktif" ? "#2e7d32" : "#dc2626", flexShrink: 0 }}>
                  {s.status}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#555", marginBottom: 3 }}>📞 {s.phone}</div>
              {s.email && <div style={{ fontSize: 12, color: "#555", marginBottom: 3 }}>✉️ {s.email}</div>}
              <div style={{ fontSize: 12, color: "#555", marginBottom: 6 }}>📍 {s.address}</div>
              {spProds.length > 0 && <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>📦 {spProds.map((p) => p.name).join(", ")}</div>}
              {s.notes && <div style={{ fontSize: 11, color: "#aaa", fontStyle: "italic", marginBottom: 10 }}>💬 {s.notes}</div>}
              <div style={{ display: "flex", gap: 6, borderTop: "1px solid #f0f5f0", paddingTop: 10 }}>
                <button className={`${styles.btn} ${styles.btnoutline}`} style={{ flex: 1, padding: "5px 0", fontSize: 11 }}
                  onClick={() => {
                    setSupForm({ name: s.name, contact: s.contact, phone: s.phone, email: s.email, address: s.address, category: s.category, status: s.status, notes: s.notes });
                    setSupModal(s);
                  }}>✏️ Edit</button>
                <button className={`${styles.btn} ${styles.btndanger}`} style={{ flex: 1, padding: "5px 0", fontSize: 11 }} onClick={() => delSup(s.id)}>🗑 Hapus</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
