-- ============================================================
--  BBS BerkahBirdShop - Row Level Security (RLS) Setup
--  Jalankan file ini di Supabase > SQL Editor > New Query
--  PENTING: Backup data dulu sebelum menjalankan!
-- ============================================================

-- 1. AKTIFKAN RLS UNTUK SEMUA TABEL
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE kategoris ENABLE ROW LEVEL SECURITY;
ALTER TABLE satuans ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE restock_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 2. POLICY UNTUK TABEL USERS
-- Semua user yang terautentikasi bisa baca data user (untuk login)
CREATE POLICY "Allow authenticated read users" ON users
  FOR SELECT USING (true);

-- Hanya superadmin yang bisa insert/update/delete users
CREATE POLICY "Superadmin can manage users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.username = current_setting('request.jwt.claims', true)::json->>'username'
      AND u.role = 'superadmin'
    )
  );

-- 3. POLICY UNTUK TABEL PRODUCTS
-- Semua user bisa baca produk
CREATE POLICY "Allow all read products" ON products
  FOR SELECT USING (true);

-- Admin dan superadmin bisa insert/update/delete produk
CREATE POLICY "Admin can manage products" ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.username = current_setting('request.jwt.claims', true)::json->>'username'
      AND u.role IN ('admin', 'superadmin')
    )
  );

-- 4. POLICY UNTUK TABEL SUPPLIERS
CREATE POLICY "Allow all read suppliers" ON suppliers
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage suppliers" ON suppliers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.username = current_setting('request.jwt.claims', true)::json->>'username'
      AND u.role IN ('admin', 'superadmin')
    )
  );

-- 5. POLICY UNTUK TABEL TRANSACTIONS & TRANSACTION_ITEMS
CREATE POLICY "Allow all read transactions" ON transactions
  FOR SELECT USING (true);

CREATE POLICY "Allow all insert transactions" ON transactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can update transactions" ON transactions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.username = current_setting('request.jwt.claims', true)::json->>'username'
      AND u.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Allow all read transaction_items" ON transaction_items
  FOR SELECT USING (true);

CREATE POLICY "Allow all insert transaction_items" ON transaction_items
  FOR INSERT WITH CHECK (true);

-- 6. POLICY UNTUK TABEL KATEGORIS & SATUANS
CREATE POLICY "Allow all read kategoris" ON kategoris
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage kategoris" ON kategoris
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.username = current_setting('request.jwt.claims', true)::json->>'username'
      AND u.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Allow all read satuans" ON satuans
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage satuans" ON satuans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.username = current_setting('request.jwt.claims', true)::json->>'username'
      AND u.role IN ('admin', 'superadmin')
    )
  );

-- 7. POLICY UNTUK TABEL ACTIVITY_LOGS & RESTOCK_LOGS
CREATE POLICY "Allow all read activity_logs" ON activity_logs
  FOR SELECT USING (true);

CREATE POLICY "Allow all insert activity_logs" ON activity_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all read restock_logs" ON restock_logs
  FOR SELECT USING (true);

CREATE POLICY "Allow all insert restock_logs" ON restock_logs
  FOR INSERT WITH CHECK (true);

-- 8. POLICY UNTUK TABEL SETTINGS
CREATE POLICY "Allow all read settings" ON settings
  FOR SELECT USING (true);

CREATE POLICY "Superadmin can manage settings" ON settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.username = current_setting('request.jwt.claims', true)::json->>'username'
      AND u.role = 'superadmin'
    )
  );

-- ============================================================
-- CATATAN PENTING:
-- Policy di atas menggunakan JWT claims yang HANYA TERSEDIA jika
-- menggunakan Supabase Auth. Karena aplikasi ini menggunakan
-- custom auth (tabel users sendiri), policy ini TIDAK AKAN BERFUNGSI.
--
-- Untuk keamanan penuh, pertimbangkan:
-- 1. Migrasi ke Supabase Auth, ATAU
-- 2. Buat Supabase Edge Function untuk handle semua operasi database
--    dengan validasi role di server-side
-- ============================================================
