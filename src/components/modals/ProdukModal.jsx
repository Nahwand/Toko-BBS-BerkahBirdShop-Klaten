import styles from '../../styles/App.module.css';

export default function ProdukModal({ prodModal, prodForm, setProdForm, prodImage, setProdImage, kategoris, satuans, suppliers, saveProd, onClose }) {
  if (!prodModal) return null;

  // Cek apakah form sudah diisi (ada perubahan)
  const isDirty = prodForm.name || prodForm.price || prodImage;
  const handleClose = () => {
    if (isDirty) {
      if (!window.confirm('Data yang sudah diisi akan hilang. Yakin tutup?')) return;
    }
    onClose();
  };
  const fields = [
    { l: "Nama *", k: "name", t: "text", p: "Nama produk..." },
    { l: "Harga *", k: "price", t: "number", p: "Harga..." },
    { l: "Stok *", k: "stock", t: "number", p: "Stok..." },
    { l: "Min Stok", k: "min_stock", t: "number", p: "Min stok..." },
  ];
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-999" onClick={handleClose}>
      <div className="bg-white  rounded-2xl p-6 w-[420px] max-h-[90vh] overflow-y-auto shadow-2xl text-gray-900 " onClick={(e) => e.stopPropagation()}>
        <div className="text-base font-extrabold mb-4 text-bbs-green-dark ">
          {prodModal === "add" ? "➕ Tambah Produk" : "✏️ Edit Produk"}
        </div>

        {/* Foto */}
        <div className="mb-4">
          <label htmlFor="produk-foto" className="block text-[11px] font-extrabold text-gray-500  mb-1">Foto Produk (Opsional)</label>
          <input id="produk-foto" name="produk-foto" type="file" accept="image/*" onChange={(e) => setProdImage(e.target.files[0])} className={styles.inp} style={{ padding: 8 }} />
          {prodModal !== "add" && prodModal?.image_url && !prodImage && (
            <div className="mt-2">
              <img src={prodModal.image_url} alt="Current" className="w-16 h-16 object-cover rounded-lg border-2 border-bbs-border" />
              <div className="text-[10px] text-gray-400 mt-1">Foto saat ini, biarkan kosong untuk tidak mengubah.</div>
            </div>
          )}
        </div>

        {/* Fields */}
        {fields.map((f) => (
          <div key={f.k} className="mb-3">
            <label htmlFor={`produk-${f.k}`} className="block text-[11px] font-extrabold text-gray-500  mb-1">{f.l}</label>
            <input id={`produk-${f.k}`} name={`produk-${f.k}`} className={styles.inp} type={f.t} placeholder={f.p} value={prodForm[f.k]}
              onChange={(e) => setProdForm((p) => ({ ...p, [f.k]: e.target.value }))} />
          </div>
        ))}

        {/* Kategori */}
        <div className="mb-3">
          <label htmlFor="produk-category" className="block text-[11px] font-extrabold text-gray-500  mb-1">Kategori</label>
          <select id="produk-category" name="produk-category" className={styles.inp} value={prodForm.category} onChange={(e) => setProdForm((p) => ({ ...p, category: e.target.value }))}>
            {kategoris.map((k) => <option key={k.id} value={k.nama}>{k.nama}</option>)}
          </select>
        </div>

        {/* Jenis */}
        <div className="mb-3">
          <label htmlFor="produk-jenis" className="block text-[11px] font-extrabold text-gray-500  mb-1">Jenis</label>
          <input id="produk-jenis" name="produk-jenis" className={styles.inp} type="text" placeholder="Kitten / Adult / Semua Umur..." value={prodForm.jenis || ""}
            onChange={(e) => setProdForm((p) => ({ ...p, jenis: e.target.value }))} />
        </div>

        {/* Varian */}
        <div className="mb-3">
          <label htmlFor="produk-varian" className="block text-[11px] font-extrabold text-gray-500  mb-1">Varian/Rasa</label>
          <input id="produk-varian" name="produk-varian" className={styles.inp} type="text" placeholder="Tuna, Salmon, Sarden..." value={prodForm.varian || ""}
            onChange={(e) => setProdForm((p) => ({ ...p, varian: e.target.value }))} />
        </div>

        {/* Satuan chips */}
        <div className="mb-3">
          <div className="block text-[11px] font-extrabold text-gray-500  mb-1">Satuan</div>
          <div className="flex flex-wrap gap-2">
            {satuans.map((s) => {
              const currentUnits = prodForm.unit ? prodForm.unit.split(", ").filter(Boolean).map(u => u.toLowerCase()) : [];
              const isSelected = currentUnits.includes(s.nama.toLowerCase());
              return (
                <div key={s.id} onClick={() => {
                  let current = prodForm.unit ? prodForm.unit.split(", ").filter(Boolean) : [];
                  if (isSelected) current = current.filter((u) => u.toLowerCase() !== s.nama.toLowerCase());
                  else current.push(s.nama);
                  setProdForm((p) => ({ ...p, unit: current.join(", ") }));
                }}
                  className={`px-3 py-1.5 rounded-lg border text-[13px] cursor-pointer select-none transition-all ${isSelected ? 'border-bbs-green bg-bbs-border text-bbs-green-dark font-bold' : 'border-gray-200 bg-white text-gray-500'}`}>
                  {s.nama}
                </div>
              );
            })}
          </div>
        </div>

        {/* Supplier */}
        <div className="mb-5">
          <label htmlFor="produk-supplier" className="block text-[11px] font-extrabold text-gray-500  mb-1">Supplier</label>
          <select id="produk-supplier" name="produk-supplier" className={styles.inp} value={prodForm.supplier_id} onChange={(e) => setProdForm((p) => ({ ...p, supplier_id: e.target.value }))}>
            <option value="">— Pilih Supplier —</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="flex gap-2.5">
          <button className="flex-1 py-3 text-sm font-bold bg-bbs-green text-white rounded-xl border-none cursor-pointer" onClick={saveProd}>💾 Simpan</button>
          <button className="flex-1 py-3 text-sm font-bold bg-[#f0f5f0]  text-bbs-green  rounded-xl border-none cursor-pointer" onClick={handleClose}>Batal</button>
        </div>
      </div>
    </div>
  );
}
