import { useState, useEffect } from 'react';
import styles from '../styles/App.module.css';

export default function AuditLogPage({ sb }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterUser, setFilterUser] = useState('Semua');
  const [filterAksi, setFilterAksi] = useState('Semua');
  const [page, setPage] = useState(1);
  const PER_PAGE = 30;

  useEffect(() => {
    setLoading(true);
    sb.from('activity_logs')
      .select('*')
      .in('aksi', ['Login', 'Logout'])
      .order('created_at', { ascending: false })
      .limit(500)
      .then(({ data }) => {
        setLogs(data || []);
        setLoading(false);
      });
  }, []);

  const users = ['Semua', ...Array.from(new Set(logs.map(l => l.user_nama))).sort()];
  const aksiList = ['Semua', 'Login', 'Logout'];

  const filtered = logs.filter(l => {
    const ms = filterUser === 'Semua' || l.user_nama === filterUser;
    const ma = filterAksi === 'Semua' || l.aksi === filterAksi;
    const mq = !search || l.user_nama?.toLowerCase().includes(search.toLowerCase()) || l.detail?.toLowerCase().includes(search.toLowerCase());
    return ms && ma && mq;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const exportExcel = async () => {
    try {
      const XL = await import('xlsx');
      const wb = XL.utils.book_new();
      XL.utils.book_append_sheet(wb, XL.utils.json_to_sheet(
        filtered.map(l => ({
          Waktu: new Date(l.created_at).toLocaleString('id-ID'),
          User: l.user_nama,
          Role: l.user_role,
          Aksi: l.aksi,
          Detail: l.detail,
        }))
      ), "Audit Login");
      XL.writeFile(wb, `BBS_AuditLogin_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e) { console.error(e); }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4 items-center flex-wrap">
        <input className={`${styles.inp} max-w-[200px]`} placeholder="🔍 Cari user / detail..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <select className={`${styles.inp} w-[150px]`} value={filterUser} onChange={e => { setFilterUser(e.target.value); setPage(1); }}>
          {users.map(u => <option key={u}>{u}</option>)}
        </select>
        <select className={`${styles.inp} w-[120px]`} value={filterAksi} onChange={e => { setFilterAksi(e.target.value); setPage(1); }}>
          {aksiList.map(a => <option key={a}>{a}</option>)}
        </select>
        <span className="text-xs text-gray-400">{filtered.length} entri</span>
        <button className="ml-auto px-4 py-1.5 rounded-lg text-xs font-bold bg-[#1565c0] text-white border-none cursor-pointer"
          onClick={exportExcel} disabled={filtered.length === 0}>
          📥 Export Excel
        </button>
      </div>

      <div className="bg-white rounded-xl border border-bbs-border overflow-auto">
        <table className="w-full border-collapse" style={{ minWidth: 600 }}>
          <thead>
            <tr>{["Waktu", "User", "Role", "Aksi", "Detail"].map(h => <th key={h} className={styles.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className={`${styles.td} text-center text-gray-300 py-8`}>Memuat data...</td></tr>
            ) : paged.map(l => {
              const isLogin = l.aksi === 'Login';
              return (
                <tr key={l.id} className="bg-white hover:bg-green-50 transition-colors">
                  <td className={`${styles.td} whitespace-nowrap`}>
                    <div className="text-xs">{new Date(l.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    <div className="text-[10px] text-gray-400">{new Date(l.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                  </td>
                  <td className={styles.td}><strong>{l.user_nama}</strong></td>
                  <td className={styles.td}>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${l.user_role === 'superadmin' ? 'bg-purple-100 text-purple-700' : l.user_role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {l.user_role === 'superadmin' ? '👑 Super Admin' : l.user_role === 'admin' ? '🛡️ Admin' : '👤 Pegawai'}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${isLogin ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {isLogin ? '🟢 Login' : '🔴 Logout'}
                    </span>
                  </td>
                  <td className={`${styles.td} text-[11px] text-gray-500`}>{l.detail || '—'}</td>
                </tr>
              );
            })}
            {!loading && paged.length === 0 && (
              <tr><td colSpan={5} className={`${styles.td} text-center text-gray-300 py-8`}>Tidak ada data</td></tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-bbs-border flex justify-between items-center flex-wrap gap-2">
            <span className="text-[13px] text-gray-400">{filtered.length} entri · halaman {page} dari {totalPages}</span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(1)} disabled={page === 1} className="px-3 py-1 text-xs font-bold rounded-lg bg-[#e8f0e8] text-bbs-green border-none cursor-pointer disabled:opacity-40">«</button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-xs font-bold rounded-lg bg-[#e8f0e8] text-bbs-green border-none cursor-pointer disabled:opacity-40">‹</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 text-xs font-bold rounded-lg bg-[#e8f0e8] text-bbs-green border-none cursor-pointer disabled:opacity-40">›</button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-3 py-1 text-xs font-bold rounded-lg bg-[#e8f0e8] text-bbs-green border-none cursor-pointer disabled:opacity-40">»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
