import { useState, useMemo } from 'react';
import styles from '../styles/App.module.css';
import { BADGE, fmt, fmtN } from '../utils/constants';
import { validateDateRange, formatPeriodLabel } from '../utils/reportUtils';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie,
} from 'recharts';

const COLORS = ['#2d7a2d', '#1565c0', '#e65100', '#7b1fa2', '#c2185b', '#00796b'];

const TODAY = new Date().toISOString().slice(0, 10);
const MONTH_START = (() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
})();
const WEEK_START = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);

export default function LaporanPage({
  rptDateStart, setRptDateStart, rptDateEnd, setRptDateEnd,
  rptTrx, rptRev, dayData, catData, topProds, kategoris, products,
}) {
  const [showExportPDFLoading, setShowExportPDFLoading] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [filterKat, setFilterKat] = useState("Semua");
  const [dateError, setDateError] = useState('');

  const handleDateChange = (start, end) => {
    const { isValid, error } = validateDateRange(start, end);
    if (!isValid) { setDateError(error); return; }
    setDateError('');
    if (start !== undefined) setRptDateStart(start);
    if (end !== undefined) setRptDateEnd(end);
  };

  const getItemCategory = (item) => {
    const prod = products?.find(p => p.id === item.product_id);
    return prod?.category || "";
  };

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

  const displayItemCount = useMemo(() => {
    if (filterKat === "Semua") return null;
    return rptTrx.reduce((s, t) =>
      s + (t.items || []).reduce((si, i) =>
        getItemCategory(i) === filterKat ? si + i.qty : si, 0), 0);
  }, [rptTrx, filterKat, products]);

  const filteredDayData = useMemo(() => {
    if (filterKat === "Semua") return dayData;
    return dayData.map(d => {
      // Match by dateStr (DD/MM) back to full date
      const rev = rptTrx.reduce((s, t) => {
        const tLabel = `${String(new Date(t.date + 'T00:00:00').getDate()).padStart(2,'0')}/${String(new Date(t.date + 'T00:00:00').getMonth()+1).padStart(2,'0')}`;
        if (tLabel !== d.dateStr) return s;
        return s + (t.items || []).reduce((si, i) =>
          getItemCategory(i) === filterKat ? si + i.price * i.qty : si, 0);
      }, 0);
      return { ...d, rev };
    });
  }, [dayData, filterKat, rptTrx, products]);

  const periodLabel = formatPeriodLabel(rptDateStart, rptDateEnd);
  const fileLabel = rptDateStart && rptDateEnd
    ? `${rptDateStart}_sd_${rptDateEnd}`
    : rptDateStart || rptDateEnd || 'custom';

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
        { Keterangan: "Periode", Nilai: periodLabel },
      ]), "Ringkasan");
      XL.utils.book_append_sheet(wb, XL.utils.json_to_sheet(
        catData.map(c => ({ Kategori: c.cat, Pendapatan: c.rev }))
      ), "Per Kategori");
      XL.writeFile(wb, `BBS_Laporan_${fileLabel}.xlsx`);
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
      pdf.save(`BBS_Laporan_${fileLabel}.pdf`);
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
        {/* Date range inputs */}
        <div className="flex items-center gap-1.5">
          <input id="laporan-date-start" name="laporan-date-start" className={`${styles.inp} w-[145px]`} type="date"
            value={rptDateStart} onChange={(e) => handleDateChange(e.target.value, rptDateEnd)} title="Dari tanggal" />
          <span className="text-xs text-gray-400">s/d</span>
          <input id="laporan-date-end" name="laporan-date-end" className={`${styles.inp} w-[145px]`} type="date"
            value={rptDateEnd} onChange={(e) => handleDateChange(rptDateStart, e.target.value)} title="Sampai tanggal" />
        </div>
        {/* Shortcut buttons */}
        <div className="flex gap-1">
          {[
            { label: 'Hari Ini', start: TODAY, end: TODAY },
            { label: '7 Hari', start: WEEK_START, end: TODAY },
            { label: 'Bulan Ini', start: MONTH_START, end: TODAY },
          ].map(s => (
            <button key={s.label}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition-colors ${rptDateStart === s.start && rptDateEnd === s.end ? 'bg-bbs-green text-white border-bbs-green' : 'bg-white text-gray-600 border-gray-200 hover:border-bbs-green'}`}
              onClick={() => { setDateError(''); setRptDateStart(s.start); setRptDateEnd(s.end); }}>
              {s.label}
            </button>
          ))}
        </div>
        {/* Kategori filter */}
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

      {/* Validasi error */}
      {dateError && (
        <div className="mb-3 px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-[12px] text-red-600 font-semibold">
          ⚠️ {dateError}
        </div>
      )}

      {/* Title */}
      <div className="text-center mb-5">
        <h2 className="text-bbs-green-dark m-0 uppercase font-black text-lg">Laporan Performa Keuangan Toko BBS</h2>
        <p className="text-gray-500 mt-1 font-semibold text-sm">
          Periode: {periodLabel}{filterKat !== "Semua" ? ` · Kategori: ${filterKat}` : ""}
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

      {/* Pesan kosong */}
      {rptTrx.length === 0 && (
        <div className="text-center py-10 text-gray-400 text-sm">Tidak ada data untuk periode ini</div>
      )}

      {/* Line chart */}
      {rptTrx.length > 0 && (
        <div className={`${styles.card} mb-5`}>
          <div className="font-extrabold text-sm text-bbs-green-dark mb-3.5 flex justify-between">
            <span>📈 Tren Pendapatan Harian</span>
            <span className="text-gray-400 text-xs font-normal">{periodLabel}</span>
          </div>
          <div style={{ height: 260, minHeight: 260 }}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={filteredDayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4ede4" />
                <XAxis dataKey="dateStr" tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} tickMargin={10}
                  interval={filteredDayData.length > 14 ? Math.floor(filteredDayData.length / 10) : 0} />
                <YAxis tickFormatter={(val) => `Rp${val / 1000}k`} tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} tickMargin={10} />
                <RTooltip formatter={(value) => [fmt(value), "Pendapatan"]} labelFormatter={(label) => `Tanggal ${label}`} contentStyle={{ borderRadius: 8, border: "1px solid #e4ede4", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} />
                <Line type="monotone" dataKey="rev" stroke="#2d7a2d" strokeWidth={3} dot={{ r: 3, fill: '#2d7a2d', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} animationDuration={1200} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Pie + Bar */}
      {rptTrx.length > 0 && (
        <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          <div className={styles.card}>
            <div className="font-extrabold text-sm text-bbs-green-dark mb-3.5">🧩 Distribusi Kategori</div>
            <div style={{ height: 240, minHeight: 240 }}>
              {catData.length === 0 ? <div className="text-gray-300 text-center pt-20">Tidak ada data</div> : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={catData} dataKey="rev" nameKey="cat" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} animationDuration={1200} fill="#2d7a2d" />
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
                    <Bar dataKey="qty" radius={[0, 6, 6, 0]} barSize={20} animationDuration={1200} fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
