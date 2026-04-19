import styles from '../styles/App.module.css';
import { fmt, fmtN } from '../utils/constants';

const ACTIVITY_COLORS = {
  "Transaksi Baru": { bg: "#e8f5e9", c: "#2e7d32" }, "Tambah Produk": { bg: "#e3f2fd", c: "#1565c0" },
  "Edit Produk": { bg: "#fff8e1", c: "#e65100" }, "Hapus Produk": { bg: "#fee2e2", c: "#dc2626" },
  "Restock Stok": { bg: "#f3e5f5", c: "#6a1b9a" }, "Tambah Supplier": { bg: "#e3f2fd", c: "#1565c0" },
  "Edit Supplier": { bg: "#fff8e1", c: "#e65100" }, "Hapus Supplier": { bg: "#fee2e2", c: "#dc2626" },
  "Tambah Akun": { bg: "#e3f2fd", c: "#1565c0" }, "Edit Akun": { bg: "#fff8e1", c: "#e65100" },
  "Hapus Akun": { bg: "#fee2e2", c: "#dc2626" }, "Export Excel": { bg: "#e3f2fd", c: "#1565c0" },
  "Import Excel": { bg: "#f3e5f5", c: "#6a1b9a" },
};
const ACTIVITY_ICONS = { Kasir: "🤝", Produk: "📦", Stok: "📊", Supplier: "🤝", Akun: "👥", "Master Data": "🗂️", "Import/Export": "📗" };

export default function DashboardPage({ transactions, products, activityLogs, todayTrx, todayRev, weekTrx, weekRev, outStock, lowStock }) {
  const stats = [
    { label: "Pendapatan Hari Ini", value: fmt(todayRev), sub: `${todayTrx.length} transaksi`, bg: "bg-green-100 ", color: "text-green-800 " },
    { label: "Pendapatan Minggu Ini", value: fmt(weekRev), sub: `${weekTrx.length} transaksi`, bg: "bg-amber-100 ", color: "text-amber-700 " },
    { label: "Total Produk", value: fmtN(products.length), sub: "jenis produk", bg: "bg-blue-100 ", color: "text-blue-800 " },
    { label: "Stok Habis", value: fmtN(outStock.length), sub: "item kosong", bg: outStock.length > 0 ? "bg-red-100 " : "bg-green-50 ", color: outStock.length > 0 ? "text-red-700 " : "text-green-700 " },
    { label: "Stok Menipis", value: fmtN(lowStock.length), sub: "perlu restock", bg: lowStock.length > 0 ? "bg-orange-100 " : "bg-green-50 ", color: lowStock.length > 0 ? "text-orange-700 " : "text-green-700 " },
  ];

  return (
    <div>
      {/* Stat cards */}
      <div className="stat-grid">
        {stats.map((s, i) => (
          <div key={i} className={`${s.bg} rounded-xl p-4 border border-transparent`}>
            <div className={`text-[10px] font-extrabold uppercase mb-2 ${s.color}`}>{s.label}</div>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-[11px] text-gray-400 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Dash grid */}
      <div className="dash-grid">
        {/* Transaksi terbaru */}
        <div className={styles.card}>
          <div className="font-extrabold text-sm text-bbs-green-dark  mb-3.5">Transaksi Terbaru</div>
          {transactions.slice(0, 7).map((t) => (
            <div key={t.id} className="flex justify-between py-2 border-b border-[#f0f5f0]  items-center">
              <div>
                <div className="font-bold text-[13px]">{t.trx_code} — {t.customer}</div>
                <div className="text-[10px] text-gray-400">{t.date} · {(t.items || []).length} item</div>
              </div>
              <span className="font-extrabold text-bbs-green text-[13px]">{fmt(t.total)}</span>
            </div>
          ))}
        </div>

        {/* Stok habis */}
        {outStock.length > 0 && (
          <div className={`${styles.card} border-l-4 border-red-500`}>
            <div className="font-extrabold text-sm text-red-700  mb-3.5">❌ Stok Habis (Segera Restock!)</div>
            {outStock.slice(0, 10).map((p) => (
              <div key={p.id} className="flex justify-between py-2 border-b border-red-50 ">
                <div>
                  <div className="font-bold text-[13px] text-red-700 ">{p.name}</div>
                  <div className="text-[10px] text-gray-400">{p.category}</div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-red-600 text-xs">Habis</div>
                  <div className="text-[9px] text-gray-300">min: {p.min_stock}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stok menipis */}
        <div className={styles.card}>
          <div className="font-extrabold text-sm text-bbs-green-dark  mb-3.5">⚠ Stok Menipis</div>
          {lowStock.length === 0 ? (
            <div className="text-gray-300 text-[13px] text-center py-5">✅ Semua stok aman</div>
          ) : lowStock.slice(0, 7).map((p) => (
            <div key={p.id} className="flex justify-between py-2 border-b border-[#f0f5f0] ">
              <div>
                <div className="font-bold text-[13px]">{p.name}</div>
                <div className="text-[10px] text-gray-400">{p.category}</div>
              </div>
              <div className="text-right">
                <div className={`font-extrabold text-[15px] ${p.stock === 0 ? "text-red-500" : "text-orange-500"}`}>{p.stock} {(p.unit || "").split(",")[0]}</div>
                <div className="text-[9px] text-gray-300">min:{p.min_stock}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity log */}
      <div className="mt-4 bg-white  rounded-xl border border-bbs-border ">
        <div className="px-5 py-4 border-b border-bbs-border  flex justify-between items-center">
          <div className="font-extrabold text-sm text-bbs-green-dark ">📋 Aktivitas Terbaru</div>
          <div className="text-[11px] text-gray-400">30 aktivitas terakhir</div>
        </div>
        {activityLogs.length === 0 ? (
          <div className="p-6 text-center text-gray-300 text-[13px]">Belum ada aktivitas tercatat</div>
        ) : (
          <div className="max-h-[320px] overflow-y-auto">
            {activityLogs.map((log) => {
              const clr = ACTIVITY_COLORS[log.aksi] || { bg: "#f5f5f5", c: "#666" };
              const tgl = new Date(log.created_at);
              const roleLabel = log.user_role === "superadmin" ? "👑 Super Admin" : log.user_role === "admin" ? "🛡️ Admin" : "👤 Pegawai";
              const roleCls = log.user_role === "superadmin" ? "bg-purple-100 text-purple-800" : log.user_role === "admin" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-800";
              return (
                <div key={log.id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50  hover:bg-green-50  transition-colors">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0" style={{ background: clr.bg }}>
                    {ACTIVITY_ICONS[log.kategori] || "📝"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold" style={{ background: clr.bg, color: clr.c }}>{log.aksi}</span>
                      <span className="text-xs font-bold text-gray-700 ">{log.user_nama}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${roleCls}`}>{roleLabel}</span>
                    </div>
                    {log.detail && <div className="text-xs text-gray-400 truncate">{log.detail}</div>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[11px] text-gray-500 font-semibold">{tgl.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</div>
                    <div className="text-[10px] text-gray-300">{tgl.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</div>
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
