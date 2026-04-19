import { describe, it, expect } from 'vitest';
import { filterByDateRange, validateDateRange, formatPeriodLabel, buildDayData } from '../reportUtils';

const makeTrx = (date, status = 'aktif', total = 100000) => ({ id: Math.random(), date, status, total });

describe('filterByDateRange', () => {
  const trxs = [
    makeTrx('2025-01-01'),
    makeTrx('2025-01-10'),
    makeTrx('2025-01-15'),
    makeTrx('2025-01-20'),
    makeTrx('2025-01-31'),
    makeTrx('2025-01-10', 'void'), // void harus dikecualikan
  ];

  it('filter inklusif — mengembalikan transaksi dalam rentang', () => {
    const result = filterByDateRange(trxs, '2025-01-10', '2025-01-20');
    expect(result.map(t => t.date)).toEqual(['2025-01-10', '2025-01-15', '2025-01-20']);
  });

  it('selalu mengecualikan transaksi void', () => {
    const result = filterByDateRange(trxs, '2025-01-01', '2025-01-31');
    expect(result.every(t => t.status !== 'void')).toBe(true);
  });

  it('hanya start diisi — tampilkan dari start hingga hari ini', () => {
    const result = filterByDateRange(trxs, '2025-01-15', null);
    expect(result.every(t => t.date >= '2025-01-15')).toBe(true);
  });

  it('hanya end diisi — tampilkan semua hingga end', () => {
    const result = filterByDateRange(trxs, null, '2025-01-10');
    expect(result.every(t => t.date <= '2025-01-10')).toBe(true);
  });

  it('array kosong jika tidak ada transaksi dalam rentang', () => {
    const result = filterByDateRange(trxs, '2026-01-01', '2026-12-31');
    expect(result).toHaveLength(0);
  });
});

describe('validateDateRange', () => {
  it('valid jika start <= end', () => {
    expect(validateDateRange('2025-01-01', '2025-01-31').isValid).toBe(true);
    expect(validateDateRange('2025-01-15', '2025-01-15').isValid).toBe(true);
  });

  it('tidak valid jika start > end', () => {
    const result = validateDateRange('2025-01-31', '2025-01-01');
    expect(result.isValid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('valid jika salah satu kosong', () => {
    expect(validateDateRange('2025-01-01', null).isValid).toBe(true);
    expect(validateDateRange(null, '2025-01-31').isValid).toBe(true);
    expect(validateDateRange(null, null).isValid).toBe(true);
  });
});

describe('formatPeriodLabel', () => {
  it('mengembalikan "Bulan Berjalan" jika keduanya kosong', () => {
    expect(formatPeriodLabel(null, null)).toBe('Bulan Berjalan');
    expect(formatPeriodLabel('', '')).toBe('Bulan Berjalan');
  });

  it('mengandung tanda pisah untuk rentang valid', () => {
    const label = formatPeriodLabel('2025-01-01', '2025-01-31');
    expect(label).toContain('–');
  });

  it('mengandung "sekarang" jika hanya start diisi', () => {
    const label = formatPeriodLabel('2025-01-01', null);
    expect(label).toContain('sekarang');
  });

  it('mengandung "s.d." jika hanya end diisi', () => {
    const label = formatPeriodLabel(null, '2025-01-31');
    expect(label).toContain('s.d.');
  });
});

describe('buildDayData', () => {
  const trxs = [
    { date: '2025-01-01', total: 50000, status: 'aktif' },
    { date: '2025-01-01', total: 30000, status: 'aktif' },
    { date: '2025-01-03', total: 80000, status: 'aktif' },
  ];

  it('menghasilkan satu entri per hari dalam rentang', () => {
    const result = buildDayData(trxs, '2025-01-01', '2025-01-03');
    expect(result).toHaveLength(3);
  });

  it('menjumlahkan revenue per hari dengan benar', () => {
    const result = buildDayData(trxs, '2025-01-01', '2025-01-03');
    expect(result[0].rev).toBe(80000); // 50000 + 30000 pada 01/01
    expect(result[1].rev).toBe(0);     // tidak ada transaksi pada 01/02
    expect(result[2].rev).toBe(80000); // 80000 pada 01/03
  });

  it('menggunakan format DD/MM untuk dateStr', () => {
    const result = buildDayData(trxs, '2025-01-01', '2025-01-01');
    expect(result[0].dateStr).toBe('01/01');
  });

  it('return array kosong jika start atau end kosong', () => {
    expect(buildDayData(trxs, null, '2025-01-31')).toHaveLength(0);
    expect(buildDayData(trxs, '2025-01-01', null)).toHaveLength(0);
  });
});
