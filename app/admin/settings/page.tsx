'use client';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  const { showToast } = useToast();
  const [recruitmentStatus, setRecruitmentStatus] = useState('open');
  const [activeBatch, setActiveBatch] = useState('1');

  useEffect(() => {
    setRecruitmentStatus(localStorage.getItem('recruitment_status') || 'open');
    setActiveBatch(localStorage.getItem('active_batch') || '1');
  }, []);

  const handleSaveRecruitmentSettings = () => {
    localStorage.setItem('active_batch', activeBatch);
    localStorage.setItem('recruitment_status', recruitmentStatus);
    showToast('Pengaturan rekrutmen & angkatan berhasil disimpan.', 'success');
  };

  return (
    <div>
      <h2 className="dashboard-title">Pengaturan Integrasi Cloud Database</h2>
      <p className="dashboard-subtitle">
        Hubungkan website ini ke Supabase melalui variabel environment (`.env.local`).
      </p>

      {/* ENV INFO */}
      <div className="glass-card config-form-box" style={{ marginTop: '1rem' }}>
        <h3>Konfigurasi Supabase</h3>
        <p className="config-desc">
          Kredensial disimpan di file <code>.env.local</code>. Edit file tersebut untuk mengganti URL atau Anon Key.
        </p>
        <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--color-border-custom)', borderRadius: 8, padding: '1rem', marginTop: '0.75rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
            NEXT_PUBLIC_SUPABASE_URL = <span style={{ color: 'var(--color-gold)' }}>{process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30)}...</span>
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            NEXT_PUBLIC_SUPABASE_ANON_KEY = <span style={{ color: 'var(--color-gold)' }}>***configured***</span>
          </p>
        </div>
      </div>

      {/* RECRUITMENT SETTINGS */}
      <div className="glass-card config-form-box" style={{ marginTop: '2rem' }}>
        <h3>Pengaturan Status & Angkatan Rekrutmen</h3>
        <p className="config-desc">
          Atur status pendaftaran aktif dan nomor angkatan penerimaan saat ini.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
          <div className="form-group">
            <label htmlFor="config-recruitment-status">Status Rekrutmen</label>
            <select
              id="config-recruitment-status"
              value={recruitmentStatus}
              onChange={(e) => setRecruitmentStatus(e.target.value)}
            >
              <option value="open">Buka (Open)</option>
              <option value="closed">Tutup (Closed)</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="config-active-batch">Angkatan Aktif Saat Ini</label>
            <input
              type="text"
              id="config-active-batch"
              value={activeBatch}
              onChange={(e) => setActiveBatch(e.target.value)}
              placeholder="Contoh: 1 atau 1.1"
            />
          </div>
        </div>

        <div className="config-actions">
          <button className="btn btn-primary" onClick={handleSaveRecruitmentSettings}>
            Simpan Pengaturan Rekrutmen <Save size={16} />
          </button>
        </div>
      </div>

      {/* SQL INSTRUCTIONS */}
      <div className="glass-card config-form-box" style={{ marginTop: '2rem' }}>
        <h3>Instruksi Setup Database Supabase</h3>
        <p>
          Untuk menggunakan database, jalankan SQL Query berikut di <strong>SQL Editor</strong> Supabase:
        </p>
        <pre className="sql-code-block">
{`-- 1. Buat Tabel Roster Anggota
CREATE TABLE IF NOT EXISTS roster (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ic_name TEXT NOT NULL,
  callsign TEXT UNIQUE NOT NULL,
  rank TEXT NOT NULL,
  division TEXT DEFAULT 'Patrol',
  status TEXT DEFAULT 'Active',
  batch TEXT DEFAULT '1',
  join_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Buat Tabel Pendaftaran Anggota
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
  status TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Disable RLS (for demo)
ALTER TABLE roster DISABLE ROW LEVEL SECURITY;
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;`}
        </pre>
      </div>
    </div>
  );
}
