'use client';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import { supabase } from '@/lib/supabase';
import { Save, KeyRound } from 'lucide-react';

export default function SettingsPage() {
  const { showToast } = useToast();
  const [recruitmentStatus, setRecruitmentStatus] = useState('open');
  const [activeBatch, setActiveBatch] = useState('1');

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    setRecruitmentStatus(localStorage.getItem('recruitment_status') || 'open');
    setActiveBatch(localStorage.getItem('active_batch') || '1');
  }, []);

  const handleSaveRecruitmentSettings = () => {
    localStorage.setItem('active_batch', activeBatch);
    localStorage.setItem('recruitment_status', recruitmentStatus);
    showToast('Pengaturan rekrutmen & angkatan berhasil disimpan.', 'success');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('Password barunya ga cocok.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password baru minimal 6 karakter ya.', 'error');
      return;
    }
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword,
        current_password: currentPassword
      });
      if (error) throw error;
      showToast('Password berhasil diubah!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message || 'Gagal ganti password.', 'error');
    } finally {
      setIsChangingPassword(false);
    }
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

      {/* Ganti Password Section */}
      <div className="glass-card config-form-box" style={{ marginTop: '2rem' }}>
        <h3>Ganti Kata Sandi</h3>
        <p className="config-desc">
          Perbarui kata sandi akun administratif Anda yang sedang aktif. Anda harus memasukkan kata sandi lama Anda.
        </p>

        <form onSubmit={handleChangePassword} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', alignItems: 'end' }}>
          <div className="form-group">
            <label htmlFor="current-password">Kata Sandi Lama</label>
            <input
              type="password"
              id="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Masukkan password lama"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="new-password">Kata Sandi Baru</label>
            <input
              type="password"
              id="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirm-password">Konfirmasi Kata Sandi Baru</label>
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi kata sandi baru"
              required
            />
          </div>
          <div className="config-actions" style={{ gridColumn: '1 / -1', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={isChangingPassword}>
              {isChangingPassword ? 'Memproses...' : 'Ubah Kata Sandi'} <KeyRound size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
