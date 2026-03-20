import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import * as XL from 'xlsx';
import { sb } from './config/supabase';
import styles from './styles/App.module.css';
import { CATS, MONTHS, BADGE, ACCESS, TODAY, fmt, fmtN } from './utils/constants';

import Badge from './components/Badge';
import Spin from './components/Spin';
import LoginPage from './pages/LoginPage';
import UsersPage from './pages/UsersPage';
import MasterDataPage from './pages/MasterDataPage';

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const s = sessionStorage.getItem("bbs_user");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  const handleLogin = async (user) => {
    try {
      await sb.from("activity_logs").insert({
        user_nama: user.nama,
        user_role: user.role,
        aksi: "Login",
        kategori: "Sistem",
        detail: `User ${user.nama} berhasil login`
      });
    } catch (e) {
      console.error("Failed to log login:", e);
    }
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    if (currentUser) {
      try {
        await sb.from("activity_logs").insert({
          user_nama: currentUser.nama,
          user_role: currentUser.role,
          aksi: "Logout",
          kategori: "Sistem",
          detail: `User ${currentUser.nama} berhasil logout`
        });
      } catch (e) {
        console.error("Failed to log logout:", e);
      }
    }
    sessionStorage.removeItem("bbs_user");
    setCurrentUser(null);
  };

  if (!currentUser) return <LoginPage onLogin={handleLogin} />;
  return <Main currentUser={currentUser} onLogout={handleLogout} />;
}

function Main({ currentUser, onLogout }) {
  const isSuperAdmin = currentUser.role === "superadmin";
  const allowedPages = ACCESS[currentUser.role] || ACCESS.pegawai;


        const [page, setPage] = useState(allowedPages[0]);
        const [products, setProducts] = useState([]);
        const [transactions, setTransactions] = useState([]);
        const [suppliers, setSuppliers] = useState([]);
        const [kategoris, setKategoris] = useState([]);
        const [satuans, setSatuans] = useState([]);
        const [activityLogs, setActivityLogs] = useState([]);
        const [loading, setLoading] = useState(true);
        const [cart, setCart] = useState([]);
        const [searchProd, setSearchProd] = useState("");
        const [filterCat, setFilterCat] = useState("Semua");
        const [customerName, setCustomerName] = useState("");
        const [paymentInput, setPaymentInput] = useState("");
        const [receipt, setReceipt] = useState(null);
        const [prodModal, setProdModal] = useState(null);
        const [prodForm, setProdForm] = useState({
          name: "",
          category: "Pakan Jadi",
          unit: "kg",
          price: "",
          stock: "",
          min_stock: "",
          supplier_id: "",
        });
        const [histSearch, setHistSearch] = useState("");
        const [filterDate, setFilterDate] = useState("");
        const [restockModal, setRestockModal] = useState(null);
        const [restockQty, setRestockQty] = useState("");
        const [notif, setNotif] = useState(null);
        const [supModal, setSupModal] = useState(null);
        const [supForm, setSupForm] = useState({
          name: "",
          contact: "",
          phone: "",
          email: "",
          address: "",
          category: "",
          status: "Aktif",
          notes: "",
        });
        const [rptMonth, setRptMonth] = useState(new Date().getMonth());
        const [rptYear, setRptYear] = useState(new Date().getFullYear());
        const [importLog, setImportLog] = useState([]);
        const [showLogout, setShowLogout] = useState(false);
        const [sidebarOpen, setSidebarOpen] = useState(false);
        const fileRef = useRef();

        const showNotif = (msg, type = "success") => {
          setNotif({ msg, type });
          setTimeout(() => setNotif(null), 3200);
        };

        const logActivity = async (aksi, kategori, detail = "") => {
          try {
            await sb.from("activity_logs").insert({
              user_nama: currentUser.nama,
              user_role: currentUser.role,
              aksi,
              kategori,
              detail,
            });
          } catch (e) {
            console.error("Log error:", e);
          }
        };

        const loadAll = useCallback(async () => {
          setLoading(true);
          try {
            const [
              { data: prods },
              { data: sups },
              { data: trxs },
              { data: items },
              { data: kats },
              { data: sats },
              { data: acts },
            ] = await Promise.all([
              sb.from("products").select("*").order("name"),
              sb.from("suppliers").select("*").order("name"),
              sb
                .from("transactions")
                .select("*")
                .order("date", { ascending: false })
                .order("id", { ascending: false }),
              sb.from("transaction_items").select("*"),
              sb.from("kategoris").select("*").order("nama"),
              sb.from("satuans").select("*").order("nama"),
              sb
                .from("activity_logs")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(30),
            ]);
            setProducts(prods || []);
            setSuppliers(sups || []);
            setKategoris(kats || []);
            setSatuans(sats || []);
            setActivityLogs(acts || []);
            setTransactions(
              (trxs || []).map((t) => ({
                ...t,
                items: (items || []).filter((i) => i.transaction_id === t.id),
              })),
            );
          } catch (e) {
            showNotif("Gagal load: " + e.message, "error");
          }
          setLoading(false);
        }, []);

        useEffect(() => {
          loadAll();
        }, [loadAll]);

        const todayTrx = transactions.filter((t) => t.date === TODAY);
        const todayRev = todayTrx.reduce((s, t) => s + t.total, 0);
        const weekStart = new Date(Date.now() - 7 * 86400000)
          .toISOString()
          .slice(0, 10);
        const weekTrx = transactions.filter((t) => t.date >= weekStart);
        const weekRev = weekTrx.reduce((s, t) => s + t.total, 0);
        const lowStock = products.filter((p) => p.stock <= p.min_stock);

        const filtProd = useMemo(
          () =>
            products.filter((p) => {
              const mc = filterCat === "Semua" || p.category === filterCat;
              const ms = p.name
                .toLowerCase()
                .includes(searchProd.toLowerCase());
              return mc && ms;
            }),
          [products, filterCat, searchProd],
        );

        const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
        const payNum = parseInt(paymentInput) || 0;
        const change = payNum - cartTotal;

        const addToCart = (prod) => {
          if (prod.stock <= 0) {
            showNotif("Stok habis!", "error");
            return;
          }
          setCart((c) => {
            const ex = c.find((x) => x.product_id === prod.id);
            if (ex) {
              if (ex.qty >= prod.stock) {
                showNotif("Stok tidak mencukupi!", "error");
                return c;
              }
              return c.map((x) =>
                x.product_id === prod.id ? { ...x, qty: x.qty + 1 } : x,
              );
            }
            return [
              ...c,
              {
                product_id: prod.id,
                name: prod.name,
                price: prod.price,
                unit: prod.unit,
                qty: 1,
              },
            ];
          });
        };
        const updCart = (pid, qty) => {
          if (qty <= 0) {
            setCart((c) => c.filter((x) => x.product_id !== pid));
            return;
          }
          const p = products.find((p) => p.id === pid);
          if (qty > p.stock) {
            showNotif("Stok tidak mencukupi!", "error");
            return;
          }
          setCart((c) =>
            c.map((x) => (x.product_id === pid ? { ...x, qty } : x)),
          );
        };
        const processPayment = async () => {
          if (!cart.length) {
            showNotif("Keranjang kosong!", "error");
            return;
          }
          if (change < 0) {
            showNotif("Pembayaran kurang!", "error");
            return;
          }
          if (payNum <= 0) {
            showNotif("Masukkan nominal pembayaran!", "error");
            return;
          }
          setLoading(true);
          try {
            const trxCode = `TRX${String(transactions.length + 1).padStart(4, "0")}`;
            const { data: trx, error: e1 } = await sb
              .from("transactions")
              .insert({
                trx_code: trxCode,
                date: TODAY,
                customer: customerName || "Umum",
                total: cartTotal,
                payment: payNum,
                change_amt: change,
              })
              .select()
              .single();
            if (e1) throw e1;
            const { error: e2 } = await sb
              .from("transaction_items")
              .insert(
                cart.map((i) => ({
                  transaction_id: trx.id,
                  product_id: i.product_id,
                  product_name: i.name,
                  qty: i.qty,
                  unit: i.unit,
                  price: i.price,
                })),
              );
            if (e2) throw e2;
            for (const i of cart) {
              const p = products.find((x) => x.id === i.product_id);
              await sb
                .from("products")
                .update({ stock: p.stock - i.qty })
                .eq("id", i.product_id);
            }
            await loadAll();
            setReceipt({
              ...trx,
              items: cart.map((i) => ({
                product_name: i.name,
                qty: i.qty,
                unit: i.unit,
                price: i.price,
              })),
            });
            setCart([]);
            setCustomerName("");
            setPaymentInput("");
            await logActivity(
              "Transaksi Baru",
              "Kasir",
              `${trxCode} - ${customerName || "Umum"} - ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(cartTotal)}`,
            );
            showNotif("Transaksi berhasil!");
          } catch (e) {
            showNotif("Gagal: " + e.message, "error");
          }
          setLoading(false);
        };
        const saveProd = async () => {
          if (!prodForm.name || !prodForm.price || !prodForm.stock) {
            showNotif("Lengkapi semua field!", "error");
            return;
          }
          setLoading(true);
          const payload = {
            name: prodForm.name,
            category: prodForm.category,
            unit: prodForm.unit,
            price: parseInt(prodForm.price),
            stock: parseInt(prodForm.stock),
            min_stock: parseInt(prodForm.min_stock) || 5,
            supplier_id: prodForm.supplier_id
              ? parseInt(prodForm.supplier_id)
              : null,
          };
          try {
            if (prodModal === "add") {
              await sb.from("products").insert(payload);
              await logActivity(
                "Tambah Produk",
                "Produk",
                `${prodForm.name} - ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(parseInt(prodForm.price))}`,
              );
              showNotif("Produk ditambahkan!");
            } else {
              await sb.from("products").update(payload).eq("id", prodModal.id);
              const fmtRp = (n) =>
                new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                }).format(n);
              const changes = [];
              if (prodModal.name !== prodForm.name)
                changes.push(`nama: "${prodModal.name}" → "${prodForm.name}"`);
              if (String(prodModal.price) !== String(prodForm.price))
                changes.push(
                  `harga: ${fmtRp(prodModal.price)} → ${fmtRp(parseInt(prodForm.price))}`,
                );
              if (prodModal.category !== prodForm.category)
                changes.push(
                  `kategori: ${prodModal.category} → ${prodForm.category}`,
                );
              if (prodModal.unit !== prodForm.unit)
                changes.push(`satuan: ${prodModal.unit} → ${prodForm.unit}`);
              if (String(prodModal.stock) !== String(prodForm.stock))
                changes.push(`stok: ${prodModal.stock} → ${prodForm.stock}`);
              if (String(prodModal.min_stock) !== String(prodForm.min_stock))
                changes.push(
                  `min stok: ${prodModal.min_stock} → ${prodForm.min_stock}`,
                );
              const detail =
                changes.length > 0
                  ? `${prodForm.name}: ${changes.join(", ")}`
                  : `${prodForm.name} (tidak ada perubahan)`;
              await logActivity("Edit Produk", "Produk", detail);
              showNotif("Produk diperbarui!");
            }
            await loadAll();
          } catch (e) {
            showNotif("Error: " + e.message, "error");
          }
          setProdModal(null);
          setLoading(false);
        };
        const delProd = async (id) => {
          if (!window.confirm("Hapus produk ini?")) return;
          const p = products.find((x) => x.id === id);
          await sb.from("products").delete().eq("id", id);
          await logActivity("Hapus Produk", "Produk", p?.name || "");
          await loadAll();
          showNotif("Produk dihapus!");
        };
        const doRestock = async () => {
          if (!restockQty || parseInt(restockQty) <= 0) {
            showNotif("Masukkan jumlah valid!", "error");
            return;
          }
          const p = products.find((x) => x.id === restockModal.id);
          await sb
            .from("products")
            .update({ stock: p.stock + parseInt(restockQty) })
            .eq("id", restockModal.id);
          await logActivity(
            "Restock Stok",
            "Stok",
            `${restockModal.name} +${restockQty} ${restockModal.unit} (${p.stock} → ${p.stock + parseInt(restockQty)})`,
          );
          await loadAll();
          showNotif(`Restock ${restockModal.name} berhasil!`);
          setRestockModal(null);
          setRestockQty("");
        };
        const saveSup = async () => {
          if (!supForm.name || !supForm.phone) {
            showNotif("Nama & Telepon wajib!", "error");
            return;
          }
          setLoading(true);
          try {
            if (supModal === "add") {
              await sb.from("suppliers").insert(supForm);
              await logActivity("Tambah Supplier", "Supplier", supForm.name);
              showNotif("Supplier ditambahkan!");
            } else {
              const oldSup = suppliers.find((s) => s.id === supModal.id);
              await sb.from("suppliers").update(supForm).eq("id", supModal.id);
              const supChanges = [];
              if (oldSup?.name !== supForm.name)
                supChanges.push(`nama: "${oldSup?.name}" → "${supForm.name}"`);
              if (oldSup?.phone !== supForm.phone)
                supChanges.push(`telepon: ${oldSup?.phone} → ${supForm.phone}`);
              if (oldSup?.contact !== supForm.contact)
                supChanges.push(`PIC: ${oldSup?.contact} → ${supForm.contact}`);
              if (oldSup?.status !== supForm.status)
                supChanges.push(
                  `status: ${oldSup?.status} → ${supForm.status}`,
                );
              const supDetail =
                supChanges.length > 0
                  ? `${supForm.name}: ${supChanges.join(", ")}`
                  : `${supForm.name} (tidak ada perubahan)`;
              await logActivity("Edit Supplier", "Supplier", supDetail);
              showNotif("Supplier diperbarui!");
            }
            await loadAll();
          } catch (e) {
            showNotif("Error: " + e.message, "error");
          }
          setSupModal(null);
          setLoading(false);
        };
        const delSup = async (id) => {
          if (!window.confirm("Hapus supplier?")) return;
          const sup = suppliers.find((x) => x.id === id);
          await sb.from("suppliers").delete().eq("id", id);
          await logActivity("Hapus Supplier", "Supplier", sup?.name || "");
          await loadAll();
          showNotif("Supplier dihapus!");
        };

        const rptTrx = transactions.filter((t) => {
          const [y, m] = t.date.split("-").map(Number);
          return y === rptYear && m === rptMonth + 1;
        });
        const rptRev = rptTrx.reduce((s, t) => s + t.total, 0);
        const daysInMonth = new Date(rptYear, rptMonth + 1, 0).getDate();
        const dayData = Array.from({ length: daysInMonth }, (_, i) => {
          const ds = `${rptYear}-${String(rptMonth + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
          const tt = rptTrx.filter((t) => t.date === ds);
          return { day: i + 1, rev: tt.reduce((s, t) => s + t.total, 0) };
        });
        const maxDayRev = Math.max(...dayData.map((d) => d.rev), 1);
        const catData = CATS.filter((c) => c !== "Semua")
          .map((cat) => {
            let rev = 0;
            rptTrx.forEach((t) =>
              (t.items || []).forEach((i) => {
                const p = products.find((pr) => pr.id === i.product_id);
                if (p && p.category === cat) rev += i.price * i.qty;
              }),
            );
            return { cat, rev };
          })
          .filter((c) => c.rev > 0)
          .sort((a, b) => b.rev - a.rev);
        const prodSales = {};
        rptTrx.forEach((t) =>
          (t.items || []).forEach((i) => {
            prodSales[i.product_name] =
              (prodSales[i.product_name] || 0) + i.qty;
          }),
        );
        const topProds = Object.entries(prodSales)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);

        const exportExcel = async (type) => {
          const wb = XL.utils.book_new();
          if (type === "all" || type === "transaksi")
            XL.utils.book_append_sheet(
              wb,
              XL.utils.json_to_sheet(
                transactions.map((t) => ({
                  ID: t.trx_code,
                  Tanggal: t.date,
                  Pelanggan: t.customer,
                  Item: (t.items || [])
                    .map((i) => `${i.product_name}(${i.qty})`)
                    .join("; "),
                  Total: t.total,
                  Pembayaran: t.payment,
                  Kembalian: t.change_amt,
                })),
              ),
              "Transaksi",
            );
          if (type === "all" || type === "produk")
            XL.utils.book_append_sheet(
              wb,
              XL.utils.json_to_sheet(
                products.map((p) => {
                  const s = suppliers.find((s) => s.id === p.supplier_id);
                  return {
                    Nama: p.name,
                    Kategori: p.category,
                    Satuan: p.unit,
                    Harga: p.price,
                    Stok: p.stock,
                    Min: p.min_stock,
                    Supplier: s?.name || "-",
                  };
                }),
              ),
              "Produk",
            );
          if (type === "all" || type === "stok")
            XL.utils.book_append_sheet(
              wb,
              XL.utils.json_to_sheet(
                products.map((p) => ({
                  Nama: p.name,
                  Kategori: p.category,
                  Stok: p.stock,
                  Min: p.min_stock,
                  Status:
                    p.stock === 0
                      ? "Habis"
                      : p.stock <= p.min_stock
                        ? "Menipis"
                        : "Aman",
                })),
              ),
              "Stok",
            );
          if (type === "all" || type === "supplier")
            XL.utils.book_append_sheet(
              wb,
              XL.utils.json_to_sheet(
                suppliers.map((s) => ({
                  Nama: s.name,
                  PIC: s.contact,
                  Telepon: s.phone,
                  Email: s.email,
                  Alamat: s.address,
                  Status: s.status,
                })),
              ),
              "Supplier",
            );
          if (type === "laporan") {
            XL.utils.book_append_sheet(
              wb,
              XL.utils.json_to_sheet(
                rptTrx.map((t) => ({
                  ID: t.trx_code,
                  Tanggal: t.date,
                  Pelanggan: t.customer,
                  Total: t.total,
                })),
              ),
              "Transaksi",
            );
            XL.utils.book_append_sheet(
              wb,
              XL.utils.json_to_sheet([
                { Keterangan: "Total Pendapatan", Nilai: rptRev },
                { Keterangan: "Jumlah Transaksi", Nilai: rptTrx.length },
                {
                  Keterangan: "Rata-rata",
                  Nilai: rptTrx.length ? Math.round(rptRev / rptTrx.length) : 0,
                },
              ]),
              "Ringkasan",
            );
          }
          if (type === "template") {
            XL.utils.book_append_sheet(
              wb,
              XL.utils.json_to_sheet([
                {
                  "Nama Produk": "",
                  Kategori: "Pakan Jadi",
                  Satuan: "kg",
                  Harga: 0,
                  Stok: 0,
                  "Min Stok": 5,
                },
              ]),
              "Produk",
            );
            XL.utils.book_append_sheet(
              wb,
              XL.utils.json_to_sheet([
                {
                  "Nama Supplier": "",
                  "Kontak PIC": "",
                  Telepon: "",
                  Email: "",
                  Alamat: "",
                  Status: "Aktif",
                },
              ]),
              "Supplier",
            );
          }
          const fn =
            type === "laporan"
              ? `BBS_Laporan_${MONTHS[rptMonth]}_${rptYear}.xlsx`
              : type === "template"
                ? "BBS_Template.xlsx"
                : `BBS_${type}_${TODAY}.xlsx`;
          XL.writeFile(wb, fn);
          const labelMap = {
            all: "Semua Data",
            laporan: "Laporan Bulanan",
            transaksi: "Transaksi",
            produk: "Produk",
            stok: "Stok",
            supplier: "Supplier",
            template: "Template Import",
          };
          await logActivity(
            "Export Excel",
            "Import/Export",
            `${labelMap[type] || type} → ${fn}`,
          );
          showNotif("Export berhasil: " + fn);
        };

        const handleImport = async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = async (ev) => {
            try {
              const wb = XL.read(ev.target.result, { type: "array" });
              const logs = [];
              const sp = wb.SheetNames.find((n) => n === "Produk");
              if (sp) {
                const rows = XL.utils.sheet_to_json(wb.Sheets[sp]);
                let added = 0,
                  updated = 0;
                for (const r of rows) {
                  if (!r["Nama Produk"] || !r["Harga"]) continue;
                  const ex = products.find(
                    (p) =>
                      p.name.toLowerCase() ===
                      String(r["Nama Produk"]).toLowerCase(),
                  );
                  const payload = {
                    name: String(r["Nama Produk"]),
                    category: r["Kategori"] || "Pakan Jadi",
                    unit: r["Satuan"] || "pcs",
                    price: parseInt(r["Harga"]) || 0,
                    stock: parseInt(r["Stok"]) || 0,
                    min_stock: parseInt(r["Min Stok"]) || 5,
                  };
                  if (ex) {
                    await sb.from("products").update(payload).eq("id", ex.id);
                    updated++;
                  } else {
                    await sb.from("products").insert(payload);
                    added++;
                  }
                }
                logs.push(
                  `✅ Produk: ${added} ditambahkan, ${updated} diperbarui`,
                );
              }
              if (!logs.length)
                logs.push("⚠️ Sheet tidak ditemukan. Gunakan template.");
              setImportLog(logs);
              await loadAll();
              const summary = logs.join(" | ");
              await logActivity("Import Excel", "Import/Export", summary);
              showNotif("Import selesai!");
            } catch (err) {
              setImportLog([`❌ Error: ${err.message}`]);
              showNotif("Gagal import!", "error");
            }
          };
          reader.readAsArrayBuffer(file);
          e.target.value = "";
        };

        const filtHist = transactions.filter((t) => {
          const md = !filterDate || t.date === filterDate;
          const ms =
            t.trx_code?.toLowerCase().includes(histSearch.toLowerCase()) ||
            t.customer?.toLowerCase().includes(histSearch.toLowerCase());
          return md && ms;
        });

        const allNavs = [
          { id: "dashboard", icon: "⊞", label: "Dashboard" },
          { id: "kasir", icon: "🤝", label: "Kasir" },
          { id: "produk", icon: "📦", label: "Produk" },
          { id: "riwayat", icon: "📋", label: "Riwayat" },
          { id: "stok", icon: "📊", label: "Stok" },
          { id: "laporan", icon: "📈", label: "Laporan" },
          { id: "supplier", icon: "🤝", label: "Supplier" },
          { id: "excel", icon: "📗", label: "Import/Export" },
          { id: "users", icon: "👥", label: "Kelola Akun" },
          { id: "masterdata", icon: "🗂️", label: "Master Data" },
        ];
        const navs = allNavs.filter((n) => allowedPages.includes(n.id));

        return (
          <div
            className="bbs-app"
            style={{ display: "flex", height: "100vh", overflow: "hidden" }}
          >
            {sidebarOpen && (
              <div
                className="bbs-overlay open"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            {loading && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(255,255,255,0.75)",
                  zIndex: 9999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <Spin />
                <div
                  style={{ fontSize: 13, color: "#2d7a2d", fontWeight: 700 }}
                >
                  Memuat data...
                </div>
              </div>
            )}

            {/* SIDEBAR */}
            <aside
              className={`bbs-sidebar${sidebarOpen ? " open" : ""}`}
              style={{
                background: "linear-gradient(180deg,#1b4d1b,#0e2e0e)",
                color: "#fff",
                display: "flex",
                flexDirection: "column",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  padding: "16px 14px 14px",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div
                  style={{ fontSize: 20, fontWeight: 900, color: "#a8e063" }}
                >
                  🌿 BBS
                </div>
                <div
                  style={{ fontSize: 11, color: "#a8e063", fontWeight: 700 }}
                >
                  BerkahBirdShop
                </div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>
                  Klaten · 🟢 Online
                </div>
              </div>

              {/* Info user login */}
              <div
                style={{
                  padding: "12px 14px",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.05)",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
                  {currentUser.nama}
                </div>
                <div style={{ marginTop: 3 }}>
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 8px",
                      borderRadius: 10,
                      fontWeight: 800,
                      background:
                        currentUser.role === "superadmin"
                          ? "rgba(168,224,99,0.2)"
                          : currentUser.role === "admin"
                            ? "rgba(255,200,100,0.2)"
                            : "rgba(100,160,255,0.2)",
                      color:
                        currentUser.role === "superadmin"
                          ? "#a8e063"
                          : currentUser.role === "admin"
                            ? "#ffc864"
                            : "#7eb8ff",
                    }}
                  >
                    {currentUser.role === "superadmin"
                      ? "👑 Super Admin"
                      : currentUser.role === "admin"
                        ? "🛡️ Admin"
                        : "👤 Pegawai"}
                  </span>
                </div>
              </div>

              <nav style={{ padding: "8px 0", flex: 1, overflowY: "auto" }}>
                {navs.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      setPage(n.id);
                      setSidebarOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 14px",
                      cursor: "pointer",
                      borderLeft:
                        page === n.id
                          ? "3px solid #a8e063"
                          : "3px solid transparent",
                      background:
                        page === n.id ? "rgba(168,224,99,0.12)" : "transparent",
                      color:
                        page === n.id ? "#a8e063" : "rgba(255,255,255,0.65)",
                      fontSize: 12,
                      fontWeight: page === n.id ? 700 : 400,
                    }}
                  >
                    <span style={{ fontSize: 15 }}>{n.icon}</span>
                    {n.label}
                  </div>
                ))}
              </nav>

              {lowStock.length > 0 && (
                <div
                  style={{
                    margin: "0 10px 10px",
                    padding: "10px 12px",
                    background: "rgba(245,158,11,0.18)",
                    borderRadius: 8,
                    borderLeft: "3px solid #f59e0b",
                  }}
                >
                  <div
                    style={{ fontSize: 9, color: "#f59e0b", fontWeight: 800 }}
                  >
                    ⚠ STOK MENIPIS
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "rgba(255,255,255,0.55)",
                      marginTop: 2,
                    }}
                  >
                    {lowStock.length} produk
                  </div>
                </div>
              )}

              {/* Tombol Logout */}
              <div style={{ padding: "10px 12px 14px" }}>
                <button
                  onClick={() => setShowLogout(true)}
                  style={{
                    width: "100%",
                    padding: "9px",
                    background: "rgba(220,53,69,0.15)",
                    color: "#ff8080",
                    border: "1px solid rgba(220,53,69,0.3)",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  🚪 Keluar
                </button>
              </div>
            </aside>

            {/* MAIN */}
            <div
              className="bbs-main"
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <header
                style={{
                  background: "#fff",
                  padding: "11px 16px",
                  borderBottom: "1px solid #e4ede4",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexShrink: 0,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    className="bbs-hamburger"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                  >
                    <span style={{ fontSize: 20, lineHeight: 1 }}>☰</span>
                  </button>
                  <div
                    style={{ fontSize: 16, fontWeight: 800, color: "#1a4a1a" }}
                  >
                    {allNavs.find((n) => n.id === page)?.icon}{" "}
                    {allNavs.find((n) => n.id === page)?.label}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    className={styles.btndefault} style={{ padding: "5px 10px", fontSize: 11  }}
                    onClick={loadAll}
                  >
                    🔄 Refresh
                  </button>
                  <div
                    className="hide-mobile"
                    style={{ fontSize: 11, color: "#888" }}
                  >
                    {new Date().toLocaleDateString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </header>

              <div className="bbs-content">
                {/* DASHBOARD */}
                {page === "dashboard" && (
                  <div>
                    <div className="stat-grid">
                      {[
                        {
                          label: "Pendapatan Hari Ini",
                          value: fmt(todayRev),
                          sub: `${todayTrx.length} transaksi`,
                          bg: "#e8f5e9",
                          color: "#2e7d32",
                        },
                        {
                          label: "Pendapatan Minggu Ini",
                          value: fmt(weekRev),
                          sub: `${weekTrx.length} transaksi`,
                          bg: "#fff8e1",
                          color: "#e65100",
                        },
                        {
                          label: "Total Produk",
                          value: fmtN(products.length),
                          sub: "jenis produk",
                          bg: "#e3f2fd",
                          color: "#1565c0",
                        },
                        {
                          label: "Stok Menipis",
                          value: fmtN(lowStock.length),
                          sub: "perlu restock",
                          bg: lowStock.length > 0 ? "#fff3e0" : "#f1f8e9",
                          color: lowStock.length > 0 ? "#e65100" : "#33691e",
                        },
                      ].map((s, i) => (
                        <div
                          key={i}
                          style={{
                            background: s.bg,
                            borderRadius: 12,
                            padding: "16px 18px",
                            border: `1px solid ${s.color}22`,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 10,
                              color: s.color,
                              fontWeight: 800,
                              marginBottom: 8,
                              textTransform: "uppercase",
                            }}
                          >
                            {s.label}
                          </div>
                          <div
                            style={{
                              fontSize: 24,
                              fontWeight: 900,
                              color: s.color,
                            }}
                          >
                            {s.value}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#999",
                              marginTop: 4,
                            }}
                          >
                            {s.sub}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="dash-grid">
                      <div className={styles.card}>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: 14,
                            color: "#1a4a1a",
                            marginBottom: 14,
                          }}
                        >
                          Transaksi Terbaru
                        </div>
                        {transactions.slice(0, 7).map((t) => (
                          <div
                            key={t.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              padding: "9px 0",
                              borderBottom: "1px solid #f0f5f0",
                              alignItems: "center",
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 13 }}>
                                {t.trx_code} — {t.customer}
                              </div>
                              <div style={{ fontSize: 10, color: "#aaa" }}>
                                {t.date} · {(t.items || []).length} item
                              </div>
                            </div>
                            <span
                              style={{
                                fontWeight: 800,
                                color: "#2d7a2d",
                                fontSize: 13,
                              }}
                            >
                              {fmt(t.total)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className={styles.card}>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: 14,
                            color: "#1a4a1a",
                            marginBottom: 14,
                          }}
                        >
                          ⚠ Stok Menipis
                        </div>
                        {lowStock.length === 0 ? (
                          <div
                            style={{
                              color: "#bbb",
                              fontSize: 13,
                              textAlign: "center",
                              padding: "20px 0",
                            }}
                          >
                            ✅ Semua stok aman
                          </div>
                        ) : (
                          lowStock.slice(0, 7).map((p) => (
                            <div
                              key={p.id}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                padding: "9px 0",
                                borderBottom: "1px solid #f0f5f0",
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 13 }}>
                                  {p.name}
                                </div>
                                <div style={{ fontSize: 10, color: "#aaa" }}>
                                  {p.category}
                                </div>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <div
                                  style={{
                                    fontWeight: 800,
                                    color:
                                      p.stock === 0 ? "#dc3545" : "#e65100",
                                    fontSize: 15,
                                  }}
                                >
                                  {p.stock} {p.unit}
                                </div>
                                <div style={{ fontSize: 9, color: "#ccc" }}>
                                  min:{p.min_stock}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* ACTIVITY LOG */}
                    <div
                      style={{
                        marginTop: 18,
                        background: "#fff",
                        borderRadius: 12,
                        border: "1px solid #e4ede4",
                      }}
                    >
                      <div
                        style={{
                          padding: "16px 20px",
                          borderBottom: "1px solid #e4ede4",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: 14,
                            color: "#1a4a1a",
                          }}
                        >
                          📋 Aktivitas Terbaru
                        </div>
                        <div style={{ fontSize: 11, color: "#aaa" }}>
                          30 aktivitas terakhir
                        </div>
                      </div>
                      {activityLogs.length === 0 ? (
                        <div
                          style={{
                            padding: "24px",
                            textAlign: "center",
                            color: "#bbb",
                            fontSize: 13,
                          }}
                        >
                          Belum ada aktivitas tercatat
                        </div>
                      ) : (
                        <div style={{ maxHeight: 320, overflowY: "auto" }}>
                          {activityLogs.map((log, i) => {
                            const ICONS = {
                              Kasir: "🤝",
                              Produk: "📦",
                              Stok: "📊",
                              Supplier: "🤝",
                              Akun: "👥",
                              "Master Data": "🗂️",
                              "Import/Export": "📗",
                            };
                            const COLORS = {
                              "Transaksi Baru": { bg: "#e8f5e9", c: "#2e7d32" },
                              "Tambah Produk": { bg: "#e3f2fd", c: "#1565c0" },
                              "Edit Produk": { bg: "#fff8e1", c: "#e65100" },
                              "Hapus Produk": { bg: "#fee2e2", c: "#dc2626" },
                              "Restock Stok": { bg: "#f3e5f5", c: "#6a1b9a" },
                              "Tambah Supplier": {
                                bg: "#e3f2fd",
                                c: "#1565c0",
                              },
                              "Edit Supplier": { bg: "#fff8e1", c: "#e65100" },
                              "Hapus Supplier": { bg: "#fee2e2", c: "#dc2626" },
                              "Tambah Akun": { bg: "#e3f2fd", c: "#1565c0" },
                              "Edit Akun": { bg: "#fff8e1", c: "#e65100" },
                              "Hapus Akun": { bg: "#fee2e2", c: "#dc2626" },
                              "Export Excel": { bg: "#e3f2fd", c: "#1565c0" },
                              "Import Excel": { bg: "#f3e5f5", c: "#6a1b9a" },
                              "Tambah Kategori": {
                                bg: "#e0f2f1",
                                c: "#00695c",
                              },
                              "Edit Kategori": { bg: "#fff8e1", c: "#e65100" },
                              "Hapus Kategori": { bg: "#fee2e2", c: "#dc2626" },
                              "Tambah Satuan": { bg: "#e0f2f1", c: "#00695c" },
                              "Edit Satuan": { bg: "#fff8e1", c: "#e65100" },
                              "Hapus Satuan": { bg: "#fee2e2", c: "#dc2626" },
                            };
                            const clr = COLORS[log.aksi] || {
                              bg: "#f5f5f5",
                              c: "#666",
                            };
                            const tgl = new Date(log.created_at);
                            const tglStr = tgl.toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            });
                            const jamStr = tgl.toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            });
                            const roleClr =
                              log.user_role === "superadmin"
                                ? "#7b1fa2"
                                : log.user_role === "admin"
                                  ? "#e65100"
                                  : "#1565c0";
                            const roleBg =
                              log.user_role === "superadmin"
                                ? "#f3e5f5"
                                : log.user_role === "admin"
                                  ? "#fff8e1"
                                  : "#e3f2fd";
                            return (
                              <div
                                key={log.id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                  padding: "11px 20px",
                                  borderBottom: "1px solid #f8f8f8",
                                  transition: "background 0.1s",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background = "#f9fdf9")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.background =
                                    "transparent")
                                }
                              >
                                <div
                                  style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    background: clr.bg,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 16,
                                    flexShrink: 0,
                                  }}
                                >
                                  {ICONS[log.kategori] || "📝"}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                      marginBottom: 3,
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <span
                                      style={{
                                        background: clr.bg,
                                        color: clr.c,
                                        padding: "2px 9px",
                                        borderRadius: 20,
                                        fontSize: 11,
                                        fontWeight: 800,
                                      }}
                                    >
                                      {log.aksi}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: 12,
                                        fontWeight: 700,
                                        color: "#333",
                                      }}
                                    >
                                      {log.user_nama}
                                    </span>
                                    <span
                                      style={{
                                        background: roleBg,
                                        color: roleClr,
                                        padding: "1px 7px",
                                        borderRadius: 20,
                                        fontSize: 10,
                                        fontWeight: 700,
                                      }}
                                    >
                                      {log.user_role === "superadmin"
                                        ? "👑 Super Admin"
                                        : log.user_role === "admin"
                                          ? "🛡️ Admin"
                                          : "👤 Pegawai"}
                                    </span>
                                  </div>
                                  {log.detail && (
                                    <div
                                      style={{
                                        fontSize: 12,
                                        color: "#888",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                      }}
                                    >
                                      {log.detail}
                                    </div>
                                  )}
                                </div>
                                <div
                                  style={{ textAlign: "right", flexShrink: 0 }}
                                >
                                  <div
                                    style={{
                                      fontSize: 11,
                                      color: "#555",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {jamStr}
                                  </div>
                                  <div style={{ fontSize: 10, color: "#bbb" }}>
                                    {tglStr}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* KASIR */}
                {page === "kasir" && (
                  <div className="kasir-grid">
                    <div>
                      <div
                        style={{ display: "flex", gap: 8, marginBottom: 14 }}
                      >
                        <input
                          className={styles.inp} style={{ flex: 1  }}
                          placeholder="🔍 Cari produk..."
                          value={searchProd}
                          onChange={(e) => setSearchProd(e.target.value)}
                        />
                        <select
                          className={styles.inp} style={{ width: 150  }}
                          value={filterCat}
                          onChange={(e) => setFilterCat(e.target.value)}
                        >
                          {CATS.map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="prod-grid">
                        {filtProd.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => addToCart(p)}
                            style={{
                              background: "#fff",
                              borderRadius: 10,
                              padding: "13px",
                              border: "1px solid #e4ede4",
                              cursor: p.stock > 0 ? "pointer" : "not-allowed",
                              opacity: p.stock <= 0 ? 0.5 : 1,
                              transition: "border 0.1s,transform 0.1s",
                            }}
                            onMouseEnter={(e) => {
                              if (p.stock > 0) {
                                e.currentTarget.style.borderColor = "#2d7a2d";
                                e.currentTarget.style.transform =
                                  "translateY(-2px)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = "#e4ede4";
                              e.currentTarget.style.transform = "";
                            }}
                          >
                            <Badge cat={p.category} />
                            <div
                              style={{
                                fontWeight: 700,
                                fontSize: 13,
                                marginTop: 8,
                                marginBottom: 3,
                                lineHeight: 1.3,
                              }}
                            >
                              {p.name}
                            </div>
                            <div
                              style={{
                                fontSize: 15,
                                fontWeight: 800,
                                color: "#2d7a2d",
                              }}
                            >
                              {fmt(p.price)}
                            </div>
                            <div style={{ fontSize: 9, color: "#ccc" }}>
                              /{p.unit}
                            </div>
                            <div
                              style={{
                                fontSize: 10,
                                marginTop: 5,
                                color:
                                  p.stock <= p.min_stock ? "#e65100" : "#aaa",
                              }}
                            >
                              Stok: {p.stock} {p.unit}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div
                      className="kasir-cart"
                      style={{
                        background: "#fff",
                        borderRadius: 12,
                        padding: "18px 20px",
                        border: "1px solid #e4ede4",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: 14,
                          color: "#1a4a1a",
                          marginBottom: 14,
                        }}
                      >
                        🤝 Keranjang
                      </div>
                      <input
                        className={styles.inp} style={{ marginBottom: 10  }}
                        placeholder="Nama pelanggan..."
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                      {cart.length === 0 ? (
                        <div
                          style={{
                            color: "#ccc",
                            textAlign: "center",
                            padding: "28px 0",
                            fontSize: 13,
                          }}
                        >
                          Ketuk produk untuk menambahkan
                        </div>
                      ) : (
                        <>
                          <div style={{ maxHeight: 250, overflowY: "auto" }}>
                            {cart.map((item) => (
                              <div
                                key={item.product_id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  padding: "7px 0",
                                  borderBottom: "1px solid #f0f5f0",
                                }}
                              >
                                <div style={{ flex: 1 }}>
                                  <div
                                    style={{ fontSize: 12, fontWeight: 700 }}
                                  >
                                    {item.name}
                                  </div>
                                  <div style={{ fontSize: 10, color: "#aaa" }}>
                                    {fmt(item.price)}/{item.unit}
                                  </div>
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                >
                                  <button
                                    onClick={() =>
                                      updCart(item.product_id, item.qty - 1)
                                    }
                                    style={{
                                      width: 24,
                                      height: 24,
                                      borderRadius: 6,
                                      border: "1px solid #ddd",
                                      cursor: "pointer",
                                      background: "#f5f5f5",
                                      fontWeight: 800,
                                      fontSize: 16,
                                      lineHeight: 1,
                                    }}
                                  >
                                    −
                                  </button>
                                  <span
                                    style={{
                                      fontSize: 13,
                                      fontWeight: 800,
                                      minWidth: 22,
                                      textAlign: "center",
                                    }}
                                  >
                                    {item.qty}
                                  </span>
                                  <button
                                    onClick={() =>
                                      updCart(item.product_id, item.qty + 1)
                                    }
                                    style={{
                                      width: 24,
                                      height: 24,
                                      borderRadius: 6,
                                      border: "1px solid #ddd",
                                      cursor: "pointer",
                                      background: "#f5f5f5",
                                      fontWeight: 800,
                                      fontSize: 16,
                                      lineHeight: 1,
                                    }}
                                  >
                                    +
                                  </button>
                                </div>
                                <div
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 800,
                                    color: "#2d7a2d",
                                    minWidth: 62,
                                    textAlign: "right",
                                  }}
                                >
                                  {fmt(item.price * item.qty)}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div
                            style={{
                              marginTop: 12,
                              paddingTop: 12,
                              borderTop: "2px solid #e4ede4",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: 10,
                              }}
                            >
                              <span style={{ fontWeight: 800, fontSize: 15 }}>
                                TOTAL
                              </span>
                              <span
                                style={{
                                  fontWeight: 900,
                                  fontSize: 18,
                                  color: "#2d7a2d",
                                }}
                              >
                                {fmt(cartTotal)}
                              </span>
                            </div>
                            <input
                              className={styles.inp} style={{ marginBottom: 8,
                                fontSize: 15,
                                fontWeight: 700,
                               }}
                              type="number"
                              placeholder="Nominal pembayaran..."
                              value={paymentInput}
                              onChange={(e) => setPaymentInput(e.target.value)}
                            />
                            {payNum > 0 && (
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  fontSize: 13,
                                  marginBottom: 10,
                                  color: change >= 0 ? "#2d7a2d" : "#dc3545",
                                  fontWeight: 800,
                                }}
                              >
                                <span>Kembalian</span>
                                <span>
                                  {change >= 0
                                    ? fmt(change)
                                    : "Kurang " + fmt(Math.abs(change))}
                                </span>
                              </div>
                            )}
                            <button
                              className={`${styles.btn} ${styles.btnprimary}`} style={{ width: "100%",
                                padding: "11px",
                                fontSize: 14,
                                borderRadius: 10,
                               }}
                              onClick={processPayment}
                            >
                              ✅ Proses Pembayaran
                            </button>
                            <button
                              className={styles.btndefault} style={{ width: "100%",
                                marginTop: 8,
                                padding: "9px",
                                fontSize: 12,
                                borderRadius: 10,
                               }}
                              onClick={() => setCart([])}
                            >
                              🗑 Kosongkan
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* PRODUK */}
                {page === "produk" && (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginBottom: 16,
                        flexWrap: "wrap",
                      }}
                    >
                      <input
                        className={styles.inp} style={{ maxWidth: 250  }}
                        placeholder="🔍 Cari produk..."
                        value={searchProd}
                        onChange={(e) => setSearchProd(e.target.value)}
                      />
                      <select
                        className={styles.inp} style={{ width: 150  }}
                        value={filterCat}
                        onChange={(e) => setFilterCat(e.target.value)}
                      >
                        {CATS.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                      <button
                        className={`${styles.btn} ${styles.btnprimary}`} style={{ marginLeft: "auto"  }}
                        onClick={() => {
                          setProdForm({
                            name: "",
                            category: "Pakan Jadi",
                            unit: "kg",
                            price: "",
                            stock: "",
                            min_stock: "",
                            supplier_id: "",
                          });
                          setProdModal("add");
                        }}
                      >
                        + Tambah Produk
                      </button>
                    </div>
                    <div className={styles.card} style={{ padding: 0, overflow: "auto"  }}>
                      <table
                        style={{ width: "100%", borderCollapse: "collapse" }}
                      >
                        <thead>
                          <tr>
                            {[
                              "Nama",
                              "Kategori",
                              "Satuan",
                              "Harga",
                              "Stok",
                              "Min",
                              "Supplier",
                              "Aksi",
                            ].map((h) => (
                              <th key={h} className={styles.th}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filtProd.map((p) => {
                            const s = suppliers.find(
                              (s) => s.id === p.supplier_id,
                            );
                            return (
                              <tr
                                key={p.id}
                                style={{
                                  background:
                                    p.stock <= p.min_stock ? "#fffaf0" : "#fff",
                                }}
                              >
                                <td className={styles.td}>
                                  <strong>{p.name}</strong>
                                </td>
                                <td className={styles.td}>
                                  <Badge cat={p.category} />
                                </td>
                                <td className={styles.td}>{p.unit}</td>
                                <td className={styles.td}>
                                  <strong style={{ color: "#2d7a2d" }}>
                                    {fmt(p.price)}
                                  </strong>
                                </td>
                                <td className={styles.td}>
                                  <strong
                                    style={{
                                      color:
                                        p.stock <= p.min_stock
                                          ? "#e65100"
                                          : "#333",
                                      fontSize: 15,
                                    }}
                                  >
                                    {p.stock}
                                  </strong>
                                </td>
                                <td className={styles.td}>{p.min_stock}</td>
                                <td className={styles.td}>
                                  <span style={{ fontSize: 11, color: "#666" }}>
                                    {s?.name || "—"}
                                  </span>
                                </td>
                                <td className={styles.td}>
                                  <div style={{ display: "flex", gap: 5 }}>
                                    <button
                                      className={`${styles.btn} ${styles.btnoutline}`} style={{ padding: "4px 10px",
                                        fontSize: 11,
                                       }}
                                      onClick={() => {
                                        setProdForm({
                                          name: p.name,
                                          category: p.category,
                                          unit: p.unit,
                                          price: String(p.price),
                                          stock: String(p.stock),
                                          min_stock: String(p.min_stock),
                                          supplier_id: String(
                                            p.supplier_id || "",
                                          ),
                                        });
                                        setProdModal(p);
                                      }}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      className={`${styles.btn} ${styles.btndanger}`} style={{ padding: "4px 10px",
                                        fontSize: 11,
                                       }}
                                      onClick={() => delProd(p.id)}
                                    >
                                      Hapus
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* RIWAYAT */}
                {page === "riwayat" && (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginBottom: 16,
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      <input
                        className={styles.inp} style={{ maxWidth: 230  }}
                        placeholder="🔍 ID / pelanggan..."
                        value={histSearch}
                        onChange={(e) => setHistSearch(e.target.value)}
                      />
                      <input
                        className={styles.inp} style={{ width: 150  }}
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                      />
                      {filterDate && (
                        <button className={styles.btndefault} onClick={() => setFilterDate("")}>
                          ✕ Reset
                        </button>
                      )}
                      <button
                        className={`${styles.btn} ${styles.btnblue}`} style={{ marginLeft: "auto"  }}
                        onClick={() => exportExcel("transaksi")}
                      >
                        📥 Export Excel
                      </button>
                    </div>
                    <div
                      className="table-wrap"
                      style={{
                        background: "#fff",
                        borderRadius: 12,
                        border: "1px solid #e4ede4",
                        overflow: "auto",
                      }}
                    >
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          minWidth: 650,
                        }}
                      >
                        <thead>
                          <tr>
                            {[
                              "ID",
                              "Tanggal",
                              "Pelanggan",
                              "Item",
                              "Total",
                              "Bayar",
                              "Kembalian",
                            ].map((h) => (
                              <th key={h} className={styles.th}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filtHist.slice(0, 60).map((t) => (
                            <tr key={t.id}>
                              <td className={styles.td}>
                                <strong style={{ color: "#2d7a2d" }}>
                                  {t.trx_code}
                                </strong>
                              </td>
                              <td className={styles.td}>{t.date}</td>
                              <td className={styles.td}>{t.customer}</td>
                              <td className={styles.td}>
                                {(t.items || []).map((i, idx) => (
                                  <div
                                    key={idx}
                                    style={{ fontSize: 10, color: "#666" }}
                                  >
                                    {i.product_name} ×{i.qty}
                                  </div>
                                ))}
                              </td>
                              <td className={styles.td}>
                                <strong style={{ color: "#2d7a2d" }}>
                                  {fmt(t.total)}
                                </strong>
                              </td>
                              <td className={styles.td}>{fmt(t.payment)}</td>
                              <td className={styles.td}>{fmt(t.change_amt)}</td>
                            </tr>
                          ))}
                          {filtHist.length === 0 && (
                            <tr>
                              <td
                                colSpan={7}
                                className={styles.td} style={{ textAlign: "center",
                                  color: "#bbb",
                                  padding: 32,
                                 }}
                              >
                                Tidak ada transaksi
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                      <div
                        style={{
                          padding: "11px 16px",
                          borderTop: "1px solid #e4ede4",
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 13,
                        }}
                      >
                        <span style={{ color: "#888" }}>
                          {filtHist.length} transaksi
                        </span>
                        <strong style={{ color: "#2d7a2d" }}>
                          Total:{" "}
                          {fmt(filtHist.reduce((s, t) => s + t.total, 0))}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* STOK */}
                {page === "stok" && (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginBottom: 16,
                        alignItems: "center",
                      }}
                    >
                      <input
                        className={styles.inp} style={{ maxWidth: 250  }}
                        placeholder="🔍 Cari produk..."
                        value={searchProd}
                        onChange={(e) => setSearchProd(e.target.value)}
                      />
                      <select
                        className={styles.inp} style={{ width: 150  }}
                        value={filterCat}
                        onChange={(e) => setFilterCat(e.target.value)}
                      >
                        {CATS.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                      {isSuperAdmin && (
                        <button
                          className={`${styles.btn} ${styles.btnblue}`} style={{ marginLeft: "auto"  }}
                          onClick={() => exportExcel("stok")}
                        >
                          📥 Export Stok
                        </button>
                      )}
                    </div>
                    <div
                      className="table-wrap"
                      style={{
                        background: "#fff",
                        borderRadius: 12,
                        border: "1px solid #e4ede4",
                        overflow: "auto",
                      }}
                    >
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          minWidth: 600,
                        }}
                      >
                        <thead>
                          <tr>
                            {[
                              "Nama Produk",
                              "Kategori",
                              "Satuan",
                              "Stok",
                              "Min",
                              "Status",
                              "Aksi",
                            ].map((h) => (
                              <th key={h} className={styles.th}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[...filtProd]
                            .sort(
                              (a, b) =>
                                a.stock / a.min_stock - b.stock / b.min_stock,
                            )
                            .map((p) => {
                              const st =
                                p.stock === 0
                                  ? "Habis"
                                  : p.stock <= p.min_stock
                                    ? "Menipis"
                                    : "Aman";
                              return (
                                <tr
                                  key={p.id}
                                  style={{
                                    background:
                                      p.stock === 0
                                        ? "#fff5f5"
                                        : p.stock <= p.min_stock
                                          ? "#fffaf0"
                                          : "#fff",
                                  }}
                                >
                                  <td className={styles.td}>
                                    <strong>{p.name}</strong>
                                  </td>
                                  <td className={styles.td}>
                                    <Badge cat={p.category} />
                                  </td>
                                  <td className={styles.td}>{p.unit}</td>
                                  <td className={styles.td}>
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                      }}
                                    >
                                      <strong style={{ fontSize: 16 }}>
                                        {p.stock}
                                      </strong>
                                      <div
                                        style={{
                                          flex: 1,
                                          height: 6,
                                          background: "#eee",
                                          borderRadius: 3,
                                          maxWidth: 80,
                                        }}
                                      >
                                        <div
                                          style={{
                                            height: "100%",
                                            borderRadius: 3,
                                            width: `${Math.min(100, (p.stock / (p.min_stock * 3)) * 100)}%`,
                                            background:
                                              p.stock === 0
                                                ? "#dc2626"
                                                : p.stock <= p.min_stock
                                                  ? "#ea580c"
                                                  : "#16a34a",
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </td>
                                  <td className={styles.td}>{p.min_stock}</td>
                                  <td className={styles.td}>
                                    <span className={`${styles.stChip} ${styles['stChip' + st]}`}>{st}</span>
                                  </td>
                                  <td className={styles.td}>
                                    <button
                                      className={`${styles.btn} ${styles.btnwarning}`} style={{ padding: "5px 12px",
                                        fontSize: 11,
                                       }}
                                      onClick={() => {
                                        setRestockModal(p);
                                        setRestockQty("");
                                      }}
                                    >
                                      + Restock
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* LAPORAN */}
                {page === "laporan" && (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        marginBottom: 18,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <select
                        className={styles.inp} style={{ width: 140  }}
                        value={rptMonth}
                        onChange={(e) => setRptMonth(parseInt(e.target.value))}
                      >
                        {MONTHS.map((m, i) => (
                          <option key={i} value={i}>
                            {m}
                          </option>
                        ))}
                      </select>
                      <select
                        className={styles.inp} style={{ width: 90  }}
                        value={rptYear}
                        onChange={(e) => setRptYear(parseInt(e.target.value))}
                      >
                        {[2024, 2025, 2026, 2027].map((y) => (
                          <option key={y}>{y}</option>
                        ))}
                      </select>
                      <button
                        className={`${styles.btn} ${styles.btnblue}`}
                        onClick={() => exportExcel("laporan")}
                      >
                        📥 Export Excel
                      </button>
                    </div>
                    <div className="rpt-grid">
                      {[
                        {
                          label: "Total Pendapatan",
                          value: fmt(rptRev),
                          color: "#2d7a2d",
                          bg: "#e8f5e9",
                        },
                        {
                          label: "Jumlah Transaksi",
                          value: fmtN(rptTrx.length),
                          color: "#1565c0",
                          bg: "#e3f2fd",
                        },
                        {
                          label: "Rata-rata / Transaksi",
                          value: fmt(
                            rptTrx.length > 0
                              ? Math.round(rptRev / rptTrx.length)
                              : 0,
                          ),
                          color: "#7b1fa2",
                          bg: "#f3e5f5",
                        },
                      ].map((s, i) => (
                        <div
                          key={i}
                          style={{
                            background: s.bg,
                            borderRadius: 12,
                            padding: "16px 18px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 10,
                              color: s.color,
                              fontWeight: 800,
                              marginBottom: 8,
                              textTransform: "uppercase",
                            }}
                          >
                            {s.label}
                          </div>
                          <div
                            style={{
                              fontSize: 22,
                              fontWeight: 900,
                              color: s.color,
                            }}
                          >
                            {s.value}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className={styles.card} style={{ marginBottom: 16  }}>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: 14,
                          color: "#1a4a1a",
                          marginBottom: 14,
                        }}
                      >
                        📊 Pendapatan Harian — {MONTHS[rptMonth]} {rptYear}
                      </div>
                      <div style={{ overflowX: "auto" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-end",
                            gap: 3,
                            height: 130,
                            minWidth: Math.max(480, daysInMonth * 24),
                            paddingBottom: 24,
                          }}
                        >
                          {dayData.map((d) => (
                            <div
                              key={d.day}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                flex: 1,
                                gap: 2,
                              }}
                            >
                              <div
                                style={{
                                  width: "100%",
                                  minWidth: 12,
                                  background: d.rev > 0 ? "#2d7a2d" : "#e8f0e8",
                                  borderRadius: "4px 4px 0 0",
                                  height: `${d.rev > 0 ? Math.max(4, (d.rev / maxDayRev) * 100) : 3}px`,
                                }}
                                title={`Tgl ${d.day}: ${fmt(d.rev)}`}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.opacity = "0.7")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.opacity = "1")
                                }
                              />
                              <div
                                style={{
                                  fontSize: 9,
                                  color: "#bbb",
                                  transform: "rotate(-40deg)",
                                  transformOrigin: "center top",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {d.day}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="rpt-bot-grid">
                      <div className={styles.card}>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: 14,
                            color: "#1a4a1a",
                            marginBottom: 14,
                          }}
                        >
                          🛒 Per Kategori
                        </div>
                        {catData.length === 0 ? (
                          <div
                            style={{
                              color: "#ccc",
                              textAlign: "center",
                              padding: 24,
                            }}
                          >
                            Tidak ada data
                          </div>
                        ) : (
                          catData.map((c, i) => {
                            const pct = Math.round((c.rev / rptRev) * 100) || 0;
                            const bc = BADGE[c.cat];
                            return (
                              <div key={i} style={{ marginBottom: 12 }}>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: 5,
                                  }}
                                >
                                  <Badge cat={c.cat} />
                                  <span
                                    style={{ fontSize: 12, fontWeight: 700 }}
                                  >
                                    {fmt(c.rev)}{" "}
                                    <span style={{ color: "#aaa" }}>
                                      ({pct}%)
                                    </span>
                                  </span>
                                </div>
                                <div
                                  style={{
                                    height: 7,
                                    background: "#f0f0f0",
                                    borderRadius: 4,
                                  }}
                                >
                                  <div
                                    style={{
                                      height: "100%",
                                      borderRadius: 4,
                                      width: `${pct}%`,
                                      background: bc?.c || "#2d7a2d",
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                      <div className={styles.card}>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: 14,
                            color: "#1a4a1a",
                            marginBottom: 14,
                          }}
                        >
                          🏆 Top 5 Terlaris
                        </div>
                        {topProds.length === 0 ? (
                          <div
                            style={{
                              color: "#ccc",
                              textAlign: "center",
                              padding: 24,
                            }}
                          >
                            Tidak ada data
                          </div>
                        ) : (
                          topProds.map(([name, qty], i) => (
                            <div
                              key={i}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "9px 0",
                                borderBottom: "1px solid #f0f5f0",
                              }}
                            >
                              <div
                                style={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: "50%",
                                  background: [
                                    "#2d7a2d",
                                    "#1565c0",
                                    "#e65100",
                                    "#7b1fa2",
                                    "#c62828",
                                  ][i],
                                  color: "#fff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 11,
                                  fontWeight: 800,
                                  flexShrink: 0,
                                }}
                              >
                                {i + 1}
                              </div>
                              <div
                                style={{
                                  flex: 1,
                                  fontWeight: 600,
                                  fontSize: 13,
                                }}
                              >
                                {name}
                              </div>
                              <strong style={{ color: "#2d7a2d" }}>
                                {fmtN(qty)} terjual
                              </strong>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* SUPPLIER */}
                {page === "supplier" && (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 16,
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 13, color: "#666" }}>
                        {suppliers.length} supplier
                      </span>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          className={`${styles.btn} ${styles.btnblue}`}
                          onClick={() => exportExcel("supplier")}
                        >
                          📥 Export
                        </button>
                        <button
                          className={`${styles.btn} ${styles.btnprimary}`}
                          onClick={() => {
                            setSupForm({
                              name: "",
                              contact: "",
                              phone: "",
                              email: "",
                              address: "",
                              category: "",
                              status: "Aktif",
                              notes: "",
                            });
                            setSupModal("add");
                          }}
                        >
                          + Tambah
                        </button>
                      </div>
                    </div>
                    <div className="sup-grid">
                      {suppliers.map((s) => {
                        const spProds = products.filter(
                          (p) => p.supplier_id === s.id,
                        );
                        return (
                          <div
                            key={s.id}
                            className={styles.card} style={{ padding: "16px 18px"  }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                marginBottom: 10,
                              }}
                            >
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    fontWeight: 800,
                                    fontSize: 14,
                                    color: "#1a4a1a",
                                  }}
                                >
                                  {s.name}
                                </div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: "#888",
                                    marginTop: 2,
                                  }}
                                >
                                  👤 {s.contact}
                                </div>
                              </div>
                              <span
                                style={{
                                  padding: "3px 10px",
                                  borderRadius: 20,
                                  fontSize: 10,
                                  fontWeight: 800,
                                  background:
                                    s.status === "Aktif"
                                      ? "#e8f5e9"
                                      : "#fee2e2",
                                  color:
                                    s.status === "Aktif"
                                      ? "#2e7d32"
                                      : "#dc2626",
                                  flexShrink: 0,
                                }}
                              >
                                {s.status}
                              </span>
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "#555",
                                marginBottom: 3,
                              }}
                            >
                              📞 {s.phone}
                            </div>
                            {s.email && (
                              <div
                                style={{
                                  fontSize: 12,
                                  color: "#555",
                                  marginBottom: 3,
                                }}
                              >
                                ✉️ {s.email}
                              </div>
                            )}
                            <div
                              style={{
                                fontSize: 12,
                                color: "#555",
                                marginBottom: 6,
                              }}
                            >
                              📍 {s.address}
                            </div>
                            {spProds.length > 0 && (
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "#888",
                                  marginBottom: 6,
                                }}
                              >
                                📦 {spProds.map((p) => p.name).join(", ")}
                              </div>
                            )}
                            {s.notes && (
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "#aaa",
                                  fontStyle: "italic",
                                  marginBottom: 10,
                                }}
                              >
                                💬 {s.notes}
                              </div>
                            )}
                            <div
                              style={{
                                display: "flex",
                                gap: 6,
                                borderTop: "1px solid #f0f5f0",
                                paddingTop: 10,
                              }}
                            >
                              <button
                                className={`${styles.btn} ${styles.btnoutline}`} style={{ flex: 1,
                                  padding: "5px 0",
                                  fontSize: 11,
                                 }}
                                onClick={() => {
                                  setSupForm({
                                    name: s.name,
                                    contact: s.contact,
                                    phone: s.phone,
                                    email: s.email,
                                    address: s.address,
                                    category: s.category,
                                    status: s.status,
                                    notes: s.notes,
                                  });
                                  setSupModal(s);
                                }}
                              >
                                ✏️ Edit
                              </button>
                              <button
                                className={`${styles.btn} ${styles.btndanger}`} style={{ flex: 1,
                                  padding: "5px 0",
                                  fontSize: 11,
                                 }}
                                onClick={() => delSup(s.id)}
                              >
                                🗑 Hapus
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* EXCEL */}
                {page === "excel" && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 18,
                    }}
                  >
                    <div className={styles.card}>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: 15,
                          color: "#1a4a1a",
                          marginBottom: 4,
                        }}
                      >
                        📥 Export ke Excel
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#888",
                          marginBottom: 16,
                        }}
                      >
                        Unduh data ke file .xlsx
                      </div>
                      {[
                        {
                          label: "📦 Semua Data",
                          sub: "4 sheet sekaligus",
                          type: "all",
                          color: "primary",
                        },
                        {
                          label: "📈 Laporan Bulanan",
                          sub: `${MONTHS[rptMonth]} ${rptYear}`,
                          type: "laporan",
                          color: "blue",
                        },
                        {
                          label: "📋 Transaksi",
                          sub: "Riwayat transaksi",
                          type: "transaksi",
                          color: "outline",
                        },
                        {
                          label: "📦 Produk",
                          sub: "Daftar produk",
                          type: "produk",
                          color: "outline",
                        },
                        {
                          label: "📊 Stok",
                          sub: "Status stok",
                          type: "stok",
                          color: "outline",
                        },
                        {
                          label: "🤝 Supplier",
                          sub: "Data supplier",
                          type: "supplier",
                          color: "outline",
                        },
                      ].map((e) => (
                        <div
                          key={e.type}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "11px 0",
                            borderBottom: "1px solid #f0f5f0",
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>
                              {e.label}
                            </div>
                            <div style={{ fontSize: 11, color: "#aaa" }}>
                              {e.sub}
                            </div>
                          </div>
                          <button
                            className={`${styles.btn} ${styles['btn' + e.color]}`} style={{ flexShrink: 0 }}
                            onClick={() => exportExcel(e.type)}
                          >
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className={styles.card} style={{ marginBottom: 14  }}>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: 15,
                            color: "#1a4a1a",
                            marginBottom: 4,
                          }}
                        >
                          📤 Import dari Excel
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#888",
                            marginBottom: 16,
                          }}
                        >
                          Upload .xlsx untuk update data produk
                        </div>
                        <div
                          style={{
                            background: "#f8fdf8",
                            borderRadius: 12,
                            padding: "20px",
                            marginBottom: 14,
                            border: "2px dashed #b8d4b8",
                            textAlign: "center",
                          }}
                        >
                          <div style={{ fontSize: 32, marginBottom: 8 }}>
                            📂
                          </div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 800,
                              color: "#333",
                              marginBottom: 14,
                            }}
                          >
                            Pilih File Excel
                          </div>
                          <input
                            type="file"
                            accept=".xlsx,.xls"
                            ref={fileRef}
                            onChange={handleImport}
                            style={{ display: "none" }}
                          />
                          <button
                            className={`${styles.btn} ${styles.btnprimary}`} style={{ padding: "10px 24px"  }}
                            onClick={() => fileRef.current.click()}
                          >
                            📤 Upload File
                          </button>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "12px 14px",
                            background: "#fff8e1",
                            borderRadius: 10,
                            border: "1px solid #fde68a",
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>
                              📄 Download Template
                            </div>
                            <div style={{ fontSize: 11, color: "#888" }}>
                              Format kolom yang benar
                            </div>
                          </div>
                          <button
                            className={`${styles.btn} ${styles.btnwarning}`} style={{ padding: "8px 14px"  }}
                            onClick={() => exportExcel("template")}
                          >
                            ⬇ Unduh
                          </button>
                        </div>
                        {importLog.length > 0 && (
                          <div
                            style={{
                              marginTop: 12,
                              background: "#f0fdf4",
                              borderRadius: 10,
                              padding: "12px 14px",
                              border: "1px solid #bbf7d0",
                            }}
                          >
                            {importLog.map((l, i) => (
                              <div
                                key={i}
                                style={{
                                  fontSize: 12,
                                  color: "#333",
                                  marginBottom: 3,
                                }}
                              >
                                {l}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* KELOLA AKUN */}
                {page === "users" && (
                  <UsersPage
                    sb={sb}
                    showNotif={showNotif}
                    currentUser={currentUser}
                    logActivity={logActivity}
                  />
                )}

                {/* MASTER DATA */}
                {page === "masterdata" && (
                  <MasterDataPage
                    sb={sb}
                    showNotif={showNotif}
                    kategoris={kategoris}
                    satuans={satuans}
                    onReload={loadAll}
                    logActivity={logActivity}
                  />
                )}
              </div>
            </div>

            {/* RECEIPT */}
            {receipt && (
              <div className={styles.overlay} onClick={() => setReceipt(null)}>
                <div
                  className={styles.modal} style={{ width: 300  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ textAlign: "center", marginBottom: 14 }}>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 900,
                        color: "#1a4a1a",
                      }}
                    >
                      🌿 BerkahBirdShop
                    </div>
                    <div style={{ fontSize: 10, color: "#aaa" }}>
                      Klaten, Jawa Tengah
                    </div>
                    <div
                      style={{ margin: "10px 0", borderTop: "2px dashed #eee" }}
                    />
                    <div style={{ fontSize: 10, color: "#aaa" }}>
                      {receipt.trx_code} · {receipt.date || TODAY}
                    </div>
                    <div
                      style={{ fontSize: 11, fontWeight: 700, color: "#555" }}
                    >
                      Pelanggan: {receipt.customer || customerName || "Umum"}
                    </div>
                  </div>
                  {(receipt.items || []).map((i, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 11,
                        padding: "4px 0",
                      }}
                    >
                      <span>
                        {i.product_name} ×{i.qty} {i.unit}
                      </span>
                      <strong>{fmt(i.price * i.qty)}</strong>
                    </div>
                  ))}
                  <div
                    style={{ margin: "10px 0", borderTop: "2px dashed #eee" }}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontWeight: 900,
                      fontSize: 15,
                    }}
                  >
                    <span>TOTAL</span>
                    <span style={{ color: "#2d7a2d" }}>
                      {fmt(receipt.total)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      marginTop: 5,
                      color: "#666",
                    }}
                  >
                    <span>Bayar</span>
                    <span>{fmt(receipt.payment)}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      color: "#666",
                    }}
                  >
                    <span>Kembalian</span>
                    <strong>{fmt(receipt.change_amt)}</strong>
                  </div>
                  <div
                    style={{
                      textAlign: "center",
                      marginTop: 14,
                      fontSize: 10,
                      color: "#bbb",
                      lineHeight: 1.8,
                    }}
                  >
                    Terima kasih sudah berbelanja! 🌿
                  </div>
                  <button
                    className={`${styles.btn} ${styles.btnprimary}`} style={{ width: "100%",
                      marginTop: 12,
                      padding: "11px",
                      borderRadius: 10,
                      fontSize: 14,
                     }}
                    onClick={() => setReceipt(null)}
                  >
                    ✅ Tutup Struk
                  </button>
                </div>
              </div>
            )}

            {/* MODAL PRODUK */}
            {prodModal && (
              <div className={styles.overlay} onClick={() => setProdModal(null)}>
                <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      marginBottom: 18,
                      color: "#1a4a1a",
                    }}
                  >
                    {prodModal === "add"
                      ? "➕ Tambah Produk"
                      : "✏️ Edit Produk"}
                  </div>
                  {[
                    { l: "Nama *", k: "name", t: "text", p: "Nama produk..." },
                    { l: "Harga *", k: "price", t: "number", p: "Harga..." },
                    { l: "Stok *", k: "stock", t: "number", p: "Stok..." },
                    {
                      l: "Min Stok",
                      k: "min_stock",
                      t: "number",
                      p: "Min stok...",
                    },
                  ].map((f) => (
                    <div key={f.k} style={{ marginBottom: 12 }}>
                      <label
                        style={{
                          display: "block",
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#555",
                          marginBottom: 4,
                        }}
                      >
                        {f.l}
                      </label>
                      <input
                        className={styles.inp}
                        type={f.t}
                        placeholder={f.p}
                        value={prodForm[f.k]}
                        onChange={(e) =>
                          setProdForm((p) => ({ ...p, [f.k]: e.target.value }))
                        }
                      />
                    </div>
                  ))}
                  <div style={{ marginBottom: 12 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#555",
                        marginBottom: 4,
                      }}
                    >
                      Kategori
                    </label>
                    <select
                      className={styles.inp}
                      value={prodForm.category}
                      onChange={(e) =>
                        setProdForm((p) => ({ ...p, category: e.target.value }))
                      }
                    >
                      {kategoris.map((k) => (
                        <option key={k.id} value={k.nama}>
                          {k.nama}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#555",
                        marginBottom: 4,
                      }}
                    >
                      Satuan
                    </label>
                    <select
                      className={styles.inp}
                      value={prodForm.unit}
                      onChange={(e) =>
                        setProdForm((p) => ({ ...p, unit: e.target.value }))
                      }
                    >
                      {satuans.map((s) => (
                        <option key={s.id} value={s.nama}>
                          {s.nama}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#555",
                        marginBottom: 4,
                      }}
                    >
                      Supplier
                    </label>
                    <select
                      className={styles.inp}
                      value={prodForm.supplier_id}
                      onChange={(e) =>
                        setProdForm((p) => ({
                          ...p,
                          supplier_id: e.target.value,
                        }))
                      }
                    >
                      <option value="">— Pilih Supplier —</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      className={`${styles.btn} ${styles.btnprimary}`} style={{ flex: 1,
                        padding: 12,
                        fontSize: 14,
                       }}
                      onClick={saveProd}
                    >
                      💾 Simpan
                    </button>
                    <button
                      className={styles.btndefault} style={{ flex: 1, padding: 12, fontSize: 14  }}
                      onClick={() => setProdModal(null)}
                    >
                      Batal
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL SUPPLIER */}
            {supModal && (
              <div className={styles.overlay} onClick={() => setSupModal(null)}>
                <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      marginBottom: 18,
                      color: "#1a4a1a",
                    }}
                  >
                    {supModal === "add"
                      ? "➕ Tambah Supplier"
                      : "✏️ Edit Supplier"}
                  </div>
                  {[
                    {
                      l: "Nama *",
                      k: "name",
                      t: "text",
                      p: "Nama supplier...",
                    },
                    {
                      l: "Kontak PIC",
                      k: "contact",
                      t: "text",
                      p: "Nama PIC...",
                    },
                    { l: "Telepon *", k: "phone", t: "text", p: "08xx..." },
                    { l: "Email", k: "email", t: "email", p: "email@..." },
                    { l: "Alamat", k: "address", t: "text", p: "Jl. ..." },
                    {
                      l: "Kategori",
                      k: "category",
                      t: "text",
                      p: "Jenis produk...",
                    },
                  ].map((f) => (
                    <div key={f.k} style={{ marginBottom: 12 }}>
                      <label
                        style={{
                          display: "block",
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#555",
                          marginBottom: 4,
                        }}
                      >
                        {f.l}
                      </label>
                      <input
                        className={styles.inp}
                        type={f.t}
                        placeholder={f.p}
                        value={supForm[f.k]}
                        onChange={(e) =>
                          setSupForm((s) => ({ ...s, [f.k]: e.target.value }))
                        }
                      />
                    </div>
                  ))}
                  <div style={{ marginBottom: 12 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#555",
                        marginBottom: 4,
                      }}
                    >
                      Status
                    </label>
                    <select
                      className={styles.inp}
                      value={supForm.status}
                      onChange={(e) =>
                        setSupForm((s) => ({ ...s, status: e.target.value }))
                      }
                    >
                      <option>Aktif</option>
                      <option>Tidak Aktif</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#555",
                        marginBottom: 4,
                      }}
                    >
                      Catatan
                    </label>
                    <textarea
                      className={styles.inp} style={{ height: 76, resize: "vertical"  }}
                      placeholder="Catatan..."
                      value={supForm.notes}
                      onChange={(e) =>
                        setSupForm((s) => ({ ...s, notes: e.target.value }))
                      }
                    />
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      className={`${styles.btn} ${styles.btnprimary}`} style={{ flex: 1,
                        padding: 12,
                        fontSize: 14,
                       }}
                      onClick={saveSup}
                    >
                      💾 Simpan
                    </button>
                    <button
                      className={styles.btndefault} style={{ flex: 1, padding: 12, fontSize: 14  }}
                      onClick={() => setSupModal(null)}
                    >
                      Batal
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL RESTOCK */}
            {restockModal && (
              <div className={styles.overlay} onClick={() => setRestockModal(null)}>
                <div
                  className={styles.modal} style={{ width: 330  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      marginBottom: 4,
                      color: "#1a4a1a",
                    }}
                  >
                    📦 Restock Produk
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#666",
                      marginBottom: 14,
                      fontWeight: 600,
                    }}
                  >
                    {restockModal.name}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      marginBottom: 14,
                      padding: "12px",
                      background: "#f4f7f2",
                      borderRadius: 10,
                    }}
                  >
                    <span>Stok saat ini</span>
                    <strong>
                      {restockModal.stock} {restockModal.unit}
                    </strong>
                  </div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#555",
                      marginBottom: 5,
                    }}
                  >
                    Tambah Stok ({restockModal.unit})
                  </label>
                  <input
                    className={styles.inp} style={{ marginBottom: 12,
                      fontSize: 16,
                      fontWeight: 700,
                     }}
                    type="number"
                    placeholder="Jumlah tambahan..."
                    value={restockQty}
                    onChange={(e) => setRestockQty(e.target.value)}
                    autoFocus
                  />
                  {restockQty && parseInt(restockQty) > 0 && (
                    <div
                      style={{
                        marginBottom: 12,
                        fontSize: 13,
                        color: "#2d7a2d",
                        fontWeight: 800,
                        padding: "10px 12px",
                        background: "#f0fdf4",
                        borderRadius: 10,
                      }}
                    >
                      ✅ Setelah restock:{" "}
                      <strong>
                        {restockModal.stock + parseInt(restockQty)}{" "}
                        {restockModal.unit}
                      </strong>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      className={`${styles.btn} ${styles.btnprimary}`} style={{ flex: 1,
                        padding: 12,
                        fontSize: 14,
                       }}
                      onClick={doRestock}
                    >
                      ✅ Konfirmasi
                    </button>
                    <button
                      className={styles.btndefault} style={{ flex: 1, padding: 12, fontSize: 14  }}
                      onClick={() => setRestockModal(null)}
                    >
                      Batal
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* KONFIRMASI LOGOUT */}
            {showLogout && (
              <div className={styles.overlay} onClick={() => setShowLogout(false)}>
                <div
                  className={styles.modal} style={{ width: 340, textAlign: "center"  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🚪</div>
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 800,
                      color: "#1a4a1a",
                      marginBottom: 8,
                    }}
                  >
                    Keluar dari Sistem?
                  </div>
                  <div
                    style={{ fontSize: 13, color: "#888", marginBottom: 24 }}
                  >
                    Anda akan kembali ke halaman login.
                    <br />
                    Pastikan semua transaksi sudah disimpan.
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      className={`${styles.btn} ${styles.btndanger}`} style={{ flex: 1,
                        padding: 12,
                        fontSize: 14,
                       }}
                      onClick={onLogout}
                    >
                      🚪 Ya, Keluar
                    </button>
                    <button
                      className={styles.btndefault} style={{ flex: 1, padding: 12, fontSize: 14  }}
                      onClick={() => setShowLogout(false)}
                    >
                      Batal
                    </button>
                  </div>
                </div>
              </div>
            )}

            {notif && (
              <div
                style={{
                  position: "fixed",
                  top: 14,
                  right: 14,
                  zIndex: 9999,
                  padding: "12px 18px",
                  borderRadius: 12,
                  background: notif.type === "error" ? "#dc3545" : "#2d7a2d",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 800,
                  boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
                  animation: "fadeIn 0.2s ease",
                }}
              >
                {notif.msg}
              </div>
            )}
          </div>
        );
      }

export default App;
