import React, { useState, useEffect } from 'react';
import styles from '../styles/App.module.css';

export default function SettingsPage({ sb, showNotif, products, transactions, suppliers, kategoris, satuans, onRestore }) {
  const [settings, setSettings] = useState({
    notif_tg_bot_token: '', notif_tg_chat_id: '', notif_tg_enabled: 'false',
  });
  const [saving, setSaving] = useState(false);
  const [testingTg, setTestingTg] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [showTgToken, setShowTgToken] = useState(false);

  useEffect(() => {
    sb.from('settings').select('*').then(({ data }) => {
      if (data) {
        const map = {};
        data.forEach(s => { map[s.key] = s.value; });
        setSettings(prev => ({ ...prev, ...map }));
      }
    });
  }, []);

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        await sb.from('settings').upsert({ key, value }, { onConflict: 'key' });
      }
      showNotif('Pengaturan disimpan!');
    } catch (e) {
      showNotif('Gagal menyimpan: ' + e.message, 'error');
    }
    setSaving(false);
  };

  const testTelegram = async () => {
    if (!settings.notif_tg_bot_token || !settings.notif_tg_chat_id) {
      showNotif('Isi Bot Token dan Chat ID terlebih dahulu!', 'error');
      return;
    }
    setTestingTg(true);
    try {
      const now = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });
      const msg = `🌿 <b>BerkahBirdShop</b>\n━━━━━━━━━━━━━━━━\n✅ <b>Notifikasi Telegram Aktif!</b>\n\nSistem notifikasi Toko BBS berhasil terhubung.\n\n📅 ${now}\n\n<i>Pesan ini dikirim otomatis oleh sistem Toko BBS.</i>`;
      const res = await fetch(`https://api.telegram.org/bot${settings.notif_tg_bot_token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: settings.notif_tg_chat_id, text: msg, parse_mode: 'HTML' }),
      });
      const data = await res.json();
      if (data.ok) {
        const today = new Date().toISOString().slice(0, 10);
        localStorage.removeItem(`bbs_notif_sent_${today}`);
        showNotif('✅ Pesan Telegram terkirim!');
      } else {
        showNotif('Gagal: ' + (data.description || 'Unknown'), 'error');
      }
    } catch (e) {
      showNotif('Error: ' + e.message, 'error');
    }
    setTestingTg(false);
  };

  const handleBackup = () => {
    const backup = { version: '1.0', exported_at: new Date().toISOString(), products, transactions, suppliers, kategoris, satuans };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BBS_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotif('Backup berhasil diunduh!');
  };

  const handleRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!window.confirm('⚠️ Restore akan MENIMPA data produk, supplier, kategori, dan satuan yang ada. Lanjutkan?')) { e.target.value = ''; return; }
    setRestoring(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.version || !data.products) throw new Error('File backup tidak valid!');
        if (data.kategoris?.length) for (const k of data.kategoris) { const { id, created_at, ...p } = k; await sb.from('kategoris').upsert(p, { onConflict: 'nama' }); }
        if (data.satuans?.length) for (const s of data.satuans) { const { id, created_at, ...p } = s; await sb.from('satuans').upsert(p, { onConflict: 'nama' }); }
        if (data.suppliers?.length) for (const s of data.suppliers) { const { id, created_at, ...p } = s; await sb.from('suppliers').upsert(p, { onConflict: 'name' }); }
        if (data.products?.length) for (const p of data.products) { const { id, created_at, updated_at, ...payload } = p; await sb.from('products').upsert(payload, { onConflict: 'name' }); }
        showNotif(`Restore selesai! ${data.products?.length || 0} produk dipulihkan.`);
        onRestore();
      } catch (err) { showNotif('Gagal restore: ' + err.message, 'error'); }
      setRestoring(false);
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

      {/* NOTIFIKASI TELEGRAM */}
      <div className={styles.card}>
        <div style={{ fontWeight: 800, fontSize: 15, color: "#1a4a1a", marginBottom: 4 }}>✈️ Notifikasi Telegram</div>
        <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>Kirim peringatan stok habis via Telegram Bot secara instan</div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#555", marginBottom: 4 }}>Status Notifikasi</label>
          <div style={{ display: "flex", gap: 8 }}>
            {['true', 'false'].map(v => (
              <button key={v} onClick={() => setSettings(s => ({ ...s, notif_tg_enabled: v }))}
                style={{ padding: "6px 18px", borderRadius: 8, border: `2px solid ${settings.notif_tg_enabled === v ? '#0088cc' : '#ddd'}`, background: settings.notif_tg_enabled === v ? '#e3f2fd' : '#fff', color: settings.notif_tg_enabled === v ? '#0088cc' : '#666', fontWeight: settings.notif_tg_enabled === v ? 800 : 500, fontSize: 12, cursor: "pointer" }}>
                {v === 'true' ? '✅ Aktif' : '❌ Nonaktif'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#555", marginBottom: 4 }}>
            Bot Token
            <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" style={{ marginLeft: 6, fontSize: 10, color: "#0088cc" }}>@BotFather →</a>
          </label>
          <div style={{ position: "relative" }}>
            <input className={styles.inp}
              style={{ filter: showTgToken ? "none" : "blur(4px)", transition: "filter 0.2s", userSelect: showTgToken ? "auto" : "none" }}
              type="text"
              placeholder="123456789:ABCdef..."
              value={settings.notif_tg_bot_token}
              onFocus={() => setShowTgToken(true)}
              onBlur={() => setShowTgToken(false)}
              onChange={(e) => setSettings(s => ({ ...s, notif_tg_bot_token: e.target.value }))} />
            {!showTgToken && settings.notif_tg_bot_token && (
              <div onClick={() => setShowTgToken(true)} style={{ position: "absolute", inset: 0, cursor: "pointer", borderRadius: 8 }} />
            )}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#555", marginBottom: 4 }}>
            Chat ID
            <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" style={{ marginLeft: 6, fontSize: 10, color: "#0088cc" }}>@userinfobot →</a>
          </label>
          <input className={styles.inp} placeholder="123456789"
            value={settings.notif_tg_chat_id} onChange={(e) => setSettings(s => ({ ...s, notif_tg_chat_id: e.target.value }))} />
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", background: "#0088cc", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
            onClick={testTelegram} disabled={testingTg}>
            {testingTg ? '⏳...' : '✈️ Test Telegram'}
          </button>
          <button className={`${styles.btn} ${styles.btnprimary}`} style={{ flex: 1, padding: 10 }} onClick={saveAll} disabled={saving}>
            {saving ? '⏳...' : '💾 Simpan'}
          </button>
        </div>

        <div style={{ padding: "10px 12px", background: "#e3f2fd", borderRadius: 8, fontSize: 11, color: "#1565c0" }}>
          <strong>Cara setup:</strong><br />
          1. Chat <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" style={{ color: "#0088cc" }}>@BotFather</a> → /newbot → copy token<br />
          2. Chat <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" style={{ color: "#0088cc" }}>@userinfobot</a> → copy Chat ID<br />
          3. Isi keduanya → Test → Simpan
        </div>
      </div>

      {/* BACKUP & RESTORE */}
      <div>
        <div className={styles.card} style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#1a4a1a", marginBottom: 4 }}>💾 Backup Data</div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>Unduh semua data ke file JSON sebagai cadangan</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
            {[
              { label: "Produk", count: products.length, color: "#1565c0", bg: "#e3f2fd" },
              { label: "Transaksi", count: transactions.length, color: "#2e7d32", bg: "#e8f5e9" },
              { label: "Supplier", count: suppliers.length, color: "#e65100", bg: "#fff8e1" },
              { label: "Kategori", count: kategoris.length, color: "#6a1b9a", bg: "#f3e5f5" },
            ].map(item => (
              <div key={item.label} style={{ background: item.bg, borderRadius: 8, padding: "8px 12px", border: `1px solid ${item.color}22` }}>
                <div style={{ fontSize: 10, color: item.color, fontWeight: 800 }}>{item.label}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: item.color }}>{item.count}</div>
              </div>
            ))}
          </div>
          <button className={`${styles.btn} ${styles.btnprimary}`} style={{ width: "100%", padding: 11 }} onClick={handleBackup}>
            📥 Download Backup (.json)
          </button>
        </div>

        <div className={styles.card}>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#1a4a1a", marginBottom: 4 }}>📤 Restore Data</div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>Upload file backup .json untuk memulihkan data</div>
          <div style={{ padding: "12px", background: "#fff8e1", borderRadius: 8, border: "1px solid #fde68a", marginBottom: 12, fontSize: 11, color: "#92400e" }}>
            ⚠️ Restore akan menimpa data produk, supplier, kategori, dan satuan. Transaksi tidak terpengaruh.
          </div>
          <input type="file" accept=".json" onChange={handleRestore} style={{ display: "none" }} id="restore-input" />
          <button className={`${styles.btn} ${styles.btnwarning}`} style={{ width: "100%", padding: 11 }}
            onClick={() => document.getElementById('restore-input').click()} disabled={restoring}>
            {restoring ? '⏳ Memulihkan data...' : '📤 Upload File Backup'}
          </button>
        </div>
      </div>
    </div>
  );
}
