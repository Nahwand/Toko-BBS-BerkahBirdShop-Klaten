# Implementation Plan: Laporan Range Tanggal Custom & Thermal Printing

## Overview

Implementasi dua peningkatan fitur pada POS BerkahBirdShop:
1. Mengganti filter bulan+tahun di `LaporanPage` dengan filter rentang tanggal bebas.
2. Mengoptimalkan cetak struk untuk printer thermal 58mm/80mm dengan fitur "Cetak Langsung".

Semua perubahan bersifat frontend-only (React + Tailwind). Tidak ada perubahan skema database.

---

## Tasks

- [x] 1. Ekstrak fungsi utilitas murni ke `src/utils/reportUtils.js`
  - Buat file baru `src/utils/reportUtils.js`
  - Implementasi `filterByDateRange(transactions, start, end)` — filter inklusif, exclude void
  - Implementasi `validateDateRange(start, end)` — kembalikan `{ isValid, error }`
  - Implementasi `formatPeriodLabel(start, end)` — format "D MMM YYYY – D MMM YYYY" locale id-ID
  - Implementasi `buildDayData(rptTrx, start, end)` — array `{ dateStr: 'DD/MM', rev }` per hari
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.4_

- [ ]* 1.1 Write property test: filter rentang tanggal inklusif
  - **Property 1: Filter Rentang Tanggal Inklusif**
  - **Validates: Requirements 1.2, 1.3, 1.4**
  - Gunakan `fast-check` dengan arbitrari transaksi dan rentang tanggal valid

- [ ]* 1.2 Write property test: transaksi void selalu dikecualikan
  - **Property 2: Transaksi Void Selalu Dikecualikan**
  - **Validates: Requirements 2.4**

- [ ]* 1.3 Write property test: konsistensi kalkulasi laporan
  - **Property 3: Konsistensi Kalkulasi Laporan**
  - **Validates: Requirements 2.1**
  - Verifikasi `rptRev === sum(rptTrx.total)` dan `dayData.length === daysBetween(start, end)`

- [ ]* 1.4 Write property test: validasi start > end
  - **Property 8: Validasi Tanggal — Start > End Tidak Memperbarui Data**
  - **Validates: Requirements 1.6**

- [ ]* 1.5 Write property test: format label periode
  - **Property 9: Format Label Periode**
  - **Validates: Requirements 1.7**

- [x] 2. Tambah `buildPrintStyle(printSize)` ke `src/utils/constants.js`
  - Export fungsi `buildPrintStyle(printSize)` yang menghasilkan string CSS `@media print`
  - Untuk `'58'`: `@page { size: 58mm auto; margin: 2mm; }`, `#struk-print { width: 54mm }`
  - Untuk `'80'`: `@page { size: 80mm auto; margin: 2mm; }`, `#struk-print { width: 76mm }`
  - Sembunyikan semua elemen kecuali `#struk-print` saat print
  - Font monospace/sans-serif 10pt
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ]* 2.1 Write property test: lebar konten thermal sesuai PrintSize
  - **Property 5: Lebar Konten Thermal Sesuai PrintSize**
  - **Validates: Requirements 3.3, 3.5, 3.6**
  - Verifikasi `buildPrintStyle('58')` mengandung `54mm` dan `buildPrintStyle('80')` mengandung `76mm`

- [x] 3. Buat custom hook `src/hooks/usePrintSize.js`
  - Buat direktori `src/hooks/` jika belum ada
  - Implementasi `usePrintSize()` — baca/tulis `localStorage['bbs_print_size']`
  - Validasi: hanya terima `'58'` atau `'80'`, selain itu fallback ke `'80'`
  - Kembalikan `[printSize, setPrintSize]`
  - _Requirements: 3.7, 3.8, 5.1, 5.2, 5.3, 5.4_

- [ ]* 3.1 Write property test: persistensi PrintSize round-trip
  - **Property 6: Persistensi PrintSize Round-Trip**
  - **Validates: Requirements 3.7, 3.8, 5.1, 5.2, 5.3**

- [ ]* 3.2 Write property test: nilai tidak valid fallback ke default
  - **Property 7: Validasi PrintSize — Nilai Tidak Valid Diganti Default**
  - **Validates: Requirements 5.4**

- [x] 4. Checkpoint — Pastikan semua unit dan property test utilitas lulus
  - Pastikan semua tests lulus, tanyakan ke user jika ada pertanyaan.

- [x] 5. Update state dan kalkulasi laporan di `src/App.jsx`
  - Ganti `rptMonth` + `rptYear` state dengan `rptDateStart` + `rptDateEnd`
  - Default `rptDateStart`: awal bulan berjalan (`YYYY-MM-01`)
  - Default `rptDateEnd`: hari ini (`YYYY-MM-DD`)
  - Ganti kalkulasi `rptTrx` menggunakan `filterByDateRange` dari `reportUtils.js`
  - Ganti kalkulasi `dayData` menggunakan `buildDayData` dari `reportUtils.js`
  - Update props yang diteruskan ke `<LaporanPage>`: hapus `rptMonth/rptYear`, tambah `rptDateStart/rptDateEnd` beserta setter-nya
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 2.1, 2.4_

- [x] 6. Refactor `src/pages/LaporanPage.jsx` — ganti filter bulan+tahun dengan DateRangeFilter
  - Hapus props `rptMonth`, `setRptMonth`, `rptYear`, `setRptYear`
  - Tambah props `rptDateStart`, `setRptDateStart`, `rptDateEnd`, `setRptDateEnd`
  - Tambah state lokal `rptDateError` untuk pesan validasi
  - Ganti selector bulan+tahun dengan dua `<input type="date">` (tanggal mulai & selesai)
  - Tambah tombol shortcut: "Hari Ini", "7 Hari", "Bulan Ini" — isi `rptDateStart`/`rptDateEnd` otomatis
  - Panggil `validateDateRange` sebelum update state; tampilkan `rptDateError` jika tidak valid
  - Tampilkan label periode aktif menggunakan `formatPeriodLabel` di bawah judul laporan
  - Update sumbu X grafik tren harian: gunakan `dateStr` (DD/MM) dari `dayData` baru
  - _Requirements: 1.1, 1.6, 1.7, 1.8, 1.9, 2.1, 2.2, 2.3_

- [ ]* 6.1 Write property test: filter kumulatif tanggal + kategori
  - **Property 4: Filter Kumulatif Tanggal + Kategori**
  - **Validates: Requirements 2.2**

- [x] 7. Update export Excel dan PDF di `LaporanPage` untuk menggunakan rentang tanggal aktif
  - Ganti nama file Excel dari `BBS_Laporan_<bulan>_<tahun>.xlsx` menjadi `BBS_Laporan_<start>_sd_<end>.xlsx`
  - Ganti nama file PDF dari `Laporan_BBS_<bulan>_<tahun>.pdf` menjadi `BBS_Laporan_<start>_sd_<end>.pdf`
  - Update label periode dalam dokumen PDF menggunakan `formatPeriodLabel`
  - _Requirements: 1.10_

- [x] 8. Checkpoint — Verifikasi fitur laporan rentang tanggal berfungsi end-to-end
  - Pastikan semua tests lulus, tanyakan ke user jika ada pertanyaan.

- [x] 9. Update `src/components/modals/ReceiptModal.jsx` — thermal printing
  - Ganti `useState('80')` dengan `usePrintSize()` hook
  - Ganti `handlePrint` agar menggunakan `buildPrintStyle` dari `constants.js`
  - Tambah tombol "⚡ Cetak Langsung" di samping tombol "🖨️ Cetak"
  - Implementasi `handleDirectPrint`:
    - Cek `typeof window.print !== 'function'` → tampilkan pesan error, disable tombol
    - Inject style via `buildPrintStyle(printSize)` ke `document.head`
    - Panggil `window.print()`
    - Hapus style setelah 1500ms
    - Auto-close modal setelah 2000ms (kecuali user membatalkan)
  - _Requirements: 3.1–3.7, 4.1, 4.2, 4.4, 4.5, 4.6, 5.1, 5.2_

- [ ]* 9.1 Write unit test: tombol "Cetak Langsung" ada di ReceiptModal
  - Render `ReceiptModal`, verifikasi tombol "Cetak Langsung" ada di DOM
  - _Requirements: 4.1_

- [ ]* 9.2 Write unit test: sequence Cetak Langsung di ReceiptModal
  - Mock `window.print`, klik tombol, verifikasi inject style → print → hapus style
  - Gunakan `vi.useFakeTimers()` untuk verifikasi auto-close 2000ms
  - _Requirements: 4.2, 4.6_

- [ ]* 9.3 Write unit test: window.print tidak tersedia di ReceiptModal
  - Set `window.print = undefined`, verifikasi pesan error dan tombol disabled
  - _Requirements: 4.5_

- [x] 10. Update `src/components/modals/HistReceiptModal.jsx` — thermal printing
  - Ganti `useState('80')` dengan `usePrintSize()` hook
  - Ganti `handlePrint` agar menggunakan `buildPrintStyle` dari `constants.js`
  - Tambah tombol "⚡ Cetak Langsung" dengan perilaku identik `ReceiptModal`
  - `handleDirectPrint` di `HistReceiptModal` **tidak** auto-close modal setelah cetak
  - _Requirements: 3.8, 4.3, 4.4, 4.5, 4.7, 5.3_

- [ ]* 10.1 Write unit test: tombol "Cetak Langsung" ada di HistReceiptModal
  - Render `HistReceiptModal`, verifikasi tombol "Cetak Langsung" ada di DOM
  - _Requirements: 4.3_

- [ ]* 10.2 Write unit test: HistReceiptModal tidak auto-close setelah Cetak Langsung
  - Fake timers, klik Cetak Langsung, advance 2000ms, verifikasi `onClose` tidak dipanggil
  - _Requirements: 4.7_

- [x] 11. Verifikasi konsistensi `localStorage` key `bbs_print_size` antar modal
  - Pastikan `ReceiptModal` dan `HistReceiptModal` keduanya menggunakan `usePrintSize()` yang sama
  - Pastikan perubahan PrintSize di satu modal langsung tercermin di modal lain (shared localStorage)
  - _Requirements: 5.3_

- [ ] 12. Final checkpoint — Pastikan semua tests lulus dan fitur terintegrasi
  - Pastikan semua tests lulus, tanyakan ke user jika ada pertanyaan.

---

## Notes

- Tasks bertanda `*` bersifat opsional dan dapat dilewati untuk MVP lebih cepat
- Fungsi murni di `reportUtils.js` dan `buildPrintStyle` harus diekstrak agar mudah diuji secara terisolasi
- Property tests menggunakan `fast-check`; unit tests menggunakan `Vitest` + `@testing-library/react`
- Tidak ada perubahan skema database — semua perubahan frontend-only
