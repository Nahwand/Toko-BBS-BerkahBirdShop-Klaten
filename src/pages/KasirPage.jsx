import React from 'react';
import styles from '../styles/App.module.css';
import Badge from '../components/Badge';
import { CATS, fmt } from '../utils/constants';

export default function KasirPage({
  filtProd, searchProd, setSearchProd, filterCat, setFilterCat,
  cart, customerName, setCustomerName, paymentInput, setPaymentInput,
  cartTotal, payNum, change, addToCart, updCart, processPayment, setCart,
  isOffline,
}) {
  return (
    <div className="kasir-grid">
      <div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <input className={styles.inp} style={{ flex: 1 }} placeholder="🔍 Cari produk..."
            value={searchProd} onChange={(e) => setSearchProd(e.target.value)} />
          <select className={styles.inp} style={{ width: 150 }} value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
            {CATS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="prod-grid">
          {filtProd.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", color: "#888", gridColumn: "1 / -1" }}>
              {searchProd ? "Produk tidak ditemukan." :
                isOffline ? "Belum ada produk di memori offline. Harap sambungkan internet sekali saja untuk menyinkronkan data produk." :
                  "Tidak ada produk."}
            </div>
          ) : (
            filtProd.map((p) => (
              <div key={p.id} onClick={() => addToCart(p)}
                style={{ background: "#fff", borderRadius: 10, padding: "13px", border: "1px solid #e4ede4", cursor: p.stock > 0 ? "pointer" : "not-allowed", opacity: p.stock <= 0 ? 0.5 : 1, transition: "border 0.1s,transform 0.1s" }}
                onMouseEnter={(e) => { if (p.stock > 0) { e.currentTarget.style.borderColor = "#2d7a2d"; e.currentTarget.style.transform = "translateY(-2px)"; } }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e4ede4"; e.currentTarget.style.transform = ""; }}
              >
                <Badge cat={p.category} />
                <div style={{ marginTop: 10, height: 100, width: "100%", background: p.image_url ? `url(${p.image_url}) center/cover` : "#f5f5f5", borderRadius: 8, display: "flex", border: "1px solid #efefef" }}>
                  {!p.image_url && <span style={{ fontSize: 28, margin: "auto", opacity: 0.2 }}>📦</span>}
                </div>
                <div style={{ fontWeight: 700, fontSize: 13, marginTop: 8, marginBottom: 3, lineHeight: 1.3 }}>{p.name}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#2d7a2d" }}>{fmt(p.price)}</div>
                <div style={{ fontSize: 9, color: "#ccc" }}>/{p.unit}</div>
                <div style={{ fontSize: 10, marginTop: 5, color: p.stock <= p.min_stock ? "#e65100" : "#aaa" }}>Stok: {p.stock} {p.unit}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="kasir-cart" style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", border: "1px solid #e4ede4" }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: "#1a4a1a", marginBottom: 14 }}>🤝 Keranjang</div>
        <input className={styles.inp} style={{ marginBottom: 10 }} placeholder="Nama pelanggan..."
          value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        {cart.length === 0 ? (
          <div style={{ color: "#ccc", textAlign: "center", padding: "28px 0", fontSize: 13 }}>Ketuk produk untuk menambahkan</div>
        ) : (
          <>
            <div style={{ maxHeight: 250, overflowY: "auto" }}>
              {cart.map((item) => (
                <div key={item.product_id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 0", borderBottom: "1px solid #f0f5f0" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{item.name}</div>
                    <div style={{ fontSize: 10, color: "#aaa" }}>{fmt(item.price)}/{item.unit}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <button onClick={() => updCart(item.product_id, item.qty - 1)} style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid #ddd", cursor: "pointer", background: "#f5f5f5", fontWeight: 800, fontSize: 16, lineHeight: 1 }}>−</button>
                    <span style={{ fontSize: 13, fontWeight: 800, minWidth: 22, textAlign: "center" }}>{item.qty}</span>
                    <button onClick={() => updCart(item.product_id, item.qty + 1)} style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid #ddd", cursor: "pointer", background: "#f5f5f5", fontWeight: 800, fontSize: 16, lineHeight: 1 }}>+</button>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#2d7a2d", minWidth: 62, textAlign: "right" }}>{fmt(item.price * item.qty)}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "2px solid #e4ede4" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontWeight: 800, fontSize: 15 }}>TOTAL</span>
                <span style={{ fontWeight: 900, fontSize: 18, color: "#2d7a2d" }}>{fmt(cartTotal)}</span>
              </div>
              <input className={styles.inp} style={{ marginBottom: 8, fontSize: 15, fontWeight: 700 }}
                type="number" placeholder="Nominal pembayaran..." value={paymentInput} onChange={(e) => setPaymentInput(e.target.value)} />
              {payNum > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 10, color: change >= 0 ? "#2d7a2d" : "#dc3545", fontWeight: 800 }}>
                  <span>Kembalian</span>
                  <span>{change >= 0 ? fmt(change) : "Kurang " + fmt(Math.abs(change))}</span>
                </div>
              )}
              <button className={`${styles.btn} ${styles.btnprimary}`} style={{ width: "100%", padding: "11px", fontSize: 14, borderRadius: 10 }} onClick={processPayment}>
                ✅ Proses Pembayaran
              </button>
              <button className={styles.btndefault} style={{ width: "100%", marginTop: 8, padding: "9px", fontSize: 12, borderRadius: 10 }} onClick={() => setCart([])}>
                🗑 Kosongkan
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
