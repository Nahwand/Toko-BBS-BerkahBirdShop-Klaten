import { TODAY } from './constants';

/**
 * Filter transaksi berdasarkan rentang tanggal (inklusif), exclude void.
 * @param {Array} transactions
 * @param {string|null} start - YYYY-MM-DD
 * @param {string|null} end   - YYYY-MM-DD
 */
export function filterByDateRange(transactions, start, end) {
  const effectiveEnd = end || TODAY;
  return transactions.filter(t => {
    if (t.status === 'void') return false;
    if (start && t.date < start) return false;
    if (t.date > effectiveEnd) return false;
    return true;
  });
}

/**
 * Validasi rentang tanggal.
 * @returns {{ isValid: boolean, error: string }}
 */
export function validateDateRange(start, end) {
  if (start && end && start > end) {
    return { isValid: false, error: 'Tanggal mulai tidak boleh lebih besar dari tanggal selesai' };
  }
  return { isValid: true, error: '' };
}

/**
 * Format label periode untuk ditampilkan di laporan.
 * @param {string|null} start
 * @param {string|null} end
 * @returns {string}
 */
export function formatPeriodLabel(start, end) {
  const opts = { day: 'numeric', month: 'short', year: 'numeric' };
  const fmt = (d) => new Date(d + 'T00:00:00').toLocaleDateString('id-ID', opts);
  if (!start && !end) return 'Bulan Berjalan';
  if (!start) return `s.d. ${fmt(end)}`;
  if (!end) return `${fmt(start)} – sekarang`;
  return `${fmt(start)} – ${fmt(end)}`;
}

/**
 * Bangun array data harian untuk grafik tren.
 * @param {Array} rptTrx - transaksi yang sudah difilter
 * @param {string} start - YYYY-MM-DD
 * @param {string} end   - YYYY-MM-DD
 * @returns {Array<{ dateStr: string, rev: number }>}
 */
export function buildDayData(rptTrx, start, end) {
  if (!start || !end) return [];
  const days = [];
  const startDate = new Date(start + 'T00:00:00');
  const endDate = new Date(end + 'T00:00:00');
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    // Gunakan komponen lokal agar tidak terpengaruh timezone
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const ds = `${year}-${month}-${day}`;
    const rev = rptTrx
      .filter(t => t.date === ds)
      .reduce((s, t) => s + t.total, 0);
    const label = `${day}/${month}`;
    days.push({ dateStr: label, rev });
  }
  return days;
}
