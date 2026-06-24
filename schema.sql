-- =======================================================
-- BLAINE COUNTY SHERIFF'S OFFICE - DATABASE SCHEMA
-- =======================================================
-- Jalankan query di bawah ini pada SQL Editor Supabase Anda
-- untuk membuat tabel yang dibutuhkan oleh sistem pendaftaran & roster.

-- 1. Tabel Roster Anggota Aktif
CREATE TABLE IF NOT EXISTS roster (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ic_name TEXT NOT NULL,
  callsign TEXT UNIQUE NOT NULL,
  rank TEXT NOT NULL,
  division TEXT DEFAULT 'Patrol',
  status TEXT DEFAULT 'Active', -- Active, LOA, Suspended, Retired
  batch TEXT DEFAULT '1',
  join_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Formulir Pendaftaran Masuk
CREATE TABLE IF NOT EXISTS applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ooc_name TEXT NOT NULL,
  passport_name_ooc TEXT NOT NULL,
  ooc_age INTEGER NOT NULL,
  ooc_gender TEXT,
  discord_id TEXT NOT NULL,
  steam_hex TEXT NOT NULL,
  playtime TEXT NOT NULL,
  rp_experience_ooc TEXT NOT NULL,
  obligations_other_cities TEXT NOT NULL,
  ic_name TEXT NOT NULL,
  ic_age INTEGER NOT NULL,
  ic_gender TEXT,
  ic_dob TEXT,
  phone_number TEXT NOT NULL,
  origin TEXT NOT NULL,
  experience TEXT NOT NULL,
  criminal_record TEXT NOT NULL,
  work_experience_ic TEXT NOT NULL,
  motivation_roxwood TEXT NOT NULL,
  why_accept_roxwood TEXT NOT NULL,
  active_hours TEXT NOT NULL,
  chain_of_command TEXT NOT NULL,
  scenario_use_of_force TEXT NOT NULL,
  batch TEXT DEFAULT '1',
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  rejection_reason TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Nonaktifkan Row Level Security (RLS) demi kemudahan demonstrasi awal.
-- (Catatan: Untuk produksi, disarankan mengaktifkan RLS dan membuat kebijakan tertulis).
ALTER TABLE roster DISABLE ROW LEVEL SECURITY;
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;

-- 4. Contoh Anggota Roster Awal (Opsional)
INSERT INTO roster (ic_name, callsign, rank, division, status)
VALUES 
  ('John Davis', '101', 'Sheriff', 'Patrol', 'Active'),
  ('Sarah Connor', '105', 'Captain', 'Detective', 'Active'),
  ('Kyle Reese', '204', 'Sergeant', 'SEU', 'Active')
ON CONFLICT (callsign) DO NOTHING;
