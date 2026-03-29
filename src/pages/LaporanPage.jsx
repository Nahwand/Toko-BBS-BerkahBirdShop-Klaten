import styles from '../styles/App.module.css';
import { MONTHS, BADGE, fmt, fmtN } from '../utils/constants';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';

export default function LaporanPage({ rptMonth, setRptMonth, rptYear, setRptYear, rptTrx, rptRev, dayData, catData, topProds, exportExcel, exportPDF, showExportPDFLoading }) {
  const summaryStats = [
    { label: "Total Pendapatan", value: fmt(rptRev), cls: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700" },
    { label: "Jumlah Transaksi", value: fmtN(rptTrx.length), cls: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700" },
    { label: "Rata-rata / Transaksi", value: fmt(rptTrx.length > 0 ? Math.round(rptRev / rptTrx.length) : 0), cls: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-700" },
  ];

  return (
    <div id="laporan-container" className="p-2.5 bg-[#f8fdf8] dark:bg-[#0f1a0f]">
      {/* Actions */}
      <div id="laporan-actions" className="flex gap-2.5 mb-4 items-center flex-wrap" data-html2canvas-ignore="true">
        <select id="laporan-month" name="laporan-month" className={`${styles.inp} w-[140px]`} value={rptMonth} onChange={(e) => setRptMonth(parseInt(e.target.value))}>
          {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <select id="laporan-year" name="laporan-year" className={`${styles.inp} w-[90px]`} value={rptYear} onChange={(e) => setRptYear(parseInt(e.target.value))}>
          {[2024, 2025, 2026, 2027].map((y) => <option key={y}>{y}</option>)}
        </select>
        <button className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#1565c0] text-white border-none cursor-pointer" onClick={() => exportExcel("laporan")}>📥 Export Excel</button>
        <button className="px-4 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white border-none cursor-pointer min-w-[140px] disabled:opacity-50" onClick={exportPDF} disabled={showExportPDFLoading}>
          {showExportPDFLoading ? "⏳ Memproses..." : "🖨️ Cetak Jurnal PDF"}
        </button>
      </div>

      {/* Title */}
      <div className="text-center mb-5">
        <h2 className="text-[#1a4a1a] dark:text-[#a8e063] m-0 uppercase font-black text-lg">Laporan Performa Keuangan Toko BBS</h2>
        <p className="text-gray-500 mt-1 font-semibold text-sm">Periode Pembukuan: {MONTHS[rptMonth]} {rptYear}</p>
      </div>

      {/* Summary */}
      <div className="rpt-grid mb-5">
        {summaryStats.map((s, i) => (
          <div key={i} className={`rounded-xl p-4 border ${s.cls}`}>
            <div className="text-[10px] font-extrabold uppercase mb-2 tracking-wide opacity-80">{s.label}</div>
            <div className="text-[22px] font-black">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Line chart */}
      <div className={`${styles.card} mb-5`}>
        <div className="font-extrabold text-sm text-[#1a4a1a] dark:text-[#a8e063] mb-3.5 flex justify-between">
          <span>📈 Tren Pendapatan Harian</span>
          <span className="text-gray-400 text-xs font-normal">{MONTHS[rptMonth]} {rptYear}</span>
        </div>
        <div style={{ height: 260, minHeight: 260 }}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
          <div className="font-extrabold text-sm text-[#1a4a1a] dark:text-[#a8e063] mb-3.5">🧩 Distribusi Kategori</div>
          <div style={{ height: 240, minHeight: 240 }}>
            {catData.length === 0 ? <div className="text-gray-300 text-center pt-20">Tidak ada data</div> : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={catData} dataKey="rev" nameKey="cat" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} animationDuration={1200}>
                    {catData.map((entry, index) => {
                      const COLORS = ['#2d7a2d', '#1565c0', '#e65100', '#7b1fa2', '#c2185b', '#00796b'];
                      return <Cell key={`cell-${index}`} fill={BADGE[entry.cat]?.c || COLORS[index % COLORS.length]} />;
                    })}
                  </Pie>
                  <RTooltip formatter={(value) => [fmt(value), "Total"]} contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className={styles.card}>
          <div className="font-extrabold text-sm text-[#1a4a1a] dark:text-[#a8e063] mb-3.5">🏆 Top 5 Produk Terlaris</div>
          <div style={{ height: 240, minHeight: 240 }}>
            {topProds.length === 0 ? <div className="text-gray-300 text-center pt-20">Tidak ada data</div> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={topProds.map(([name, qty]) => ({ name, qty }))} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fill: '#444' }} axisLine={false} tickLine={false} />
                  <RTooltip formatter={(value) => [`${fmtN(value)} Terjual`, "Kuantitas"]} contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                  <Bar dataKey="qty" radius={[0, 6, 6, 0]} barSize={20} animationDuration={1200}>
                    {topProds.map((_, index) => <Cell key={`cell-${index}`} fill={index === 0 ? '#ea580c' : '#2563eb'} />)}
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
