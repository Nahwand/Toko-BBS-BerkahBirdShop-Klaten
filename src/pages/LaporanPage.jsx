import { useState, useMemo } from 'react';
import styles from '../styles/App.module.css';
import { MONTHS, BADGE, fmt, fmtN } from '../utils/constants';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie,
} from 'recharts';

const COLORS = ['#2d7a2d', '#1565c0', '#e65100', '#7b1fa2', '#c2185b', '#00796b'];

export default function LaporanPage({ rptMonth, setRptMonth, rptYear, setRptYear, rptTrx, rptRev, dayData, catData, topProds, kategoris, products }) {
  const [showExportPDFLoading, setShowExportPDFLoading] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [filterKat, setFilterKat] = useState("Semua");

  // Lookup kategori produk dari products array
  const getItemCategory = (item) => {
    const prod = products?.find(p => p.id === item.product_id);
    return prod?.category || "";
  };

  // Filter transaksi berdasarkan kategori
  const filteredTrx = useMemo(() => {
    if (filterKat === "Semua") return rptTrx;
    return rptTrx.filter(t => (t.items || []).some(i => getItemCategory(i) === filterKat));
  }, [rptTrx, filterKat, products]);

  const displayRev = useMemo(() => {
    if (filterKat === "Semua") return rptRev;
    return rptTrx.reduce((s, t) =>
      s + (t.items || []).reduce((si, i) =>
        getItemCategory(i) === filterKat ? si + i.price * i.qty : si, 0), 0);
  }, [rptTrx, filterKat, products]);

  const displayTrxCount = filterKat === "Semua" ? rptTrx.length : filteredTrx.length;

  // Jumlah item terjual untuk kategori yang dipilih
  const displayItemCount = useMemo(() => {
    if (filterKat === "Semua") return null;
    return rptTrx.reduce((s, t) =>
      s + (t.items || []).reduce((si, i) =>
        getItemCategory(i) === filterKat ? si + i.qty : si, 0), 0);
  }, [rptTrx, filterKat, products]);

  const filteredDayData = useMemo(() => {
    if (filterKat === "Semua") return dayData;
    return dayData.map(d => {
      const dayTrx = rptTrx.filter(t => parseInt(t.date.split('-')[2]) === d.day);
      const rev = dayTrx.reduce((s, t) =>
        s + (t.items || []).reduce((si, i) =>
          getItemCategory(i) === filterKat ? si + i.price * i.qty : si, 0), 0);
      return { ...d, rev };
    });
  }, [dayData, filterKat, rptTrx, products]);

  const exportLaporanExcel = async () => {
    setExportingExcel(true);
    try {
      const XL = await import('xlsx');
      const wb = XL.utils.book_new();
      XL.utils.book_append_sheet(wb, XL.utils.json_to_sheet(
        rptTrx.map((t) => ({ ID: t.trx_code, Tanggal: t.date, Pelanggan: t.customer, Total: t.total }))
      ), "Transaksi");
      XL.utils.book_append_sheet(wb, XL.utils.json_to_sheet([
        { Keterangan: "Total Pendapatan", Nilai: rptRev },
        { Keterangan: "Jumlah Transaksi", Nilai: rptTrx.length },
        { Keterangan: "Rata-rata", Nilai: rptTrx.length ? Math.round(rptRev / rptTrx.length) : 0 },
      ]), "Ringkasan");
      XL.utils.book_append_sheet(wb, XL.utils.json_to_sheet(
        catData.map(c => ({ Kategori: c.cat, Pendapatan: c.rev }))
      ), "Per Kategori");
      XL.writeFile(wb, `BBS_Laporan_${MONTHS[rptMonth]}_${rptYear}.xlsx`);
    } catch (e) {
      console.error(e);
      alert("Gagal export Excel");
    } finally {
      setExportingExcel(false);
    }
  };

  const exportPDF = async () => {
    const reportNode = document.getElementById("laporan-container");
    if (!reportNode) return;
    setShowExportPDFLoading(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);
      const actionsNode = document.getElementById("laporan-actions");
      if (actionsNode) actionsNode.style.display = "none";
      const canvas = await html2canvas(reportNode, { scale: 2, useCORS: true, logging: false });
      if (actionsNode) actionsNode.style.display = "flex";
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Laporan_BBS_${MONTHS[rptMonth]}_${rptYear}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Gagal mencetak PDF");
      const actionsNode = document.getElementById("laporan-actions");
      if (actionsNode) actionsNode.style.display = "flex";
    } finally {
      setShowExportPDFLoading(false);
    }
  };

  const activeRev = filterKat === "Semua" ? rptRev : displayRev;

  const summaryStats = [
    { label: "Total Pendapatan", value: fmt(activeRev), cls: "bg-green-100 text-green-800 border-green-200" },
    {
      label: filterKat === "Semua" ? "Jumlah Transaksi" : "Transaksi Mengandung Kategori",
      value: fmtN(displayTrxCount),
      sub: filterKat !== "Semua" ? `${fmtN(displayItemCount)} item terjual` : null,
      cls: "bg-blue-100 text-blue-800 border-blue-200"
    },
    {
      label: "Rata-rata / Transaksi",
      value: fmt(displayTrxCount > 0 ? Math.round(activeRev / displayTrxCount) : 0),
      cls: "bg-purple-100 text-purple-800 border-purple-200"
    },
  ];

  const catList = ["Semua", ...(kategoris || []).map(k => k.nama)];

  return (
    <div id="laporan-container" className="p-2.5 bg-[#f8fdf8]">
      {/* Actions */}
      <div id="laporan-actions" className="flex gap-2.5 mb-4 items-center flex-wrap" data-html2canvas-ignore="true">
        <select id="laporan-month" name="laporan-month" className={`${styles.inp} w-[130px]`} value={rptMonth} onChange={(e) => setRptMonth(parseInt(e.target.value))}>
          {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <select id="laporan-year" name="laporan-year" className={`${styles.inp} w-[85px]`} value={rptYear} onChange={(e) => setRptYear(parseInt(e.target.value))}>
          {[2024, 2025, 2026, 2027].map((y) => <option key={y}>{y}</option>)}
        </select>
        <select id="laporan-kat" name="laporan-kat" className={`${styles.inp} w-[140px]`} value={filterKat} onChange={(e) => setFilterKat(e.target.value)}>
          {catList.map(c => <option key={c}>{c}</option>)}
        </select>
        <button className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#1565c0] text-white border-none cursor-pointer disabled:opacity-50"
          onClick={exportLaporanExcel} disabled={exportingExcel}>
          {exportingExcel ? "⏳..." : "📥 Export Excel"}
        </button>
        <button className="px-4 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white border-none cursor-pointer min-w-[140px] disabled:opacity-50"
          onClick={exportPDF} disabled={showExportPDFLoading}>
          {showExportPDFLoading ? "⏳ Memproses..." : "🖨️ Cetak PDF"}
        </button>
      </div>

      {/* Title */}
      <div className="text-center mb-5">
        <h2 className="text-bbs-green-dark m-0 uppercase font-black text-lg">Laporan Performa Keuangan Toko BBS</h2>
        <p className="text-gray-500 mt-1 font-semibold text-sm">
          Periode: {MONTHS[rptMonth]} {rptYear}{filterKat !== "Semua" ? ` · Kategori: ${filterKat}` : ""}
        </p>
      </div>

      {/* Summary */}
      <div className="rpt-grid mb-5">
        {summaryStats.map((s, i) => (
          <div key={i} className={`rounded-xl p-4 border ${s.cls}`}>
            <div className="text-[10px] font-extrabold uppercase mb-2 tracking-wide opacity-80">{s.label}</div>
            <div className="text-[22px] font-black">{s.value}</div>
            {s.sub && <div className="text-[11px] mt-1 opacity-70 font-semibold">{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Line chart */}
      <div className={`${styles.card} mb-5`}>
        <div className="font-extrabold text-sm text-bbs-green-dark mb-3.5 flex justify-between">
          <span>📈 Tren Pendapatan Harian</span>
          <span className="text-gray-400 text-xs font-normal">{MONTHS[rptMonth]} {rptYear}</span>
        </div>
        <div style={{ height: 260, minHeight: 260 }}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={filteredDayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4ede4" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} tickMargin={10} />
              <YAxis tickFormatter={(val) => `Rp${val / 1000}k`} tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} tickMargin={10} />
              <RTooltip formatter={(value) => [fmt(value), "Pendapatan"]} labelFormatter={(label) => `Tanggal ${label}`} contentStyle={{ borderRadius: 8, border: "1px solid #e4ede4", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} />
              <Line type="monotone" dataKey="rev" stroke="#2d7a2d" strokeWidth={3} dot={{ r: 3, fill: '#2d7a2d', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} animationDuration={1200} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie + Bar */}
      <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        <div className={styles.card}>
          <div className="font-extrabold text-sm text-bbs-green-dark mb-3.5">🧩 Distribusi Kategori</div>
          <div style={{ height: 240, minHeight: 240 }}>
            {catData.length === 0 ? <div className="text-gray-300 text-center pt-20">Tidak ada data</div> : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={catData} dataKey="rev" nameKey="cat" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} animationDuration={1200}
                    fill="#2d7a2d">
                    {catData.map((entry, index) => (
                      <Pie key={`cell-${index}`} fill={BADGE[entry.cat]?.c || COLORS[index % COLORS.length]}
                        opacity={filterKat === "Semua" || filterKat === entry.cat ? 1 : 0.25} />
                    ))}
                  </Pie>
                  <RTooltip formatter={(value) => [fmt(value), "Total"]} contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className={styles.card}>
          <div className="font-extrabold text-sm text-bbs-green-dark mb-3.5">🏆 Top 5 Produk Terlaris</div>
          <div style={{ height: 240, minHeight: 240 }}>
            {topProds.length === 0 ? <div className="text-gray-300 text-center pt-20">Tidak ada data</div> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={topProds.map(([name, qty]) => ({ name, qty }))} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fill: '#444' }} axisLine={false} tickLine={false} />
                  <RTooltip formatter={(value) => [`${fmtN(value)} Terjual`, "Kuantitas"]} contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                  <Bar dataKey="qty" radius={[0, 6, 6, 0]} barSize={20} animationDuration={1200}
                    fill="#2563eb">
                    {topProds.map((_, index) => (
                      <Bar key={`cell-${index}`} fill={index === 0 ? '#ea580c' : '#2563eb'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
