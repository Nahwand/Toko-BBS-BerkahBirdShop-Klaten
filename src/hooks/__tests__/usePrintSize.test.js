import { describe, it, expect, beforeEach } from 'vitest';

// Test fungsi murni dari usePrintSize tanpa React hook
const VALID_SIZES = ['58', '80'];
const KEY = 'bbs_print_size';
const DEFAULT = '80';

function loadPrintSize(storage = {}) {
  const val = storage[KEY];
  return VALID_SIZES.includes(val) ? val : DEFAULT;
}

function savePrintSize(size, storage = {}) {
  const valid = VALID_SIZES.includes(size) ? size : DEFAULT;
  storage[KEY] = valid;
  return valid;
}

describe('usePrintSize logic', () => {
  it('membaca nilai valid dari storage', () => {
    expect(loadPrintSize({ [KEY]: '58' })).toBe('58');
    expect(loadPrintSize({ [KEY]: '80' })).toBe('80');
  });

  it('fallback ke 80 untuk nilai tidak valid', () => {
    expect(loadPrintSize({ [KEY]: 'invalid' })).toBe(DEFAULT);
    expect(loadPrintSize({ [KEY]: '100' })).toBe(DEFAULT);
    expect(loadPrintSize({ [KEY]: '' })).toBe(DEFAULT);
    expect(loadPrintSize({})).toBe(DEFAULT);
  });

  it('menyimpan nilai valid ke storage', () => {
    const storage = {};
    savePrintSize('58', storage);
    expect(storage[KEY]).toBe('58');
  });

  it('menyimpan default jika nilai tidak valid', () => {
    const storage = {};
    savePrintSize('invalid', storage);
    expect(storage[KEY]).toBe(DEFAULT);
  });

  it('round-trip: simpan lalu baca menghasilkan nilai yang sama', () => {
    const storage = {};
    savePrintSize('58', storage);
    expect(loadPrintSize(storage)).toBe('58');

    savePrintSize('80', storage);
    expect(loadPrintSize(storage)).toBe('80');
  });
});
