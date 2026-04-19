import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { canVoid, validateVoidReason, buildPrintStyle, fmt, fmtN } from '../constants';

// Mock TODAY agar test tidak bergantung pada tanggal saat ini
const MOCK_TODAY = '2025-01-15';

describe('canVoid', () => {
  it('superadmin bisa void transaksi aktif kapan saja', () => {
    const user = { role: 'superadmin' };
    expect(canVoid(user, { status: 'aktif', date: '2024-01-01' })).toBe(true);
    expect(canVoid(user, { status: 'aktif', date: '2020-06-15' })).toBe(true);
  });

  it('admin hanya bisa void transaksi hari ini', () => {
    const user = { role: 'admin' };
    const TODAY = new Date().toISOString().slice(0, 10);
    expect(canVoid(user, { status: 'aktif', date: TODAY })).toBe(true);
    expect(canVoid(user, { status: 'aktif', date: '2020-01-01' })).toBe(false);
  });

  it('pegawai tidak bisa void transaksi apapun', () => {
    const user = { role: 'pegawai' };
    const TODAY = new Date().toISOString().slice(0, 10);
    expect(canVoid(user, { status: 'aktif', date: TODAY })).toBe(false);
    expect(canVoid(user, { status: 'aktif', date: '2020-01-01' })).toBe(false);
  });

  it('transaksi yang sudah void tidak bisa di-void ulang', () => {
    const superadmin = { role: 'superadmin' };
    const admin = { role: 'admin' };
    const TODAY = new Date().toISOString().slice(0, 10);
    expect(canVoid(superadmin, { status: 'void', date: TODAY })).toBe(false);
    expect(canVoid(admin, { status: 'void', date: TODAY })).toBe(false);
  });

  it('return false jika currentUser null atau undefined', () => {
    expect(canVoid(null, { status: 'aktif', date: '2025-01-01' })).toBe(false);
    expect(canVoid(undefined, { status: 'aktif', date: '2025-01-01' })).toBe(false);
  });

  it('return false jika transaction null atau undefined', () => {
    expect(canVoid({ role: 'superadmin' }, null)).toBe(false);
    expect(canVoid({ role: 'superadmin' }, undefined)).toBe(false);
  });
});

describe('validateVoidReason', () => {
  it('return true untuk alasan yang valid', () => {
    expect(validateVoidReason('Salah input produk')).toBe(true);
    expect(validateVoidReason('a')).toBe(true);
    expect(validateVoidReason('  valid  ')).toBe(true);
  });

  it('return false untuk string kosong', () => {
    expect(validateVoidReason('')).toBe(false);
    expect(validateVoidReason(null)).toBe(false);
    expect(validateVoidReason(undefined)).toBe(false);
  });

  it('return false untuk string yang hanya berisi whitespace', () => {
    expect(validateVoidReason('   ')).toBe(false);
    expect(validateVoidReason('\t\n')).toBe(false);
    expect(validateVoidReason('  \t  ')).toBe(false);
  });
});

describe('buildPrintStyle', () => {
  it('menghasilkan CSS dengan lebar 54mm untuk ukuran 58mm', () => {
    const css = buildPrintStyle('58');
    expect(css).toContain('58mm');
    expect(css).toContain('54mm');
  });

  it('menghasilkan CSS dengan lebar 76mm untuk ukuran 80mm', () => {
    const css = buildPrintStyle('80');
    expect(css).toContain('80mm');
    expect(css).toContain('76mm');
  });

  it('fallback ke 80mm untuk nilai tidak valid', () => {
    const css = buildPrintStyle('invalid');
    expect(css).toContain('80mm');
    expect(css).toContain('76mm');
  });

  it('mengandung @media print dan @page', () => {
    const css = buildPrintStyle('80');
    expect(css).toContain('@media print');
    expect(css).toContain('@page');
  });
});

describe('fmt', () => {
  it('memformat angka sebagai Rupiah', () => {
    const result = fmt(50000);
    expect(result).toContain('50');
    expect(result).toContain('000');
  });

  it('memformat nol', () => {
    const result = fmt(0);
    expect(result).toContain('0');
  });
});

describe('fmtN', () => {
  it('memformat angka dengan separator ribuan', () => {
    const result = fmtN(1000);
    expect(result).toContain('1');
    expect(result).toContain('000');
  });
});
