-- =======================================================
-- SHERIFF KERAJAAN ROXWOOD — DATABASE SCHEMA (v2.1)
-- =======================================================
-- AMAN DIJALANKAN BERULANG KALI.
-- Skema ini tidak akan menghapus data lama Anda.

-- -------------------------------------------------------
-- LANGKAH 1: Buat Tabel Utama (Jika Belum Ada)
-- -------------------------------------------------------

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
  experience TEXT NOT NULL,
  criminal_record TEXT NOT NULL,
  work_experience_ic TEXT NOT NULL,
  motivation_roxwood TEXT NOT NULL,
  why_accept_roxwood TEXT NOT NULL,
  active_hours TEXT NOT NULL,
  batch TEXT DEFAULT '1',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roster (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ic_name TEXT NOT NULL,
  callsign TEXT UNIQUE NOT NULL,
  rank TEXT NOT NULL DEFAULT 'Cadet',
  division TEXT DEFAULT 'Patrol',
  status TEXT DEFAULT 'Active',
  batch TEXT DEFAULT '1',
  join_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------
-- LANGKAH 2: Migrasi Kolom Baru ke Tabel Applications
-- (Menambahkan kolom tanpa menghapus data lama)
-- -------------------------------------------------------
ALTER TABLE applications ADD COLUMN IF NOT EXISTS origin TEXT DEFAULT '-';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS chain_of_command TEXT DEFAULT '-';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS scenario_use_of_force TEXT DEFAULT '-';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS rejection_reason TEXT NULL;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS processed_by TEXT NULL;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS badge_status TEXT DEFAULT 'lencana aktif';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS training_status TEXT DEFAULT 'sedang dalam pelatihan';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS deposit_status TEXT DEFAULT 'sudah deposit';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS probatus_score INTEGER DEFAULT 0;

-- Kolom Penilaian Interview
ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_etika INTEGER DEFAULT NULL;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_komunikasi INTEGER DEFAULT NULL;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_penampilan INTEGER DEFAULT NULL;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_pemahaman_peraturan INTEGER DEFAULT NULL;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_pemahaman_kasus INTEGER DEFAULT NULL;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_pengalaman_organisasi TEXT DEFAULT NULL;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_pengalaman_instansi TEXT DEFAULT NULL;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_evaluator TEXT DEFAULT NULL;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_assessed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- -------------------------------------------------------
-- LANGKAH 3: Tabel Penilaian & Absensi Probatus
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS probatus_evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  evaluation_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  evaluator_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS probatus_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL,
  recorded_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(application_id, attendance_date)
);

-- -------------------------------------------------------
-- LANGKAH 4: Tabel Absensi Staff (Pelatih & Pengawas)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_attendance_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL,
  username TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES staff_attendance_members(user_id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL,
  recorded_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, attendance_date)
);

-- -------------------------------------------------------
-- LANGKAH 5: Tabel Log Aktivitas & Pengaturan Sistem
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  role TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings (hanya jika belum ada)
INSERT INTO system_settings (key, value) VALUES 
('active_batch', '1'),
('recruitment_status', 'open'),
('absensi_probatus_start_date', CURRENT_DATE::TEXT),
('absensi_pelatih_start_date', CURRENT_DATE::TEXT)
ON CONFLICT (key) DO NOTHING;

-- -------------------------------------------------------
-- LANGKAH 6: Trigger Auto-Update updated_at
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON applications;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -------------------------------------------------------
-- LANGKAH 7: Nonaktifkan RLS (Row Level Security)
-- -------------------------------------------------------
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE roster DISABLE ROW LEVEL SECURITY;
ALTER TABLE probatus_evaluations DISABLE ROW LEVEL SECURITY;
ALTER TABLE probatus_attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_attendance_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;
