import styles from '../../styles/App.module.css';

export default function RestockModal({ restockModal, restockQty, setRestockQty, restockCatatan, setRestockCatatan, doRestock, onClose }) {
  if (!restockModal) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999]" onClick={onClose}>
      <div className="bg-white dark:bg-[#1a2a1a] rounded-2xl p-6 w-[330px] shadow-2xl text-gray-900 dark:text-[#e8f5e8]" onClick={(e) => e.stopPropagation()}>
        <div className="text-base font-extrabold mb-1 text-[#1a4a1a] dark:text-[#a8e063]">📦 Restock Produk</div>
        <div className="text-[13px] text-gray-500 dark:text-gray-400 mb-3.5 font-semibold">{restockModal.name}</div>
        <div className="flex justify-between text-[13px] mb-3.5 p-3 bg-[#f4f7f2] dark:bg-[#243424] rounded-xl">
          <span>Stok saat ini</span>
          <strong>{restockModal.stock} {restockModal.unit}</strong>
        </div>
        <label htmlFor="restock-qty" className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 mb-1">
          Tambah Stok ({restockModal.unit})
        </label>
        <input id="restock-qty" name="restock-qty" className={`${styles.inp} mb-3 text-base font-bold`}
          type="number" placeholder="Jumlah tambahan..." value={restockQty}
          onChange={(e) => setRestockQty(e.target.value)} autoFocus />
        {restockQty && parseInt(restockQty) > 0 && (
          <div className="mb-3 text-[13px] text-[#2d7a2d] font-extrabold p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
            ✅ Setelah restock: <strong>{restockModal.stock + parseInt(restockQty)} {restockModal.unit}</strong>
          </div>
        )}
        <label htmlFor="restock-catatan" className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 mb-1">Catatan (opsional)</label>
        <input id="restock-catatan" name="restock-catatan" className={`${styles.inp} mb-4`}
          placeholder="Misal: dari supplier X, tanggal kirim..."
          value={restockCatatan} onChange={(e) => setRestockCatatan(e.target.value)} />
        <div className="flex gap-2.5">
          <button className="flex-1 py-3 text-sm font-bold bg-[#2d7a2d] text-white rounded-xl border-none cursor-pointer" onClick={doRestock}>✅ Konfirmasi</button>
          <button className="flex-1 py-3 text-sm font-bold bg-[#f0f5f0] dark:bg-[#2d4a2d] text-[#2d7a2d] dark:text-[#a8e063] rounded-xl border-none cursor-pointer" onClick={onClose}>Batal</button>
        </div>
      </div>
    </div>
  );
}
