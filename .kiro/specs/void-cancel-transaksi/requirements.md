# Requirements Document

## Introduction

Fitur **Void/Cancel Transaksi** memungkinkan kasir atau admin untuk membatalkan transaksi yang sudah tercatat di sistem POS BerkahBirdShop. Pembatalan diperlukan ketika terjadi kesalahan input, misalnya salah produk, salah jumlah, atau transaksi duplikat. Saat void dilakukan, stok produk yang terlibat dikembalikan secara otomatis, alasan void wajib dicatat, dan seluruh riwayat transaksi tetap tersimpan di database untuk keperluan audit. Akses void dibatasi berdasarkan role pengguna.

---

## Glossary

- **Void_System**: Subsistem yang menangani proses pembatalan transaksi di aplikasi POS Toko_BBS.
- **Transaksi**: Record penjualan yang tersimpan di tabel `transactions` beserta item-itemnya di `transaction_items`.
- **Status_Void**: Kolom `status` pada tabel `transactions` yang bernilai `'aktif'` (default) atau `'void'`.
- **Alasan_Void**: Teks wajib yang menjelaskan mengapa transaksi dibatalkan, disimpan di kolom `void_reason`.
- **Kasir**: Pengguna dengan role `pegawai` yang bertugas melayani transaksi di POS.
- **Admin**: Pengguna dengan role `admin` yang memiliki akses lebih luas dari kasir.
- **Superadmin**: Pengguna dengan role `superadmin` yang memiliki akses penuh ke seluruh sistem.
- **Activity_Log**: Tabel `activity_logs` yang mencatat semua aktivitas penting di sistem.
- **Stok_Produk**: Kolom `stock` pada tabel `products` yang merepresentasikan jumlah stok tersedia.
- **Batas_Waktu_Void**: Batas waktu maksimal setelah transaksi dibuat di mana void masih diizinkan.

---

## Requirements

### Requirement 1: Hak Akses Void Berdasarkan Role

**User Story:** Sebagai superadmin, saya ingin mengatur siapa saja yang boleh melakukan void transaksi, agar pembatalan transaksi hanya dilakukan oleh pihak yang berwenang.

#### Acceptance Criteria

1. THE Void_System SHALL mengizinkan pengguna dengan role `superadmin` untuk melakukan void pada transaksi mana pun tanpa batasan waktu.
2. THE Void_System SHALL mengizinkan pengguna dengan role `admin` untuk melakukan void pada transaksi mana pun tanpa batasan waktu.
3. WHEN pengguna dengan role `pegawai` mencoba melakukan void transaksi, THE Void_System SHALL menampilkan pesan error "Anda tidak memiliki izin untuk membatalkan transaksi."
4. IF pengguna yang tidak terautentikasi mencoba mengakses fungsi void, THEN THE Void_System SHALL menolak permintaan dan mengarahkan ke halaman login.

---

### Requirement 2: Batasan Transaksi yang Dapat Di-void

**User Story:** Sebagai admin, saya ingin ada aturan transaksi mana yang bisa di-void, agar tidak semua transaksi lama bisa dibatalkan sembarangan.

#### Acceptance Criteria

1. WHEN pengguna dengan role `admin` atau `superadmin` memilih transaksi untuk di-void, THE Void_System SHALL menampilkan tombol "Void Transaksi" hanya pada transaksi dengan `status = 'aktif'`.
2. IF transaksi sudah memiliki `status = 'void'`, THEN THE Void_System SHALL menampilkan label "VOID" dan menonaktifkan tombol void.
3. THE Void_System SHALL mengizinkan void pada transaksi yang dibuat pada hari yang sama (H+0) oleh pengguna dengan role `admin`.
4. THE Void_System SHALL mengizinkan void pada transaksi dari tanggal mana pun oleh pengguna dengan role `superadmin`.
5. IF pengguna dengan role `admin` mencoba void transaksi yang dibuat sebelum hari ini, THEN THE Void_System SHALL menampilkan pesan error "Hanya transaksi hari ini yang dapat dibatalkan oleh Admin."

---

### Requirement 3: Proses Konfirmasi Void

**User Story:** Sebagai admin, saya ingin ada konfirmasi sebelum void dieksekusi, agar tidak terjadi pembatalan transaksi yang tidak disengaja.

#### Acceptance Criteria

1. WHEN pengguna mengklik tombol "Void Transaksi", THE Void_System SHALL menampilkan modal konfirmasi yang memuat kode transaksi, tanggal, nama pelanggan, total transaksi, dan daftar item.
2. THE Void_System SHALL menyediakan field input teks wajib untuk Alasan_Void di dalam modal konfirmasi.
3. IF pengguna mengklik tombol konfirmasi void dengan field Alasan_Void kosong, THEN THE Void_System SHALL menampilkan pesan validasi "Alasan void wajib diisi."
4. THE Void_System SHALL menyediakan tombol "Batal" di modal konfirmasi yang menutup modal tanpa melakukan perubahan apa pun.
5. WHEN pengguna mengklik konfirmasi void dengan Alasan_Void terisi, THE Void_System SHALL memproses void dan menutup modal.

---

### Requirement 4: Eksekusi Void dan Pembaruan Status Transaksi

**User Story:** Sebagai admin, saya ingin status transaksi yang di-void berubah secara permanen di database, agar riwayat audit tetap terjaga.

#### Acceptance Criteria

1. WHEN void dikonfirmasi, THE Void_System SHALL mengubah kolom `status` pada record `transactions` menjadi `'void'`.
2. WHEN void dikonfirmasi, THE Void_System SHALL menyimpan Alasan_Void ke kolom `void_reason` pada record `transactions`.
3. WHEN void dikonfirmasi, THE Void_System SHALL menyimpan nama pengguna yang melakukan void ke kolom `voided_by` pada record `transactions`.
4. WHEN void dikonfirmasi, THE Void_System SHALL menyimpan timestamp saat void dilakukan ke kolom `voided_at` pada record `transactions`.
5. THE Void_System SHALL mempertahankan semua data transaksi yang di-void (tidak menghapus record dari database).
6. IF terjadi kegagalan saat menyimpan perubahan status ke database, THEN THE Void_System SHALL menampilkan pesan error "Gagal membatalkan transaksi. Silakan coba lagi." dan tidak mengubah stok produk.

---

### Requirement 5: Pengembalian Stok Otomatis

**User Story:** Sebagai admin, saya ingin stok produk dikembalikan secara otomatis saat transaksi di-void, agar data stok selalu akurat.

#### Acceptance Criteria

1. WHEN void berhasil disimpan ke database, THE Void_System SHALL menambahkan kembali jumlah stok setiap produk dalam transaksi sesuai dengan `qty` pada `transaction_items`.
2. WHEN stok dikembalikan, THE Void_System SHALL memperbarui kolom `stock` pada tabel `products` untuk setiap produk yang terlibat dalam transaksi.
3. IF `product_id` pada `transaction_items` bernilai NULL (produk sudah dihapus), THEN THE Void_System SHALL melewati pengembalian stok untuk item tersebut dan tetap melanjutkan proses void.
4. THE Void_System SHALL memproses pengembalian stok seluruh item dalam satu transaksi secara atomik, sehingga jika salah satu item gagal diperbarui, seluruh proses void dibatalkan.
5. WHEN seluruh stok berhasil dikembalikan, THE Void_System SHALL memuat ulang data produk di aplikasi untuk mencerminkan stok terbaru.

---

### Requirement 6: Pencatatan Activity Log

**User Story:** Sebagai superadmin, saya ingin setiap aksi void tercatat di activity log, agar ada jejak audit yang lengkap untuk setiap pembatalan transaksi.

#### Acceptance Criteria

1. WHEN void berhasil dieksekusi, THE Void_System SHALL menyimpan satu record ke tabel `activity_logs` dengan `aksi = 'Void Transaksi'` dan `kategori = 'Kasir'`.
2. THE Void_System SHALL menyertakan detail log yang memuat kode transaksi, nama pelanggan, total transaksi, dan Alasan_Void dalam kolom `detail` pada `activity_logs`.
3. THE Void_System SHALL menyertakan nama dan role pengguna yang melakukan void dalam kolom `user_nama` dan `user_role` pada `activity_logs`.
4. IF pencatatan activity log gagal, THEN THE Void_System SHALL tetap menyelesaikan proses void dan menampilkan notifikasi sukses, serta mencatat error ke console.

---

### Requirement 7: Tampilan Status Void di Riwayat Transaksi

**User Story:** Sebagai admin, saya ingin transaksi yang sudah di-void terlihat jelas berbeda di halaman riwayat, agar mudah diidentifikasi saat menelusuri data.

#### Acceptance Criteria

1. WHEN halaman Riwayat Transaksi dimuat, THE Void_System SHALL menampilkan badge/label "VOID" berwarna merah pada setiap transaksi dengan `status = 'void'`.
2. WHEN pengguna membuka detail transaksi yang berstatus void, THE Void_System SHALL menampilkan informasi Alasan_Void, nama pengguna yang melakukan void (`voided_by`), dan waktu void (`voided_at`).
3. THE Void_System SHALL menampilkan transaksi void dengan tampilan visual yang berbeda (misalnya teks dicoret atau baris berwarna abu-abu) untuk membedakannya dari transaksi aktif.
4. WHEN pengguna menggunakan filter di halaman Riwayat Transaksi, THE Void_System SHALL menyertakan opsi filter "Tampilkan Void" untuk memfilter transaksi berdasarkan status.
5. THE Void_System SHALL mengecualikan transaksi dengan `status = 'void'` dari perhitungan total pendapatan di halaman Laporan dan Dashboard.

---

### Requirement 8: Notifikasi Hasil Void

**User Story:** Sebagai kasir, saya ingin mendapat notifikasi yang jelas setelah proses void selesai, agar saya tahu apakah pembatalan berhasil atau gagal.

#### Acceptance Criteria

1. WHEN proses void berhasil sepenuhnya, THE Void_System SHALL menampilkan notifikasi sukses "Transaksi [kode_transaksi] berhasil dibatalkan."
2. IF proses void gagal pada tahap mana pun, THEN THE Void_System SHALL menampilkan notifikasi error dengan pesan yang spesifik menjelaskan penyebab kegagalan.
3. WHILE proses void sedang berjalan, THE Void_System SHALL menampilkan indikator loading dan menonaktifkan tombol konfirmasi untuk mencegah double-submit.
