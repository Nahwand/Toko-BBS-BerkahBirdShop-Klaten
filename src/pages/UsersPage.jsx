import React, { useState, useEffect } from "react";
import bcrypt from "bcryptjs";
import styles from "../styles/UsersPage.module.css";

export default function UsersPage({ sb, showNotif, currentUser, logActivity }) {
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    username: "",
    password: "",
    nama: "",
    role: "pegawai",
    status: "Aktif",
  });
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    const { data } = await sb.from("users").select("*").order("id");
    setUsers(data || []);
  };
  useEffect(() => {
    loadUsers();
  }, []);

  const saveUser = async () => {
    if (!form.username || !form.nama) {
      showNotif("Field username dan nama wajib diisi!", "error");
      return;
    }
    
    // Validasi Password Keamanan Tinggi
    const pass = form.password;
    if (pass) {
        if (pass.length < 8) {
            showNotif("Maaf, Password HARUS minimal 8 karakter panjangnya!", "error");
            return;
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(pass)) {
            showNotif("Maaf, Password WAJIB mengandung kombinasi lengkap: huruf besar, huruf kecil, angka, dan simbol (seperti @#$%^&*)!", "error");
            return;
        }
        if (modal !== "add" && bcrypt.compareSync(pass, modal.password)) {
            showNotif("Keamanan: Anda tidak boleh menggunakan rutinitas password yang persis sama dengan password sebelumnya!", "error");
            return;
        }
    } else if (modal === "add") {
      showNotif("Password wajib diisi untuk akun baru!", "error");
      return;
    }
    setLoading(true);
    try {
      if (modal === "add") {
        const payload = { ...form, password: bcrypt.hashSync(form.password, 10) };
        const { error } = await sb.from("users").insert(payload);
        if (error) throw error;
        if (logActivity)
          await logActivity(
            "Tambah Akun",
            "Akun",
            `${form.nama} (${form.role})`,
          );
        showNotif("Akun berhasil ditambahkan!");
      } else {
        const oldUser = users.find((u) => u.id === modal.id);
        const payload = { ...form };
        if (payload.password) {
          payload.password = bcrypt.hashSync(payload.password, 10);
        } else {
          delete payload.password; // Do not overwrite existing password if left empty
        }
        const { error } = await sb
          .from("users")
          .update(payload)
          .eq("id", modal.id);
        if (error) throw error;
        const akunChanges = [];
        if (oldUser?.nama !== form.nama)
          akunChanges.push(`nama: "${oldUser?.nama}" → "${form.nama}"`);
        if (oldUser?.username !== form.username)
          akunChanges.push(
            `username: ${oldUser?.username} → ${form.username}`,
          );
        if (oldUser?.role !== form.role)
          akunChanges.push(`role: ${oldUser?.role} → ${form.role}`);
        if (oldUser?.status !== form.status)
          akunChanges.push(`status: ${oldUser?.status} → ${form.status}`);
        if (oldUser?.password !== form.password)
          akunChanges.push(`password diubah`);
        const akunDetail =
          akunChanges.length > 0
            ? `${form.nama}: ${akunChanges.join(", ")}`
            : `${form.nama} (tidak ada perubahan)`;
        if (logActivity)
          await logActivity("Edit Akun", "Akun", akunDetail);
        showNotif("Akun berhasil diperbarui!");
      }
      await loadUsers();
      setModal(null);
    } catch (e) {
      showNotif("Error: " + e.message, "error");
    }
    setLoading(false);
  };

  const delUser = async (id) => {
    if (id === currentUser.id) {
      showNotif("Tidak bisa hapus akun sendiri!", "error");
      return;
    }
    if (!window.confirm("Hapus akun ini?")) return;
    const u = users.find((x) => x.id === id);
    await sb.from("users").delete().eq("id", id);
    if (logActivity)
      await logActivity("Hapus Akun", "Akun", u?.nama || "");
    await loadUsers();
    showNotif("Akun dihapus!");
  };

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, color: "transparent", text: "", pct: 0 };
    let score = 0;
    if (pass.length > 0) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    
    if (score <= 2) return { score, color: "#f44336", text: "Lemah", pct: 33 }; // Merah
    if (score <= 4) return { score, color: "#ffc107", text: "Kurang Kuat", pct: 66 }; // Kuning
    return { score, color: "#4caf50", text: "Sangat Kuat", pct: 100 }; // Hijau
  };

  return (
    <div>
      <div className={styles.header}>
        <span className={styles.accountCount}>
          {users.length} akun terdaftar
        </span>
        <button
          className={styles.btnPrimary}
          onClick={() => {
            setForm({
              username: "",
              password: "",
              nama: "",
              role: "pegawai",
              status: "Aktif",
            });
            setModal("add");
          }}
        >
          + Tambah Akun
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              {["Nama", "Username", "Role", "Status", "Aksi"].map((h) => (
                <th key={h} className={styles.th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className={`${styles.tr} ${u.id === currentUser.id ? styles.trCurrentUser : ""}`}
              >
                <td className={styles.td}>
                  <strong>{u.nama}</strong>
                  {u.id === currentUser.id && (
                    <span className={styles.youBadge}>
                      Anda
                    </span>
                  )}
                </td>
                <td className={styles.td}>
                  {u.username}
                </td>
                <td className={styles.td}>
                  <span
                    className={`${styles.roleBadge} ${
                      u.role === "superadmin"
                        ? styles.roleBadgeSuperAdmin
                        : u.role === "admin"
                          ? styles.roleBadgeAdmin
                          : styles.roleBadgePegawai
                    }`}
                  >
                    {u.role === "superadmin"
                      ? "👑 Super Admin"
                      : u.role === "admin"
                        ? "🛡️ Admin"
                        : "👤 Pegawai"}
                  </span>
                </td>
                <td className={styles.td}>
                  <span
                    className={`${styles.statusBadge} ${
                      u.status === "Aktif" ? styles.statusBadgeAktif : styles.statusBadgeNonaktif
                    }`}
                  >
                    {u.status}
                  </span>
                </td>
                <td className={styles.td}>
                  <div className={styles.actionBtns}>
                    <button
                      className={styles.btnOutline}
                      onClick={() => {
                        setForm({
                          username: u.username,
                          password: "", // Hide existing hash
                          nama: u.nama,
                          role: u.role,
                          status: u.status,
                        });
                        setModal(u);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className={styles.btnDanger}
                      onClick={() => delUser(u.id)}
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info hak akses */}
      <div className={styles.roleGrid}>
        {[
          {
            role: "👑 Super Admin",
            color: "#7b1fa2",
            bg: "#f3e5f5",
            akses: [
              "Dashboard",
              "Kasir",
              "Produk",
              "Riwayat",
              "Stok",
              "Laporan",
              "Supplier",
              "Import/Export",
              "Kelola Akun",
              "Master Data",
            ],
          },
          {
            role: "🛡️ Admin",
            color: "#e65100",
            bg: "#fff8e1",
            akses: [
              "Dashboard",
              "Kasir",
              "Produk",
              "Riwayat",
              "Stok",
              "Laporan",
              "Import/Export",
              "Master Data",
            ],
          },
          {
            role: "👤 Pegawai",
            color: "#1565c0",
            bg: "#e3f2fd",
            akses: ["Dashboard", "Kasir", "Produk", "Stok"],
          },
        ].map((r, i) => (
          <div key={i} className={styles.roleCard}>
            <div
              className={styles.roleCardTitle}
              style={{ color: r.color }}
            >
              {r.role}
            </div>
            <div className={styles.roleAccessList}>
              {r.akses.map((a) => (
                <span
                  key={a}
                  className={styles.roleAccessBadge}
                  style={{ background: r.bg, color: r.color }}
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setModal(null)}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              {modal === "add" ? "➕ Tambah Akun Baru" : "✏️ Edit Akun"}
            </div>
            {[
              {
                l: "Nama Lengkap *",
                k: "nama",
                t: "text",
                p: "Nama lengkap...",
              },
              {
                l: "Username *",
                k: "username",
                t: "text",
                p: "Username unik...",
              },
              {
                l: modal === "add" ? "Password *" : "Ganti Password",
                k: "password",
                t: "text",
                p: modal === "add" ? "Password..." : "Kosongkan jika tidak diubah...",
              },
            ].map((f) => (
              <div key={f.k} className={styles.formGroup}>
                <label className={styles.label}>
                  {f.l}
                </label>
                <input
                  className={styles.inputField}
                  type={f.t}
                  placeholder={f.p}
                  value={form[f.k]}
                  onChange={(e) =>
                    setForm((x) => ({ ...x, [f.k]: e.target.value }))
                  }
                />
                {f.k === "password" && form.password && (() => {
                  const strength = getPasswordStrength(form.password);
                  return (
                    <div style={{ marginTop: "8px" }}>
                       <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "4px" }}>
                          <span style={{ color: "#555" }}>Indikator Kekuatan:</span>
                          <span style={{ color: strength.color, fontWeight: "bold" }}>{strength.text}</span>
                       </div>
                       <div style={{ height: "6px", width: "100%", backgroundColor: "#e0e0e0", borderRadius: "4px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${strength.pct}%`, backgroundColor: strength.color, transition: "all 0.4s ease" }}></div>
                       </div>
                       <div style={{ fontSize: "0.75rem", color: "#888", marginTop: "6px", fontStyle: "italic", lineHeight: "1.3" }}>
                          Syarat Wajib: 8 Aksara, Huruf Besar (A-Z), Huruf Kecil (a-z), Angka (0-9), & Simbol (!@#$%).
                       </div>
                    </div>
                  );
                })()}
              </div>
            ))}
            <div className={styles.formGroupSelect}>
              <label className={styles.label}>
                Role
              </label>
              <select
                className={styles.inputField}
                value={form.role}
                onChange={(e) =>
                  setForm((x) => ({ ...x, role: e.target.value }))
                }
              >
                <option value="superadmin">👑 Super Admin</option>
                <option value="admin">🛡️ Admin</option>
                <option value="pegawai">👤 Pegawai</option>
              </select>
            </div>
            <div className={styles.formGroupSelect}>
              <label className={styles.label}>
                Status
              </label>
              <select
                className={styles.inputField}
                value={form.status}
                onChange={(e) =>
                  setForm((x) => ({ ...x, status: e.target.value }))
                }
              >
                <option>Aktif</option>
                <option>Nonaktif</option>
              </select>
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.saveBtn}
                onClick={saveUser}
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
  );
}
