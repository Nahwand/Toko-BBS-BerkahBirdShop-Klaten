import styles from '../../styles/App.module.css';

export default function SupplierModal({ supModal, supForm, setSupForm, saveSup, onClose }) {
  if (!supModal) return null;
  const fields = [
    { l: "Nama *", k: "name", t: "text", p: "Nama supplier..." },
    { l: "Kontak PIC", k: "contact", t: "text", p: "Nama PIC..." },
    { l: "Telepon *", k: "phone", t: "text", p: "08xx..." },
    { l: "Email", k: "email", t: "email", p: "email@..." },
    { l: "Alamat", k: "address", t: "text", p: "Jl. ..." },
    { l: "Kategori", k: "category", t: "text", p: "Jenis produk..." },
  ];
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-999" onClick={onClose}>
      <div className="bg-white dark:bg-[#1a2a1a] rounded-2xl p-6 w-[420px] max-h-[90vh] overflow-y-auto shadow-2xl text-gray-900 dark:text-[#e8f5e8]" onClick={(e) => e.stopPropagation()}>
        <div className="text-base font-extrabold mb-4 text-bbs-green-dark dark:text-[#a8e063]">
          {supModal === "add" ? "➕ Tambah Supplier" : "✏️ Edit Supplier"}
        </div>
        {fields.map((f) => (
          <div key={f.k} className="mb-3">
            <label htmlFor={`sup-${f.k}`} className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 mb-1">{f.l}</label>
            <input id={`sup-${f.k}`} name={`sup-${f.k}`} className={styles.inp} type={f.t} placeholder={f.p} value={supForm[f.k]}
              onChange={(e) => setSupForm((s) => ({ ...s, [f.k]: e.target.value }))} />
          </div>
        ))}
        <div className="mb-3">
          <label htmlFor="sup-status" className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 mb-1">Status</label>
          <select id="sup-status" name="sup-status" className={styles.inp} value={supForm.status} onChange={(e) => setSupForm((s) => ({ ...s, status: e.target.value }))}>
            <option>Aktif</option>
            <option>Tidak Aktif</option>
          </select>
        </div>
        <div className="mb-5">
          <label htmlFor="sup-notes" className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 mb-1">Catatan</label>
          <textarea id="sup-notes" name="sup-notes" className={styles.inp} style={{ height: 76, resize: "vertical" }} placeholder="Catatan..."
            value={supForm.notes} onChange={(e) => setSupForm((s) => ({ ...s, notes: e.target.value }))} />
        </div>
        <div className="flex gap-2.5">
          <button className="flex-1 py-3 text-sm font-bold bg-bbs-green text-white rounded-xl border-none cursor-pointer" onClick={saveSup}>💾 Simpan</button>
          <button className="flex-1 py-3 text-sm font-bold bg-[#f0f5f0] dark:bg-[#2d4a2d] text-bbs-green dark:text-[#a8e063] rounded-xl border-none cursor-pointer" onClick={onClose}>Batal</button>
        </div>
      </div>
    </div>
  );
}
