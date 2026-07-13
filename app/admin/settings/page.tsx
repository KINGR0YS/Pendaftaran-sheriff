'use client';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import { supabase } from '@/lib/supabase';
import { Save, KeyRound, UserPlus } from 'lucide-react';
import { logActivity } from '@/lib/activity-log';
import { getSystemSettings, updateSystemSetting } from '@/lib/settings';

export default function SettingsPage() {
  const { showToast } = useToast();
  const [recruitmentStatus, setRecruitmentStatus] = useState('open');
  const [activeBatch, setActiveBatch] = useState('');

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Role & Pembuatan Akun State
  const [userRole, setUserRole] = useState<string>('dismag');
  const [newEmail, setNewEmail] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newAccountPassword, setNewAccountPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'dismag' | 'pelatih' | 'superadmin'>('pelatih');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  useEffect(() => {
    getSystemSettings().then((settings) => {
      setRecruitmentStatus(settings.recruitment_status);
      setActiveBatch(settings.active_batch);
    });
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserRole(session.user.user_metadata?.role || 'dismag');
      }
    });
  }, []);

  const handleSaveRecruitmentSettings = async () => {
    const successStatus = await updateSystemSetting('recruitment_status', recruitmentStatus);
    const successBatch = await updateSystemSetting('active_batch', activeBatch);
    
    logActivity(`Mengubah status pendaftaran menjadi ${recruitmentStatus} dan angkatan aktif menjadi ${activeBatch}`);
    
    if (successStatus && successBatch) {
      showToast('Pengaturan rekrutmen & angkatan berhasil disimpan secara global.', 'success');
    } else {
      showToast('Pengaturan disimpan secara lokal. Pastikan Anda telah menjalankan LANGKAH 11 di Supabase SQL Editor Anda!', 'warning');
    }
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
      logActivity('Mengubah password akun');
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

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== 'superadmin') {
      showToast('Hanya superadmin yang diizinkan untuk membuat akun baru.', 'error');
      return;
    }
    if (!newEmail.trim() || !newUsername.trim() || !newAccountPassword.trim()) {
      showToast('Semua field wajib diisi untuk membuat akun baru.', 'error');
      return;
    }
    if (newAccountPassword.length < 6) {
      showToast('Password minimal harus 6 karakter.', 'error');
      return;
    }
    
    setIsCreatingAccount(true);
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const tempSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        }
      );

      const { error } = await tempSupabase.auth.signUp({
        email: newEmail.trim(),
        password: newAccountPassword,
        options: {
          data: {
            role: selectedRole,
            username: newUsername.trim()
          }
        }
      });

      if (error) throw error;
      
      logActivity(`Membuat akun baru (${selectedRole}) untuk ${newUsername.trim()}`);
      showToast(`Akun baru (${selectedRole}) untuk ${newUsername} berhasil dibuat!`, 'success');
      setNewEmail('');
      setNewUsername('');
      setNewAccountPassword('');
    } catch (err: any) {
      showToast(`Gagal membuat akun: ${err.message}`, 'error');
    } finally {
      setIsCreatingAccount(false);
    }
  };


  return (
    <div>
      <h2 className="dashboard-title">Pengaturan</h2>
      <p className="dashboard-subtitle">
        Kelola pengaturan rekrutmen dan angkatan Sheriff Kerajaan Roxwood.
      </p>

      {/* Recruitment Settings — Hanya untuk Dismag & Superadmin */}
      {(userRole === 'dismag' || userRole === 'superadmin') && (
        <div className="glass-card config-form-box" style={{ marginTop: '1.5rem' }}>
          <h3>Pengaturan Status & Angkatan</h3>
          <p className="config-desc">
            Atur Status Pembukaan Pendaftaran Sheriff Kerajaan Roxwood.
          </p>

          <div className="form-grid-2">
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
      )}

      {/* Ganti Password Section */}
      <div className="glass-card config-form-box" style={{ marginTop: '2rem' }}>
        <h3>RESET PASSWORD</h3>
        <p className="config-desc">
          Perbarui kata sandi akun Anda.
        </p>

        <form onSubmit={handleChangePassword} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', alignItems: 'end' }}>
          <div className="form-group">
            <label htmlFor="current-password">Password Lama</label>
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
            <label htmlFor="new-password">Password Baru</label>
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
            <label htmlFor="confirm-password">Konfirmasi Password Baru</label>
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

      {/* Pembuatan Akun Baru (Hanya untuk Superadmin) */}
      {userRole === 'superadmin' && (
        <div className="glass-card config-form-box" style={{ marginTop: '2rem' }}>
          <h3>BUAT AKUN BARU</h3>
          <p className="config-desc">
            Daftarkan akun admin baru atau pelatih untuk mengelola website pendaftaran.
          </p>

          <form onSubmit={handleCreateAccount} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', alignItems: 'end' }}>
            <div className="form-group">
              <label htmlFor="new-email">Email Kantor <span className="required">*</span></label>
              <input
                type="email"
                id="new-email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Contoh: pelatih1@roxwood.gov"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="new-username">Nama Pengguna <span className="required">*</span></label>
              <input
                type="text"
                id="new-username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Contoh: Frank Austin"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="new-account-password">Kata Sandi <span className="required">*</span></label>
              <input
                type="password"
                id="new-account-password"
                value={newAccountPassword}
                onChange={(e) => setNewAccountPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="selected-role">Hak Akses / Peran <span className="required">*</span></label>
              <select
                id="selected-role"
                className="form-input"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                required
              >
                <option value="pelatih">Pelatih (Hanya Nilai & Absensi)</option>
                <option value="dismag">Full Akses (Dismag)</option>
                <option value="superadmin">Superadmin (Full Akses & Manajemen Akun)</option>
              </select>
            </div>

            <div className="config-actions" style={{ gridColumn: '1 / -1', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={isCreatingAccount}>
                {isCreatingAccount ? 'Mendaftarkan...' : 'Buat Akun'} <UserPlus size={16} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
