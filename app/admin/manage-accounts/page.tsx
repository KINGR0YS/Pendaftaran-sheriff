'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import RoleGuard from '@/components/RoleGuard';
import Modal from '@/components/Modal';
import { 
  listUsers, 
  forceResetPassword, 
  deleteUser 
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
  UserCheck
} from 'lucide-react';

interface AccountUser {
  id: string;
  email: string;
  username: string;
  role: string;
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
      fetchUsers(accessToken);
    } else {
      showToast(res.message || 'Gagal menghapus akun.', 'error');
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <div className="table-responsive" style={{ overflowX: 'auto', border: '1px solid var(--color-border-custom)', borderRadius: '8px', background: 'var(--color-bg-card)' }}>
            <table className="roster-table" style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '2px solid var(--color-border-custom)' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Nama Pengguna</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Email Kantor</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', width: '150px' }}>Hak Akses / Peran</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', width: '180px' }}>Terdaftar</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', width: '220px' }}>Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  const roleLabel = u.role.toUpperCase();
                  
                  let roleColor = '#cbd5e1';
                  let roleBg = 'rgba(255,255,255,0.05)';
                  let roleBorder = 'rgba(255,255,255,0.1)';

                  if (u.role === 'superadmin') {
                    roleColor = '#f87171';
                    roleBg = 'rgba(239, 68, 68, 0.08)';
                    roleBorder = 'rgba(239, 68, 68, 0.2)';
                  } else if (u.role === 'admin') {
                    roleColor = '#d4af37';
                    roleBg = 'rgba(212, 175, 55, 0.08)';
                    roleBorder = 'rgba(212, 175, 55, 0.2)';
                  } else if (u.role === 'trainer') {
                    roleColor = '#60a5fa';
                    roleBg = 'rgba(59, 130, 246, 0.08)';
                    roleBorder = 'rgba(59, 130, 246, 0.2)';
                  }

                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border-custom)' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {u.username}
                          {isCurrent && (
                            <span style={{ 
                              fontSize: '0.65rem', 
                              background: 'rgba(16, 185, 129, 0.1)', 
                              color: '#10b981', 
                              padding: '0.1rem 0.4rem', 
                              borderRadius: '4px',
                              border: '1px solid rgba(16,185,129,0.2)' 
                            }}>
                              Anda
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>{u.email}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          fontWeight: 700, 
                          color: roleColor, 
                          background: roleBg, 
                          border: `1px solid ${roleBorder}`, 
                          padding: '0.2rem 0.6rem', 
                          borderRadius: '20px',
                          letterSpacing: '0.5px'
                        }}>
                          {roleLabel}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {new Date(u.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td style={{ padding: '0.4rem 1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleOpenResetModal(u)}
                            className="btn btn-sm btn-secondary"
                            title="Reset Password Paksa"
                            style={{ padding: '0.35rem 0.5rem' }}
                          >
                            <KeyRound size={13} style={{ marginRight: '3px' }} /> Reset PW
                          </button>
                          
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="btn btn-sm btn-danger"
                            title="Hapus Akun Permanen"
                            disabled={isCurrent}
                            style={{ 
                              padding: '0.35rem 0.5rem',
                              opacity: isCurrent ? 0.3 : 1 
                            }}
                          >
                            <Trash2 size={13} style={{ marginRight: '3px' }} /> Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
