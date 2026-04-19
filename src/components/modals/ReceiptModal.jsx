import { useState } from 'react';
import { fmt, TODAY, buildPrintStyle } from '../../utils/constants';
import { usePrintSize } from '../../hooks/usePrintSize';

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
        {data.discount > 0 && (
          <>
            <tr>
              <td style={{ color: "#555" }}>Subtotal</td>
              <td style={{ textAlign: "right", color: "#555" }}>{fmt((data.items || []).reduce((s, i) => s + i.price * i.qty, 0))}</td>
            </tr>
            <tr>
              <td style={{ color: "#e65100", fontWeight: 700 }}>🏷️ Diskon</td>
              <td style={{ textAlign: "right", color: "#e65100", fontWeight: 700 }}>− {fmt(data.discount)}</td>
            </tr>
          </>
        )}
        <tr><td style={{ fontWeight: 900, fontSize: 13, paddingBottom: 3 }}>TOTAL</td><td style={{ fontWeight: 900, fontSize: 13, textAlign: "right", color: "#2d7a2d", paddingBottom: 3 }}>{fmt(data.total)}</td></tr>
        <tr><td style={{ color: "#555" }}>Bayar</td><td style={{ textAlign: "right", color: "#555" }}>{fmt(data.payment)}</td></tr>
        <tr><td style={{ fontWeight: 700 }}>Kembalian</td><td style={{ textAlign: "right", fontWeight: 700 }}>{fmt(data.change_amt)}</td></tr>
      </tbody>
    </table>
    <div style={{ textAlign: "center", marginTop: 8, fontSize: 9, color: "#aaa" }}>Terima kasih sudah berbelanja!</div>
  </div>
);

export default function ReceiptModal({ receipt, customerName, onClose }) {
  const [printSize, setPrintSize] = usePrintSize();
  const [autoCloseMsg, setAutoCloseMsg] = useState(false);
  const canPrint = typeof window !== 'undefined' && typeof window.print === 'function';

  if (!receipt) return null;

  const handleDirectPrint = () => {
    if (!canPrint) return;
    const s = document.createElement('style');
    s.id = 'print-size-override';
    s.innerHTML = buildPrintStyle(printSize);
    document.head.appendChild(s);
    window.print();
    setTimeout(() => document.getElementById('print-size-override')?.remove(), 1500);
    setAutoCloseMsg(true);
    setTimeout(() => { setAutoCloseMsg(false); onClose(); }, 2000);
  };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-999" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-[320px] max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <StrukContent data={receipt} customerName={customerName} />
        <div className="flex items-center gap-2 my-3">
          <span className="text-[11px] font-bold text-gray-500">Ukuran kertas:</span>
          {['58', '80'].map(size => (
            <button key={size} onClick={() => setPrintSize(size)}
              className={`px-3.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all border-2 ${printSize === size ? 'border-bbs-green bg-green-50 text-bbs-green-dark font-extrabold' : 'border-gray-200 bg-white text-gray-500'}`}>
              {size}mm
            </button>
          ))}
        </div>
        {!canPrint && (
          <div className="text-[11px] text-red-500 mb-2">Fitur cetak tidak didukung oleh browser ini.</div>
        )}
        {autoCloseMsg && (
          <div className="text-[11px] text-bbs-green text-center mb-2 font-semibold">✅ Mencetak... modal akan tertutup otomatis.</div>
        )}
        <div className="flex gap-2 mb-2">
          <button className="flex-1 py-2.5 text-sm font-bold bg-bbs-green text-white rounded-xl border-none cursor-pointer" onClick={onClose}>✅ Tutup</button>
        </div>
        <button className="w-full py-2.5 text-sm font-bold bg-amber-500 text-white rounded-xl border-none cursor-pointer disabled:opacity-50"
          onClick={handleDirectPrint} disabled={!canPrint}>
          ⚡ Cetak Langsung
        </button>
      </div>
    </div>
  );
}
