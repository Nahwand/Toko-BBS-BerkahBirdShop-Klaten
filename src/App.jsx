import { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { sb } from './config/supabase';
import styles from './styles/App.module.css';
import { ACCESS, fmt } from './utils/constants';
import { AppProvider, useApp } from './context/AppContext';
import { filterByDateRange, buildDayData } from './utils/reportUtils';

import Spin from './components/Spin';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import UsersPage from './pages/UsersPage';
import MasterDataPage from './pages/MasterDataPage';
import DashboardPage from './pages/DashboardPage';
import KasirPage from './pages/KasirPage';
import ProdukPage from './pages/ProdukPage';
import RiwayatPage from './pages/RiwayatPage';
import StokPage from './pages/StokPage';
import SupplierPage from './pages/SupplierPage';
import RestockLogPage from './pages/RestockLogPage';
import SettingsPage from './pages/SettingsPage';
import AuditLogPage from './pages/AuditLogPage';

const LaporanPage = lazy(() => import('./pages/LaporanPage'));
const ImportExportPage = lazy(() => import('./pages/ImportExportPage'));
import ReceiptModal from './components/modals/ReceiptModal';
import HistReceiptModal from './components/modals/HistReceiptModal';
import ProdukModal from './components/modals/ProdukModal';
import SupplierModal from './components/modals/SupplierModal';
import RestockModal from './components/modals/RestockModal';
import ConfirmModal from './components/modals/ConfirmModal';
import VoidModal from './components/modals/VoidModal';

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

  // Session timeout: auto logout setelah 30 menit tidak ada aktivitas
  // Warning muncul 2 menit sebelum logout
  const [sessionWarning, setSessionWarning] = useState(false);
  const [sessionCountdown, setSessionCountdown] = useState(120);
  useEffect(() => {
    if (!currentUser) return;
    const TIMEOUT = 30 * 60 * 1000;
    const WARN_BEFORE = 2 * 60 * 1000;
    let warnTimer, logoutTimer, countdownInterval;

    const startTimers = () => {
      clearTimeout(warnTimer); clearTimeout(logoutTimer); clearInterval(countdownInterval);
      setSessionWarning(false);
      warnTimer = setTimeout(() => {
        setSessionWarning(true);
        setSessionCountdown(120);
        countdownInterval = setInterval(() => {
          setSessionCountdown(prev => { if (prev <= 1) { clearInterval(countdownInterval); return 0; } return prev - 1; });
        }, 1000);
      }, TIMEOUT - WARN_BEFORE);
      logoutTimer = setTimeout(() => {
        sessionStorage.removeItem("bbs_user");
        setCurrentUser(null);
      }, TIMEOUT);
    };

    startTimers();
    const reset = () => startTimers();
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, reset));
    return () => {
      clearTimeout(warnTimer); clearTimeout(logoutTimer); clearInterval(countdownInterval);
      events.forEach(e => window.removeEventListener(e, reset));
    };
  }, [currentUser]);

  return (
    <ErrorBoundary>
      {isOffline && (
        <div className="bg-red-600 text-white text-center px-4 py-2 text-[13px] font-bold z-9999 relative tracking-wide">
          ⚠️ Koneksi Internet Terputus: Kasir Berjalan dalam Mode Offline
        </div>
      )}
      {sessionWarning && currentUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-99999">
          <div className="bg-white rounded-2xl p-6 w-[340px] text-center shadow-2xl">
            <div className="text-4xl mb-3">⏰</div>
            <div className="text-[17px] font-extrabold text-bbs-green-dark mb-2">Sesi Hampir Berakhir</div>
            <div className="text-[13px] text-gray-500 mb-4">Anda akan otomatis logout dalam <strong className="text-red-500">{sessionCountdown}</strong> detik karena tidak ada aktivitas.</div>
            <button className="w-full py-3 bg-bbs-green text-white rounded-xl font-bold text-sm border-none cursor-pointer"
              onClick={() => { setSessionWarning(false); window.dispatchEvent(new MouseEvent('mousedown')); }}>
              ✅ Saya Masih Di Sini
            </button>
          </div>
        </div>
      )}
      {!currentUser ? <LoginPage onLogin={handleLogin} /> : (
        <AppProvider currentUser={currentUser} isOffline={isOffline}>
          <Main currentUser={currentUser} onLogout={handleLogout} isOffline={isOffline} />
        </AppProvider>
      )}
    </ErrorBoundary>
  );
}

function Main({ currentUser, onLogout, isOffline }) {
  const isSuperAdmin = currentUser.role === "superadmin";
  const allowedPages = ACCESS[currentUser.role] || ACCESS.pegawai;

  const {
    products, setProducts, transactions, suppliers, kategoris, satuans,
    activityLogs, restockLogs, loading, setLoading,
    notif, showNotif, logActivity, sendStockNotif, loadAll,
    todayTrx, todayRev, weekTrx, weekRev, outStock, lowStock,
    realtimeUsers, voidTransaction,
  } = useApp();

  const [page, setPage] = useState(allowedPages[0]);
  const [cart, setCart] = useState([]);
  const [searchProd, setSearchProd] = useState("");
  const [filterCat, setFilterCat] = useState("Semua");
  const [customerName, setCustomerName] = useState("");
  const [paymentInput, setPaymentInput] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [prodModal, setProdModal] = useState(null);
  const [prodForm, setProdForm] = useState({
    name: "", category: "Pakan Jadi", unit: "", price: "", stock: "", min_stock: "", supplier_id: "", jenis: "", varian: "",
  });
  const [prodImage, setProdImage] = useState(null);
  const [histSearch, setHistSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");
  const [restockModal, setRestockModal] = useState(null);
  const [restockQty, setRestockQty] = useState("");
  const [restockCatatan, setRestockCatatan] = useState("");
  const [histReceipt, setHistReceipt] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [discount, setDiscount] = useState('');
  const [voidTarget, setVoidTarget] = useState(null);
  const [filterStatus, setFilterStatus] = useState('Semua');

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
    name: "", contact: "", phone: "", email: "", address: "", category: "", status: "Aktif", notes: "",
  });
  const [rptDateStart, setRptDateStart] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [rptDateEnd, setRptDateEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [showLogout, setShowLogout] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Pagination riwayat
  const [histPage, setHistPage] = useState(1);
  const HIST_PER_PAGE = 20;

  // Confirm modal (ganti window.confirm)
  const [confirm, setConfirm] = useState(null);
  const confirmResolve = useRef(null);
  const showConfirm = (opts) => new Promise((resolve) => {
    confirmResolve.current = resolve;
    setConfirm(opts);
  });

  // Global search
  const [globalSearch, setGlobalSearch] = useState("");
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const globalSearchRef = useRef();

  const filtProd = useMemo(() => {
    const s = searchProd.toLowerCase();
    return products.filter((p) => {
      const mc = filterCat === "Semua" || p.category === filterCat;
      if (!s) return mc;
      const supplier = suppliers.find(sup => sup.id === p.supplier_id);
      const supplierName = supplier?.name?.toLowerCase() ?? "";
      const ms =
        (p.name?.toLowerCase() ?? "").includes(s) ||
        (p.category?.toLowerCase() ?? "").includes(s) ||
        (p.unit?.toLowerCase() ?? "").includes(s) ||
        (p.price?.toString() ?? "").includes(s) ||
        supplierName.includes(s);
      return mc && ms;
    });
  }, [products, filterCat, searchProd, suppliers]);

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const payNum = parseInt(paymentInput) || 0;

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
  const processPayment = async (discountAmt = 0, finalTotal = cartTotal) => {
    if (!cart.length) { showNotif("Keranjang kosong!", "error"); return; }
    if (payNum < finalTotal) { showNotif(payNum <= 0 ? "Masukkan nominal pembayaran!" : "Pembayaran kurang!", "error"); return; }
    const changeAmt = payNum - finalTotal;
    setLoading(true);

    if (isOffline) {
      const trxCode = `OFF-${Date.now().toString().slice(-4)}`;
      const todayDate = new Date().toISOString().slice(0, 10);
      const trx = {
        id: Date.now().toString(),
        trx_code: trxCode,
        date: todayDate,
        customer: customerName || "Umum",
        total: finalTotal,
        payment: payNum,
        change_amt: changeAmt,
      };
      const trxItems = cart.map((i) => ({
        transaction_id: trx.id, product_id: i.product_id, product_name: i.name,
        qty: i.qty, unit: i.unit, price: i.price,
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
      setReceipt({ ...trx, discount: discountAmt, items: cart.map((i) => ({ product_name: i.name, qty: i.qty, unit: i.unit, price: i.price })) });
      setCart([]); setCustomerName(""); setPaymentInput(""); setDiscount('');
      showNotif("Berhasil: Transaksi Tersimpan Offline!");
      setLoading(false);
      return;
    }

    try {
      const trxCode = `TRX${String(transactions.length + 1).padStart(4, "0")}`;
      const { data: trx, error: e1 } = await sb.from("transactions").insert({
        trx_code: trxCode,
        date: new Date().toISOString().slice(0, 10),
        customer: customerName || "Umum",
        total: finalTotal,
        payment: payNum,
        change_amt: changeAmt,
      }).select().single();
      if (e1) throw e1;
      const { error: e2 } = await sb.from("transaction_items").insert(
        cart.map((i) => ({ transaction_id: trx.id, product_id: i.product_id, product_name: i.name, qty: i.qty, unit: i.unit, price: i.price }))
      );
      if (e2) throw e2;
      for (const i of cart) {
        const p = products.find((x) => x.id === i.product_id);
        await sb.from("products").update({ stock: p.stock - i.qty }).eq("id", i.product_id);
      }
      await loadAll();
      setReceipt({ ...trx, discount: discountAmt, items: cart.map((i) => ({ product_name: i.name, qty: i.qty, unit: i.unit, price: i.price })) });
      setCart([]); setCustomerName(""); setPaymentInput(""); setDiscount('');
      await logActivity("Transaksi Baru", "Kasir",
        `${trxCode} - ${customerName || "Umum"} - ${fmt(finalTotal)}${discountAmt > 0 ? ` (diskon ${fmt(discountAmt)})` : ''}`);
      showNotif("Transaksi berhasil!");
      const { data: freshProds } = await sb.from("products").select("*");
      if (freshProds) sendStockNotif(freshProds);
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
      // Compress gambar sebelum upload (max 800px, quality 0.8)
      const compressedBlob = await new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(prodImage);
        img.onload = () => {
          const MAX = 800;
          const scale = Math.min(1, MAX / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(url);
          canvas.toBlob(resolve, 'image/webp', 0.8);
        };
        img.src = url;
      });
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
      const { error: uploadError } = await sb.storage.from("produk").upload(fileName, compressedBlob, { contentType: 'image/webp' });

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
      jenis: prodForm.jenis || "",
      varian: prodForm.varian || "",
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
    const p = products.find((x) => x.id === id);
    const hasTransactions = transactions.some(t => (t.items || []).some(i => i.product_id === id));
    const ok = await showConfirm({
      icon: "🗑️",
      title: "Hapus Produk?",
      message: `Produk "${p?.name}" akan dihapus permanen.`,
      warning: hasTransactions ? "⚠️ Produk ini memiliki riwayat transaksi. Data transaksi lama tidak akan terhapus, tapi nama produk tidak bisa dilacak." : null,
      confirmLabel: "Ya, Hapus",
    });
    if (!ok) return;
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
    const qtyBefore = p.stock;
    const qtyAdded = parseInt(restockQty);
    const qtyAfter = qtyBefore + qtyAdded;
    await sb.from("products").update({ stock: qtyAfter }).eq("id", restockModal.id);
    // Simpan ke restock_logs
    await sb.from("restock_logs").insert({
      product_id: restockModal.id,
      product_name: restockModal.name,
      qty_before: qtyBefore,
      qty_added: qtyAdded,
      qty_after: qtyAfter,
      unit: restockModal.unit,
      user_nama: currentUser.nama,
      user_role: currentUser.role,
      catatan: restockCatatan || "",
    });
    await logActivity("Restock Stok", "Stok", `${restockModal.name} +${restockQty} ${restockModal.unit} (${qtyBefore} → ${qtyAfter})`);
    await loadAll();
    showNotif(`Restock ${restockModal.name} berhasil!`);
    setRestockModal(null);
    setRestockQty("");
    setRestockCatatan("");
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
    const sup = suppliers.find((x) => x.id === id);
    const hasProducts = products.some(p => p.supplier_id === id);
    const ok = await showConfirm({
      icon: "🗑️",
      title: "Hapus Supplier?",
      message: `Supplier "${sup?.name}" akan dihapus permanen.`,
      warning: hasProducts ? `⚠️ Ada ${products.filter(p => p.supplier_id === id).length} produk yang terhubung ke supplier ini. Produk tidak akan terhapus tapi supplier-nya jadi kosong.` : null,
      confirmLabel: "Ya, Hapus",
    });
    if (!ok) return;
    await sb.from("suppliers").delete().eq("id", id);
    await logActivity("Hapus Supplier", "Supplier", sup?.name || "");
    await loadAll();
    showNotif("Supplier dihapus!");
  };

  const exportExcel = async (type) => {
    try {
      const XL = await import('xlsx');
      const wb = XL.utils.book_new();
      if (type === "supplier")
        XL.utils.book_append_sheet(wb, XL.utils.json_to_sheet(
          suppliers.map(s => ({ Nama: s.name, PIC: s.contact, Telepon: s.phone, Email: s.email, Alamat: s.address, Status: s.status }))
        ), "Supplier");
      XL.writeFile(wb, `BBS_${type}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      await logActivity("Export Excel", "Import/Export", type);
      showNotif("Export berhasil!");
    } catch (e) {
      showNotif("Gagal export: " + e.message, "error");
    }
  };

  const handleVoidConfirm = async (alasan) => {
    if (!voidTarget) return;
    try {
      await voidTransaction(voidTarget.id, alasan);
      showNotif(`Transaksi ${voidTarget.trx_code} berhasil dibatalkan.`);
      setVoidTarget(null);
    } catch (e) {
      showNotif(e.message || 'Gagal membatalkan transaksi.', 'error');
    }
  };

  const rptTrx = filterByDateRange(transactions, rptDateStart, rptDateEnd);
  const rptRev = rptTrx.reduce((s, t) => s + t.total, 0);
  const dayData = buildDayData(rptTrx, rptDateStart, rptDateEnd);
  const catData = kategoris
    .map((kat) => {
      let rev = 0;
      rptTrx.forEach((t) =>
        (t.items || []).forEach((i) => {
          const p = products.find((pr) => pr.id === i.product_id);
          if (p && p.category === kat.nama) rev += i.price * i.qty;
        }),
      );
      return { cat: kat.nama, rev };
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

  const filtHist = transactions.filter((t) => {
    const md = (!filterDate && !filterDateEnd) ||
      (filterDate && filterDateEnd ? t.date >= filterDate && t.date <= filterDateEnd :
       filterDate ? t.date === filterDate :
       t.date <= filterDateEnd);
    const ms =
      t.trx_code?.toLowerCase().includes(histSearch.toLowerCase()) ||
      t.customer?.toLowerCase().includes(histSearch.toLowerCase());
    const mst = filterStatus === 'Semua' ? true :
      filterStatus === 'Void' ? t.status === 'void' :
      t.status !== 'void';
    return md && ms && mst;
  });

  // Reset ke halaman 1 saat filter berubah
  useEffect(() => { setHistPage(1); }, [histSearch, filterDate, filterDateEnd, filterStatus]);

  const histTotalPages = Math.ceil(filtHist.length / HIST_PER_PAGE);
  const histPaged = filtHist.slice((histPage - 1) * HIST_PER_PAGE, histPage * HIST_PER_PAGE);

  // Global search results
  const globalResults = useMemo(() => {
    const q = globalSearch.toLowerCase().trim();
    if (!q || q.length < 2) return [];
    const results = [];
    products.filter(p => p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q))
      .slice(0, 5).forEach(p => results.push({ type: "Produk", icon: "📦", label: p.name, sub: `${p.category} · Stok: ${p.stock}`, action: () => { setPage("produk"); setGlobalSearch(""); setShowGlobalSearch(false); } }));
    transactions.filter(t => t.trx_code?.toLowerCase().includes(q) || t.customer?.toLowerCase().includes(q))
      .slice(0, 5).forEach(t => results.push({ type: "Transaksi", icon: "📋", label: t.trx_code, sub: `${t.customer} · ${t.date} · ${fmt(t.total)}`, action: () => { setPage("riwayat"); setHistSearch(t.trx_code); setGlobalSearch(""); setShowGlobalSearch(false); } }));
    suppliers.filter(s => s.name?.toLowerCase().includes(q) || s.contact?.toLowerCase().includes(q))
      .slice(0, 3).forEach(s => results.push({ type: "Supplier", icon: "🤝", label: s.name, sub: s.phone, action: () => { setPage("supplier"); setGlobalSearch(""); setShowGlobalSearch(false); } }));
    return results;
  }, [globalSearch, products, transactions, suppliers]);

  const allNavs = [
    { id: "dashboard", icon: "⊞", label: "Dashboard" },
    { id: "kasir", icon: "🤝", label: "Kasir" },
    { id: "produk", icon: "📦", label: "Produk" },
    { id: "riwayat", icon: "📋", label: "Riwayat" },
    { id: "stok", icon: "📊", label: "Stok" },
    { id: "restocklog", icon: "📦", label: "Riwayat Restock" },
    { id: "laporan", icon: "📈", label: "Laporan" },
    { id: "supplier", icon: "🤝", label: "Supplier" },
    { id: "excel", icon: "📗", label: "Import/Export" },
    { id: "users", icon: "👥", label: "Kelola Akun" },
    { id: "masterdata", icon: "🗂️", label: "Master Data" },
    { id: "settings", icon: "⚙️", label: "Pengaturan" },
    { id: "auditlog", icon: "🔐", label: "Audit Login" },
  ];
  const navs = allNavs.filter((n) => allowedPages.includes(n.id));


  return (
    <div className="bbs-app">
      {sidebarOpen && <div className="bbs-overlay open" onClick={() => setSidebarOpen(false)} />}

      {loading && (
        <div className="fixed inset-0 bg-white/75 z-9999 flex flex-col items-center justify-center gap-3">
          <Spin />
          <div className="text-[13px] text-bbs-green font-bold">Memuat data...</div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className={`bbs-sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="px-3.5 pt-4 pb-3.5 border-b border-white/10">
          <div className="text-xl font-black text-[#a8e063]">🌿 BBS</div>
          <div className="text-[11px] text-[#a8e063] font-bold">BerkahBirdShop</div>
          <div className="text-[9px] text-white/40">
            Klaten · {isOffline ? "🔴 Offline" : `🟢 Online${realtimeUsers.length > 1 ? ` · ${realtimeUsers.length} kasir aktif` : ""}`}
          </div>
        </div>
        <div className="px-3.5 py-3 border-b border-white/8 bg-white/5">
          <div className="text-xs font-bold text-white">{currentUser.nama}</div>
          <div className="mt-0.5">
            <span className={`text-[10px] px-2 py-0.5 rounded-xl font-extrabold ${currentUser.role === "superadmin" ? "bg-[#a8e063]/20 text-[#a8e063]" : currentUser.role === "admin" ? "bg-[#ffc864]/20 text-[#ffc864]" : "bg-[#7eb8ff]/20 text-[#7eb8ff]"}`}>
              {currentUser.role === "superadmin" ? "👑 Super Admin" : currentUser.role === "admin" ? "🛡️ Admin" : "👤 Pegawai"}
            </span>
          </div>
        </div>
        <nav className="py-2 flex-1 overflow-y-auto">
          {navs.map((n) => (
            <div key={n.id} onClick={() => { setPage(n.id); setSidebarOpen(false); }}
              className={`flex items-center gap-2 px-3.5 py-2.5 cursor-pointer text-xs transition-colors border-l-[3px] ${page === n.id ? "border-[#a8e063] bg-[#a8e063]/12 text-[#a8e063] font-bold" : "border-transparent text-white/65 hover:text-white/90 hover:bg-white/5"}`}>
              <span className="text-[15px]">{n.icon}</span>{n.label}
            </div>
          ))}
        </nav>
        {outStock.length > 0 && (
          <div className="mx-2.5 mb-2.5 px-3 py-2.5 bg-red-500/18 rounded-lg border-l-[3px] border-red-500">
            <div className="text-[9px] text-red-400 font-extrabold">❌ STOK HABIS</div>
            <div className="text-[10px] text-white/55 mt-0.5">{outStock.length} produk</div>
          </div>
        )}
        {lowStock.length > 0 && (
          <div className="mx-2.5 mb-2.5 px-3 py-2.5 bg-amber-500/18 rounded-lg border-l-[3px] border-amber-500">
            <div className="text-[9px] text-amber-400 font-extrabold">⚠ STOK MENIPIS</div>
            <div className="text-[10px] text-white/55 mt-0.5">{lowStock.length} produk</div>
          </div>
        )}
        {deferredPrompt && (
          <div className="px-3 pb-2.5">
            <button onClick={handleInstallClick} className="w-full py-2 bg-white text-bbs-green-dark border border-bbs-green-dark rounded-lg cursor-pointer text-[13px] font-extrabold flex items-center justify-center gap-1.5">
              🚀 Install Aplikasi
            </button>
          </div>
        )}
        <div className="px-3 pb-3.5">
          <button onClick={() => setShowLogout(true)} className="w-full py-2 bg-red-500/15 text-[#ff8080] border border-red-500/30 rounded-lg cursor-pointer text-xs font-bold flex items-center justify-center gap-1.5">
            🚪 Keluar
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="bbs-main">
        <header className="bg-white px-4 py-3 border-b border-bbs-border flex justify-between items-center shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <button className="bbs-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <span className="text-xl leading-none">☰</span>
            </button>
            <div className="text-base font-extrabold text-bbs-green-dark">
              {allNavs.find((n) => n.id === page)?.icon} {allNavs.find((n) => n.id === page)?.label}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative" ref={globalSearchRef}>
              <input id="global-search" name="global-search"
                className={`${styles.inp} transition-all duration-200 cursor-pointer`}
                style={{ width: showGlobalSearch ? 220 : 36, padding: showGlobalSearch ? "5px 10px" : "5px", fontSize: 12 }}
                placeholder={showGlobalSearch ? "🔍 Cari produk, transaksi, supplier..." : "🔍"}
                value={globalSearch}
                onFocus={() => setShowGlobalSearch(true)}
                onChange={(e) => { setGlobalSearch(e.target.value); setShowGlobalSearch(true); }}
                onBlur={() => setTimeout(() => { setShowGlobalSearch(false); setGlobalSearch(""); }, 200)}
              />
              {showGlobalSearch && globalResults.length > 0 && (
                <div className="absolute top-full right-0 w-[300px] bg-white rounded-xl shadow-xl border border-bbs-border z-999 mt-1 overflow-hidden">
                  {globalResults.map((r, i) => (
                    <div key={i} onMouseDown={r.action}
                      className="px-3.5 py-2.5 cursor-pointer border-b border-gray-50 flex gap-2.5 items-center hover:bg-green-50 transition-colors">
                      <span className="text-lg">{r.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold text-bbs-green-dark">{r.label}</div>
                        <div className="text-[11px] text-gray-400 truncate">{r.sub}</div>
                      </div>
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-xl">{r.type}</span>
                    </div>
                  ))}
                </div>
              )}
              {showGlobalSearch && globalSearch.length >= 2 && globalResults.length === 0 && (
                <div className="absolute top-full right-0 w-[240px] bg-white rounded-xl shadow-xl border border-bbs-border z-999 mt-1 p-3.5 text-center text-gray-400 text-xs">
                  Tidak ada hasil untuk "{globalSearch}"
                </div>
              )}
            </div>
            <button className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#e8f0e8] text-bbs-green border-none cursor-pointer" onClick={loadAll}>🔄 Refresh</button>
            <div className="hide-mobile text-[11px] text-gray-400">
              {new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>
        </header>

        <div className="bbs-content">
          {page === "dashboard" && <DashboardPage transactions={transactions} products={products} activityLogs={activityLogs} todayTrx={todayTrx} todayRev={todayRev} weekTrx={weekTrx} weekRev={weekRev} outStock={outStock} lowStock={lowStock} />}
          {page === "kasir" && <KasirPage filtProd={filtProd} searchProd={searchProd} setSearchProd={setSearchProd} filterCat={filterCat} setFilterCat={setFilterCat} kategoris={kategoris} cart={cart} customerName={customerName} setCustomerName={setCustomerName} paymentInput={paymentInput} setPaymentInput={setPaymentInput} cartTotal={cartTotal} payNum={payNum} addToCart={addToCart} updCart={updCart} processPayment={processPayment} setCart={setCart} isOffline={isOffline} discount={discount} setDiscount={setDiscount} />}
          {page === "produk" && <ProdukPage filtProd={filtProd} suppliers={suppliers} searchProd={searchProd} setSearchProd={setSearchProd} filterCat={filterCat} setFilterCat={setFilterCat} kategoris={kategoris} setProdForm={setProdForm} setProdImage={setProdImage} setProdModal={setProdModal} delProd={delProd} />}
          {page === "riwayat" && <RiwayatPage filtHist={histPaged} histSearch={histSearch} setHistSearch={setHistSearch} filterDate={filterDate} setFilterDate={setFilterDate} filterDateEnd={filterDateEnd} setFilterDateEnd={setFilterDateEnd} filterStatus={filterStatus} setFilterStatus={setFilterStatus} setHistReceipt={setHistReceipt} totalCount={filtHist.length} page={histPage} setPage={setHistPage} totalPages={histTotalPages} perPage={HIST_PER_PAGE} />}
          {page === "stok" && <StokPage filtProd={filtProd} searchProd={searchProd} setSearchProd={setSearchProd} filterCat={filterCat} setFilterCat={setFilterCat} kategoris={kategoris} isSuperAdmin={isSuperAdmin} setRestockModal={setRestockModal} setRestockQty={setRestockQty} />}
          {page === "laporan" && <Suspense fallback={<div className="flex justify-center py-20"><Spin /></div>}><LaporanPage rptDateStart={rptDateStart} setRptDateStart={setRptDateStart} rptDateEnd={rptDateEnd} setRptDateEnd={setRptDateEnd} rptTrx={rptTrx} rptRev={rptRev} dayData={dayData} catData={catData} topProds={topProds} kategoris={kategoris} products={products} /></Suspense>}
          {page === "supplier" && <SupplierPage suppliers={suppliers} products={products} exportExcel={exportExcel} setSupForm={setSupForm} setSupModal={setSupModal} delSup={delSup} />}
          {page === "excel" && <Suspense fallback={<div className="flex justify-center py-20"><Spin /></div>}><ImportExportPage products={products} transactions={transactions} suppliers={suppliers} sb={sb} showNotif={showNotif} logActivity={logActivity} rptDateStart={rptDateStart} rptDateEnd={rptDateEnd} onReload={loadAll} /></Suspense>}
          {page === "users" && <UsersPage sb={sb} showNotif={showNotif} currentUser={currentUser} logActivity={logActivity} />}
          {page === "masterdata" && <MasterDataPage sb={sb} showNotif={showNotif} kategoris={kategoris} satuans={satuans} onReload={loadAll} logActivity={logActivity} />}
          {page === "restocklog" && <RestockLogPage restockLogs={restockLogs} products={products} />}
          {page === "settings" && <SettingsPage sb={sb} showNotif={showNotif} products={products} transactions={transactions} suppliers={suppliers} kategoris={kategoris} satuans={satuans} onRestore={loadAll} />}
          {page === "auditlog" && <AuditLogPage sb={sb} />}
        </div>
      </div>

      {/* MODALS */}
      <ConfirmModal confirm={confirm} onConfirm={() => { confirmResolve.current?.(true); setConfirm(null); }} onCancel={() => { confirmResolve.current?.(false); setConfirm(null); }} />
      <HistReceiptModal histReceipt={histReceipt} onClose={() => setHistReceipt(null)} currentUser={currentUser} onVoid={(trx) => { setHistReceipt(null); setVoidTarget(trx); }} />
      <VoidModal transaction={voidTarget} currentUser={currentUser} onConfirm={handleVoidConfirm} onClose={() => setVoidTarget(null)} loading={loading} />
      <ReceiptModal receipt={receipt} customerName={customerName} onClose={() => setReceipt(null)} />
      <ProdukModal prodModal={prodModal} prodForm={prodForm} setProdForm={setProdForm} prodImage={prodImage} setProdImage={setProdImage} kategoris={kategoris} satuans={satuans} suppliers={suppliers} saveProd={saveProd} onClose={() => setProdModal(null)} />
      <SupplierModal supModal={supModal} supForm={supForm} setSupForm={setSupForm} saveSup={saveSup} onClose={() => setSupModal(null)} />
      <RestockModal restockModal={restockModal} restockQty={restockQty} setRestockQty={setRestockQty} restockCatatan={restockCatatan} setRestockCatatan={setRestockCatatan} doRestock={doRestock} onClose={() => { setRestockModal(null); setRestockCatatan(""); }} />

      {showLogout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-999" onClick={() => setShowLogout(false)}>
          <div className="bg-white rounded-2xl p-6 w-[340px] text-center shadow-2xl text-gray-900" onClick={(e) => e.stopPropagation()}>
            <div className="text-4xl mb-3">🚪</div>
            <div className="text-[17px] font-extrabold text-bbs-green-dark mb-2">Keluar dari Sistem?</div>
            <div className="text-[13px] text-gray-400 mb-6">Anda akan kembali ke halaman login.<br />Pastikan semua transaksi sudah disimpan.</div>
            <div className="flex gap-2.5">
              <button className="flex-1 py-3 text-sm font-bold bg-[#dc3545] text-white rounded-xl border-none cursor-pointer" onClick={onLogout}>🚪 Ya, Keluar</button>
              <button className="flex-1 py-3 text-sm font-bold bg-[#f0f5f0] text-bbs-green rounded-xl border-none cursor-pointer" onClick={() => setShowLogout(false)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {notif && (
        <div className={`fixed top-3.5 right-3.5 z-9999 px-4 py-3 rounded-xl text-white text-[13px] font-extrabold shadow-xl ${notif.type === "error" ? "bg-[#dc3545]" : "bg-bbs-green"}`}
          style={{ animation: "fadeIn 0.2s ease" }}>
          {notif.msg}
        </div>
      )}
    </div>
  );
}

export default App;
