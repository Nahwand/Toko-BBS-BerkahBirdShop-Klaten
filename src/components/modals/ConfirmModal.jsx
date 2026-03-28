import React from 'react';
import styles from '../../styles/App.module.css';

export default function ConfirmModal({ confirm, onConfirm, onCancel }) {
  if (!confirm) return null;
  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} style={{ width: 340, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>{confirm.icon || "⚠️"}</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#1a4a1a", marginBottom: 8 }}>{confirm.title}</div>
        <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>{confirm.message}</div>
        {confirm.warning && (
          <div style={{ fontSize: 12, color: "#dc2626", background: "#fee2e2", borderRadius: 8, padding: "8px 12px", marginBottom: 16, fontWeight: 600 }}>
            {confirm.warning}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button className={`${styles.btn} ${styles.btndanger}`} style={{ flex: 1, padding: 12, fontSize: 14 }} onClick={onConfirm}>
            {confirm.confirmLabel || "Ya, Hapus"}
          </button>
          <button className={styles.btndefault} style={{ flex: 1, padding: 12, fontSize: 14 }} onClick={onCancel}>
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
