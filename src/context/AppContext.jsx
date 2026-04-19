import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { sb } from '../config/supabase';
import { fmt, canVoid, validateVoidReason } from '../utils/constants';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

export function AppProvider({ currentUser, isOffline, children }) {
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [kategoris, setKategoris] = useState([]);
  const [satuans, setSatuans] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [restockLogs, setRestockLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState(null);
  const [realtimeUsers, setRealtimeUsers] = useState([]);

  const showNotif = useCallback((msg, type = 'success') => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 3200);
  }, []);

  const logActivity = useCallback(async (aksi, kategori, detail = '') => {
    try {
      await sb.from('activity_logs').insert({
        user_nama: currentUser.nama,
        user_role: currentUser.role,
        aksi, kategori, detail,
      });
    } catch (e) {
      console.error('Log error:', e);
    }
  }, [currentUser]);

  const sendStockNotif = useCallback(async (prods) => {
    try {
      const { data: settingsData } = await sb.from('settings').select('*');
      if (!settingsData) return;
      const cfg = {};
      settingsData.forEach(s => { cfg[s.key] = s.value; });
      if (cfg.notif_tg_enabled !== 'true') return;
      const habis = prods.filter(p => Number(p.stock) === 0);
      if (!habis.length) return;
      const today = new Date().toISOString().slice(0, 10);
      const cacheKey = `bbs_notif_sent_${today}`;
      const alreadySent = JSON.parse(localStorage.getItem(cacheKey) || '[]').map(String);
      const belumDinotif = habis.filter(p => !alreadySent.includes(String(p.id)));
      if (!belumDinotif.length) return;
      localStorage.setItem(cacheKey, JSON.stringify([...alreadySent, ...belumDinotif.map(p => String(p.id))]));
      if (!cfg.notif_tg_bot_token || !cfg.notif_tg_chat_id) return;
      const now = new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });
      const tgMsg = `🌿 <b>BerkahBirdShop - Peringatan Stok!</b>\n━━━━━━━━━━━━━━━━\n🚨 <b>${belumDinotif.length} Produk Stok HABIS</b>\n\n${belumDinotif.map((p, i) => `${i + 1}. ❌ ${p.name}`).join('\n')}\n\n━━━━━━━━━━━━━━━━\n📅 ${now}\n\n⚡ Segera lakukan restock!\n\n<i>Notifikasi otomatis dari sistem Toko BBS</i>`;
      await fetch(`https://api.telegram.org/bot${cfg.notif_tg_bot_token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: cfg.notif_tg_chat_id, text: tgMsg, parse_mode: 'HTML' }),
      });
    } catch (e) {
      console.error('Notif error:', e);
    }
  }, []);

  const loadFromCache = useCallback(() => {
    const cachedProds = JSON.parse(localStorage.getItem('bbs_offline_products') || '[]');
    const cachedCats = JSON.parse(localStorage.getItem('bbs_offline_cats') || '[]');
    const cachedUnits = JSON.parse(localStorage.getItem('bbs_offline_units') || '[]');
    const cachedSup = JSON.parse(localStorage.getItem('bbs_offline_suppliers') || '[]');
    setProducts(cachedProds);
    setKategoris(cachedCats);
    setSatuans(cachedUnits);
    if (cachedSup.length > 0) setSuppliers(cachedSup);
    return cachedProds.length > 0;
  }, []);

  const loadAll = useCallback(async (forceOffline = false) => {
    setLoading(true);
    if (forceOffline || !navigator.onLine) {
      setProducts(prev => prev.length > 0 ? prev : JSON.parse(localStorage.getItem('bbs_offline_products') || '[]'));
      setKategoris(prev => prev.length > 0 ? prev : JSON.parse(localStorage.getItem('bbs_offline_cats') || '[]'));
      setSatuans(prev => prev.length > 0 ? prev : JSON.parse(localStorage.getItem('bbs_offline_units') || '[]'));
      setSuppliers(prev => prev.length > 0 ? prev : JSON.parse(localStorage.getItem('bbs_offline_suppliers') || '[]'));
      const cachedCount = JSON.parse(localStorage.getItem('bbs_offline_products') || '[]').length;
      showNotif(
        cachedCount > 0 ? 'Mode Offline: Menggunakan data tersimpan.' : 'Mode Offline: Belum ada data. Sambungkan internet lalu refresh.',
        cachedCount > 0 ? 'info' : 'error'
      );
      setLoading(false);
      return;
    }
    try {
      // Sync offline queue
      const queue = JSON.parse(localStorage.getItem('bbs_offline_queue') || '[]');
      if (queue.length > 0) {
        try {
          for (const q of queue) {
            const { trx, trxItems } = q;
            const { id, ...trxPayload } = trx;
            const { data: newTrx, error: e1 } = await sb.from('transactions').insert(trxPayload).select().single();
            if (!e1 && newTrx) {
              const itemsPayload = trxItems.map(ti => { const { transaction_id, ...rest } = ti; return { ...rest, transaction_id: newTrx.id }; });
              await sb.from('transaction_items').insert(itemsPayload);
              for (const i of trxItems) {
                const { data: pData } = await sb.from('products').select('stock').eq('id', i.product_id).single();
                if (pData) await sb.from('products').update({ stock: pData.stock - i.qty }).eq('id', i.product_id);
              }
            }
          }
          localStorage.removeItem('bbs_offline_queue');
        } catch (syncErr) { console.error('Sync error:', syncErr); }
      }

      // Auto-delete log lama
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 31);
      sb.from('activity_logs').delete().lt('created_at', cutoffDate.toISOString()).then(() => {}).catch(() => {});

      const fetchWithTimeout = Promise.all([
        sb.from('products').select('*').order('name'),
        sb.from('suppliers').select('*').order('name'),
        sb.from('transactions').select('*, transaction_items(*)').order('date', { ascending: false }).order('id', { ascending: false }).limit(500),
        sb.from('kategoris').select('*').order('nama'),
        sb.from('satuans').select('*').order('nama'),
        sb.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(30),
        sb.from('restock_logs').select('*').order('created_at', { ascending: false }).limit(100),
      ]);

      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 8000));

      const [
        { data: prods },
        { data: sups },
        { data: trxs },
        { data: kats },
        { data: sats },
        { data: acts },
        { data: rlogs },
      ] = await Promise.race([fetchWithTimeout, timeoutPromise]);

      if (prods) { setProducts(prods); localStorage.setItem('bbs_offline_products', JSON.stringify(prods)); sendStockNotif(prods); }
      if (sups) { setSuppliers(sups); localStorage.setItem('bbs_offline_suppliers', JSON.stringify(sups)); }
      if (kats) { setKategoris(kats); localStorage.setItem('bbs_offline_cats', JSON.stringify(kats)); }
      if (sats) { setSatuans(sats); localStorage.setItem('bbs_offline_units', JSON.stringify(sats)); }
      if (acts) setActivityLogs(acts);
      if (rlogs) setRestockLogs(rlogs);
      // Gunakan relasi Supabase langsung (transaction_items sudah di-join)
      if (trxs) {
        setTransactions(trxs.map(t => ({ ...t, items: t.transaction_items || [] })));
      }
    } catch (e) {
      console.error('LoadAll Error:', e);
      try {
        const hasData = loadFromCache();
        showNotif(hasData ? 'Koneksi bermasalah. Menggunakan data offline.' : 'Gagal terhubung ke server. Periksa koneksi Anda.', hasData ? 'info' : 'error');
      } catch { showNotif('Gagal terhubung ke server.', 'error'); }
    }
    setLoading(false);
  }, [loadFromCache, sendStockNotif, showNotif]);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (isOffline) {
      setProducts(prev => prev.length > 0 ? prev : JSON.parse(localStorage.getItem('bbs_offline_products') || '[]'));
      setKategoris(prev => prev.length > 0 ? prev : JSON.parse(localStorage.getItem('bbs_offline_cats') || '[]'));
      setSatuans(prev => prev.length > 0 ? prev : JSON.parse(localStorage.getItem('bbs_offline_units') || '[]'));
      setSuppliers(prev => prev.length > 0 ? prev : JSON.parse(localStorage.getItem('bbs_offline_suppliers') || '[]'));
    } else {
      loadAll();
    }
  }, [isOffline]);

  // Realtime
  useEffect(() => {
    if (isOffline) return;
    const channel = sb.channel('bbs-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => loadAll())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, (payload) => {
        showNotif(`🔔 Transaksi baru dari kasir lain: ${payload.new?.trx_code || ''}`, 'info');
        loadAll();
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setRealtimeUsers(Object.values(state).flat());
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user: currentUser.nama, role: currentUser.role, online_at: new Date().toISOString() });
        }
      });
    return () => { sb.removeChannel(channel); };
  }, [isOffline]);

  const voidTransaction = useCallback(async (trxId, alasan) => {
    const trx = transactions.find(t => t.id === trxId);
    if (!trx) throw new Error('Transaksi tidak ditemukan.');
    if (!canVoid(currentUser, trx)) {
      if (trx.status === 'void') throw new Error('Transaksi ini sudah dibatalkan.');
      if (currentUser.role === 'pegawai') throw new Error('Anda tidak memiliki izin untuk membatalkan transaksi.');
      throw new Error('Hanya transaksi hari ini yang dapat dibatalkan oleh Admin.');
    }
    if (!validateVoidReason(alasan)) throw new Error('Alasan void wajib diisi.');

    // 1. Update status transaksi
    const { error: e1 } = await sb.from('transactions').update({
      status: 'void',
      void_reason: alasan.trim(),
      voided_by: currentUser.nama,
      voided_at: new Date().toISOString(),
    }).eq('id', trxId);
    if (e1) throw new Error('Gagal membatalkan transaksi. Silakan coba lagi.');

    // 2. Kembalikan stok setiap item
    const items = trx.items || [];
    for (const item of items) {
      if (!item.product_id) continue;
      const { data: pData } = await sb.from('products').select('stock').eq('id', item.product_id).single();
      if (pData) {
        await sb.from('products').update({ stock: pData.stock + item.qty }).eq('id', item.product_id);
      }
    }

    // 3. Catat activity log (non-blocking)
    try {
      await sb.from('activity_logs').insert({
        user_nama: currentUser.nama,
        user_role: currentUser.role,
        aksi: 'Void Transaksi',
        kategori: 'Kasir',
        detail: `${trx.trx_code} - ${trx.customer} - ${fmt(trx.total)} | Alasan: ${alasan.trim()}`,
      });
    } catch (e) { console.error('Log void error:', e); }

    await loadAll();
  }, [currentUser, transactions, loadAll]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayTrx = useMemo(() => transactions.filter(t => t.date === todayStr && t.status !== 'void'), [transactions, todayStr]);
  const todayRev = useMemo(() => todayTrx.reduce((s, t) => s + t.total, 0), [todayTrx]);
  const weekStart = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const weekTrx = useMemo(() => transactions.filter(t => t.date >= weekStart && t.status !== 'void'), [transactions, weekStart]);
  const weekRev = useMemo(() => weekTrx.reduce((s, t) => s + t.total, 0), [weekTrx]);
  const outStock = useMemo(() => products.filter(p => Number(p.stock) === 0), [products]);
  const lowStock = useMemo(() => products.filter(p => Number(p.stock) > 0 && Number(p.stock) <= Number(p.min_stock)), [products]);

  return (
    <AppContext.Provider value={{
      products, setProducts, transactions, setTransactions,
      suppliers, setSuppliers, kategoris, satuans,
      activityLogs, restockLogs, loading, setLoading,
      notif, showNotif, logActivity, sendStockNotif, loadAll,
      todayTrx, todayRev, weekTrx, weekRev, outStock, lowStock,
      realtimeUsers, voidTransaction,
    }}>
      {children}
    </AppContext.Provider>
  );
}
