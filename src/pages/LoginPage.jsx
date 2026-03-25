import React, { useState } from "react";
import bcrypt from "bcryptjs";
import { sb } from "../config/supabase";
import Spin from "../components/Spin";
import styles from "../styles/LoginPage.module.css";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Username dan password wajib diisi!");
      return;
    }
    setLoading(true);
    setError("");

    // === OFFLINE FALLBACK ===
    if (!navigator.onLine) {
      try {
        const cached = sessionStorage.getItem("bbs_user");
        if (cached) {
          const cachedUser = JSON.parse(cached);
          if (cachedUser.username === username.trim()) {
            onLogin(cachedUser);
            setLoading(false);
            return;
          }
        }
        setError("Mode Offline: Hanya user yang terakhir login di perangkat ini yang bisa masuk tanpa internet.");
      } catch (offErr) {
        setError("Mode Offline: Tidak ada data login tersimpan. Sambungkan internet untuk login pertama kali.");
      }
      setLoading(false);
      return;
    }

    // === ONLINE LOGIN ===
    try {
      const { data: rows, error: err } = await sb
        .from("users")
        .select("*")
        .eq("username", username.trim())
        .eq("status", "Aktif");
      if (err || !rows || rows.length === 0) {
        setError("Username atau password salah!");
        setLoading(false);
        return;
      }
      const data = rows.find((u) => {
        // Fallback for unmigrated plain-text passwords during transition
        if (!u.password.startsWith("$2a$") && !u.password.startsWith("$2b$")) {
          return u.password === password;
        }
        return bcrypt.compareSync(password, u.password);
      });
      if (!data) {
        setError("Username atau password salah!");
        setLoading(false);
        return;
      }
      sessionStorage.setItem("bbs_user", JSON.stringify(data));
      onLogin(data);
    } catch (e) {
      // Network error saat online — coba fallback ke cache
      try {
        const cached = sessionStorage.getItem("bbs_user");
        if (cached) {
          const cachedUser = JSON.parse(cached);
          if (cachedUser.username === username.trim()) {
            onLogin(cachedUser);
            setLoading(false);
            return;
          }
        }
      } catch (_) { /* ignore */ }
      setError("Gagal login: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      {/* Dekorasi background */}
      <div className={styles.decor1} />
      <div className={styles.decor2} />
      <div className={styles.decor3} />

      <div className={styles.loginBox}>
        {/* Logo */}
        <div className={styles.logoContainer}>
          <div className={styles.logoCircle}>🌿</div>
          <div className={styles.logoText}>BerkahBirdShop</div>
          <div className={styles.logoSub}>Klaten, Jawa Tengah</div>
          <div className={styles.logoLine} />
        </div>

        <div className={styles.title}>Masuk ke Sistem Manajemen</div>

        {error && (
          <div className={styles.errorBox}>
            <span className={styles.errorIcon}>⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Username</label>
            <div className={styles.inputGroup}>
              <span className={styles.inputIcon}>👤</span>
              <input
                className={styles.inputField}
                placeholder="Masukkan username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className={styles.formGroupLarge}>
            <label className={styles.label}>Password</label>
            <div className={styles.inputGroup}>
              <span className={styles.inputIcon}>🔒</span>
              <input
                className={styles.inputFieldPass}
                type={showPass ? "text" : "password"}
                placeholder="Masukkan password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className={styles.passToggleBtn}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.submitBtn}
          >
            {loading ? (
              <>
                <Spin /> Memverifikasi...
              </>
            ) : (
              <>🚀 Masuk ke Sistem</>
            )}
          </button>
        </form>

        <div className={styles.footerText}>
          🌿 BBS · Sistem Manajemen Penjualan
        </div>

      </div>
    </div>
  );
}
