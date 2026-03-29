import { useState } from 'react';
import { fmt, TODAY } from '../../utils/constants';

const StrukContent = ({ data, customerName }) => (
  <div id="struk-print">
    <div style={{ textAlign: "center", marginBottom: 8 }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: "#2d7a2d", letterSpacing: 1 }}>🌿 BBS</div>
      <div style={{ fontSize: 15, fontWeight: 900, color: "#1a4a1a" }}>BerkahBirdShop</div>
      <div style={{ fontSize: 9, color: "#aaa" }}>Klaten, Jawa Tengah</div>
      <div style={{ margin: "6px 0", borderTop: "1px dashed #ccc" }} />
      <div style={{ fontSize: 9, color: "#666" }}>{data.trx_code} · {data.date || TODAY}</div>
      <div style={{ fontSize: 10, fontWeight: 700 }}>Pelanggan: {data.customer || customerName || "Umum"}</div>
    </div>
    <div style={{ margin: "6px 0", borderTop: "1px dashed #ccc" }} />
    {(data.items || []).map((i, idx) => (
      <div key={idx} style={{ padding: "4px 0", fontSize: 10, borderBottom: "1px dotted #eee" }}>
        <div style={{ fontWeight: 700 }}>{i.product_name}</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
          <span style={{ color: "#888", fontSize: 9 }}>{i.qty} {i.unit} × {fmt(i.price)}</span>
          <span style={{ fontWeight: 700 }}>{fmt(i.price * i.qty)}</span>
        </div>
      </div>
    ))}
    <div style={{ margin: "6px 0", borderTop: "1px dashed #ccc" }} />
    <table style={{ width: "100%", fontSize: 10, borderCollapse: "collapse" }}>
      <tbody>
        <tr><td style={{ fontWeight: 900, fontSize: 13, paddingBottom: 3 }}>TOTAL</td><td style={{ fontWeight: 900, fontSize: 13, textAlign: "right", color: "#2d7a2d", paddingBottom: 3 }}>{fmt(data.total)}</td></tr>
        <tr><td style={{ color: "#555" }}>Bayar</td><td style={{ textAlign: "right", color: "#555" }}>{fmt(data.payment)}</td></tr>
        <tr><td style={{ fontWeight: 700 }}>Kembalian</td><td style={{ textAlign: "right", fontWeight: 700 }}>{fmt(data.change_amt)}</td></tr>
      </tbody>
    </table>
    <div style={{ textAlign: "center", marginTop: 8, fontSize: 9, color: "#aaa" }}>Terima kasih sudah berbelanja!</div>
  </div>
);

const PrintButtons = ({ printSize, setPrintSize, handlePrint, onClose, closeLabel = "✅ Tutup" }) => (
  <>
    <div className="flex items-center gap-2 my-3">
      <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">Ukuran kertas:</span>
      {['58', '80'].map(size => (
        <button key={size} onClick={() => setPrintSize(size)}
          className={`px-3.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all border-2 ${printSize === size ? 'border-[#2d7a2d] bg-green-50 dark:bg-[#2d4a2d] text-[#1a4a1a] dark:text-[#a8e063] font-extrabold' : 'border-gray-200 dark:border-[#3a5a3a] bg-white dark:bg-[#1e2e1e] text-gray-500'}`}>
          {size}mm
        </button>
      ))}
    </div>
    <div className="flex gap-2">
      <button className="flex-1 py-2.5 text-sm font-bold bg-[#f0f5f0] dark:bg-[#2d4a2d] text-[#2d7a2d] dark:text-[#a8e063] rounded-xl border-none cursor-pointer" onClick={handlePrint}>🖨️ Cetak</button>
      <button className="flex-1 py-2.5 text-sm font-bold bg-[#2d7a2d] text-white rounded-xl border-none cursor-pointer" onClick={onClose}>{closeLabel}</button>
    </div>
  </>
);

export default function ReceiptModal({ receipt, customerName, onClose }) {
  const [printSize, setPrintSize] = useState('80');
  if (!receipt) return null;
  const handlePrint = () => {
    const s = document.createElement('style');
    s.id = 'print-size-override';
    s.innerHTML = `@media print { @page { size: ${printSize}mm auto; margin: 2mm; } #struk-print { width: ${parseInt(printSize) - 4}mm !important; } }`;
    document.head.appendChild(s);
    window.print();
    setTimeout(() => document.getElementById('print-size-override')?.remove(), 1000);
  };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999]" onClick={onClose}>
      <div className="bg-white dark:bg-[#1a2a1a] rounded-2xl p-6 w-[320px] max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <StrukContent data={receipt} customerName={customerName} />
        <PrintButtons printSize={printSize} setPrintSize={setPrintSize} handlePrint={handlePrint} onClose={onClose} />
      </div>
    </div>
  );
}
