import React, { useState, useEffect } from 'react';
import styles from '../styles/App.module.css';

export default function SettingsPage({ sb, showNotif, products, transactions, suppliers, kategoris, satuans, onRestore }) {
  const [settings, setSettings] = useState({ notif_wa_token: '', notif_wa_number: '', notif_email: '', notif_enabled: 'false' });
  const [saving, setSaving] = useState(false);
  const [testingWa, setTestingWa] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    sb.from('settings').select('*').then(({ data }) => {
      if (data) {
        const map = {};
        data.forEach(s => { map[s.key] = s.value; });
        setSettings(prev => ({ ...prev, ...map }));
      }
    });
  }, []);

  const saveSetting = async (key, value) => {
    await sb.from('settings').upsert({ key, value }, { onConflict: 'key' });
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        await saveSetting(key, value);
      }
      showNotif('Pengaturan disimpan!');
    } catch (e) {
      showNotif('Gagal menyimpan: ' + e.message, 'error');
    }
    setSaving(false);
  };

  const testWA = async () => {
    if (!settings.notif_wa_token || !settings.notif_wa_number) {
      showNotif('Isi Token dan Nomor WA terlebih dahulu!', 'error');
      return;
    }
    setTestingWa(true);
    try {
      // Auto-format nomor
      let nomorWA = settings.notif_wa_number.trim().replace(/\s+/g, '');
      if (nomorWA.startsWith('0')) nomorWA = '62' + nomorWA.slice(1);
      if (nomorWA.startsWith('+')) nomorWA = nomorWA.slice(1);

      const now = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });
      const msg = `🌿 *BerkahBirdShop*\n━━━━━━━━━━━━━━━━\n✅ *Notifikasi Aktif!*\n\nSistem notifikasi Toko BBS berhasil terhubung dan siap digunakan.\n\n📅 ${now}\n\n_Pesan ini dikirim otomatis oleh sistem Toko BBS._`;
      const res = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { 'Authorization': settings.notif_wa_token },
        body: new URLSearchParams({ target: nomorWA, message: msg }),
      });
      const data = await res.json();
      if (data.status) {
        // Reset cache notif agar bisa kirim lagi
        const today = new Date().toISOString().slice(0, 10);
        localStorage.removeItem(`bbs_notif_sent_${today}`);
        showNotif('✅ Pesan WA terkirim!');
      } else {
        showNotif('Gagal kirim WA: ' + (data.reason || 'Unknown'), 'error');
      }
    } catch (e) {
      showNotif('Error: ' + e.message, 'error');
    }
    setTestingWa(false);
  };

  // BACKUP
  const handleBackup = () => {
    const backup = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      products, transactions, suppliers, kategoris, satuans,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BBS_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotif('Backup berhasil diunduh!');
  };

  // RESTORE
  const handleRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!window.confirm('⚠️ Restore akan MENIMPA data produk, supplier, kategori, dan satuan yang ada. Lanjutkan?')) {
      e.target.value = '';
      return;
    }
    setRestoring(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.version || !data.products) throw new Error('File backup tidak valid!');

        // Restore kategoris
        if (data.kategoris?.length) {
          for (const k of data.kategoris) {
            const { id, created_at, ...payload } = k;
            await sb.from('kategoris').upsert(payload, { onConflict: 'nama' });
          }
        }
        // Restore satuans
        if (data.satuans?.length) {
          for (const s of data.satuans) {
            const { id, created_at, ...payload } = s;
            await sb.from('satuans').upsert(payload, { onConflict: 'nama' });
          }
        }
        // Restore suppliers
        if (data.suppliers?.length) {
          for (const s of data.suppliers) {
            const { id, created_at, ...payload } = s;
            await sb.from('suppliers').upsert(payload, { onConflict: 'name' });
          }
        }
        // Restore products (tanpa image_url agar tidak overwrite)
        if (data.products?.length) {
          for (const p of data.products) {
            const { id, created_at, updated_at, ...payload } = p;
            await sb.from('products').upsert(payload, { onConflict: 'name' });
          }
        }

        showNotif(`Restore selesai! ${data.products?.length || 0} produk dipulihkan.`);
        onRestore();
      } catch (err) {
        showNotif('Gagal restore: ' + err.message, 'error');
      }
      setRestoring(false);
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

      {/* NOTIFIKASI */}
      <div className={styles.card}>
        <div style={{ fontWeight: 800, fontSize: 15, color: "#1a4a1a", marginBottom: 4 }}>🔔 Notifikasi Stok Habis</div>
        <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>Kirim peringatan otomatis via WhatsApp saat ada produk stok habis</div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#555", marginBottom: 4 }}>Aktifkan Notifikasi</label>
          <div style={{ display: "flex", gap: 8 }}>
            {['true', 'false'].map(v => (
              <button key={v} onClick={() => setSettings(s => ({ ...s, notif_enabled: v }))}
                style={{ padding: "6px 18px", borderRadius: 8, border: `2px solid ${settings.notif_enabled === v ? '#2d7a2d' : '#ddd'}`, background: settings.notif_enabled === v ? '#e8f5e9' : '#fff', color: settings.notif_enabled === v ? '#1a4a1a' : '#666', fontWeight: settings.notif_enabled === v ? 800 : 500, fontSize: 12, cursor: "pointer" }}>
                {v === 'true' ? '✅ Aktif' : '❌ Nonaktif'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#555", marginBottom: 4 }}>
            Token Fonnte API
            <a href="https://fonnte.com" target="_blank" rel="noreferrer" style={{ marginLeft: 6, fontSize: 10, color: "#1565c0" }}>Daftar di fonnte.com →</a>
          </label>
          <input className={styles.inp} placeholder="Token dari dashboard Fonnte..."
            value={settings.notif_wa_token} onChange={(e) => setSettings(s => ({ ...s, notif_wa_token: e.target.value }))} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#555", marginBottom: 4 }}>Nomor WA Pemilik (format: 628xxx)</label>
          <input className={styles.inp} placeholder="628123456789"
            value={settings.notif_wa_number} onChange={(e) => setSettings(s => ({ ...s, notif_wa_number: e.target.value }))} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#555", marginBottom: 4 }}>Email Pemilik (opsional)</label>
          <input className={styles.inp} type="email" placeholder="email@toko.com"
            value={settings.notif_email} onChange={(e) => setSettings(s => ({ ...s, notif_email: e.target.value }))} />
          <div style={{ fontSize: 10, color: "#aaa", marginTop: 4 }}>Klik link mailto — buka email client otomatis</div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className={`${styles.btn} ${styles.btnprimary}`} style={{ flex: 1, padding: 10 }} onClick={saveAll} disabled={saving}>
            {saving ? '⏳ Menyimpan...' : '💾 Simpan'}
          </button>
          <button className={`${styles.btn} ${styles.btnblue}`} style={{ flex: 1, padding: 10 }} onClick={testWA} disabled={testingWa}>
            {testingWa ? '⏳...' : '📱 Test WA'}
          </button>
        </div>

        {settings.notif_email && (
          <a href={`mailto:${settings.notif_email}?subject=Test Notifikasi BBS&body=Test email dari Toko BBS`}
            style={{ display: "block", marginTop: 8, textAlign: "center", fontSize: 12, color: "#1565c0" }}>
            📧 Test Email →
          </a>
        )}

        <div style={{ marginTop: 14, padding: "10px 12px", background: "#f8fdf8", borderRadius: 8, border: "1px solid #e4ede4", fontSize: 11, color: "#666" }}>
          <strong>Cara kerja:</strong> Setiap kali app dibuka atau refresh, sistem otomatis cek produk stok habis. Jika ada dan notifikasi aktif, pesan WA dikirim ke nomor pemilik.
        </div>
      </div>

      {/* BACKUP & RESTORE */}
      <div>
        <div className={styles.card} style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#1a4a1a", marginBottom: 4 }}>💾 Backup Data</div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>Unduh semua data ke file JSON sebagai cadangan</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14, fontSize: 12 }}>
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
          <div style={{ padding: "14px", background: "#fff8e1", borderRadius: 8, border: "1px solid #fde68a", marginBottom: 12, fontSize: 11, color: "#92400e" }}>
            ⚠️ Restore akan menimpa data produk, supplier, kategori, dan satuan yang ada. Transaksi tidak akan terpengaruh.
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
