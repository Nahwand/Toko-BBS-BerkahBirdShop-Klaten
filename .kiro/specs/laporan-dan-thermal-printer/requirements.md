# Requirements Document

## Introduction

Dokumen ini mendefinisikan kebutuhan untuk dua peningkatan fitur pada aplikasi POS BerkahBirdShop (Toko_BBS):

1. **Laporan Range Tanggal Custom** — Saat ini halaman laporan hanya mendukung filter per bulan (pilih bulan + tahun). Fitur ini memungkinkan pengguna memilih rentang tanggal bebas, misalnya 1–15 Januari atau lintas bulan seperti 25 Januari – 5 Februari, sehingga analisis performa keuangan lebih fleksibel.

2. **Cetak Struk ke Printer Thermal Langsung** — Saat ini cetak struk menggunakan dialog print browser standar. Fitur ini mengoptimalkan output cetak untuk printer thermal 58mm/80mm menggunakan CSS `@media print`, menambahkan opsi "Cetak Langsung" yang melewati preview browser, dan memastikan layout struk sesuai lebar kertas thermal yang dipilih.

Stack teknis: React 19 + Vite + Supabase + Tailwind CSS. Halaman laporan: `src/pages/LaporanPage.jsx`. Modal struk: `src/components/modals/ReceiptModal.jsx` dan `HistReceiptModal.jsx`. State management: `AppContext`.

---

## Glossary

- **Toko_BBS**: Sistem POS BerkahBirdShop secara keseluruhan.
- **LaporanPage**: Komponen halaman `src/pages/LaporanPage.jsx` yang menampilkan laporan performa keuangan.
- **ReceiptModal**: Komponen modal `src/components/modals/ReceiptModal.jsx` untuk menampilkan dan mencetak struk transaksi baru.
- **HistReceiptModal**: Komponen modal `src/components/modals/HistReceiptModal.jsx` untuk menampilkan dan mencetak struk dari riwayat transaksi.
- **DateRangeFilter**: Komponen UI pemilih rentang tanggal (tanggal mulai dan tanggal selesai) yang menggantikan filter bulan+tahun di LaporanPage.
- **ThermalPrintStyle**: Stylesheet CSS `@media print` yang dikonfigurasi khusus untuk printer thermal 58mm atau 80mm.
- **CetakLangsung**: Fungsi yang memanggil `window.print()` setelah menginjeksi ThermalPrintStyle tanpa menampilkan preview struk di layar terlebih dahulu.
- **PrintSize**: Pilihan ukuran kertas thermal, bernilai `'58'` (58mm) atau `'80'` (80mm).
- **AppContext**: Context React di `src/context/AppContext.jsx` yang menyediakan state global aplikasi.
- **rptMonth / rptYear**: State di `App.jsx` yang saat ini mengontrol filter bulan dan tahun laporan.
- **rptDateStart / rptDateEnd**: State baru di `App.jsx` yang akan mengontrol filter rentang tanggal laporan.
- **Kasir**: Pengguna dengan role `pegawai`, `admin`, atau `superadmin` yang mengoperasikan POS.
- **Admin**: Pengguna dengan role `admin` atau `superadmin`.

---

## Requirements

### Requirement 1: Filter Rentang Tanggal Custom pada Laporan

**User Story:** Sebagai Admin, saya ingin memfilter laporan berdasarkan rentang tanggal bebas (misalnya 1–15 Januari atau 25 Januari – 5 Februari), sehingga saya dapat menganalisis performa keuangan untuk periode yang tidak terbatas pada satu bulan penuh.

#### Acceptance Criteria

1. THE LaporanPage SHALL menyediakan dua input tanggal: tanggal mulai (rptDateStart) dan tanggal selesai (rptDateEnd) sebagai pengganti selector bulan dan tahun.
2. WHEN Admin mengisi rptDateStart dan rptDateEnd, THE LaporanPage SHALL menampilkan hanya transaksi yang tanggalnya berada dalam rentang `rptDateStart <= tanggal <= rptDateEnd`.
3. WHEN Admin mengisi hanya rptDateStart tanpa rptDateEnd, THE LaporanPage SHALL menampilkan transaksi dari rptDateStart hingga tanggal hari ini.
4. WHEN Admin mengisi hanya rptDateEnd tanpa rptDateStart, THE LaporanPage SHALL menampilkan semua transaksi hingga rptDateEnd.
5. WHEN rptDateStart dan rptDateEnd keduanya kosong, THE LaporanPage SHALL menampilkan transaksi bulan berjalan sebagai default.
6. IF rptDateStart lebih besar dari rptDateEnd, THEN THE LaporanPage SHALL menampilkan pesan validasi "Tanggal mulai tidak boleh lebih besar dari tanggal selesai" dan tidak memperbarui data laporan.
7. THE LaporanPage SHALL menampilkan label periode aktif dalam format "DD MMM YYYY – DD MMM YYYY" (contoh: "1 Jan 2025 – 15 Jan 2025") di bawah judul laporan.
8. WHEN rentang tanggal mencakup lebih dari satu bulan, THE LaporanPage SHALL menampilkan grafik tren harian dengan sumbu X berupa tanggal lengkap (DD/MM) untuk seluruh rentang yang dipilih.
9. THE LaporanPage SHALL menyertakan tombol shortcut "Hari Ini", "7 Hari", dan "Bulan Ini" untuk mengisi rptDateStart dan rptDateEnd secara otomatis.
10. WHEN Admin mengekspor laporan ke Excel atau PDF, THE LaporanPage SHALL menggunakan rentang tanggal aktif (bukan bulan+tahun) sebagai nama file dan label periode dalam dokumen.

---

### Requirement 2: Validasi dan Konsistensi Data Laporan

**User Story:** Sebagai Admin, saya ingin data laporan yang ditampilkan selalu konsisten dengan filter rentang tanggal yang aktif, sehingga ringkasan, grafik, dan tabel top produk semuanya mencerminkan periode yang sama.

#### Acceptance Criteria

1. WHEN rentang tanggal diubah, THE LaporanPage SHALL memperbarui secara bersamaan: total pendapatan, jumlah transaksi, rata-rata per transaksi, grafik tren harian, distribusi kategori, dan top 5 produk terlaris.
2. WHEN filter kategori (filterKat) aktif bersamaan dengan rentang tanggal, THE LaporanPage SHALL menerapkan kedua filter secara kumulatif (AND logic).
3. WHEN tidak ada transaksi dalam rentang tanggal yang dipilih, THE LaporanPage SHALL menampilkan nilai nol pada semua ringkasan dan pesan "Tidak ada data untuk periode ini" pada area grafik.
4. THE LaporanPage SHALL mengecualikan transaksi dengan status `void` dari semua perhitungan laporan.

---

### Requirement 3: Optimasi CSS Thermal Printing untuk Struk

**User Story:** Sebagai Kasir, saya ingin struk yang dicetak menghasilkan output yang tepat sesuai lebar kertas thermal (58mm atau 80mm) tanpa elemen UI aplikasi ikut tercetak, sehingga struk terlihat profesional dan mudah dibaca.

#### Acceptance Criteria

1. THE ThermalPrintStyle SHALL mendefinisikan `@page { size: <PrintSize>mm auto; margin: 2mm; }` sesuai PrintSize yang dipilih.
2. THE ThermalPrintStyle SHALL menyembunyikan semua elemen halaman kecuali elemen dengan id `struk-print` saat `@media print` aktif.
3. THE ThermalPrintStyle SHALL mengatur lebar elemen `#struk-print` menjadi `(PrintSize - 4)mm` agar konten tidak terpotong di tepi kertas.
4. THE ThermalPrintStyle SHALL menggunakan font monospace atau sans-serif berukuran 9–11pt yang terbaca pada resolusi printer thermal (203 dpi).
5. WHEN PrintSize adalah `'58'`, THE ThermalPrintStyle SHALL mengatur lebar konten menjadi 54mm.
6. WHEN PrintSize adalah `'80'`, THE ThermalPrintStyle SHALL mengatur lebar konten menjadi 76mm.
7. THE ReceiptModal SHALL mempertahankan pilihan PrintSize terakhir yang digunakan oleh Kasir selama sesi browser aktif menggunakan `localStorage`.
8. THE HistReceiptModal SHALL mempertahankan pilihan PrintSize terakhir yang digunakan oleh Kasir selama sesi browser aktif menggunakan `localStorage`.

---

### Requirement 4: Fitur Cetak Langsung (Bypass Preview Browser)

**User Story:** Sebagai Kasir, saya ingin mencetak struk langsung ke printer thermal tanpa melalui dialog preview browser, sehingga proses checkout lebih cepat dan efisien.

#### Acceptance Criteria

1. THE ReceiptModal SHALL menyediakan tombol "Cetak Langsung" di samping tombol "Cetak" yang sudah ada.
2. WHEN Kasir menekan tombol "Cetak Langsung", THE ReceiptModal SHALL menginjeksi ThermalPrintStyle ke `document.head`, memanggil `window.print()`, lalu menghapus style tersebut setelah 1500ms.
3. THE HistReceiptModal SHALL menyediakan tombol "Cetak Langsung" dengan perilaku yang identik dengan ReceiptModal.
4. WHEN `window.print()` dipanggil melalui CetakLangsung, THE Toko_BBS SHALL tidak menampilkan preview struk di dalam modal sebelum mencetak.
5. IF browser tidak mendukung `window.print()`, THEN THE ReceiptModal SHALL menampilkan pesan "Fitur cetak tidak didukung oleh browser ini" dan menonaktifkan tombol "Cetak Langsung".
6. THE ReceiptModal SHALL menutup modal secara otomatis 2 detik setelah CetakLangsung berhasil dipanggil, kecuali Kasir membatalkan penutupan otomatis.
7. THE HistReceiptModal SHALL TIDAK menutup modal secara otomatis setelah CetakLangsung, karena modal riwayat digunakan untuk referensi.

---

### Requirement 5: Persistensi Preferensi Ukuran Kertas

**User Story:** Sebagai Kasir, saya ingin ukuran kertas thermal yang saya pilih tersimpan otomatis, sehingga saya tidak perlu memilih ulang setiap kali membuka struk baru.

#### Acceptance Criteria

1. THE ReceiptModal SHALL membaca nilai PrintSize awal dari `localStorage` dengan key `bbs_print_size`, dengan nilai default `'80'` jika key tidak ditemukan.
2. WHEN Kasir mengubah PrintSize, THE ReceiptModal SHALL menyimpan nilai baru ke `localStorage` dengan key `bbs_print_size`.
3. THE HistReceiptModal SHALL membaca dan menyimpan PrintSize menggunakan key `localStorage` yang sama (`bbs_print_size`) agar preferensi konsisten di seluruh modal.
4. THE Toko_BBS SHALL hanya menerima nilai `'58'` atau `'80'` sebagai PrintSize yang valid; nilai lain SHALL diabaikan dan diganti dengan default `'80'`.
