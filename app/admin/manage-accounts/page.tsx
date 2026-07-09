'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import RoleGuard from '@/components/RoleGuard';
import Modal from '@/components/Modal';
import { logActivity } from '@/lib/activity-log';
import { 
  listUsers, 
  forceResetPassword, 
  deleteUser,
  updateUserStatus
} from './actions';
import { 
  KeyRound, 
  Trash2, 
  Search, 
  Inbox, 
  UserCog, 
  ShieldAlert,
  Loader2,
  Shield,
  UserCheck,
  UserX,
  Power
} from 'lucide-react';

interface AccountUser {
  id: string;
  email: string;
  username: string;
  role: string;
  status?: 'active' | 'inactive';
  created_at: string;
  last_sign_in_at?: string;
}

export default function ManageAccountsPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<AccountUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Reset Password Modal states
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AccountUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAccessToken(session.access_token);
        setCurrentUser(session.user);
        fetchUsers(session.access_token);
      }
    });
  }, []);

  async function fetchUsers(token: string) {
    setLoading(true);
    try {
      const res = await listUsers(token);
      if (res.success && res.users) {
        setUsers(res.users);
      } else {
        showToast(res.message || 'Gagal mengambil data akun.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan jaringan atau server.', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleOpenResetModal = (user: AccountUser) => {
    setSelectedUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setIsResetModalOpen(true);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (newPassword !== confirmPassword) {
      showToast('Konfirmasi password tidak sesuai.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password minimal 6 karakter.', 'error');
      return;
    }

    setIsSubmittingReset(true);
    const res = await forceResetPassword(accessToken, selectedUser.id, newPassword);
    if (res.success) {
      showToast(res.message || 'Password berhasil diubah.', 'success');
      logActivity(`Mereset password akun <strong>${selectedUser.username}</strong> (${selectedUser.email})`);
      setIsResetModalOpen(false);
    } else {
      showToast(res.message || 'Gagal mengubah password.', 'error');
    }
    setIsSubmittingReset(false);
  };

  const handleDeleteUser = async (targetUser: AccountUser) => {
    if (currentUser?.id === targetUser.id) {
      showToast('Anda tidak dapat menghapus akun Anda sendiri.', 'error');
      return;
    }

    if (!confirm(`HAPUS AKUN SECARA PERMANEN?\n\nAkun: ${targetUser.username} (${targetUser.email})\nHak Akses: ${targetUser.role.toUpperCase()}\n\nTindakan ini tidak bisa dibatalkan.`)) {
      return;
    }

    setLoading(true);
    const res = await deleteUser(accessToken, targetUser.id);
    if (res.success) {
      showToast(res.message || 'Akun berhasil dihapus.', 'success');
      logActivity(`Menghapus akun <strong>${targetUser.username}</strong> (${targetUser.email}) secara permanen`);
      fetchUsers(accessToken);
    } else {
      showToast(res.message || 'Gagal menghapus akun.', 'error');
      setLoading(false);
    }
  };

  const handleToggleStatus = async (targetUser: AccountUser) => {
    if (currentUser?.id === targetUser.id) {
      showToast('Anda tidak dapat mengubah status akun Anda sendiri.', 'error');
      return;
    }

    const newStatus = targetUser.status === 'inactive' ? 'active' : 'inactive';
    const statusLabel = newStatus === 'active' ? 'MENGAKTIFKAN' : 'MENONAKTIFKAN';

    if (!confirm(`Apakah Anda yakin ingin ${statusLabel} akun ${targetUser.username} (${targetUser.email})?`)) {
      return;
    }

    setLoading(true);
    const res = await updateUserStatus(accessToken, targetUser.id, newStatus);
    if (res.success) {
      showToast(res.message || 'Status akun berhasil diperbarui.', 'success');
      logActivity(`Mengubah status akun <strong>${targetUser.username}</strong> (${targetUser.email}) menjadi <strong>${newStatus === 'active' ? 'Aktif' : 'Nonaktif'}</strong>`);
      fetchUsers(accessToken);
    } else {
      showToast(res.message || 'Gagal memperbarui status akun.', 'error');
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const superadmins = filteredUsers.filter(u => u.role === 'superadmin');
  const dismags = filteredUsers.filter(u => u.role === 'dismag');
  const pelatihs = filteredUsers.filter(u => u.role === 'pelatih');
  const others = filteredUsers.filter(u => u.role !== 'superadmin' && u.role !== 'dismag' && u.role !== 'pelatih');

  const renderUserTable = (usersList: AccountUser[], roleTitle: string) => {
    if (usersList.length === 0) {
      return (
        <div className="empty-section">
          Tidak ada akun {roleTitle.toLowerCase()} yang ditemukan.
        </div>
      );
    }

    return (
      <div className="table-wrapper" style={{ marginBottom: '2rem' }}>
        <table className="roster-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Nama Pengguna</th>
              <th style={{ textAlign: 'left' }}>Email Kantor</th>
              <th style={{ textAlign: 'center', width: '120px' }}>Status</th>
              <th style={{ textAlign: 'center', width: '180px' }}>Terdaftar</th>
              <th style={{ textAlign: 'center', width: '200px' }}>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {usersList.map((u) => {
              const isCurrent = currentUser?.id === u.id;
              return (
                <tr key={u.id}>
                  <td className="account-user-cell">
                    <div className="user-name-wrap">
                      {u.username}
                      {isCurrent && (
                        <span className="you-badge">Anda</span>
                      )}
                    </div>
                  </td>
                  <td className="account-email-cell">{u.email}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`status-badge ${u.status === 'inactive' ? 'inactive' : 'active'}`}>
                      {u.status === 'inactive' ? 'NONAKTIF' : 'AKTIF'}
                    </span>
                  </td>
                  <td className="account-date-cell">
                    {new Date(u.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="account-actions-cell">
                    <div className="actions-wrap">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        title={u.status === 'inactive' ? 'Aktifkan Akun' : 'Nonaktifkan Akun'}
                        disabled={isCurrent}
                        className={`icon-btn ${u.status === 'inactive' ? 'toggle-active' : 'toggle-inactive'}`}
                      >
                        {u.status === 'inactive' ? <UserCheck size={15} /> : <UserX size={15} />}
                      </button>

                      <button
                        onClick={() => handleOpenResetModal(u)}
                        title="Reset Password Paksa"
                        className="icon-btn reset-pw"
                      >
                        <KeyRound size={15} />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteUser(u)}
                        title="Hapus Akun Permanen"
                        disabled={isCurrent}
                        className="icon-btn delete-user"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <RoleGuard allowedRoles={['superadmin']}>
      <div>
        <div className="header-action-row">
          <h2 className="dashboard-title">
            Manajemen Akun Sistem
            <span style={{ 
              marginLeft: '0.75rem', 
              fontSize: '0.8rem', 
              background: 'var(--color-bg-card)', 
              padding: '0.2rem 0.6rem', 
              borderRadius: '12px', 
              border: '1px solid var(--color-border-custom)', 
              color: 'var(--color-text-secondary)' 
            }}>
              {loading ? '...' : `${users.length} Akun`}
            </span>
          </h2>
        </div>

        <p className="dashboard-subtitle" style={{ marginBottom: '1.5rem' }}>
          Kelola kredensial, hak akses, dan lakukan reset/penghapusan akun personil. Fitur ini eksklusif untuk tingkat jabatan **Superadmin**.
        </p>

        {/* Search Bar */}
        <div className="search-input-wrapper" style={{ maxWidth: '400px' }}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Cari berdasarkan nama, email, atau role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Table/List Grid */}
        {loading && users.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem' }}>
            <Loader2 size={32} color="var(--color-gold)" style={{ animation: 'spin 0.7s linear infinite' }} />
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Memuat database akun...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <Inbox />
            <h3>Tidak Ada Pengguna</h3>
            <p>Tidak ditemukan akun yang cocok dengan pencarian Anda.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
            {/* Section Superadmin */}
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f87171', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '0.5px' }}>
                SUPERADMIN
                <span style={{ fontSize: '0.7rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.1rem 0.5rem', borderRadius: '10px', color: '#f87171' }}>
                  {superadmins.length}
                </span>
              </h3>
              {renderUserTable(superadmins, 'Superadmin')}
            </div>

            {/* Section Dismag */}
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#d4af37', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '0.5px' }}>
                DISMAG
                <span style={{ fontSize: '0.7rem', background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.2)', padding: '0.1rem 0.5rem', borderRadius: '10px', color: '#d4af37' }}>
                  {dismags.length}
                </span>
              </h3>
              {renderUserTable(dismags, 'Dismag')}
            </div>

            {/* Section Pelatih */}
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#60a5fa', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '0.5px' }}>
                PELATIH
                <span style={{ fontSize: '0.7rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '0.1rem 0.5rem', borderRadius: '10px', color: '#60a5fa' }}>
                  {pelatihs.length}
                </span>
              </h3>
              {renderUserTable(pelatihs, 'Pelatih')}
            </div>

            {/* Section Lainnya (jika ada) */}
            {others.length > 0 && (
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '0.5px' }}>
                  LAINNYA
                  <span style={{ fontSize: '0.7rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '0.1rem 0.5rem', borderRadius: '10px', color: '#cbd5e1' }}>
                    {others.length}
                  </span>
                </h3>
                {renderUserTable(others, 'Lainnya')}
              </div>
            )}
          </div>
        )}

        {/* Action Warnings */}
        <div style={{ marginTop: '2rem', padding: '1.25rem', background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '12px', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <ShieldAlert size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontSize: '0.85rem', color: '#f87171', fontWeight: 700, marginBottom: '0.25rem' }}>PROTOKOL KESELAMATAN SUPERADMIN</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Setiap tindakan pengaturan password paksa atau penghapusan akun personil bersifat instan dan langsung terpengaruh pada cloud database Supabase. Pastikan Anda telah melakukan koordinasi OOC dengan Command Staff / Pimpinan Dismag sebelum melakukan tindakan.
            </p>
          </div>
        </div>

        {/* Reset Password Modal */}
        <Modal 
          open={isResetModalOpen} 
          onClose={() => setIsResetModalOpen(false)}
          title={`Reset Password: ${selectedUser?.username}`}
        >
          <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              Masukkan password baru untuk akun **{selectedUser?.email}**. Pengguna akan ter-logout secara otomatis jika sesi token mereka kedaluwarsa, dan harus login menggunakan password baru ini.
            </p>

            <div className="form-group">
              <label htmlFor="new-force-password">Password Baru <span className="required">*</span></label>
              <input
                type="password"
                id="new-force-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm-force-password">Ulangi Password Baru <span className="required">*</span></label>
              <input
                type="password"
                id="confirm-force-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Konfirmasi password baru"
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setIsResetModalOpen(false)}
                disabled={isSubmittingReset}
              >
                Batal
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSubmittingReset}
              >
                {isSubmittingReset ? 'Mereset...' : 'Simpan Password Baru'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </RoleGuard>
  );
}
