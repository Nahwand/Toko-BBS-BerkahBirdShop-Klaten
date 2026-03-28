import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import * as XL from 'xlsx';
import { sb } from './config/supabase';
import styles from './styles/App.module.css';
import { CATS, MONTHS, BADGE, ACCESS, TODAY, fmt, fmtN } from './utils/constants';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import Badge from './components/Badge';
import Spin from './components/Spin';
import LoginPage from './pages/LoginPage';
import UsersPage from './pages/UsersPage';
import MasterDataPage from './pages/MasterDataPage';
import DashboardPage from './pages/DashboardPage';
import KasirPage from './pages/KasirPage';
import ProdukPage from './pages/ProdukPage';
import RiwayatPage from './pages/RiwayatPage';
import StokPage from './pages/StokPage';
import LaporanPage from './pages/LaporanPage';
import SupplierPage from './pages/SupplierPage';
import ImportExportPage from './pages/ImportExportPage';
import ReceiptModal from './components/modals/ReceiptModal';
import HistReceiptModal from './components/modals/HistReceiptModal';
import ProdukModal from './components/modals/ProdukModal';
import SupplierModal from './components/modals/SupplierModal';
import RestockModal from './components/modals/RestockModal';

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const s = sessionStorage.getItem("bbs_user");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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

  return (
    <>
      {isOffline && (
        <div style={{ background: '#dc2626', color: '#fff', textAlign: 'center', padding: '8px 16px', fontSize: 13, fontWeight: 700, zIndex: 9999, position: 'relative', letterSpacing: 0.5 }}>
          ⚠️ Koneksi Internet Terputus: Kasir Berjalan dalam Mode Offline
        </div>
      )}
      {!currentUser ? <LoginPage onLogin={handleLogin} /> : <Main currentUser={currentUser} onLogout={handleLogout} isOffline={isOffline} />}
    </>
  );
}

function Main({ currentUser, onLogout, isOffline }) {
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
  const [prodImage, setProdImage] = useState(null);
  const [histSearch, setHistSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [restockModal, setRestockModal] = useState(null);
  const [restockQty, setRestockQty] = useState("");
  const [histReceipt, setHistReceipt] = useState(null);
  const [notif, setNotif] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    }
  };
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

  // Helper: Load all cached data from localStorage
  const loadFromCache = () => {
    const cachedProds = JSON.parse(localStorage.getItem('bbs_offline_products') || "[]");
    const cachedCats = JSON.parse(localStorage.getItem('bbs_offline_cats') || "[]");
    const cachedUnits = JSON.parse(localStorage.getItem('bbs_offline_units') || "[]");
    const cachedSup = JSON.parse(localStorage.getItem('bbs_offline_suppliers') || "[]");

    console.log('[BBS Offline] loadFromCache:', {
      products: cachedProds.length,
      cats: cachedCats.length,
      units: cachedUnits.length,
      suppliers: cachedSup.length,
    });

    setProducts(cachedProds);
    setKategoris(cachedCats);
    setSatuans(cachedUnits);
    if (cachedSup.length > 0) setSuppliers(cachedSup);

    return cachedProds.length > 0;
  };

  const loadAll = useCallback(async (forceOffline = false) => {
    setLoading(true);

    // Jika offline, pakai data yang sudah ada di state dulu
    // Hanya load dari cache jika state kosong (pertama kali)
    if (forceOffline || (!navigator.onLine)) {
      setProducts(prev => {
        if (prev.length > 0) return prev; // sudah ada data di memory, jangan timpa
        const cached = JSON.parse(localStorage.getItem('bbs_offline_products') || "[]");
        return cached;
      });
      setKategoris(prev => {
        if (prev.length > 0) return prev;
        return JSON.parse(localStorage.getItem('bbs_offline_cats') || "[]");
      });
      setSatuans(prev => {
        if (prev.length > 0) return prev;
        return JSON.parse(localStorage.getItem('bbs_offline_units') || "[]");
      });
      setSuppliers(prev => {
        if (prev.length > 0) return prev;
        return JSON.parse(localStorage.getItem('bbs_offline_suppliers') || "[]");
      });
      const cachedCount = JSON.parse(localStorage.getItem('bbs_offline_products') || "[]").length;
      showNotif(
        cachedCount > 0 ? "Mode Offline: Menggunakan data tersimpan." : "Mode Offline: Belum ada data. Sambungkan internet lalu refresh.",
        cachedCount > 0 ? "info" : "error"
      );
      setLoading(false);
      return;
    }

    try {
      // 2. Sync Offline Queue (Hanya jika Online)
      if (navigator.onLine) {
        const queue = JSON.parse(localStorage.getItem('bbs_offline_queue') || "[]");
        if (queue.length > 0) {
          try {
            for (const q of queue) {
              const { trx, trxItems } = q;
              const { id, ...trxPayload } = trx;
              const { data: newTrx, error: e1 } = await sb.from("transactions").insert(trxPayload).select().single();
              if (!e1 && newTrx) {
                const itemsPayload = trxItems.map(ti => {
                  const { transaction_id, ...rest } = ti;
                  return { ...rest, transaction_id: newTrx.id };
                });
                await sb.from("transaction_items").insert(itemsPayload);
                for (const i of trxItems) {
                  const { data: pData } = await sb.from("products").select("stock").eq("id", i.product_id).single();
                  if (pData) {
                    await sb.from("products").update({ stock: pData.stock - i.qty }).eq("id", i.product_id);
                  }
                }
              }
            }
            localStorage.removeItem('bbs_offline_queue');
          } catch (syncErr) {
            console.error("Sync error:", syncErr);
          }
        }
      }

      // 3. Auto-delete aktivitas yang lebih tua dari 31 hari
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 31);
      sb.from("activity_logs")
        .delete()
        .lt("created_at", cutoffDate.toISOString())
        .then(() => { })
        .catch(e => console.error("Gagal menghapus log lama:", e));

      // 4. Fetch data dari server DENGAN timeout 8 detik
      const fetchWithTimeout = Promise.all([
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

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), 8000)
      );

      const [
        { data: prods },
        { data: sups },
        { data: trxs },
        { data: items },
        { data: kats },
        { data: sats },
        { data: acts },
      ] = await Promise.race([fetchWithTimeout, timeoutPromise]);

      // 5. Update state & Caching (HANYA jika data berhasil di-fetch)
      if (prods) {
        setProducts(prods);
        localStorage.setItem('bbs_offline_products', JSON.stringify(prods));
        console.log('[BBS Offline] Cached products:', prods.length);
      }
      if (sups) {
        setSuppliers(sups);
        localStorage.setItem('bbs_offline_suppliers', JSON.stringify(sups));
      }
      if (kats) {
        setKategoris(kats);
        localStorage.setItem('bbs_offline_cats', JSON.stringify(kats));
      }
      if (sats) {
        setSatuans(sats);
        localStorage.setItem('bbs_offline_units', JSON.stringify(sats));
      }
      if (acts) setActivityLogs(acts);
      if (trxs) {
        setTransactions(
          trxs.map((t) => ({
            ...t,
            items: (items || []).filter((i) => i.transaction_id === t.id),
          })),
        );
      }
    } catch (e) {
      console.error("LoadAll Error:", e);
      // Fallback terakhir: SELALU coba load dari cache jika fetch gagal
      try {
        const hasData = loadFromCache();
        if (hasData) {
          showNotif("Koneksi bermasalah. Menggunakan data offline.", "info");
        } else {
          showNotif("Gagal terhubung ke server. Periksa koneksi Anda.", "error");
        }
      } catch (cacheErr) {
        showNotif("Gagal terhubung ke server. Periksa koneksi Anda.", "error");
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Saat status offline berubah, jangan reload data — cukup notif
  useEffect(() => {
    if (isOffline) {
      // Pastikan data di memory tidak hilang — jika kosong, load dari cache
      setProducts(prev => {
        if (prev.length > 0) return prev;
        return JSON.parse(localStorage.getItem('bbs_offline_products') || "[]");
      });
      setKategoris(prev => {
        if (prev.length > 0) return prev;
        return JSON.parse(localStorage.getItem('bbs_offline_cats') || "[]");
      });
      setSatuans(prev => {
        if (prev.length > 0) return prev;
        return JSON.parse(localStorage.getItem('bbs_offline_units') || "[]");
      });
      setSuppliers(prev => {
        if (prev.length > 0) return prev;
        return JSON.parse(localStorage.getItem('bbs_offline_suppliers') || "[]");
      });
    } else {
      // Kembali online — refresh data dari server
      loadAll();
    }
  }, [isOffline]);

  const todayTrx = transactions.filter((t) => t.date === TODAY);
  const todayRev = todayTrx.reduce((s, t) => s + t.total, 0);
  const weekStart = new Date(Date.now() - 7 * 86400000)
    .toISOString()
    .slice(0, 10);
  const weekTrx = transactions.filter((t) => t.date >= weekStart);
  const weekRev = weekTrx.reduce((s, t) => s + t.total, 0);
  const outStock = (products || []).filter((p) => Number(p.stock) === 0);
  const lowStock = (products || []).filter((p) => Number(p.stock) > 0 && Number(p.stock) <= Number(p.min_stock));

  const filtProd = useMemo(() => {
    const s = searchProd.toLowerCase();
    return products.filter((p) => {
      const mc = filterCat === "Semua" || p.category === filterCat;
      if (!s) return mc;

      const supplier = suppliers.find(sup => sup.id === p.supplier_id);
      const supplierName = supplier && supplier.name ? supplier.name.toLowerCase() : "";

      const pName = p.name ? p.name.toLowerCase() : "";
      const pCat = p.category ? p.category.toLowerCase() : "";
      const pUnit = p.unit ? p.unit.toLowerCase() : "";
      const pPrice = p.price ? p.price.toString() : "";

      const ms =
        pName.includes(s) ||
        pCat.includes(s) ||
        pUnit.includes(s) ||
        pPrice.includes(s) ||
        supplierName.includes(s);

      return mc && ms;
    });
  }, [products, filterCat, searchProd, suppliers]);

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

    if (isOffline) {
      const trxCode = `OFF-${Date.now().toString().slice(-4)}`;
      const trx = {
        id: Date.now().toString(),
        trx_code: trxCode,
        date: TODAY,
        customer: customerName || "Umum",
        total: cartTotal,
        payment: payNum,
        change_amt: change,
      };
      const trxItems = cart.map((i) => ({
        transaction_id: trx.id,
        product_id: i.product_id,
        product_name: i.name,
        qty: i.qty,
        unit: i.unit,
        price: i.price,
      }));
      const queue = JSON.parse(localStorage.getItem('bbs_offline_queue') || "[]");
      queue.push({ trx, trxItems });
      localStorage.setItem('bbs_offline_queue', JSON.stringify(queue));

      const newProducts = [...products];
      for (const i of cart) {
        const pIdx = newProducts.findIndex((x) => x.id === i.product_id);
        if (pIdx > -1) newProducts[pIdx].stock -= i.qty;
      }
      setProducts(newProducts);
      localStorage.setItem('bbs_offline_products', JSON.stringify(newProducts));

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
      showNotif("Berhasil: Transaksi Tersimpan Offline!");
      setLoading(false);
      return;
    }

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

    let imageUrl = prodModal !== "add" ? prodModal.image_url : null;
    if (prodImage) {
      const ext = prodImage.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      const { error: uploadError } = await sb.storage
        .from("produk")
        .upload(fileName, prodImage);

      if (uploadError) {
        setLoading(false);
        showNotif("Gagal upload gambar: " + uploadError.message, "error");
        return;
      }

      const { data: publicUrlData } = sb.storage
        .from("produk")
        .getPublicUrl(fileName);
      imageUrl = publicUrlData.publicUrl;
    }

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
      image_url: imageUrl,
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

  const [showExportPDFLoading, setShowExportPDFLoading] = useState(false);
  const [exportingTitle, setExportingTitle] = useState(null);
  const [importingState, setImportingState] = useState(null);

  const exportPDF = async () => {
    const reportNode = document.getElementById("laporan-container");
    if (!reportNode) return;
    setShowExportPDFLoading(true);
    try {
      const actionsNode = document.getElementById("laporan-actions");
      if (actionsNode) actionsNode.style.display = "none";

      const canvas = await html2canvas(reportNode, { scale: 2, useCORS: true, logging: false });

      if (actionsNode) actionsNode.style.display = "flex";

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Laporan_BBS_${MONTHS[rptMonth]}_${rptYear}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Gagal mencetak PDF");
      const actionsNode = document.getElementById("laporan-actions");
      if (actionsNode) actionsNode.style.display = "flex";
    } finally {
      setShowExportPDFLoading(false);
    }
  };

  const exportExcel = async (type) => {
    setExportingTitle(type);
    try {
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
    } catch (e) {
      console.error(e);
      showNotif("Gagal melakukan export data", "error");
    } finally {
      setExportingTitle(null);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportingState("Membaca file Excel...");
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
          for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            setImportingState(`Memproses data ${i + 1} / ${rows.length}...`);
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
        setImportingState("Menyinkronkan data...");
        await loadAll();
        const summary = logs.join(" | ");
        await logActivity("Import Excel", "Import/Export", summary);
        showNotif("Import selesai!");
      } catch (err) {
        setImportLog([`❌ Error: ${err.message}`]);
        showNotif("Gagal import!", "error");
      } finally {
        setImportingState(null);
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
    <div className="bbs-app" style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {sidebarOpen && <div className="bbs-overlay open" onClick={() => setSidebarOpen(false)} />}

      {loading && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(255,255,255,0.75)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
          <Spin />
          <div style={{ fontSize: 13, color: "#2d7a2d", fontWeight: 700 }}>Memuat data...</div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className={`bbs-sidebar${sidebarOpen ? " open" : ""}`} style={{ background: "linear-gradient(180deg,#1b4d1b,#0e2e0e)", color: "#fff", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "16px 14px 14px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#a8e063" }}>🌿 BBS</div>
          <div style={{ fontSize: 11, color: "#a8e063", fontWeight: 700 }}>BerkahBirdShop</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>Klaten · 🟢 Online</div>
        </div>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.05)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{currentUser.nama}</div>
          <div style={{ marginTop: 3 }}>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 800, background: currentUser.role === "superadmin" ? "rgba(168,224,99,0.2)" : currentUser.role === "admin" ? "rgba(255,200,100,0.2)" : "rgba(100,160,255,0.2)", color: currentUser.role === "superadmin" ? "#a8e063" : currentUser.role === "admin" ? "#ffc864" : "#7eb8ff" }}>
              {currentUser.role === "superadmin" ? "👑 Super Admin" : currentUser.role === "admin" ? "🛡️ Admin" : "👤 Pegawai"}
            </span>
          </div>
        </div>
        <nav style={{ padding: "8px 0", flex: 1, overflowY: "auto" }}>
          {navs.map((n) => (
            <div key={n.id} onClick={() => { setPage(n.id); setSidebarOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", cursor: "pointer", borderLeft: page === n.id ? "3px solid #a8e063" : "3px solid transparent", background: page === n.id ? "rgba(168,224,99,0.12)" : "transparent", color: page === n.id ? "#a8e063" : "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: page === n.id ? 700 : 400 }}>
              <span style={{ fontSize: 15 }}>{n.icon}</span>{n.label}
            </div>
          ))}
        </nav>
        {outStock.length > 0 && (
          <div style={{ margin: "0 10px 10px", padding: "10px 12px", background: "rgba(239,68,68,0.18)", borderRadius: 8, borderLeft: "3px solid #ef4444" }}>
            <div style={{ fontSize: 9, color: "#ef4444", fontWeight: 800 }}>❌ STOK HABIS</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{outStock.length} produk</div>
          </div>
        )}
        {lowStock.length > 0 && (
          <div style={{ margin: "0 10px 10px", padding: "10px 12px", background: "rgba(245,158,11,0.18)", borderRadius: 8, borderLeft: "3px solid #f59e0b" }}>
            <div style={{ fontSize: 9, color: "#f59e0b", fontWeight: 800 }}>⚠ STOK MENIPIS</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{lowStock.length} produk</div>
          </div>
        )}
        {deferredPrompt && (
          <div style={{ padding: "0 12px 10px" }}>
            <button onClick={handleInstallClick} style={{ width: "100%", padding: "9px", background: "#fff", color: "#1a4a1a", border: "1px solid #1a4a1a", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              🚀 Install Aplikasi
            </button>
          </div>
        )}
        <div style={{ padding: "10px 12px 14px" }}>
          <button onClick={() => setShowLogout(true)} style={{ width: "100%", padding: "9px", background: "rgba(220,53,69,0.15)", color: "#ff8080", border: "1px solid rgba(220,53,69,0.3)", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            🚪 Keluar
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="bbs-main" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header style={{ background: "#fff", padding: "11px 16px", borderBottom: "1px solid #e4ede4", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="bbs-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>☰</span>
            </button>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1a4a1a" }}>
              {allNavs.find((n) => n.id === page)?.icon} {allNavs.find((n) => n.id === page)?.label}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className={styles.btndefault} style={{ padding: "5px 10px", fontSize: 11 }} onClick={loadAll}>🔄 Refresh</button>
            <div className="hide-mobile" style={{ fontSize: 11, color: "#888" }}>
              {new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>
        </header>

        <div className="bbs-content">
          {page === "dashboard" && (
            <DashboardPage transactions={transactions} products={products} activityLogs={activityLogs}
              todayTrx={todayTrx} todayRev={todayRev} weekTrx={weekTrx} weekRev={weekRev}
              outStock={outStock} lowStock={lowStock} />
          )}
          {page === "kasir" && (
            <KasirPage filtProd={filtProd} searchProd={searchProd} setSearchProd={setSearchProd}
              filterCat={filterCat} setFilterCat={setFilterCat} cart={cart} customerName={customerName}
              setCustomerName={setCustomerName} paymentInput={paymentInput} setPaymentInput={setPaymentInput}
              cartTotal={cartTotal} payNum={payNum} change={change} addToCart={addToCart}
              updCart={updCart} processPayment={processPayment} setCart={setCart} isOffline={isOffline} />
          )}
          {page === "produk" && (
            <ProdukPage filtProd={filtProd} suppliers={suppliers} searchProd={searchProd}
              setSearchProd={setSearchProd} filterCat={filterCat} setFilterCat={setFilterCat}
              setProdForm={setProdForm} setProdImage={setProdImage} setProdModal={setProdModal} delProd={delProd} />
          )}
          {page === "riwayat" && (
            <RiwayatPage filtHist={filtHist} histSearch={histSearch} setHistSearch={setHistSearch}
              filterDate={filterDate} setFilterDate={setFilterDate} exportExcel={exportExcel} setHistReceipt={setHistReceipt} />
          )}
          {page === "stok" && (
            <StokPage filtProd={filtProd} searchProd={searchProd} setSearchProd={setSearchProd}
              filterCat={filterCat} setFilterCat={setFilterCat} isSuperAdmin={isSuperAdmin}
              exportExcel={exportExcel} setRestockModal={setRestockModal} setRestockQty={setRestockQty} />
          )}
          {page === "laporan" && (
            <LaporanPage rptMonth={rptMonth} setRptMonth={setRptMonth} rptYear={rptYear} setRptYear={setRptYear}
              rptTrx={rptTrx} rptRev={rptRev} dayData={dayData} catData={catData} topProds={topProds}
              exportExcel={exportExcel} exportPDF={exportPDF} showExportPDFLoading={showExportPDFLoading} />
          )}
          {page === "supplier" && (
            <SupplierPage suppliers={suppliers} products={products} exportExcel={exportExcel}
              setSupForm={setSupForm} setSupModal={setSupModal} delSup={delSup} />
          )}
          {page === "excel" && (
            <ImportExportPage exportExcel={exportExcel} exportingTitle={exportingTitle}
              handleImport={handleImport} importingState={importingState} importLog={importLog}
              rptMonth={rptMonth} rptYear={rptYear} />
          )}
          {page === "users" && (
            <UsersPage sb={sb} showNotif={showNotif} currentUser={currentUser} logActivity={logActivity} />
          )}
          {page === "masterdata" && (
            <MasterDataPage sb={sb} showNotif={showNotif} kategoris={kategoris} satuans={satuans} onReload={loadAll} logActivity={logActivity} />
          )}
        </div>
      </div>

      {/* MODALS */}
      <HistReceiptModal histReceipt={histReceipt} onClose={() => setHistReceipt(null)} />
      <ReceiptModal receipt={receipt} customerName={customerName} onClose={() => setReceipt(null)} />
      <ProdukModal prodModal={prodModal} prodForm={prodForm} setProdForm={setProdForm} prodImage={prodImage}
        setProdImage={setProdImage} kategoris={kategoris} satuans={satuans} suppliers={suppliers}
        saveProd={saveProd} onClose={() => setProdModal(null)} />
      <SupplierModal supModal={supModal} supForm={supForm} setSupForm={setSupForm} saveSup={saveSup} onClose={() => setSupModal(null)} />
      <RestockModal restockModal={restockModal} restockQty={restockQty} setRestockQty={setRestockQty} doRestock={doRestock} onClose={() => setRestockModal(null)} />

      {/* KONFIRMASI LOGOUT */}
      {showLogout && (
        <div className={styles.overlay} onClick={() => setShowLogout(false)}>
          <div className={styles.modal} style={{ width: 340, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚪</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#1a4a1a", marginBottom: 8 }}>Keluar dari Sistem?</div>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>Anda akan kembali ke halaman login.<br />Pastikan semua transaksi sudah disimpan.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className={`${styles.btn} ${styles.btndanger}`} style={{ flex: 1, padding: 12, fontSize: 14 }} onClick={onLogout}>🚪 Ya, Keluar</button>
              <button className={styles.btndefault} style={{ flex: 1, padding: 12, fontSize: 14 }} onClick={() => setShowLogout(false)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {notif && (
        <div style={{ position: "fixed", top: 14, right: 14, zIndex: 9999, padding: "12px 18px", borderRadius: 12, background: notif.type === "error" ? "#dc3545" : "#2d7a2d", color: "#fff", fontSize: 13, fontWeight: 800, boxShadow: "0 6px 20px rgba(0,0,0,0.25)", animation: "fadeIn 0.2s ease" }}>
          {notif.msg}
        </div>
      )}
    </div>
  );
}

export default App;
