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
      <h2 className="dashboard-title">Pengaturan</h2>
      <p className="dashboard-subtitle">
        Kelola pengaturan rekrutmen dan angkatan Sheriff Kerajaan Roxwood.
      </p>

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
    </div>
  );
}
