import React, { useState } from 'react';
import styles from '../../styles/App.module.css';
import { fmt, TODAY } from '../../utils/constants';

export default function ReceiptModal({ receipt, customerName, onClose }) {
  const [printSize, setPrintSize] = useState('80');
  if (!receipt) return null;

  const handlePrint = () => {
    // Set ukuran kertas sebelum print
    const style = document.createElement('style');
    style.id = 'print-size-override';
    style.innerHTML = `@media print { @page { size: ${printSize}mm auto; margin: 2mm; } }`;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => {
      const el = document.getElementById('print-size-override');
      if (el) el.remove();
    }, 1000);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={{ width: 320 }} onClick={(e) => e.stopPropagation()}>
        <div id="struk-print">
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#1a4a1a" }}>BerkahBirdShop</div>
            <div style={{ fontSize: 9, color: "#aaa" }}>Klaten, Jawa Tengah</div>
            <div style={{ margin: "6px 0", borderTop: "1px dashed #ccc" }} />
            <div style={{ fontSize: 9, color: "#666" }}>{receipt.trx_code} · {receipt.date || TODAY}</div>
            <div style={{ fontSize: 10, fontWeight: 700 }}>Pelanggan: {receipt.customer || customerName || "Umum"}</div>
          </div>
          <div style={{ margin: "6px 0", borderTop: "1px dashed #ccc" }} />
          {(receipt.items || []).map((i, idx) => (
            <div key={idx} style={{ padding: "4px 0", fontSize: 10, borderBottom: "1px dotted #eee" }}>
              <div style={{ fontWeight: 700 }}>{i.product_name}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                <span style={{ color: "#888", fontSize: 9 }}>{i.qty} {i.unit} &times; {fmt(i.price)}</span>
                <strong style={{ whiteSpace: "nowrap", marginLeft: 8 }}>{fmt(i.price * i.qty)}</strong>
              </div>
            </div>
          ))}
          <div style={{ margin: "6px 0", borderTop: "1px dashed #ccc" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 13, padding: "3px 0" }}>
            <span>TOTAL</span>
            <span style={{ color: "#2d7a2d", whiteSpace: "nowrap" }}>{fmt(receipt.total)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, padding: "2px 0" }}>
            <span>Bayar</span><span style={{ whiteSpace: "nowrap" }}>{fmt(receipt.payment)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, padding: "2px 0" }}>
            <span>Kembalian</span><strong style={{ whiteSpace: "nowrap" }}>{fmt(receipt.change_amt)}</strong>
          </div>
          <div style={{ textAlign: "center", marginTop: 8, fontSize: 9, color: "#aaa" }}>
            Terima kasih sudah berbelanja!
          </div>
        </div>

        {/* Pilih ukuran kertas */}
        <div style={{ margin: "12px 0 8px", display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#555", fontWeight: 700 }}>Ukuran kertas:</span>
          {['58', '80'].map(size => (
            <button key={size} onClick={() => setPrintSize(size)}
              style={{ padding: "5px 14px", borderRadius: 8, border: `2px solid ${printSize === size ? '#2d7a2d' : '#ddd'}`, background: printSize === size ? '#e8f5e9' : '#fff', color: printSize === size ? '#1a4a1a' : '#666', fontWeight: printSize === size ? 800 : 500, fontSize: 12, cursor: "pointer" }}>
              {size}mm
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className={`${styles.btn} ${styles.btndefault}`} style={{ flex: 1, padding: "11px", borderRadius: 10, fontSize: 14 }} onClick={handlePrint}>🖨️ Cetak</button>
          <button className={`${styles.btn} ${styles.btnprimary}`} style={{ flex: 1, padding: "11px", borderRadius: 10, fontSize: 14 }} onClick={onClose}>✅ Tutup</button>
        </div>
      </div>
    </div>
  );
}
