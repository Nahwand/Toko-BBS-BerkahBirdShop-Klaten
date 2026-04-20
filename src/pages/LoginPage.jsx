import { useState, useEffect } from "react";
import bcrypt from "bcryptjs";
import { sb } from "../config/supabase";
import Spin from "../components/Spin";
import styles from "../styles/LoginPage.module.css";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 menit
const RATE_KEY = "bbs_login_attempts";

function getRateData() {
  try { return JSON.parse(localStorage.getItem(RATE_KEY) || '{}'); } catch { return {}; }
}
function setRateData(data) {
  localStorage.setItem(RATE_KEY, JSON.stringify(data));
}

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Countdown timer saat lockout
  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const t = setInterval(() => {
      setLockoutRemaining(prev => {
        if (prev <= 1) { clearInterval(t); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [lockoutRemaining]);

  const checkLockout = () => {
    const data = getRateData();
    if (!data.lockedUntil) return false;
    const remaining = Math.ceil((data.lockedUntil - Date.now()) / 1000);
    if (remaining > 0) {
      setLockoutRemaining(remaining);
      return true;
    }
    // Lockout sudah habis, reset
    setRateData({});
    return false;
  };

  const recordFailedAttempt = () => {
    const data = getRateData();
    const attempts = (data.attempts || 0) + 1;
    if (attempts >= MAX_ATTEMPTS) {
      setRateData({ attempts, lockedUntil: Date.now() + LOCKOUT_MS });
      setLockoutRemaining(Math.ceil(LOCKOUT_MS / 1000));
    } else {
      setRateData({ attempts });
    }
    return attempts;
  };

  const resetAttempts = () => setRateData({});

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Username dan password wajib diisi!");
      return;
    }

    // Cek lockout
    if (checkLockout()) return;

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
      } catch {
        setError("Mode Offline: Tidak ada data login tersimpan. Sambungkan internet untuk login pertama kali.");
      }
      setLoading(false);
      return;
    }

    // === ONLINE LOGIN ===
    try {
      // Hanya ambil kolom yang diperlukan — tidak ambil password hash
      const { data: rows, error: err } = await sb
        .from("users")
        .select("id, username, nama, role, status, password")
        .eq("username", username.trim())
        .eq("status", "Aktif");

      if (err || !rows || rows.length === 0) {
        const attempts = recordFailedAttempt();
        const sisa = MAX_ATTEMPTS - attempts;
        setError(sisa > 0
          ? `Username atau password salah! (${sisa} percobaan tersisa)`
          : `Terlalu banyak percobaan gagal. Coba lagi dalam 5 menit.`
        );
        setLoading(false);
        return;
      }

      const data = rows.find((u) => {
        if (!u.password.startsWith("$2a$") && !u.password.startsWith("$2b$")) {
          return u.password === password;
        }
        return bcrypt.compareSync(password, u.password);
      });

      if (!data) {
        const attempts = recordFailedAttempt();
        const sisa = MAX_ATTEMPTS - attempts;
        setError(sisa > 0
          ? `Username atau password salah! (${sisa} percobaan tersisa)`
          : `Terlalu banyak percobaan gagal. Coba lagi dalam 5 menit.`
        );
        setLoading(false);
        return;
      }

      // Login berhasil — reset counter, simpan tanpa password hash
      resetAttempts();
      const { password: _pw, ...safeUser } = data;
      sessionStorage.setItem("bbs_user", JSON.stringify(safeUser));
      onLogin(safeUser);
    } catch (e) {
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

        {lockoutRemaining > 0 && (
          <div className={styles.errorBox} style={{ background: '#fff3cd', borderColor: '#ffc107', color: '#856404' }}>
            🔒 Akun terkunci. Coba lagi dalam <strong>{Math.floor(lockoutRemaining / 60)}:{String(lockoutRemaining % 60).padStart(2, '0')}</strong>
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
                disabled={lockoutRemaining > 0}
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
                disabled={lockoutRemaining > 0}
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
            disabled={loading || lockoutRemaining > 0}
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
