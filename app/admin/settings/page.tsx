'use client';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import { Save, Trash2, Info } from 'lucide-react';

export default function SettingsPage() {
  const { showToast } = useToast();
  const [recruitmentStatus, setRecruitmentStatus] = useState('open');
  const [activeBatch, setActiveBatch] = useState('1');
  const [systemLogsCount, setSystemLogsCount] = useState(0);

  useEffect(() => {
    setRecruitmentStatus(localStorage.getItem('recruitment_status') || 'open');
    setActiveBatch(localStorage.getItem('active_batch') || '1');
    updateLogsCount();
  }, []);

  const updateLogsCount = () => {
    const logs = JSON.parse(localStorage.getItem('activity_logs') || '[]');
    setSystemLogsCount(logs.length);
  };

  const handleSaveRecruitmentSettings = () => {
    localStorage.setItem('active_batch', activeBatch);
    localStorage.setItem('recruitment_status', recruitmentStatus);
    showToast('Pengaturan rekrutmen & angkatan berhasil disimpan.', 'success');
  };

  const handleClearLogs = () => {
    if (!confirm('Apakah Anda yakin ingin menghapus semua log aktivitas admin? Tindakan ini tidak dapat dibatalkan.')) return;
    localStorage.removeItem('activity_logs');
    setSystemLogsCount(0);
    showToast('Seluruh log aktivitas admin telah berhasil dihapus.', 'info');
  };

  return (
    <div>
      <h2 className="dashboard-title">Pengaturan</h2>
      <p className="dashboard-subtitle">
        Kelola pengaturan rekrutmen dan angkatan Sheriff Kerajaan Roxwood serta utilitas sistem.
      </p>

      {/* Recruitment Settings */}
      <div className="glass-card config-form-box" style={{ marginTop: '1.5rem' }}>
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

      {/* System Settings & Version Info */}
      <div className="glass-card config-form-box" style={{ marginTop: '2rem' }}>
        <h3>Utilitas & Informasi Sistem</h3>
        <p className="config-desc">
          Kelola cache sistem, hapus log lama, dan lihat informasi build aplikasi saat ini.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
          <div className="form-group">
            <label>Log Aktivitas Admin</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                Tersimpan: <strong>{systemLogsCount}</strong> entri
              </span>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={handleClearLogs}
                disabled={systemLogsCount === 0}
                style={{ color: 'var(--color-error)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
              >
                <Trash2 size={14} /> Hapus Log
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Informasi Build</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              <div>Versi Aplikasi: <strong>v2.0.2 (Roxwood Edition)</strong></div>
              <div>Database: <strong>Supabase Cloud Database (PostgreSQL)</strong></div>
              <div>Pimpinan: <strong>DISMAG ON FIRE (Commanding Officer)</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
