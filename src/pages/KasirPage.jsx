import styles from '../styles/App.module.css';
import Badge from '../components/Badge';
import { CATS, fmt } from '../utils/constants';

export default function KasirPage({
  filtProd, searchProd, setSearchProd, filterCat, setFilterCat,
  cart, customerName, setCustomerName, paymentInput, setPaymentInput,
  cartTotal, payNum, change, addToCart, updCart, processPayment, setCart, isOffline,
}) {
  return (
    <div className="kasir-grid">
      {/* Produk grid */}
      <div>
        <div className="flex gap-2 mb-3.5">
          <input id="kasir-search" name="kasir-search" className={`${styles.inp} flex-1`}
            placeholder="🔍 Cari produk..." value={searchProd} onChange={(e) => setSearchProd(e.target.value)} />
          <select id="kasir-cat" name="kasir-cat" className={`${styles.inp} w-[150px]`} value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
            {CATS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="prod-grid">
          {filtProd.length === 0 ? (
            <div className="col-span-full py-8 text-center text-gray-400 text-sm">
              {searchProd ? "Produk tidak ditemukan." : isOffline ? "Belum ada produk di memori offline. Harap sambungkan internet sekali saja." : "Tidak ada produk."}
            </div>
          ) : filtProd.map((p) => (
            <div key={p.id} onClick={() => addToCart(p)}
              className={`bg-white dark:bg-[#1a2a1a] rounded-xl p-3 border border-bbs-border dark:border-[#2d4a2d] transition-all ${p.stock > 0 ? 'cursor-pointer hover:border-bbs-green hover:-translate-y-0.5' : 'cursor-not-allowed opacity-50'}`}>
              <Badge cat={p.category} />
              <div className="mt-2.5 h-[100px] w-full rounded-lg border border-gray-100 dark:border-[#2d4a2d] flex overflow-hidden"
                style={{ background: p.image_url ? `url(${p.image_url}) center/cover` : "#f5f5f5" }}>
                {!p.image_url && <span className="m-auto text-3xl opacity-20">📦</span>}
              </div>
              <div className="font-bold text-[13px] mt-2 mb-0.5 leading-tight">{p.name}</div>
              <div className="text-[15px] font-extrabold text-bbs-green">{fmt(p.price)}</div>
              <div className="text-[9px] text-gray-300">/{p.unit}</div>
              <div className={`text-[10px] mt-1 ${p.stock <= p.min_stock ? "text-orange-500" : "text-gray-400"}`}>Stok: {p.stock} {p.unit}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Keranjang */}
      <div className="kasir-cart bg-white dark:bg-[#1a2a1a] rounded-xl p-5 border border-bbs-border dark:border-[#2d4a2d]">
        <div className="font-extrabold text-sm text-bbs-green-dark dark:text-[#a8e063] mb-3.5">🤝 Keranjang</div>
        <input id="kasir-customer" name="kasir-customer" className={`${styles.inp} mb-2.5`}
          placeholder="Nama pelanggan..." value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        {cart.length === 0 ? (
          <div className="text-gray-300 text-center py-7 text-[13px]">Ketuk produk untuk menambahkan</div>
        ) : (
          <>
            <div className="max-h-[250px] overflow-y-auto">
              {cart.map((item) => (
                <div key={item.product_id} className="flex items-center gap-1.5 py-1.5 border-b border-[#f0f5f0] dark:border-[#243424]">
                  <div className="flex-1">
                    <div className="text-xs font-bold">{item.name}</div>
                    <div className="text-[10px] text-gray-400">{fmt(item.price)}/{item.unit}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updCart(item.product_id, item.qty - 1)} className="w-6 h-6 rounded-md border border-gray-200 dark:border-[#3a5a3a] bg-gray-50 dark:bg-[#243424] font-extrabold text-base leading-none cursor-pointer">−</button>
                    <span className="text-[13px] font-extrabold min-w-[22px] text-center">{item.qty}</span>
                    <button onClick={() => updCart(item.product_id, item.qty + 1)} className="w-6 h-6 rounded-md border border-gray-200 dark:border-[#3a5a3a] bg-gray-50 dark:bg-[#243424] font-extrabold text-base leading-none cursor-pointer">+</button>
                  </div>
                  <div className="text-xs font-extrabold text-bbs-green min-w-[62px] text-right">{fmt(item.price * item.qty)}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t-2 border-bbs-border dark:border-[#2d4a2d]">
              <div className="flex justify-between mb-2.5">
                <span className="font-extrabold text-[15px]">TOTAL</span>
                <span className="font-black text-lg text-bbs-green">{fmt(cartTotal)}</span>
              </div>
              <input id="kasir-payment" name="kasir-payment" className={`${styles.inp} mb-2 text-[15px] font-bold`}
                type="number" placeholder="Nominal pembayaran..." value={paymentInput} onChange={(e) => setPaymentInput(e.target.value)} />
              {payNum > 0 && (
                <div className={`flex justify-between text-[13px] mb-2.5 font-extrabold ${change >= 0 ? "text-bbs-green" : "text-red-500"}`}>
                  <span>Kembalian</span>
                  <span>{change >= 0 ? fmt(change) : "Kurang " + fmt(Math.abs(change))}</span>
                </div>
              )}
              <button className="w-full py-3 text-sm font-bold bg-bbs-green text-white rounded-xl border-none cursor-pointer mb-2" onClick={processPayment}>
                ✅ Proses Pembayaran
              </button>
              <button className="w-full py-2 text-xs font-bold bg-[#e8f0e8] dark:bg-[#2d4a2d] text-bbs-green dark:text-[#a8e063] rounded-xl border-none cursor-pointer" onClick={() => setCart([])}>
                🗑 Kosongkan
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
