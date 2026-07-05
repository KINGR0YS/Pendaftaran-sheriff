-- =======================================================
-- SHERIFF KERAJAAN ROXWOOD — DATABASE SCHEMA (v2.0)
-- =======================================================
-- Jalankan semua query ini pada SQL Editor Supabase Anda.
-- Jika tabel sudah ada, langsung ke LANGKAH 3 (ALTER TABLE)
-- untuk menambahkan kolom baru tanpa kehilangan data.

-- -------------------------------------------------------
-- LANGKAH 1: Buat Tabel (Jika Belum Ada)
-- -------------------------------------------------------

-- Tabel Formulir Pendaftaran (Tabel Utama)
CREATE TABLE IF NOT EXISTS applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Informasi OOC (Out of Character)
  ooc_name TEXT NOT NULL,
  passport_name_ooc TEXT NOT NULL,
  ooc_age INTEGER NOT NULL,
  ooc_gender TEXT,
  discord_id TEXT NOT NULL,
  steam_hex TEXT NOT NULL,
  playtime TEXT NOT NULL,
  rp_experience_ooc TEXT NOT NULL,
  obligations_other_cities TEXT NOT NULL,

  -- Informasi IC (In Character)
  ic_name TEXT NOT NULL,
  ic_age INTEGER NOT NULL,
  ic_gender TEXT,
  ic_dob TEXT,
  phone_number TEXT NOT NULL,
  experience TEXT NOT NULL,

  -- Kualifikasi Personal
  criminal_record TEXT NOT NULL,
  work_experience_ic TEXT NOT NULL,
  motivation_roxwood TEXT NOT NULL,
  why_accept_roxwood TEXT NOT NULL,
  active_hours TEXT NOT NULL,

  -- Kolom Legacy (dipertahankan untuk kompatibilitas)
  origin TEXT DEFAULT '-',
  chain_of_command TEXT DEFAULT '-',
  scenario_use_of_force TEXT DEFAULT '-',

  -- Metadata Pendaftaran
  batch TEXT DEFAULT '1',
  status TEXT DEFAULT 'pending',       -- pending | approved | rejected
  rejection_reason TEXT NULL,
  processed_by TEXT NULL,              -- Email admin yang memproses
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Roster Anggota (Opsional — digunakan saat approve)
CREATE TABLE IF NOT EXISTS roster (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ic_name TEXT NOT NULL,
  callsign TEXT UNIQUE NOT NULL,
  rank TEXT NOT NULL DEFAULT 'Cadet',
  division TEXT DEFAULT 'Patrol',
  status TEXT DEFAULT 'Active',        -- Active | LOA | Suspended | Retired
  batch TEXT DEFAULT '1',
  join_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------
-- LANGKAH 2: Nonaktifkan Row Level Security (RLS)
-- -------------------------------------------------------
-- PENTING: Untuk produksi, aktifkan RLS dan buat policies.
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE roster DISABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------
-- LANGKAH 3: Migrasi — Tambah Kolom Baru (ALTER TABLE)
-- Jalankan bagian ini JIKA tabel SUDAH ADA sebelumnya
-- agar data lama TIDAK hilang.
-- -------------------------------------------------------
ALTER TABLE applications ADD COLUMN IF NOT EXISTS processed_by TEXT NULL;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS origin TEXT DEFAULT '-';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS chain_of_command TEXT DEFAULT '-';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS scenario_use_of_force TEXT DEFAULT '-';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS badge_status TEXT DEFAULT 'lencana aktif';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS training_status TEXT DEFAULT 'sedang dalam pelatihan';

-- -------------------------------------------------------
-- LANGKAH 4: Fungsi Auto-Update updated_at (Opsional)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Buat trigger agar updated_at otomatis terupdate
DROP TRIGGER IF EXISTS set_updated_at ON applications;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -------------------------------------------------------
-- LANGKAH 5: Tabel dan Kolom Nilai Probatus (Tambahan)
-- -------------------------------------------------------
ALTER TABLE applications ADD COLUMN IF NOT EXISTS probatus_score INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS probatus_evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  evaluation_type TEXT NOT NULL, -- 'tambah' | 'kurangi'
  reason TEXT NOT NULL,
  evaluator_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE probatus_evaluations DISABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------
-- LANGKAH 6: Tabel Absensi Probatus (Tambahan)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS probatus_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL, -- 'Hadir' | 'Izin' | 'Sakit' | 'Alfa'
  recorded_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(application_id, attendance_date)
);

ALTER TABLE probatus_attendance DISABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------
-- LANGKAH 7: Dokumentasi Autentikasi & Role (RBAC)
-- -------------------------------------------------------
-- Halaman website ini menggunakan sistem otentikasi bawaan Supabase Auth.
-- Hak akses (Role) disimpan pada metadata pengguna (user_metadata) dengan skema:
--
-- 1. 'superadmin' : Akses penuh ke seluruh halaman admin & panel Manajemen Akun.
-- 2. 'admin'      : Akses penuh ke seluruh halaman admin, kecuali Manajemen Akun.
-- 3. 'trainer'    : Akses terbatas (hanya Nilai Probatus, Absensi, dan Pengaturan terbatas).
--
-- Pendaftaran akun baru langsung dilakukan dari halaman Pengaturan (Settings)
-- menggunakan parameter metadata role di bawah opsi pendaftaran.
--
-- SELESAI — Susunan data database & dokumentasi role siap digunakan.
-- -------------------------------------------------------

-- -------------------------------------------------------
-- LANGKAH 8: Tabel Absensi Pelatih & Pengawas (Staff)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_attendance_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL,
  username TEXT NOT NULL,
  role TEXT NOT NULL, -- 'pelatih' | 'dismag' | 'superadmin'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES staff_attendance_members(user_id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL, -- 'Hadir' | 'Izin' | 'Sakit' | 'Alfa'
  recorded_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, attendance_date)
);

ALTER TABLE staff_attendance_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_attendance DISABLE ROW LEVEL SECURITY;



