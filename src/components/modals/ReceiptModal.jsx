import React from 'react';
import styles from '../../styles/App.module.css';
import { fmt, TODAY } from '../../utils/constants';

const row = { display: "flex", justifyContent: "space-between", fontSize: 11, padding: "3px 0" };
const divider = { margin: "8px 0", borderTop: "1px dashed #ccc" };

export default function ReceiptModal({ receipt, customerName, onClose }) {
  if (!receipt) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={{ width: 300 }} onClick={(e) => e.stopPropagation()}>
        <div id="struk-print">
          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#1a4a1a" }}>BerkahBirdShop</div>
            <div style={{ fontSize: 9, color: "#aaa" }}>Klaten, Jawa Tengah</div>
            <div style={divider} />
            <div style={{ fontSize: 9, color: "#666" }}>{receipt.trx_code} · {receipt.date || TODAY}</div>
            <div style={{ fontSize: 10, fontWeight: 700 }}>Pelanggan: {receipt.customer || customerName || "Umum"}</div>
          </div>
          <div style={divider} />
          {(receipt.items || []).map((i, idx) => (
            <div key={idx} style={{ padding: "3px 0", fontSize: 10 }}>
              <div>{i.product_name}</div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#888" }}>{i.qty} {i.unit} × {fmt(i.price)}</span>
                <strong>{fmt(i.price * i.qty)}</strong>
              </div>
            </div>
          ))}
          <div style={divider} />
          <div style={{ ...row, fontWeight: 900, fontSize: 13 }}>
            <span>TOTAL</span>
            <span style={{ color: "#2d7a2d" }}>{fmt(receipt.total)}</span>
          </div>
          <div style={row}><span>Bayar</span><span>{fmt(receipt.payment)}</span></div>
          <div style={row}><span>Kembalian</span><strong>{fmt(receipt.change_amt)}</strong></div>
          <div style={{ textAlign: "center", marginTop: 10, fontSize: 9, color: "#aaa" }}>
            Terima kasih sudah berbelanja!
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
