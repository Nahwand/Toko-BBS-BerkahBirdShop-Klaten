# Implementation Plan: Void/Cancel Transaksi

## Overview

Implementasi fitur void transaksi di atas arsitektur yang sudah ada: migrasi database, fungsi `voidTransaction` di AppContext, helper `canVoid` + `validateVoidReason` di constants, komponen `VoidModal`, dan perubahan tampilan di `HistReceiptModal`, `RiwayatPage`, `App.jsx`, serta kalkulasi dashboard.

## Tasks

- [x] 1. Migrasi database — tambah kolom void ke tabel `transactions`
  - Tambahkan SQL berikut ke `database_setup.sql` (bagian PATCH):
    ```sql
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'aktif';
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS void_reason TEXT DEFAULT NULL;
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS voided_by TEXT DEFAULT NULL;
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ DEFAULT NULL;
    CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
    ```
  - Jalankan SQL tersebut di Supabase SQL Editor
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 2. Tambah helper `canVoid` dan `validateVoidReason` ke `src/utils/constants.js`
  - [x] 2.1 Implementasi fungsi `canVoid(currentUser, transaction)`
    - Export fungsi `canVoid` yang menerima `currentUser` dan `transaction`
    - Return `false` jika `currentUser` null/undefined
    - Return `false` jika `transaction.status === 'void'`
    - Return `true` jika `currentUser.role === 'superadmin'`
    - Return `true` jika `currentUser.role === 'admin'` DAN `transaction.date === TODAY`
    - Return `false` untuk semua role lain (termasuk `pegawai`)
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 2.2 Tulis property test untuk `canVoid` — Property 1: superadmin selalu bisa void transaksi aktif
    - **Property 1: superadmin selalu bisa void transaksi aktif**
    - **Validates: Requirements 1.1, 2.4**
    - Tag komentar: `// Feature: void-cancel-transaksi, Property 1`

  - [ ]* 2.3 Tulis property test untuk `canVoid` — Property 2: admin hanya bisa void transaksi hari ini
    - **Property 2: admin hanya bisa void transaksi hari ini**
    - **Validates: Requirements 1.2, 2.3, 2.5**
    - Tag komentar: `// Feature: void-cancel-transaksi, Property 2`

  - [ ]* 2.4 Tulis property test untuk `canVoid` — Property 3: pegawai tidak pernah bisa void
    - **Property 3: pegawai tidak pernah bisa void**
    - **Validates: Requirements 1.3**
    - Tag komentar: `// Feature: void-cancel-transaksi, Property 3`

  - [ ]* 2.5 Tulis property test untuk `canVoid` — Property 4: transaksi void tidak bisa di-void ulang
    - **Property 4: transaksi void tidak bisa di-void ulang**
    - **Validates: Requirements 2.1, 2.2**
    - Tag komentar: `// Feature: void-cancel-transaksi, Property 4`

  - [x] 2.6 Implementasi fungsi `validateVoidReason(input)`
    - Export fungsi `validateVoidReason` yang menerima string
    - Return `false` jika input kosong atau hanya whitespace (`input.trim() === ''`)
    - Return `true` jika input mengandung karakter non-whitespace
    - _Requirements: 3.3_

  - [ ]* 2.7 Tulis property test untuk `validateVoidReason` — Property 5: menolak input kosong/whitespace
    - **Property 5: validasi alasan menolak input kosong/whitespace**
    - **Validates: Requirements 3.3**
    - Tag komentar: `// Feature: void-cancel-transaksi, Property 5`

- [x] 3. Checkpoint — Pastikan semua tests helper lulus
  - Pastikan semua tests lulus, tanya user jika ada pertanyaan.

- [x] 4. Tambah fungsi `voidTransaction` ke `src/context/AppContext.jsx`
  - [x] 4.1 Implementasi fungsi `voidTransaction(trxId, alasan)`
    - Import `canVoid` dan `validateVoidReason` dari `constants.js`
    - Validasi role dengan `canVoid`; throw error jika tidak diizinkan
    - Validasi alasan dengan `validateVoidReason`; throw error jika kosong
    - `UPDATE transactions SET status='void', void_reason, voided_by, voided_at WHERE id=trxId`
    - Jika UPDATE gagal, throw error dan hentikan proses (stok tidak diubah)
    - Untuk setiap item di `transaction_items` dengan `product_id IS NOT NULL`: `UPDATE products SET stock = stock + qty`
    - `INSERT activity_logs` dengan `aksi='Void Transaksi'`, `kategori='Kasir'`; jika gagal, log ke console dan lanjutkan
    - Panggil `loadAll()` untuk refresh state
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4_

  - [x] 4.2 Expose `voidTransaction` melalui `AppContext.Provider` value
    - Tambahkan `voidTransaction` ke objek value di `<AppContext.Provider>`
    - _Requirements: 4.1_

  - [x] 4.3 Perbarui kalkulasi `todayTrx`, `todayRev`, `weekTrx`, `weekRev` agar mengecualikan transaksi void
    - Filter `t.status !== 'void'` pada `todayTrx` dan `weekTrx`
    - _Requirements: 7.5_

  - [ ]* 4.4 Tulis property test untuk kalkulasi pendapatan — Property 8: total pendapatan mengecualikan transaksi void
    - **Property 8: total pendapatan mengecualikan transaksi void**
    - **Validates: Requirements 7.5**
    - Tag komentar: `// Feature: void-cancel-transaksi, Property 8`

- [x] 5. Buat komponen `src/components/modals/VoidModal.jsx`
  - [x] 5.1 Implementasi komponen `VoidModal`
    - Props: `transaction`, `currentUser`, `onConfirm`, `onClose`, `loading`
    - State internal: `alasan` (string), `error` (string)
    - Tampilkan detail transaksi: kode, tanggal, pelanggan, total, daftar item
    - Textarea wajib untuk alasan void
    - Validasi `validateVoidReason` sebelum submit; tampilkan error inline jika kosong
    - Tombol "Konfirmasi Void" — disabled saat `loading === true`
    - Tombol "Batal" — menutup modal tanpa perubahan
    - Warning merah: "Tindakan ini tidak dapat dibatalkan. Stok akan dikembalikan."
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 8.3_

  - [ ]* 5.2 Tulis unit test snapshot untuk `VoidModal`
    - Test render dengan data transaksi valid
    - Test tombol "Batal" menutup modal tanpa submit
    - Test validasi alasan kosong menampilkan error
    - Test tombol konfirmasi disabled saat `loading=true`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 8.3_

- [x] 6. Modifikasi `src/components/modals/HistReceiptModal.jsx`
  - [x] 6.1 Tambah tombol "🚫 Void Transaksi" yang kondisional
    - Import `canVoid` dari `constants.js`
    - Terima prop tambahan: `currentUser`, `onVoid`
    - Tampilkan tombol "🚫 Void Transaksi" hanya jika `canVoid(currentUser, histReceipt)` return `true`
    - Klik tombol memanggil `onVoid(histReceipt)`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 6.2 Tampilkan section info void untuk transaksi yang sudah void
    - Jika `histReceipt.status === 'void'`, tampilkan section dengan:
      - Label "VOID" berwarna merah
      - Alasan void (`void_reason`)
      - Nama yang melakukan void (`voided_by`)
      - Waktu void (`voided_at`) dalam format lokal Indonesia
    - _Requirements: 7.2_

  - [ ]* 6.3 Tulis unit test untuk `HistReceiptModal`
    - Test tombol void tidak muncul untuk role `pegawai`
    - Test tombol void tidak muncul untuk transaksi yang sudah void
    - Test section info void muncul untuk transaksi void
    - _Requirements: 2.1, 2.2, 7.2_

- [x] 7. Modifikasi `src/pages/RiwayatPage.jsx`
  - [x] 7.1 Tambah kolom "Status" dengan badge di tabel transaksi
    - Tambah header kolom "Status" di `<thead>`
    - Untuk transaksi `status === 'void'`: tampilkan badge merah "VOID", baris dengan `opacity-50`, kode transaksi dengan `line-through`
    - Untuk transaksi `status === 'aktif'` atau tanpa status: tampilkan normal (tanpa badge)
    - _Requirements: 7.1, 7.3_

  - [x] 7.2 Tambah filter status (Semua | Aktif | Void)
    - Terima prop `filterStatus` dan `setFilterStatus` dari `App.jsx`
    - Tambah dropdown atau toggle dengan opsi: "Semua", "Aktif", "Void"
    - _Requirements: 7.4_

  - [x] 7.3 Perbarui kalkulasi total di footer agar hanya menjumlahkan transaksi aktif
    - Ganti `filtHist.reduce(...)` di footer menjadi `filtHist.filter(t => t.status !== 'void').reduce(...)`
    - _Requirements: 7.5_

  - [ ]* 7.4 Tulis property test untuk render badge — Property 9: badge VOID muncul untuk semua transaksi void
    - **Property 9: render badge VOID untuk semua transaksi void**
    - **Validates: Requirements 7.1**
    - Tag komentar: `// Feature: void-cancel-transaksi, Property 9`

- [x] 8. Modifikasi `src/App.jsx` — wiring VoidModal
  - [x] 8.1 Import `VoidModal` dan tambah state `voidTarget`
    - `import VoidModal from './components/modals/VoidModal'`
    - Tambah state: `const [voidTarget, setVoidTarget] = useState(null)`
    - _Requirements: 3.1_

  - [x] 8.2 Tambah handler `handleVoidConfirm` dan render `<VoidModal>`
    - Destructure `voidTransaction` dari `useApp()`
    - Handler `handleVoidConfirm(alasan)`: panggil `voidTransaction(voidTarget.id, alasan)`, tampilkan notif sukses `"Transaksi ${voidTarget.trx_code} berhasil dibatalkan."`, tutup modal
    - Tangkap error dan tampilkan notif error dengan pesan spesifik
    - Render `<VoidModal transaction={voidTarget} currentUser={currentUser} onConfirm={handleVoidConfirm} onClose={() => setVoidTarget(null)} loading={loading} />`
    - _Requirements: 3.5, 8.1, 8.2, 8.3_

  - [x] 8.3 Pass prop `currentUser` dan `onVoid` ke `HistReceiptModal`
    - Tambah `currentUser={currentUser}` dan `onVoid={(trx) => { setHistReceipt(null); setVoidTarget(trx); }}` ke `<HistReceiptModal>`
    - _Requirements: 2.1, 3.1_

  - [x] 8.4 Pass prop `filterStatus` dan `setFilterStatus` ke `RiwayatPage`
    - Tambah state `const [filterStatus, setFilterStatus] = useState('Semua')`
    - Pass ke `<RiwayatPage>` dan perbarui `filtHist` di `App.jsx` untuk memfilter berdasarkan status
    - _Requirements: 7.4_

- [x] 9. Final checkpoint — Pastikan semua tests lulus dan fitur terintegrasi
  - Pastikan semua tests lulus, tanya user jika ada pertanyaan.

## Notes

- Tasks bertanda `*` bersifat opsional dan bisa dilewati untuk MVP lebih cepat
- Setiap task mereferensikan requirements spesifik untuk traceability
- Property tests menggunakan library `fast-check` dengan minimum 100 iterasi
- Void bukan delete — record transaksi tetap ada, hanya status yang berubah
- Atomicity: jika UPDATE status transaksi gagal, stok tidak diubah
