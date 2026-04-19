import { useRef, useState } from 'react';
import styles from '../styles/App.module.css';
import Spin from '../components/Spin';
import { MONTHS, TODAY } from '../utils/constants';

export default function ImportExportPage({ products, transactions, suppliers, kategoris, satuans, sb, showNotif, logActivity, rptMonth, rptYear, onReload }) {
  const fileRef = useRef();
  const [exportingTitle, setExportingTitle] = useState(null);
  const [importingState, setImportingState] = useState(null);
  const [importLog, setImportLog] = useState([]);

  const exportExcel = async (type) => {
    setExportingTitle(type);
    try {
      const XL = await import('xlsx');
      const wb = XL.utils.book_new();

      if (type === "all" || type === "transaksi")
        XL.utils.book_append_sheet(wb, XL.utils.json_to_sheet(
          transactions.map((t) => ({
            ID: t.trx_code, Tanggal: t.date, Pelanggan: t.customer,
            Item: (t.items || []).map((i) => `${i.product_name}(${i.qty})`).join("; "),
            Total: t.total, Pembayaran: t.payment, Kembalian: t.change_amt,
          }))
        ), "Transaksi");

      if (type === "all" || type === "produk")
        XL.utils.book_append_sheet(wb, XL.utils.json_to_sheet(
          products.map((p) => {
            const s = suppliers.find((s) => s.id === p.supplier_id);
            return { Nama: p.name, Kategori: p.category, Satuan: p.unit, Harga: p.price, Stok: p.stock, Min: p.min_stock, Supplier: s?.name || "-" };
          })
        ), "Produk");

      if (type === "all" || type === "stok")
        XL.utils.book_append_sheet(wb, XL.utils.json_to_sheet(
          products.map((p) => ({
            Nama: p.name, Kategori: p.category, Stok: p.stock, Min: p.min_stock,
            Status: p.stock === 0 ? "Habis" : p.stock <= p.min_stock ? "Menipis" : "Aman",
          }))
        ), "Stok");

      if (type === "all" || type === "supplier")
        XL.utils.book_append_sheet(wb, XL.utils.json_to_sheet(
          suppliers.map((s) => ({ Nama: s.name, PIC: s.contact, Telepon: s.phone, Email: s.email, Alamat: s.address, Status: s.status }))
        ), "Supplier");

      if (type === "laporan") {
        const rptTrx = transactions.filter((t) => {
          const [y, m] = t.date.split("-").map(Number);
          return y === rptYear && m === rptMonth + 1;
        });
        const rptRev = rptTrx.reduce((s, t) => s + t.total, 0);
        XL.utils.book_append_sheet(wb, XL.utils.json_to_sheet(
          rptTrx.map((t) => ({ ID: t.trx_code, Tanggal: t.date, Pelanggan: t.customer, Total: t.total }))
        ), "Transaksi");
        XL.utils.book_append_sheet(wb, XL.utils.json_to_sheet([
          { Keterangan: "Total Pendapatan", Nilai: rptRev },
          { Keterangan: "Jumlah Transaksi", Nilai: rptTrx.length },
          { Keterangan: "Rata-rata", Nilai: rptTrx.length ? Math.round(rptRev / rptTrx.length) : 0 },
        ]), "Ringkasan");
      }

      if (type === "template") {
        XL.utils.book_append_sheet(wb, XL.utils.json_to_sheet([
          { "Nama Produk": "", Kategori: "Pakan Jadi", Satuan: "kg", Harga: 0, Stok: 0, "Min Stok": 5 },
        ]), "Produk");
        XL.utils.book_append_sheet(wb, XL.utils.json_to_sheet([
          { "Nama Supplier": "", "Kontak PIC": "", Telepon: "", Email: "", Alamat: "", Status: "Aktif" },
        ]), "Supplier");
      }

      const fn = type === "laporan" ? `BBS_Laporan_${MONTHS[rptMonth]}_${rptYear}.xlsx`
        : type === "template" ? "BBS_Template.xlsx"
        : `BBS_${type}_${TODAY}.xlsx`;
      XL.writeFile(wb, fn);

      const labelMap = { all: "Semua Data", laporan: "Laporan Bulanan", transaksi: "Transaksi", produk: "Produk", stok: "Stok", supplier: "Supplier", template: "Template Import" };
      await logActivity("Export Excel", "Import/Export", `${labelMap[type] || type} → ${fn}`);
      showNotif("Export berhasil: " + fn);
    } catch (e) {
      console.error(e);
      showNotif("Gagal melakukan export data", "error");
    } finally {
      setExportingTitle(null);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportingState("Membaca file Excel...");
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const XL = await import('xlsx');
        const wb = XL.read(ev.target.result, { type: "array" });
        const logs = [];
        const sp = wb.SheetNames.find((n) => n === "Produk");
        if (sp) {
          const rows = XL.utils.sheet_to_json(wb.Sheets[sp]);
          let added = 0, updated = 0;
          for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            setImportingState(`Memproses data ${i + 1} / ${rows.length}...`);
            if (!r["Nama Produk"] || !r["Harga"]) continue;
            const ex = products.find((p) => p.name.toLowerCase() === String(r["Nama Produk"]).toLowerCase());
            const payload = {
              name: String(r["Nama Produk"]), category: r["Kategori"] || "Pakan Jadi",
              unit: r["Satuan"] || "pcs", price: parseInt(r["Harga"]) || 0,
              stock: parseInt(r["Stok"]) || 0, min_stock: parseInt(r["Min Stok"]) || 5,
            };
            if (ex) { await sb.from("products").update(payload).eq("id", ex.id); updated++; }
            else { await sb.from("products").insert(payload); added++; }
          }
          logs.push(`✅ Produk: ${added} ditambahkan, ${updated} diperbarui`);
        }
        if (!logs.length) logs.push("⚠️ Sheet tidak ditemukan. Gunakan template.");
        setImportLog(logs);
        setImportingState("Menyinkronkan data...");
        await onReload();
        await logActivity("Import Excel", "Import/Export", logs.join(" | "));
        showNotif("Import selesai!");
      } catch (err) {
        setImportLog([`❌ Error: ${err.message}`]);
        showNotif("Gagal import!", "error");
      } finally {
        setImportingState(null);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const exportItems = [
    { label: "📦 Semua Data", sub: "4 sheet sekaligus", type: "all", cls: "bg-bbs-green text-white" },
    { label: "📈 Laporan Bulanan", sub: `${MONTHS[rptMonth]} ${rptYear}`, type: "laporan", cls: "bg-[#1565c0] text-white" },
    { label: "📋 Transaksi", sub: "Riwayat transaksi", type: "transaksi", cls: "border border-bbs-green text-bbs-green bg-transparent" },
    { label: "📦 Produk", sub: "Daftar produk", type: "produk", cls: "border border-bbs-green text-bbs-green bg-transparent" },
    { label: "📊 Stok", sub: "Status stok", type: "stok", cls: "border border-bbs-green text-bbs-green bg-transparent" },
    { label: "🤝 Supplier", sub: "Data supplier", type: "supplier", cls: "border border-bbs-green text-bbs-green bg-transparent" },
  ];

  return (
    <div className="excel-grid">
      {/* IMPORT */}
      <div className={styles.card}>
        <div className="text-[15px] font-extrabold text-bbs-green-dark mb-1">📤 Import dari Excel</div>
        <div className="text-xs text-gray-400 mb-4">Upload .xlsx untuk update data produk massal</div>
        <div className={`bg-[#f8fdf8] rounded-xl p-5 mb-3.5 border-2 border-dashed border-[#b8d4b8] text-center transition-opacity ${importingState ? 'opacity-60 pointer-events-none' : ''}`}>
          <div className="text-3xl mb-2">{importingState ? "⏳" : "📂"}</div>
          <div className={`text-[13px] font-extrabold mb-3.5 ${importingState ? "text-bbs-green" : "text-gray-700"}`}>
            {importingState || "Pilih File Excel"}
          </div>
          <input id="import-file" name="import-file" type="file" accept=".xlsx,.xls" ref={fileRef} onChange={handleImport} className="hidden" />
          <button className="px-6 py-2.5 rounded-lg font-bold text-sm bg-bbs-green text-white border-none cursor-pointer disabled:opacity-50"
            onClick={() => fileRef.current.click()} disabled={!!importingState}>
            {importingState ? <Spin size={16} color="#fff" /> : "📤 Upload File"}
          </button>
        </div>
        <div className="flex justify-between items-center p-3.5 bg-amber-50 rounded-xl border border-amber-200">
          <div>
            <div className="text-[13px] font-bold text-gray-700">📄 Download Template</div>
            <div className="text-[11px] text-gray-400">Format kolom yang benar</div>
          </div>
          <button className="px-3.5 py-2 rounded-lg text-xs font-bold bg-[#f59e0b] text-white border-none cursor-pointer" onClick={() => exportExcel("template")}>⬇ Unduh</button>
        </div>
        {importLog.length > 0 && (
          <div className="mt-3 bg-green-50 rounded-xl p-3.5 border border-green-200">
            {importLog.map((l, i) => <div key={i} className="text-xs text-gray-700 mb-0.5">{l}</div>)}
          </div>
        )}
      </div>

      {/* EXPORT */}
      <div className={styles.card}>
        <div className="text-[15px] font-extrabold text-bbs-green-dark mb-1">📥 Export ke Excel</div>
        <div className="text-xs text-gray-400 mb-4">Unduh data ke file .xlsx</div>
        {exportItems.map((e) => (
          <div key={e.type} className="flex justify-between items-center py-3 border-b border-[#f0f5f0]">
            <div>
              <div className="text-[13px] font-bold text-gray-800">{e.label}</div>
              <div className="text-[11px] text-gray-400">{e.sub}</div>
            </div>
            <button className={`px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer min-w-[100px] ${e.cls} disabled:opacity-50`}
              onClick={() => exportExcel(e.type)} disabled={exportingTitle === e.type}>
              {exportingTitle === e.type ? "⏳..." : "Download"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
