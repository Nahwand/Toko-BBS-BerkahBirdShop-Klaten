import { useState } from 'react';
import { fmt, validateVoidReason } from '../../utils/constants';

export default function VoidModal({ transaction, currentUser, onConfirm, onClose, loading }) {
  const [alasan, setAlasan] = useState('');
  const [error, setError] = useState('');

  if (!transaction) return null;

  const handleConfirm = async () => {
    if (!validateVoidReason(alasan)) {
      setError('Alasan void wajib diisi.');
      return;
    }
    setError('');
    await onConfirm(alasan);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-999" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-[440px] max-h-[90vh] overflow-y-auto shadow-2xl text-gray-900"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="text-base font-extrabold text-red-600 mb-1">🚫 Void Transaksi</div>
        <div className="text-[12px] text-gray-400 mb-4">Tindakan ini tidak dapat dibatalkan. Stok akan dikembalikan otomatis.</div>

        {/* Warning */}
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          <div className="text-[11px] font-extrabold text-red-600 mb-2">⚠️ Detail Transaksi yang Akan Di-void</div>
          <div className="flex justify-between text-[12px] mb-1">
            <span className="text-gray-500">Kode</span>
            <span className="font-bold">{transaction.trx_code}</span>
          </div>
          <div className="flex justify-between text-[12px] mb-1">
            <span className="text-gray-500">Tanggal</span>
            <span className="font-bold">{transaction.date}</span>
          </div>
          <div className="flex justify-between text-[12px] mb-1">
            <span className="text-gray-500">Pelanggan</span>
            <span className="font-bold">{transaction.customer}</span>
          </div>
          <div className="flex justify-between text-[12px] mb-2">
            <span className="text-gray-500">Total</span>
            <span className="font-extrabold text-red-600">{fmt(transaction.total)}</span>
          </div>
          {/* Daftar item */}
          {(transaction.items || []).length > 0 && (
            <div className="border-t border-red-100 pt-2">
              <div className="text-[10px] font-extrabold text-gray-400 mb-1">Item:</div>
              {(transaction.items || []).map((item, idx) => (
                <div key={idx} className="flex justify-between text-[11px] text-gray-600 mb-0.5">
                  <span>{item.product_name} ×{item.qty}</span>
                  <span>{fmt(item.price * item.qty)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alasan void */}
        <div className="mb-4">
          <label className="block text-[11px] font-extrabold text-gray-600 mb-1">
            Alasan Void <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[13px] outline-none focus:border-red-400 resize-none"
            rows={3}
            placeholder="Contoh: Salah input produk, transaksi duplikat..."
            value={alasan}
            onChange={(e) => { setAlasan(e.target.value); setError(''); }}
          />
          {error && <div className="text-[11px] text-red-500 mt-1 font-semibold">{error}</div>}
        </div>

        {/* Actions */}
        <div className="flex gap-2.5">
          <button
            className="flex-1 py-3 text-sm font-bold bg-red-600 text-white rounded-xl border-none cursor-pointer disabled:opacity-50"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? '⏳ Memproses...' : '🚫 Konfirmasi Void'}
          </button>
          <button
            className="flex-1 py-3 text-sm font-bold bg-[#f0f5f0] text-bbs-green rounded-xl border-none cursor-pointer"
            onClick={onClose}
            disabled={loading}
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
