import React from 'react';
import styles from '../../styles/App.module.css';
import { fmt } from '../../utils/constants';

export default function HistReceiptModal({ histReceipt, onClose }) {
  if (!histReceipt) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={{ width: 300 }} onClick={(e) => e.stopPropagation()}>
        <div id="struk-print">
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#1a4a1a" }}>🌿 BerkahBirdShop</div>
            <div style={{ fontSize: 10, color: "#aaa" }}>Klaten, Jawa Tengah</div>
            <div style={{ margin: "10px 0", borderTop: "2px dashed #eee" }} />
            <div style={{ fontSize: 10, color: "#aaa" }}>{histReceipt.trx_code} · {histReceipt.date}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#555" }}>Pelanggan: {histReceipt.customer || "Umum"}</div>
          </div>
          {(histReceipt.items || []).map((i, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "4px 0" }}>
              <span>{i.product_name} ×{i.qty} {i.unit}</span>
              <strong>{fmt(i.price * i.qty)}</strong>
            </div>
          ))}
          <div style={{ margin: "10px 0", borderTop: "2px dashed #eee" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 15 }}>
            <span>TOTAL</span>
            <span style={{ color: "#2d7a2d" }}>{fmt(histReceipt.total)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 5, color: "#666" }}>
            <span>Bayar</span><span>{fmt(histReceipt.payment)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#666" }}>
            <span>Kembalian</span><strong>{fmt(histReceipt.change_amt)}</strong>
          </div>
          <div style={{ textAlign: "center", marginTop: 14, fontSize: 10, color: "#bbb", lineHeight: 1.8 }}>
            Terima kasih sudah berbelanja! 🌿
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className={`${styles.btn} ${styles.btndefault}`} style={{ flex: 1, padding: "11px", borderRadius: 10, fontSize: 14 }} onClick={() => window.print()}>🖨️ Cetak</button>
          <button className={`${styles.btn} ${styles.btnprimary}`} style={{ flex: 1, padding: "11px", borderRadius: 10, fontSize: 14 }} onClick={onClose}>✅ Tutup</button>
        </div>
      </div>
    </div>
  );
}
