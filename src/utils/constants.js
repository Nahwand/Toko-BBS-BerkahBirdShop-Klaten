export const CATS = [
  "Semua",
  "Pakan Jadi",
  "Pakan Kiloan",
  "Pakan Segar",
  "Cemilan Hewan",
  "Suplemen",
  "Pakan Kucing",
];

export const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export const BADGE = {
  "Pakan Jadi": { bg: "#e8f5e9", c: "#2e7d32" },
  "Pakan Kiloan": { bg: "#fff8e1", c: "#e65100" },
  "Pakan Segar": { bg: "#e3f2fd", c: "#1565c0" },
  "Cemilan Hewan": { bg: "#fce4ec", c: "#c62828" },
  "Suplemen": { bg: "#f3e5f5", c: "#6a1b9a" },
  "Pakan Kucing": { bg: "#e0f2f1", c: "#00695c" },
};

export const ACCESS = {
  superadmin: [
    "dashboard", "kasir", "produk", "riwayat", "stok", "restocklog",
    "laporan", "supplier", "excel", "users", "masterdata", "settings", "auditlog",
  ],
  admin: [
    "dashboard", "kasir", "produk", "riwayat", "stok", "restocklog",
    "laporan", "excel", "masterdata", "auditlog",
  ],
  pegawai: ["dashboard", "kasir", "produk", "stok"],
};

export const TODAY = new Date().toISOString().slice(0, 10);

export const fmt = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

export const fmtN = (n) => new Intl.NumberFormat("id-ID").format(n);

// Void/Cancel Transaksi helpers
export function canVoid(currentUser, transaction) {
  if (!currentUser || !transaction) return false;
  if (transaction.status === 'void') return false;
  if (currentUser.role === 'superadmin') return true;
  if (currentUser.role === 'admin') return transaction.date === TODAY;
  return false;
}

export function validateVoidReason(input) {
  if (!input) return false;
  return input.trim() !== '';
}

/**
 * Hasilkan CSS @media print untuk printer thermal.
 * @param {'58'|'80'} printSize
 * @returns {string}
 */
export function buildPrintStyle(printSize) {
  const size = printSize === '58' ? '58' : '80';
  const contentWidth = parseInt(size) - 4;
  return `
@media print {
  @page { size: ${size}mm auto; margin: 2mm; }
  body * { visibility: hidden !important; }
  #struk-print, #struk-print * { visibility: visible !important; }
  #struk-print {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: ${contentWidth}mm !important;
    font-family: monospace, sans-serif;
    font-size: 10pt;
    line-height: 1.3;
  }
}`.trim();
}
