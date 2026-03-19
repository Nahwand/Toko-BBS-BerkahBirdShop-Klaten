-- ============================================================
--  BBS BerkahBirdShop - Database Setup (Gabungan Penuh)
--  Jalankan file ini di Supabase > SQL Editor > New Query
--  File ini menggantikan semua file script patch sebelumnya.
-- ============================================================

-- 1. TABEL KATEGORI PRODUK
CREATE TABLE IF NOT EXISTS kategoris (
  id         BIGSERIAL PRIMARY KEY,
  nama       TEXT NOT NULL UNIQUE,
  warna_bg   TEXT DEFAULT '#f5f5f5',
  warna_text TEXT DEFAULT '#555555',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE kategoris DISABLE ROW LEVEL SECURITY;

-- 2. TABEL SATUAN
CREATE TABLE IF NOT EXISTS satuans (
  id         BIGSERIAL PRIMARY KEY,
  nama       TEXT NOT NULL UNIQUE,
  keterangan TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE satuans DISABLE ROW LEVEL SECURITY;

-- 3. TABEL SUPPLIER
CREATE TABLE IF NOT EXISTS suppliers (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  contact     TEXT DEFAULT '',
  phone       TEXT DEFAULT '',
  email       TEXT DEFAULT '',
  address     TEXT DEFAULT '',
  category    TEXT DEFAULT '',
  status      TEXT DEFAULT 'Aktif',
  notes       TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL PRODUK
CREATE TABLE IF NOT EXISTS products (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT DEFAULT 'Pakan Jadi',
  unit        TEXT DEFAULT 'pcs',
  price       INTEGER NOT NULL DEFAULT 0,
  stock       INTEGER NOT NULL DEFAULT 0,
  min_stock   INTEGER NOT NULL DEFAULT 5,
  supplier_id BIGINT REFERENCES suppliers(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL TRANSAKSI
CREATE TABLE IF NOT EXISTS transactions (
  id          BIGSERIAL PRIMARY KEY,
  trx_code    TEXT NOT NULL UNIQUE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  customer    TEXT DEFAULT 'Umum',
  total       INTEGER NOT NULL DEFAULT 0,
  payment     INTEGER NOT NULL DEFAULT 0,
  change_amt  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABEL ITEM TRANSAKSI
CREATE TABLE IF NOT EXISTS transaction_items (
  id             BIGSERIAL PRIMARY KEY,
  transaction_id BIGINT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  product_id     BIGINT REFERENCES products(id) ON DELETE SET NULL,
  product_name   TEXT NOT NULL,
  qty            INTEGER NOT NULL DEFAULT 1,
  unit           TEXT DEFAULT 'pcs',
  price          INTEGER NOT NULL DEFAULT 0
);

-- 7. TABEL USERS (LOGIN)
CREATE TABLE IF NOT EXISTS users (
  id          BIGSERIAL PRIMARY KEY,
  username    TEXT NOT NULL UNIQUE,
  password    TEXT NOT NULL,
  nama        TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'pegawai',
  status      TEXT NOT NULL DEFAULT 'Aktif',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 8. TABEL ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS activity_logs (
  id          BIGSERIAL PRIMARY KEY,
  user_nama   TEXT NOT NULL,
  user_role   TEXT NOT NULL,
  aksi        TEXT NOT NULL,
  kategori    TEXT NOT NULL,
  detail      TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- INDEX & TRIGGERS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_category   ON products(category);
CREATE INDEX IF NOT EXISTS idx_transactions_date   ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_trx_items_trx_id    ON transaction_items(transaction_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_updated ON products;
CREATE TRIGGER trg_products_updated
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- DATA AWAL (SEEDING)
-- ============================================================

-- Kategori
INSERT INTO kategoris (nama, warna_bg, warna_text) VALUES
('Pakan Jadi',    '#e8f5e9', '#2e7d32'),
('Pakan Kiloan',  '#fff8e1', '#e65100'),
('Pakan Segar',   '#e3f2fd', '#1565c0'),
('Cemilan Hewan', '#fce4ec', '#c62828'),
('Suplemen',      '#f3e5f5', '#6a1b9a'),
('Pakan Kucing',  '#e0f2f1', '#00695c')
ON CONFLICT (nama) DO NOTHING;

-- Satuan
INSERT INTO satuans (nama, keterangan) VALUES
('kg',      'Kilogram'),
('gram',    'Gram'),
('pcs',     'Per buah / pieces'),
('bungkus', 'Per bungkus'),
('sachet',  'Per sachet'),
('botol',   'Per botol'),
('cup',     'Per cup'),
('karung',  'Per karung'),
('pak',     'Per pak / paket'),
('liter',   'Per liter'),
('ekor',    'Per ekor')
ON CONFLICT (nama) DO NOTHING;

-- Supplier
INSERT INTO suppliers (name, contact, phone, email, address, category, status, notes) VALUES
('CV Berkah Pakan Jaya',    'Pak Hendra', '0812-3456-7890', 'berkah@email.com',  'Jl. Pasar Burung No.12, Solo',    'Pakan Jadi & Cemilan',   'Aktif', 'Supplier utama pakan jadi, min order 50pcs'),
('UD Milet Makmur',         'Bu Rina',    '0856-9876-5432', 'milet@email.com',   'Jl. Kota Lama No.45, Klaten',     'Pakan Biji-bijian',      'Aktif', 'Grosir biji-bijian, harga terbaik order >10kg'),
('Toko Agro Nusantara',     'Pak Doni',   '0823-1122-3344', 'agro@email.com',    'Jl. Veteran No.78, Yogyakarta',   'Suplemen & Biji Impor',  'Aktif', 'Spesialis canary seed & suplemen impor'),
('Peternakan Jangkrik Maju','Pak Slamet', '0878-5566-7788', 'jangkrik@email.com','Desa Pandan RT 03, Klaten',       'Pakan Segar & Serangga', 'Aktif', 'Kirim setiap Senin & Kamis, kroto/jangkrik segar'),
('Distributor Royal Canin', 'Ibu Dewi',   '0811-2233-4455', 'royal@email.com',   'Jl. Pemuda No.100, Semarang',     'Pakan Premium',          'Aktif', 'Distributor resmi, min order 1 karton');

-- Produk
INSERT INTO products (name, category, unit, price, stock, min_stock, supplier_id) VALUES
('Voer Burung Extra',      'Pakan Jadi',    'bungkus', 8500,  120, 20, 1),
('Milet Putih',            'Pakan Kiloan',  'kg',      12000,  35, 10, 2),
('Milet Merah',            'Pakan Kiloan',  'kg',      13000,  28, 10, 2),
('Jewawut',                'Pakan Kiloan',  'kg',      15000,  40, 10, 2),
('Canary Seed',            'Pakan Kiloan',  'kg',      22000,  18,  5, 3),
('Biji Bunga Matahari',    'Pakan Kiloan',  'kg',      18000,  25,  8, 2),
('Kroto Segar',            'Pakan Segar',   'cup',      5000,  50, 15, 4),
('Jangkrik Kecil',         'Pakan Segar',   'bungkus',  7000,  30, 10, 4),
('Ulat Hongkong',          'Pakan Segar',   'cup',      6000,  40, 10, 4),
('Snack Stick Burung',     'Cemilan Hewan', 'pcs',      4500,  80, 20, 1),
('Egg Food Lovebird',      'Cemilan Hewan', 'bungkus', 12000,  35, 10, 1),
('Mineral Block',          'Suplemen',      'pcs',      6500,  45, 10, 3),
('Vitamin Burung Cair',    'Suplemen',      'botol',   25000,  22,  5, 3),
('Nektar Lovebird',        'Cemilan Hewan', 'bungkus',  9500,  30,  8, 1),
('Pakan Kucing Whiskas',   'Pakan Kucing',  'sachet',   8000,  60, 15, 5),
('Pakan Kelinci Pellet',   'Pakan Kiloan',  'kg',      20000,  15,  5, 2),
('Minyak Ikan Cod',        'Suplemen',      'botol',   35000,  12,  5, 3),
('Pasir Burung',           'Pakan Jadi',    'bungkus',  5000,  90, 20, 1);

-- Users (Final set of accounts considering all patches)
INSERT INTO users (username, password, nama, role, status) VALUES
('AdminBBS14', 'TokoBBS2014',  'Super Admin BBS',  'superadmin', 'Aktif'),
('OwnerBBS',   'TokoBBS2014',  'Owner BBS Klaten', 'superadmin', 'Aktif'),
('Kasir001',   'KasirBBS#001', 'Pegawai Kasir 1',  'pegawai',    'Aktif'),
('Kasir002',   'KasirBBS#002', 'Pegawai Kasir 2',  'pegawai',    'Aktif'),
('AdminToko',  'AdminBBS2025', 'Admin Toko BBS',   'admin',      'Aktif')
ON CONFLICT (username) DO UPDATE SET password=EXCLUDED.password, nama=EXCLUDED.nama, role=EXCLUDED.role, status=EXCLUDED.status;
