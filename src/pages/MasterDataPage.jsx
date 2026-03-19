import React, { useState } from "react";
import styles from "../styles/MasterDataPage.module.css";

function MasterDataPage({
  sb,
  showNotif,
  kategoris,
  satuans,
  onReload,
  logActivity,
}) {
  const [tab, setTab] = useState("kategori");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    nama: "",
    warna_bg: "#e8f5e9",
    warna_text: "#2e7d32",
    keterangan: "",
  });

  const WARNA_PRESETS = [
    { bg: "#e8f5e9", c: "#2e7d32", label: "Hijau" },
    { bg: "#fff8e1", c: "#e65100", label: "Oranye" },
    { bg: "#e3f2fd", c: "#1565c0", label: "Biru" },
    { bg: "#fce4ec", c: "#c62828", label: "Merah" },
    { bg: "#f3e5f5", c: "#6a1b9a", label: "Ungu" },
    { bg: "#e0f2f1", c: "#00695c", label: "Teal" },
    { bg: "#fff3e0", c: "#e65100", label: "Amber" },
    { bg: "#e8eaf6", c: "#283593", label: "Indigo" },
    { bg: "#fafafa", c: "#424242", label: "Abu" },
  ];

  const saveKategori = async () => {
    if (!form.nama) {
      showNotif("Nama kategori wajib diisi!", "error");
      return;
    }
    try {
      if (modal === "add") {
        const { error } = await sb.from("kategoris").insert({
          nama: form.nama,
          warna_bg: form.warna_bg,
          warna_text: form.warna_text,
        });
        if (error) throw error;
        if (logActivity)
          await logActivity(
            "Tambah Kategori",
            "Master Data",
            `Kategori: ${form.nama}`,
          );
        showNotif("Kategori ditambahkan!");
      } else {
        const oldKat = kategoris.find((k) => k.id === modal.id);
        const { error } = await sb
          .from("kategoris")
          .update({
            nama: form.nama,
            warna_bg: form.warna_bg,
            warna_text: form.warna_text,
          })
          .eq("id", modal.id);
        if (error) throw error;
        const katChanges = [];
        if (oldKat?.nama !== form.nama)
          katChanges.push(`nama: "${oldKat?.nama}" → "${form.nama}"`);
        if (oldKat?.warna_bg !== form.warna_bg)
          katChanges.push(`warna diubah`);
        const katDetail =
          katChanges.length > 0
            ? `${form.nama}: ${katChanges.join(", ")}`
            : `${form.nama} (tidak ada perubahan)`;
        if (logActivity)
          await logActivity("Edit Kategori", "Master Data", katDetail);
        showNotif("Kategori diperbarui!");
      }
      await onReload();
      setModal(null);
    } catch (e) {
      showNotif("Error: " + e.message, "error");
    }
  };

  const delKategori = async (id) => {
    if (!window.confirm("Hapus kategori ini?")) return;
    const kat = kategoris.find((k) => k.id === id);
    const { error } = await sb.from("kategoris").delete().eq("id", id);
    if (error) {
      showNotif("Gagal hapus: " + error.message, "error");
      return;
    }
    if (logActivity)
      await logActivity(
        "Hapus Kategori",
        "Master Data",
        `Kategori: ${kat?.nama || ""}`,
      );
    await onReload();
    showNotif("Kategori dihapus!");
  };

  const saveSatuan = async () => {
    if (!form.nama) {
      showNotif("Nama satuan wajib diisi!", "error");
      return;
    }
    try {
      if (modal === "add") {
        const { error } = await sb
          .from("satuans")
          .insert({ nama: form.nama, keterangan: form.keterangan });
        if (error) throw error;
        if (logActivity)
          await logActivity(
            "Tambah Satuan",
            "Master Data",
            `Satuan: ${form.nama}`,
          );
        showNotif("Satuan ditambahkan!");
      } else {
        const oldSat = satuans.find((s) => s.id === modal.id);
        const { error } = await sb
          .from("satuans")
          .update({ nama: form.nama, keterangan: form.keterangan })
          .eq("id", modal.id);
        if (error) throw error;
        const satChanges = [];
        if (oldSat?.nama !== form.nama)
          satChanges.push(`nama: "${oldSat?.nama}" → "${form.nama}"`);
        if (oldSat?.keterangan !== form.keterangan)
          satChanges.push(
            `keterangan: "${oldSat?.keterangan}" → "${form.keterangan}"`,
          );
        const satDetail =
          satChanges.length > 0
            ? `${form.nama}: ${satChanges.join(", ")}`
            : `${form.nama} (tidak ada perubahan)`;
        if (logActivity)
          await logActivity("Edit Satuan", "Master Data", satDetail);
        showNotif("Satuan diperbarui!");
      }
      await onReload();
      setModal(null);
    } catch (e) {
      showNotif("Error: " + e.message, "error");
    }
  };

  const delSatuan = async (id) => {
    if (!window.confirm("Hapus satuan ini?")) return;
    const sat = satuans.find((s) => s.id === id);
    const { error } = await sb.from("satuans").delete().eq("id", id);
    if (error) {
      showNotif("Gagal hapus: " + error.message, "error");
      return;
    }
    if (logActivity)
      await logActivity(
        "Hapus Satuan",
        "Master Data",
        `Satuan: ${sat?.nama || ""}`,
      );
    await onReload();
    showNotif("Satuan dihapus!");
  };

  return (
    <div>
      {/* TAB */}
      <div className={styles.tabContainer}>
        {[
          { id: "kategori", icon: "🏷️", label: "Kategori Produk" },
          { id: "satuan", icon: "⚖️", label: "Satuan" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`${styles.tabBtn} ${tab === t.id ? styles.tabBtnActive : ""}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* KATEGORI */}
      {tab === "kategori" && (
        <div>
          <div className={styles.header}>
            <span className={styles.countText}>
              {kategoris.length} kategori terdaftar
            </span>
            <button
              className={styles.btnPrimary}
              onClick={() => {
                setForm({
                  nama: "",
                  warna_bg: "#e8f5e9",
                  warna_text: "#2e7d32",
                  keterangan: "",
                });
                setModal("add");
              }}
            >
              + Tambah Kategori
            </button>
          </div>
          <div className={`master-grid ${styles.grid}`}>
            {kategoris.map((k) => (
              <div key={k.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <span
                    className={styles.badge}
                    style={{
                      background: k.warna_bg,
                      color: k.warna_text,
                    }}
                  >
                    {k.nama}
                  </span>
                  <div
                    className={styles.colorBox}
                    style={{
                      background: k.warna_bg,
                      border: `2px solid ${k.warna_text}`,
                    }}
                  />
                </div>
                <div className={styles.actionBtns}>
                  <button
                    className={styles.btnOutline}
                    onClick={() => {
                      setForm({
                        nama: k.nama,
                        warna_bg: k.warna_bg,
                        warna_text: k.warna_text,
                        keterangan: "",
                      });
                      setModal(k);
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className={styles.btnDanger}
                    onClick={() => delKategori(k.id)}
                  >
                    🗑 Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>

          {modal && (
            <div
              className={styles.modalOverlay}
              onClick={() => setModal(null)}
            >
              <div
                className={`${styles.modal} ${styles.modalKategori}`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.modalHeader}>
                  {modal === "add"
                    ? "➕ Tambah Kategori"
                    : "✏️ Edit Kategori"}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Nama Kategori *
                  </label>
                  <input
                    className={styles.inputField}
                    placeholder="Contoh: Pakan Burung..."
                    value={form.nama}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, nama: e.target.value }))
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Pilih Warna
                  </label>
                  <div className={styles.colorGrid}>
                    {WARNA_PRESETS.map((w, i) => (
                      <div
                        key={i}
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            warna_bg: w.bg,
                            warna_text: w.c,
                          }))
                        }
                        className={styles.colorOption}
                        style={{
                          background: w.bg,
                          border:
                            form.warna_bg === w.bg
                              ? `3px solid ${w.c}`
                              : "2px solid transparent",
                        }}
                      >
                        <span
                          className={styles.colorOptionText}
                          style={{
                            color: w.c,
                          }}
                        >
                          {w.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    marginTop: '20px',
                    padding: '16px',
                    background: '#fafcfa',
                    border: '1px solid #e4ede4',
                    borderRadius: '12px'
                  }}>
                    <div style={{ fontWeight: 800, color: '#555', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '16px' }}>🎨</span> Warna Kustom (Pilih Bebas):
                    </div>
                    
                    <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: '24px' }}>
                        {/* Background Picker */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#777' }}>Warna Latar</span>
                          <div style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '8px',
                            border: '2px solid #e4ede4',
                            padding: '3px',
                            background: '#fff',
                            position: 'relative'
                          }}>
                            <div style={{
                              width: '100%',
                              height: '100%',
                              background: form.warna_bg && form.warna_bg.startsWith('#') ? form.warna_bg : '#ffffff',
                              borderRadius: '4px',
                              border: '1px solid rgba(0,0,0,0.1)'
                            }}></div>
                            <input
                              type="color"
                              value={form.warna_bg && form.warna_bg.startsWith('#') ? form.warna_bg : '#ffffff'}
                              onChange={(e) => {
                                const bg = e.target.value;
                                const r = parseInt(bg.slice(1, 3), 16);
                                const g = parseInt(bg.slice(3, 5), 16);
                                const b = parseInt(bg.slice(5, 7), 16);
                                const yiq = (r * 299 + g * 587 + b * 114) / 1000;
                                const c = yiq >= 128 ? "#2e7d32" : "#ffffff";
                                setForm((f) => ({ ...f, warna_bg: bg, warna_text: c }));
                              }}
                              style={{
                                opacity: 0,
                                position: 'absolute',
                                inset: 0,
                                width: '100%',
                                height: '100%',
                                cursor: 'pointer',
                                zIndex: 2
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '11px', color: '#999', fontFamily: 'monospace' }}>
                            {form.warna_bg && form.warna_bg.startsWith('#') ? form.warna_bg : '#ffffff'}
                          </span>
                        </div>

                        {/* Text Picker */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#777' }}>Warna Teks</span>
                          <div style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '8px',
                            border: '2px solid #e4ede4',
                            padding: '3px',
                            background: '#fff',
                            position: 'relative'
                          }}>
                            <div style={{
                              width: '100%',
                              height: '100%',
                              background: form.warna_text && form.warna_text.startsWith('#') ? form.warna_text : '#2e7d32',
                              borderRadius: '4px',
                              border: '1px solid rgba(0,0,0,0.1)'
                            }}></div>
                            <input
                              type="color"
                              value={form.warna_text && form.warna_text.startsWith('#') ? form.warna_text : '#2e7d32'}
                              onChange={(e) => setForm((f) => ({ ...f, warna_text: e.target.value }))}
                              style={{
                                opacity: 0,
                                position: 'absolute',
                                inset: 0,
                                width: '100%',
                                height: '100%',
                                cursor: 'pointer',
                                zIndex: 2
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '11px', color: '#999', fontFamily: 'monospace' }}>
                            {form.warna_text && form.warna_text.startsWith('#') ? form.warna_text : '#2e7d32'}
                          </span>
                        </div>
                      </div>

                      {/* Preview Kustom */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#777' }}>Preview kustom:</span>
                        <div style={{
                          padding: '6px 16px',
                          borderRadius: '20px',
                          display: 'inline-block',
                          fontWeight: 800,
                          fontSize: '13px',
                          background: form.warna_bg && form.warna_bg.startsWith('#') ? form.warna_bg : '#e8f5e9',
                          color: form.warna_text && form.warna_text.startsWith('#') ? form.warna_text : '#2e7d32',
                          border: '1px solid rgba(0,0,0,0.05)',
                          textAlign: 'center'
                        }}>
                          {form.nama || 'Nama Kategori'}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '20px', fontSize: '11px', color: '#aaa', display: 'flex', alignItems: 'flex-start', gap: '6px', lineHeight: 1.4 }}>
                      <span style={{ fontSize: '12px' }}>💡</span>
                      <span>Klik kotak warna untuk membuka color picker - Warna teks otomatis<br/>menyesuaikan latar (dan bebas diubah manual)</span>
                    </div>
                  </div>
                </div>
                <div className={styles.previewBox}>
                  <div className={styles.previewLabel}>
                    Preview:
                  </div>
                  <span
                    className={styles.previewText}
                    style={{
                      background: form.warna_bg,
                      color: form.warna_text,
                    }}
                  >
                    {form.nama || "Nama Kategori"}
                  </span>
                </div>
                <div className={styles.modalActions}>
                  <button
                    className={styles.saveBtn}
                    onClick={saveKategori}
                  >
                    💾 Simpan
                  </button>
                  <button
                    className={styles.btnDefault}
                    onClick={() => setModal(null)}
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SATUAN */}
      {tab === "satuan" && (
        <div>
          <div className={styles.header}>
            <span className={styles.countText}>
              {satuans.length} satuan terdaftar
            </span>
            <button
              className={styles.btnPrimary}
              onClick={() => {
                setForm({
                  nama: "",
                  keterangan: "",
                  warna_bg: "",
                  warna_text: "",
                });
                setModal("add");
              }}
            >
              + Tambah Satuan
            </button>
          </div>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {["Nama Satuan", "Keterangan", "Aksi"].map((h) => (
                    <th key={h} className={styles.th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {satuans.map((s) => (
                  <tr key={s.id}>
                    <td className={styles.td}>
                      <span className={styles.satuanBadge}>
                        {s.nama}
                      </span>
                    </td>
                    <td className={styles.tdPadded}>
                      {s.keterangan || "—"}
                    </td>
                    <td className={styles.td}>
                      <div className={styles.satuanActionBtns}>
                        <button
                          className={styles.satuanBtnOutline}
                          onClick={() => {
                            setForm({
                              nama: s.nama,
                              keterangan: s.keterangan || "",
                              warna_bg: "",
                              warna_text: "",
                            });
                            setModal(s);
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className={styles.satuanBtnDanger}
                          onClick={() => delSatuan(s.id)}
                        >
                          🗑 Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {modal && (
            <div
              className={styles.modalOverlay}
              onClick={() => setModal(null)}
            >
              <div
                className={`${styles.modal} ${styles.modalSatuan}`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.modalHeader}>
                  {modal === "add"
                    ? "➕ Tambah Satuan"
                    : "✏️ Edit Satuan"}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Nama Satuan *{" "}
                    <span className={styles.labelHint}>
                      (contoh: kg, pcs, botol)
                    </span>
                  </label>
                  <input
                    className={styles.inputField}
                    placeholder="Nama satuan..."
                    value={form.nama}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, nama: e.target.value }))
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Keterangan{" "}
                    <span className={styles.labelHint}>
                      (opsional)
                    </span>
                  </label>
                  <input
                    className={styles.inputField}
                    placeholder="Contoh: Per kilogram..."
                    value={form.keterangan}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        keterangan: e.target.value,
                      }))
                    }
                  />
                </div>
                {form.nama && (
                  <div className={styles.previewBox}>
                    <div className={styles.previewLabel}>
                      Preview:
                    </div>
                    <span className={styles.previewText} style={{ background: "#e8f0e8", color: "#2d7a2d" }}>
                      {form.nama}
                    </span>
                    {form.keterangan && (
                      <span className={styles.previewSubtext}>
                        {form.keterangan}
                      </span>
                    )}
                  </div>
                )}
                <div className={styles.modalActions}>
                  <button
                    className={styles.saveBtn}
                    onClick={saveSatuan}
                  >
                    💾 Simpan
                  </button>
                  <button
                    className={styles.btnDefault}
                    onClick={() => setModal(null)}
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MasterDataPage;
