export default function ConfirmModal({ confirm, onConfirm, onCancel }) {
  if (!confirm) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-999" onClick={onCancel}>
      <div className="bg-white  rounded-2xl p-6 w-[340px] shadow-2xl text-center text-gray-900 " onClick={(e) => e.stopPropagation()}>
        <div className="text-4xl mb-2.5">{confirm.icon || "⚠️"}</div>
        <div className="text-base font-extrabold text-bbs-green-dark  mb-2">{confirm.title}</div>
        <div className="text-[13px] text-gray-500  mb-1.5">{confirm.message}</div>
        {confirm.warning && (
          <div className="text-xs text-red-600 bg-red-100  rounded-lg px-3 py-2 mb-4 font-semibold">
            {confirm.warning}
          </div>
        )}
        <div className="flex gap-2.5 mt-4">
          <button className="flex-1 py-3 text-sm font-bold bg-[#dc3545] text-white rounded-xl border-none cursor-pointer" onClick={onConfirm}>
            {confirm.confirmLabel || "Ya, Hapus"}
          </button>
          <button className="flex-1 py-3 text-sm font-bold bg-[#f0f5f0]  text-bbs-green  rounded-xl border-none cursor-pointer" onClick={onCancel}>
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
