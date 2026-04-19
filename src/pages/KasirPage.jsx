import { useState } from 'react';
import styles from '../styles/App.module.css';
import Badge from '../components/Badge';
import { fmt } from '../utils/constants';

export default function KasirPage({
  filtProd, searchProd, setSearchProd, filterCat, setFilterCat, kategoris,
  cart, customerName, setCustomerName, paymentInput, setPaymentInput,
  cartTotal, payNum, addToCart, updCart, processPayment, setCart, isOffline,
  discount, setDiscount,
}) {
  const [discountType, setDiscountType] = useState('persen'); // 'persen' | 'nominal'
  const catList = ["Semua", ...(kategoris || []).map(k => k.nama)];

  const discountAmount = discountType === 'persen'
    ? Math.round(cartTotal * (Math.min(100, Math.max(0, parseFloat(discount) || 0)) / 100))
    : Math.min(cartTotal, Math.max(0, parseInt(discount) || 0));

  const totalAfterDiscount = cartTotal - discountAmount;

  return (
    <div className="kasir-grid">
      {/* Produk grid */}
      <div>
        <div className="flex gap-2 mb-3.5 items-center">
          <input id="kasir-search" name="kasir-search" className={`${styles.inp} w-[200px]`}
            placeholder="🔍 Cari produk..." value={searchProd} onChange={(e) => setSearchProd(e.target.value)} />
          <select id="kasir-cat" name="kasir-cat" className={`${styles.inp} w-[150px]`} value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
            {catList.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="prod-grid">
          {filtProd.length === 0 ? (
            <div className="col-span-full py-8 text-center text-gray-400 text-sm">
              {searchProd ? "Produk tidak ditemukan." : isOffline ? "Belum ada produk di memori offline. Harap sambungkan internet sekali saja." : "Tidak ada produk."}
            </div>
          ) : filtProd.map((p) => (
            <div key={p.id} onClick={() => addToCart(p)}
              className={`bg-white rounded-xl p-3 border border-bbs-border transition-all ${p.stock > 0 ? 'cursor-pointer hover:border-bbs-green hover:-translate-y-0.5' : 'cursor-not-allowed opacity-50'}`}>
              <Badge cat={p.category} />
              <div className="mt-2.5 h-[100px] w-full rounded-lg border border-gray-100 flex overflow-hidden"
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
      <div className="kasir-cart bg-white rounded-xl p-5 border border-bbs-border">
        <div className="font-extrabold text-sm text-bbs-green-dark mb-3.5">🤝 Keranjang</div>
        <input id="kasir-customer" name="kasir-customer" className={`${styles.inp} mb-2.5`}
          placeholder="Nama pelanggan..." value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        {cart.length === 0 ? (
          <div className="text-gray-300 text-center py-7 text-[13px]">Ketuk produk untuk menambahkan</div>
        ) : (
          <>
            <div className="max-h-[220px] overflow-y-auto">
              {cart.map((item) => {
                const prod = filtProd.find(p => p.id === item.product_id);
                const maxStock = prod?.stock ?? item.qty;
                return (
                  <div key={item.product_id} className="flex items-center gap-1.5 py-1.5 border-b border-[#f0f5f0]">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate">{item.name}</div>
                      <div className="text-[10px] text-gray-400">{fmt(item.price)}/{item.unit}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updCart(item.product_id, item.qty - 1)} className="w-6 h-6 rounded-md border border-gray-200 bg-gray-50 font-extrabold text-base leading-none cursor-pointer">−</button>
                      <input
                        type="number" min="1" max={maxStock}
                        value={item.qty}
                        onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v)) updCart(item.product_id, v); }}
                        className="w-10 h-6 text-center text-[13px] font-extrabold border border-gray-200 rounded-md outline-none focus:border-bbs-green"
                        style={{ MozAppearance: 'textfield' }}
                      />
                      <button onClick={() => updCart(item.product_id, item.qty + 1)} className="w-6 h-6 rounded-md border border-gray-200 bg-gray-50 font-extrabold text-base leading-none cursor-pointer">+</button>
                    </div>
                    <div className="text-xs font-extrabold text-bbs-green min-w-[62px] text-right">{fmt(item.price * item.qty)}</div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 pt-3 border-t-2 border-bbs-border">
              {/* Subtotal */}
              <div className="flex justify-between mb-2 text-[13px] text-gray-500">
                <span>Subtotal</span>
                <span>{fmt(cartTotal)}</span>
              </div>

              {/* Diskon */}
              <div className="mb-2.5 p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                <div className="text-[10px] font-extrabold text-amber-700 mb-1.5">🏷️ Diskon</div>
                <div className="flex gap-1.5 items-center">
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden text-[11px] font-bold">
                    <button onClick={() => { setDiscountType('persen'); setDiscount(''); }}
                      className={`px-2.5 py-1 border-none cursor-pointer ${discountType === 'persen' ? 'bg-bbs-green text-white' : 'bg-white text-gray-500'}`}>%</button>
                    <button onClick={() => { setDiscountType('nominal'); setDiscount(''); }}
                      className={`px-2.5 py-1 border-none cursor-pointer ${discountType === 'nominal' ? 'bg-bbs-green text-white' : 'bg-white text-gray-500'}`}>Rp</button>
                  </div>
                  <input
                    type="number" min="0"
                    max={discountType === 'persen' ? 100 : cartTotal}
                    placeholder={discountType === 'persen' ? "0 %" : "0"}
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className={`${styles.inp} flex-1 text-sm`}
                    style={{ MozAppearance: 'textfield' }}
                  />
                  {discount && <button onClick={() => setDiscount('')} className="text-gray-400 text-xs px-1 cursor-pointer bg-transparent border-none">✕</button>}
                </div>
                {discountAmount > 0 && (
                  <div className="text-[11px] text-amber-700 font-bold mt-1.5">
                    Hemat: {fmt(discountAmount)} {discountType === 'persen' ? `(${discount}%)` : ''}
                  </div>
                )}
              </div>

              {/* Total setelah diskon */}
              <div className="flex justify-between mb-2.5">
                <span className="font-extrabold text-[15px]">TOTAL</span>
                <div className="text-right">
                  {discountAmount > 0 && <div className="text-[11px] text-gray-400 line-through">{fmt(cartTotal)}</div>}
                  <span className="font-black text-lg text-bbs-green">{fmt(totalAfterDiscount)}</span>
                </div>
              </div>

              <input id="kasir-payment" name="kasir-payment" className={`${styles.inp} mb-2 text-[15px] font-bold`}
                type="number" placeholder="Nominal pembayaran..." value={paymentInput} onChange={(e) => setPaymentInput(e.target.value)} />
              {payNum > 0 && (
                <div className={`flex justify-between text-[13px] mb-2.5 font-extrabold ${payNum >= totalAfterDiscount ? "text-bbs-green" : "text-red-500"}`}>
                  <span>Kembalian</span>
                  <span>{payNum >= totalAfterDiscount ? fmt(payNum - totalAfterDiscount) : "Kurang " + fmt(totalAfterDiscount - payNum)}</span>
                </div>
              )}
              <button className="w-full py-3 text-sm font-bold bg-bbs-green text-white rounded-xl border-none cursor-pointer mb-2"
                onClick={() => processPayment(discountAmount, totalAfterDiscount)}>
                ✅ Proses Pembayaran
              </button>
              <button className="w-full py-2 text-xs font-bold bg-[#e8f0e8] text-bbs-green rounded-xl border-none cursor-pointer"
                onClick={() => { setCart([]); setDiscount(''); }}>
                🗑 Kosongkan
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
