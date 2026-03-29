import React from 'react';
import styles from '../../styles/App.module.css';

export default function RestockModal({ restockModal, restockQty, setRestockQty, restockCatatan, setRestockCatatan, doRestock, onClose }) {
  if (!restockModal) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={{ width: 330 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4, color: "#1a4a1a" }}>📦 Restock Produk</div>
        <div style={{ fontSize: 13, color: "#666", marginBottom: 14, fontWeight: 600 }}>{restockModal.name}</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 14, padding: "12px", background: "#f4f7f2", borderRadius: 10 }}>
          <span>Stok saat ini</span>
          <strong>{restockModal.stock} {restockModal.unit}</strong>
        </div>
        <label htmlFor="restock-qty" style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#555", marginBottom: 5 }}>
          Tambah Stok ({restockModal.unit})
        </label>
        <input id="restock-qty" name="restock-qty" className={styles.inp} style={{ marginBottom: 12, fontSize: 16, fontWeight: 700 }}
          type="number" placeholder="Jumlah tambahan..." value={restockQty}
          onChange={(e) => setRestockQty(e.target.value)} autoFocus />
        {restockQty && parseInt(restockQty) > 0 && (
          <div style={{ marginBottom: 12, fontSize: 13, color: "#2d7a2d", fontWeight: 800, padding: "10px 12px", background: "#f0fdf4", borderRadius: 10 }}>
            ✅ Setelah restock: <strong>{restockModal.stock + parseInt(restockQty)} {restockModal.unit}</strong>
          </div>
        )}
        <label htmlFor="restock-catatan" style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#555", marginBottom: 5 }}>Catatan (opsional)</label>
        <input id="restock-catatan" name="restock-catatan" className={styles.inp} style={{ marginBottom: 16 }} placeholder="Misal: dari supplier X, tanggal kirim..."
          value={restockCatatan} onChange={(e) => setRestockCatatan(e.target.value)} />
        <div style={{ display: "flex", gap: 10 }}>
          <button className={`${styles.btn} ${styles.btnprimary}`} style={{ flex: 1, padding: 12, fontSize: 14 }} onClick={doRestock}>✅ Konfirmasi</button>
          <button style={{ flex: 1, padding: 12, fontSize: 14, borderRadius: 10, border: "none", background: "#f0f5f0", color: "#2d7a2d", fontWeight: 700, cursor: "pointer" }} onClick={onClose}>Batal</button>
        </div>
      </div>
    </div>
  );
}
