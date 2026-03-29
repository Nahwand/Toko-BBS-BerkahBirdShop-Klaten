import styles from '../styles/App.module.css';

export default function SupplierPage({ suppliers, products, exportExcel, setSupForm, setSupModal, delSup }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <span className="text-[13px] text-gray-500">{suppliers.length} supplier</span>
        <div className="flex gap-2">
          <button className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#1565c0] text-white border-none cursor-pointer" onClick={() => exportExcel("supplier")}>📥 Export</button>
          <button className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#2d7a2d] text-white border-none cursor-pointer"
            onClick={() => { setSupForm({ name: "", contact: "", phone: "", email: "", address: "", category: "", status: "Aktif", notes: "" }); setSupModal("add"); }}>
            + Tambah
          </button>
        </div>
      </div>
      <div className="sup-grid">
        {suppliers.map((s) => {
          const spProds = products.filter((p) => p.supplier_id === s.id);
          return (
            <div key={s.id} className={`${styles.card} p-4`}>
              <div className="flex justify-between items-start mb-2.5">
                <div className="flex-1">
                  <div className="font-extrabold text-sm text-[#1a4a1a] dark:text-[#a8e063]">{s.name}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">👤 {s.contact}</div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex-shrink-0 ${s.status === "Aktif" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-600"}`}>
                  {s.status}
                </span>
              </div>
              <div className="text-xs text-gray-500 mb-0.5">📞 {s.phone}</div>
              {s.email && <div className="text-xs text-gray-500 mb-0.5">✉️ {s.email}</div>}
              <div className="text-xs text-gray-500 mb-1.5">📍 {s.address}</div>
              {spProds.length > 0 && <div className="text-[11px] text-gray-400 mb-1.5">📦 {spProds.map(p => p.name).join(", ")}</div>}
              {s.notes && <div className="text-[11px] text-gray-400 italic mb-2.5">💬 {s.notes}</div>}
              <div className="flex gap-1.5 border-t border-[#f0f5f0] dark:border-[#243424] pt-2.5">
                <button className="flex-1 py-1 text-[11px] font-bold rounded-lg border border-[#2d7a2d] text-[#2d7a2d] bg-transparent cursor-pointer"
                  onClick={() => { setSupForm({ name: s.name, contact: s.contact, phone: s.phone, email: s.email, address: s.address, category: s.category, status: s.status, notes: s.notes }); setSupModal(s); }}>✏️ Edit</button>
                <button className="flex-1 py-1 text-[11px] font-bold rounded-lg bg-[#dc3545] text-white border-none cursor-pointer" onClick={() => delSup(s.id)}>🗑 Hapus</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
