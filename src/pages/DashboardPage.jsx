import React from 'react';
import styles from '../styles/App.module.css';
import { fmt, fmtN, MONTHS } from '../utils/constants';

export default function DashboardPage({
  transactions, products, activityLogs,
  todayTrx, todayRev, weekTrx, weekRev,
  outStock, lowStock,
}) {
  return (
    <div>
      <div className="stat-grid">
        {[
          { label: "Pendapatan Hari Ini", value: fmt(todayRev), sub: `${todayTrx.length} transaksi`, bg: "#e8f5e9", color: "#2e7d32" },
          { label: "Pendapatan Minggu Ini", value: fmt(weekRev), sub: `${weekTrx.length} transaksi`, bg: "#fff8e1", color: "#e65100" },
          { label: "Total Produk", value: fmtN(products.length), sub: "jenis produk", bg: "#e3f2fd", color: "#1565c0" },
          { label: "Stok Habis", value: fmtN(outStock.length), sub: "item kosong", bg: outStock.length > 0 ? "#ffebee" : "#f1f8e9", color: outStock.length > 0 ? "#c62828" : "#33691e" },
          { label: "Stok Menipis", value: fmtN(lowStock.length), sub: "perlu restock", bg: lowStock.length > 0 ? "#fff3e0" : "#f1f8e9", color: lowStock.length > 0 ? "#e65100" : "#33691e" },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, borderRadius: 12, padding: "16px 18px", border: `1px solid ${s.color}22` }}>
            <div style={{ fontSize: 10, color: s.color, fontWeight: 800, marginBottom: 8, textTransform: "uppercase" }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        <div className={styles.card}>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#1a4a1a", marginBottom: 14 }}>Transaksi Terbaru</div>
          {transactions.slice(0, 7).map((t) => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #f0f5f0", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{t.trx_code} — {t.customer}</div>
                <div style={{ fontSize: 10, color: "#aaa" }}>{t.date} · {(t.items || []).length} item</div>
              </div>
              <span style={{ fontWeight: 800, color: "#2d7a2d", fontSize: 13 }}>{fmt(t.total)}</span>
            </div>
          ))}
        </div>

        {outStock.length > 0 && (
          <div className={styles.card} style={{ borderLeft: '4px solid #ef4444' }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#c62828", marginBottom: 14 }}>❌ Stok Habis (Segera Restock!)</div>
            {outStock.slice(0, 10).map((p) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #f9ecec" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#c62828' }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: "#aaa" }}>{p.category}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, color: "#c62828", fontSize: 12 }}>Habis</div>
                  <div style={{ fontSize: 9, color: "#ccc" }}>min: {p.min_stock}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.card}>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#1a4a1a", marginBottom: 14 }}>⚠ Stok Menipis</div>
          {lowStock.length === 0 ? (
            <div style={{ color: "#bbb", fontSize: 13, textAlign: "center", padding: "20px 0" }}>✅ Semua stok aman</div>
          ) : (
            lowStock.slice(0, 7).map((p) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #f0f5f0" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: "#aaa" }}>{p.category}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, color: p.stock === 0 ? "#dc3545" : "#e65100", fontSize: 15 }}>
                    {p.stock} {(p.unit || "").split(",")[0]}
                  </div>
                  <div style={{ fontSize: 9, color: "#ccc" }}>min:{p.min_stock}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ACTIVITY LOG */}
      <div style={{ marginTop: 18, background: "#fff", borderRadius: 12, border: "1px solid #e4ede4" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e4ede4", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#1a4a1a" }}>📋 Aktivitas Terbaru</div>
          <div style={{ fontSize: 11, color: "#aaa" }}>30 aktivitas terakhir</div>
        </div>
        {activityLogs.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", color: "#bbb", fontSize: 13 }}>Belum ada aktivitas tercatat</div>
        ) : (
          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {activityLogs.map((log) => {
              const ICONS = { Kasir: "🤝", Produk: "📦", Stok: "📊", Supplier: "🤝", Akun: "👥", "Master Data": "🗂️", "Import/Export": "📗" };
              const COLORS = {
                "Transaksi Baru": { bg: "#e8f5e9", c: "#2e7d32" }, "Tambah Produk": { bg: "#e3f2fd", c: "#1565c0" },
                "Edit Produk": { bg: "#fff8e1", c: "#e65100" }, "Hapus Produk": { bg: "#fee2e2", c: "#dc2626" },
                "Restock Stok": { bg: "#f3e5f5", c: "#6a1b9a" }, "Tambah Supplier": { bg: "#e3f2fd", c: "#1565c0" },
                "Edit Supplier": { bg: "#fff8e1", c: "#e65100" }, "Hapus Supplier": { bg: "#fee2e2", c: "#dc2626" },
                "Tambah Akun": { bg: "#e3f2fd", c: "#1565c0" }, "Edit Akun": { bg: "#fff8e1", c: "#e65100" },
                "Hapus Akun": { bg: "#fee2e2", c: "#dc2626" }, "Export Excel": { bg: "#e3f2fd", c: "#1565c0" },
                "Import Excel": { bg: "#f3e5f5", c: "#6a1b9a" },
              };
              const clr = COLORS[log.aksi] || { bg: "#f5f5f5", c: "#666" };
              const tgl = new Date(log.created_at);
              const tglStr = tgl.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
              const jamStr = tgl.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
              const roleClr = log.user_role === "superadmin" ? "#7b1fa2" : log.user_role === "admin" ? "#e65100" : "#1565c0";
              const roleBg = log.user_role === "superadmin" ? "#f3e5f5" : log.user_role === "admin" ? "#fff8e1" : "#e3f2fd";
              return (
                <div key={log.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 20px", borderBottom: "1px solid #f8f8f8" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fdf9")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: clr.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                    {ICONS[log.kategori] || "📝"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                      <span style={{ background: clr.bg, color: clr.c, padding: "2px 9px", borderRadius: 20, fontSize: 11, fontWeight: 800 }}>{log.aksi}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#333" }}>{log.user_nama}</span>
                      <span style={{ background: roleBg, color: roleClr, padding: "1px 7px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>
                        {log.user_role === "superadmin" ? "👑 Super Admin" : log.user_role === "admin" ? "🛡️ Admin" : "👤 Pegawai"}
                      </span>
                    </div>
                    {log.detail && <div style={{ fontSize: 12, color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{log.detail}</div>}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: "#555", fontWeight: 600 }}>{jamStr}</div>
                    <div style={{ fontSize: 10, color: "#bbb" }}>{tglStr}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
