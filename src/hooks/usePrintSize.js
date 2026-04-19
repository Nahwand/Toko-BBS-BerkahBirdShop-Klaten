import { useState } from 'react';

const VALID_SIZES = ['58', '80'];
const KEY = 'bbs_print_size';
const DEFAULT = '80';

function loadPrintSize() {
  try {
    const val = localStorage.getItem(KEY);
    return VALID_SIZES.includes(val) ? val : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function usePrintSize() {
  const [printSize, setPrintSizeState] = useState(() => loadPrintSize());

  const setPrintSize = (size) => {
    const valid = VALID_SIZES.includes(size) ? size : DEFAULT;
    try { localStorage.setItem(KEY, valid); } catch { /* ignore */ }
    setPrintSizeState(valid);
  };

  return [printSize, setPrintSize];
}
