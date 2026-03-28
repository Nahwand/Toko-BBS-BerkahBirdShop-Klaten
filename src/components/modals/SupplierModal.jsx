import React from 'react';
import styles from '../../styles/App.module.css';

export default function SupplierModal({ supModal, supForm, setSupForm, saveSup, onClose }) {
  if (!supModal) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 18, color: "#1a4a1a" }}>
          {supModal === "add" ? "➕ Tambah Supplier" : "✏️ Edit Supplier"}
        </div>
        {[
          { l: "Nama *", k: "name", t: "text", p: "Nama supplier..." },
          { l: "Kontak PIC", k: "contact", t: "text", p: "Nama PIC..." },
          { l: "Telepon *", k: "phone", t: "text", p: "08xx..." },
          { l: "Email", k: "email", t: "email", p: "email@..." },
          { l: "Alamat", k: "address", t: "text", p: "Jl. ..." },
          { l: "Kategori", k: "category", t: "text", p: "Jenis produk..." },
        ].map((f) => (
          <div key={f.k} style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#555", marginBottom: 4 }}>{f.l}</label>
            <input className={styles.inp} type={f.t} placeholder={f.p} value={supForm[f.k]}
              onChange={(e) => setSupForm((s) => ({ ...s, [f.k]: e.target.value }))} />
          </div>
        ))}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#555", marginBottom: 4 }}>Status</label>
          <select className={styles.inp} value={supForm.status} onChange={(e) => setSupForm((s) => ({ ...s, status: e.target.value }))}>
            <option>Aktif</option>
            <option>Tidak Aktif</option>
          </select>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#555", marginBottom: 4 }}>Catatan</label>
          <textarea className={styles.inp} style={{ height: 76, resize: "vertical" }} placeholder="Catatan..."
            value={supForm.notes} onChange={(e) => setSupForm((s) => ({ ...s, notes: e.target.value }))} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className={`${styles.btn} ${styles.btnprimary}`} style={{ flex: 1, padding: 12, fontSize: 14 }} onClick={saveSup}>💾 Simpan</button>
          <button className={styles.btndefault} style={{ flex: 1, padding: 12, fontSize: 14 }} onClick={onClose}>Batal</button>
        </div>
      </div>
    </div>
  );
}
