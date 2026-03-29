import React from 'react';
import styles from '../styles/App.module.css';
import { MONTHS, BADGE, fmt, fmtN } from '../utils/constants';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';

export default function LaporanPage({
  rptMonth, setRptMonth, rptYear, setRptYear,
  rptTrx, rptRev, dayData, catData, topProds,
  exportExcel, exportPDF, showExportPDFLoading,
}) {
  return (
    <div id="laporan-container" style={{ padding: 10, background: "#f8fdf8" }}>
      <div id="laporan-actions" style={{ display: "flex", gap: 10, marginBottom: 18, alignItems: "center", flexWrap: "wrap" }} data-html2canvas-ignore="true">
        <select id="laporan-month" name="laporan-month" className={styles.inp} style={{ width: 140 }} value={rptMonth} onChange={(e) => setRptMonth(parseInt(e.target.value))}>
          {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <select id="laporan-year" name="laporan-year" className={styles.inp} style={{ width: 90 }} value={rptYear} onChange={(e) => setRptYear(parseInt(e.target.value))}>
          {[2024, 2025, 2026, 2027].map((y) => <option key={y}>{y}</option>)}
        </select>
        <button className={`${styles.btn} ${styles.btnblue}`} onClick={() => exportExcel("laporan")}>📥 Export Excel</button>
        <button className={styles.btn} style={{ background: "#dc2626", color: "#fff", minWidth: 140 }} onClick={exportPDF} disabled={showExportPDFLoading}>
          {showExportPDFLoading ? "⏳ Memproses..." : "🖨️ Cetak Jurnal PDF"}
        </button>
      </div>

      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <h2 style={{ color: "#1a4a1a", margin: 0, textTransform: "uppercase" }}>Laporan Performa Keuangan Toko BBS</h2>
        <p style={{ color: "#666", margin: "5px 0 0 0", fontWeight: 600 }}>Periode Pembukuan: {MONTHS[rptMonth]} {rptYear}</p>
      </div>

      <div className="rpt-grid" style={{ marginBottom: 20 }}>
        {[
          { label: "Total Pendapatan", value: fmt(rptRev), color: "#2d7a2d", bg: "#e8f5e9" },
          { label: "Jumlah Transaksi", value: fmtN(rptTrx.length), color: "#1565c0", bg: "#e3f2fd" },
          { label: "Rata-rata Pendapatan / Transaksi", value: fmt(rptTrx.length > 0 ? Math.round(rptRev / rptTrx.length) : 0), color: "#7b1fa2", bg: "#f3e5f5" },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, borderRadius: 12, padding: "16px 18px", border: `1px solid ${s.color}33` }}>
            <div style={{ fontSize: 10, color: s.color, fontWeight: 800, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className={styles.card} style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: "#1a4a1a", marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
          <span>📈 Tren Pendapatan Harian</span>
          <span style={{ color: "#aaa", fontSize: 12, fontWeight: 500 }}>{MONTHS[rptMonth]} {rptYear}</span>
        </div>
        <div style={{ height: 260, width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
        <div className={styles.card}>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#1a4a1a", marginBottom: 14 }}>🧩 Distribusi Kategori</div>
          <div style={{ height: 240, width: "100%" }}>
            {catData.length === 0 ? (
              <div style={{ color: "#ccc", textAlign: "center", paddingTop: 80 }}>Tidak ada data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
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
          <div style={{ fontWeight: 800, fontSize: 14, color: "#1a4a1a", marginBottom: 14 }}>🏆 Top 5 Produk Terlaris</div>
          <div style={{ height: 240, width: "100%" }}>
            {topProds.length === 0 ? (
              <div style={{ color: "#ccc", textAlign: "center", paddingTop: 80 }}>Tidak ada data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProds.map(([name, qty]) => ({ name, qty }))} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fill: '#444' }} axisLine={false} tickLine={false} />
                  <RTooltip formatter={(value) => [`${fmtN(value)} Terjual`, "Kuantitas"]} contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                  <Bar dataKey="qty" fill="#1565c0" radius={[0, 6, 6, 0]} barSize={20} animationDuration={1200}>
                    {topProds.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#ea580c' : '#2563eb'} />
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
