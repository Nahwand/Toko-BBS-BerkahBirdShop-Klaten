import React, { useState } from 'react';
import styles from '../../styles/App.module.css';
import { fmt } from '../../utils/constants';

export default function HistReceiptModal({ histReceipt, onClose }) {
  const [printSize, setPrintSize] = useState('80');
  if (!histReceipt) return null;

  const handlePrint = () => {
    const style = document.createElement('style');
    style.id = 'print-size-override';
    style.innerHTML = `@media print { @page { size: ${printSize}mm auto; margin: 2mm; } #struk-print { width: ${parseInt(printSize) - 4}mm !important; } }`;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => { document.getElementById('print-size-override')?.remove(); }, 1000);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={{ width: 320 }} onClick={(e) => e.stopPropagation()}>
        <div id="struk-print">

          {/* HEADER — center semua */}
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#2d7a2d", letterSpacing: 1 }}>🌿 BBS</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#1a4a1a" }}>BerkahBirdShop</div>
            <div style={{ fontSize: 9, color: "#aaa" }}>Klaten, Jawa Tengah</div>
            <div style={{ margin: "6px 0", borderTop: "1px dashed #ccc" }} />
            <div style={{ fontSize: 9, color: "#666" }}>{histReceipt.trx_code} &middot; {histReceipt.date}</div>
            <div style={{ fontSize: 10, fontWeight: 700 }}>Pelanggan: {histReceipt.customer || "Umum"}</div>
          </div>

          <div style={{ margin: "6px 0", borderTop: "1px dashed #ccc" }} />

          {/* ITEM LIST */}
          {(histReceipt.items || []).map((i, idx) => (
            <div key={idx} style={{ padding: "4px 0", fontSize: 10, borderBottom: "1px dotted #eee" }}>
              <div style={{ fontWeight: 700 }}>{i.product_name}</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                <span style={{ color: "#888", fontSize: 9 }}>{i.qty} {i.unit} &times; {fmt(i.price)}</span>
                <span style={{ fontWeight: 700 }}>{fmt(i.price * i.qty)}</span>
              </div>
            </div>
          ))}

          <div style={{ margin: "6px 0", borderTop: "1px dashed #ccc" }} />

          {/* TOTAL, BAYAR, KEMBALIAN */}
          <table style={{ width: "100%", fontSize: 10, borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ fontWeight: 900, fontSize: 13, paddingBottom: 3 }}>TOTAL</td>
                <td style={{ fontWeight: 900, fontSize: 13, textAlign: "right", color: "#2d7a2d", paddingBottom: 3 }}>{fmt(histReceipt.total)}</td>
              </tr>
              <tr>
                <td style={{ color: "#555" }}>Bayar</td>
                <td style={{ textAlign: "right", color: "#555" }}>{fmt(histReceipt.payment)}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Kembalian</td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>{fmt(histReceipt.change_amt)}</td>
              </tr>
            </tbody>
          </table>

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
          <button style={{ flex: 1, padding: "11px", borderRadius: 10, fontSize: 14, border: "none", background: "#f0f5f0", color: "#2d7a2d", fontWeight: 700, cursor: "pointer" }} onClick={handlePrint}>🖨️ Cetak</button>
          <button className={`${styles.btn} ${styles.btnprimary}`} style={{ flex: 1, padding: "11px", borderRadius: 10, fontSize: 14 }} onClick={onClose}>✅ Tutup</button>
        </div>
      </div>
    </div>
  );
}
