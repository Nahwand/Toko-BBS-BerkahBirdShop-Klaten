# 🛒 Sistem Kasir & Manajemen Stok - Berkah Bird Shop (Toko BBS)

Aplikasi web Sistem Kasir (*Point of Sale*) dan Manajemen Inventaris interaktif yang dirancang khusus untuk **Berkah Bird Shop**. Sistem ini mempermudah pemilik toko dalam mempercepat transaksi kasir, mengontrol ketersediaan stok, mengelola daftar barang, serta melacak riwayat operasional harian secara presisi.

## ✨ Fitur Utama
- **Dashboard Analitik:** Ringkasan pendapatan, info total produk, dan pemantauan otomatis (*Real-time*) untuk peringatan **Stok Habis** maupun **Stok Menipis**.
- **Kasir (POS):** Antarmuka transaksi kasir kilat dengan fitur pencarian cerdas, kalkulator kembalian otomatis, dan struk digital.
- **Manajemen Inventaris:** Pusat kontrol untuk menambah, mengedit, dan menghapus detail produk beserta harga jual dan beli.
- **Master Data:** Pencatatan rapi untuk *Supplier*, *Kategori*, *Satuan Produk*, dan *Manajemen Pengguna (Akun Kasir/Admin)*.
- **Auto-Purge Aktvitas:** Log aktivitas pengguna pintar yang otomatis menghapus riwayat log lebih tua dari 31 hari tanpa memperlambat aplikasi.

## 📸 Tampilan Aplikasi
![Tampilan Dashboard](public/screenshot-dashboard.png)
> *(Catatan: Simpan foto *screenshot* tampilan aplikasi Anda di dalam folder `public` dan beri nama `screenshot-dashboard.png` agar muncul di halaman ini).*

## 🛠️ Teknologi Pembuatan
- **Frontend:** React.js + Vite (Cepat & Ringan)
- **Desain:** CSS Modular Murni
- **Backend/Database:** Supabase (Cloud PostgreSQL)

## 👨‍💻 Dibuat Oleh
Sistem ini diprogram secara mandiri dan dikembangkan oleh:
**Naha Nidz**

---
## 🚀 Cara Menjalankan Proyek Secara Lokal

Pastikan Anda sudah memiliki [Node.js](https://nodejs.org/) yang terinstal di komputer.
Jalankan perintah berikut di *Terminal* (*Command Prompt*):

1. **Instal seluruh modul (*dependencies*):**
   ```bash
   npm install
   ```
2. **Jalankan server pengembangan lokal:**
   ```bash
   npm run dev
   ```
3. Buka link yang muncul di terminal (contoh: `http://localhost:5173`) menggunakan *browser* Anda!
