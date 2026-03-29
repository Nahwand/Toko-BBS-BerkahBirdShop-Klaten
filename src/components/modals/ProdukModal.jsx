import React from 'react';
import styles from '../../styles/App.module.css';

export default function ProdukModal({ prodModal, prodForm, setProdForm, prodImage, setProdImage, kategoris, satuans, suppliers, saveProd, onClose }) {
  if (!prodModal) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 18, color: "#1a4a1a" }}>
          {prodModal === "add" ? "➕ Tambah Produk" : "✏️ Edit Produk"}
        </div>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="produk-foto" style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#555", marginBottom: 4 }}>Foto Produk (Opsional)</label>
          <input id="produk-foto" name="produk-foto" type="file" accept="image/*" onChange={(e) => setProdImage(e.target.files[0])} className={styles.inp} style={{ padding: "8px", width: "100%" }} />
          {prodModal !== "add" && prodModal?.image_url && !prodImage && (
            <div style={{ marginTop: 8 }}>
              <img src={prodModal.image_url} alt="Current" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, border: "2px solid #e4ede4" }} />
              <div style={{ fontSize: 10, color: "#888", marginTop: 4 }}>Foto saat ini, biarkan kosong untuk tidak mengubah.</div>
            </div>
          )}
        </div>
        {[
          { l: "Nama *", k: "name", t: "text", p: "Nama produk..." },
          { l: "Harga *", k: "price", t: "number", p: "Harga..." },
          { l: "Stok *", k: "stock", t: "number", p: "Stok..." },
          { l: "Min Stok", k: "min_stock", t: "number", p: "Min stok..." },
        ].map((f) => (
          <div key={f.k} style={{ marginBottom: 12 }}>
            <label htmlFor={`produk-${f.k}`} style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#555", marginBottom: 4 }}>{f.l}</label>
            <input id={`produk-${f.k}`} name={`produk-${f.k}`} className={styles.inp} type={f.t} placeholder={f.p} value={prodForm[f.k]}
              onChange={(e) => setProdForm((p) => ({ ...p, [f.k]: e.target.value }))} />
          </div>
        ))}
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="produk-category" style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#555", marginBottom: 4 }}>Kategori</label>
          <select id="produk-category" name="produk-category" className={styles.inp} value={prodForm.category} onChange={(e) => setProdForm((p) => ({ ...p, category: e.target.value }))}>
            {kategoris.map((k) => <option key={k.id} value={k.nama}>{k.nama}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="produk-jenis" style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#555", marginBottom: 4 }}>Jenis</label>
          <input id="produk-jenis" name="produk-jenis" className={styles.inp} type="text" placeholder="Kitten / Adult / Semua Umur..." value={prodForm.jenis || ""}
            onChange={(e) => setProdForm((p) => ({ ...p, jenis: e.target.value }))} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="produk-varian" style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#555", marginBottom: 4 }}>Varian/Rasa</label>
          <input id="produk-varian" name="produk-varian" className={styles.inp} type="text" placeholder="Tuna, Salmon, Sarden..." value={prodForm.varian || ""}
            onChange={(e) => setProdForm((p) => ({ ...p, varian: e.target.value }))} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#555", marginBottom: 4 }}>Satuan</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {satuans.map((s) => {
              // Normalisasi lowercase agar "kg" == "Kg" == "KG"
              const currentUnits = prodForm.unit
                ? prodForm.unit.split(", ").filter(Boolean).map(u => u.toLowerCase())
                : [];
              const isSelected = currentUnits.includes(s.nama.toLowerCase());
              return (
                <div key={s.id} onClick={() => {
                  // Ambil unit yang ada, normalisasi, toggle
                  let current = prodForm.unit ? prodForm.unit.split(", ").filter(Boolean) : [];
                  if (isSelected) {
                    // Hapus semua varian case dari satuan ini
                    current = current.filter((u) => u.toLowerCase() !== s.nama.toLowerCase());
                  } else {
                    current.push(s.nama);
                  }
                  setProdForm((p) => ({ ...p, unit: current.join(", ") }));
                }} style={{ padding: "6px 12px", border: "1px solid " + (isSelected ? "#2d7a2d" : "#ddd"), borderRadius: 6, background: isSelected ? "#e4ede4" : "#fff", color: isSelected ? "#1a4a1a" : "#666", fontSize: 13, cursor: "pointer", fontWeight: isSelected ? 700 : 500, userSelect: "none", transition: "all 0.15s ease" }}>
                  {s.nama}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label htmlFor="produk-supplier" style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#555", marginBottom: 4 }}>Supplier</label>
          <select id="produk-supplier" name="produk-supplier" className={styles.inp} value={prodForm.supplier_id} onChange={(e) => setProdForm((p) => ({ ...p, supplier_id: e.target.value }))}>
            <option value="">— Pilih Supplier —</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className={`${styles.btn} ${styles.btnprimary}`} style={{ flex: 1, padding: 12, fontSize: 14 }} onClick={saveProd}>💾 Simpan</button>
          <button style={{ flex: 1, padding: 12, fontSize: 14, borderRadius: 10, border: "none", background: "#f0f5f0", color: "#2d7a2d", fontWeight: 700, cursor: "pointer" }} onClick={onClose}>Batal</button>
        </div>
      </div>
    </div>
  );
}
