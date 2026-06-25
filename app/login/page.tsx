'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import Image from 'next/image';
import { ShieldCheck, KeyRound, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'change-pass'>('login');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/admin');
    });
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      showToast('Koneksi aman terjalin. Selamat datang Sheriff!', 'success');
      router.push('/admin');
    } catch (err: any) {
      showToast(err.message || 'Gagal login. Periksa email/password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('Password baru tidak cocok.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password minimal 6 karakter.', 'error');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      showToast('Password berhasil diubah!', 'success');
      setMode('login');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: 'calc(100vh - 70px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glow-bg glow-1"></div>
      <div className="glow-bg glow-2"></div>

      <div className="login-container glass-card">
        <div className="login-header">
          <Image src="/logo.png" alt="Roxwood Sheriff Logo" width={115} height={115} style={{ objectFit: 'contain', marginBottom: '1.5rem', filter: 'drop-shadow(0 0 10px rgba(212, 175, 55, 0.25))' }} />
          <h2>{mode === 'login' ? 'Sheriff Access Center' : 'Ubah Kata Sandi'}</h2>
          <p>{mode === 'login'
            ? 'Silakan masuk menggunakan kredensial Biro Administrasi Sheriff Kerajaan Roxwood Anda.'
            : 'Masukkan password baru untuk akun Anda.'
          }</p>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLogin} style={{ marginTop: '1.5rem' }}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="login-email" style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                Email Kantor <span className="required">*</span>
              </label>
              <input
                type="email"
                id="login-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@roxwood.gov"
              />
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="login-password" style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                Kata Sandi <span className="required">*</span>
              </label>
              <input
                type="password"
                id="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="btn btn-block btn-primary" disabled={loading} style={{ height: 48 }}>
              {loading ? 'Mengautentikasi...' : <>Autentikasi Akses <ShieldCheck size={16} /></>}
            </button>
            <button
              type="button"
              onClick={() => setMode('change-pass')}
              style={{
                display: 'block', width: '100%', marginTop: '0.75rem', padding: '0.75rem',
                background: 'transparent', border: '1px solid var(--color-border-custom)',
                borderRadius: 8, color: 'var(--color-text-muted)', fontSize: '0.85rem',
                cursor: 'pointer', textAlign: 'center'
              }}
            >
              <KeyRound size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Ubah Kata Sandi
            </button>
          </form>
        ) : (
          <form onSubmit={handleChangePassword} style={{ marginTop: '1.5rem' }}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                Password Baru <span className="required">*</span>
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Minimal 6 karakter"
              />
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                Konfirmasi Password <span className="required">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Ulangi password baru"
              />
            </div>
            <button type="submit" className="btn btn-block btn-primary" disabled={loading} style={{ height: 48 }}>
              {loading ? 'Memproses...' : <>Simpan Password Baru <KeyRound size={16} /></>}
            </button>
            <button
              type="button"
              onClick={() => { setMode('login'); setNewPassword(''); setConfirmPassword(''); }}
              style={{
                display: 'block', width: '100%', marginTop: '0.75rem', padding: '0.75rem',
                background: 'transparent', border: '1px solid var(--color-border-custom)',
                borderRadius: 8, color: 'var(--color-text-muted)', fontSize: '0.85rem',
                cursor: 'pointer', textAlign: 'center'
              }}
            >
              <ArrowLeft size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Kembali ke Login
            </button>
          </form>
        )}

        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 8 }}>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--color-error)', marginBottom: '0.25rem' }}>Peringatan Otoritas Keamanan</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            Akses ini dilindungi oleh undang-undang Departemen Hukum Kerajaan Roxwood. Segala bentuk pelanggaran akses ilegal akan dilacak dan ditindak secara tegas baik IC maupun OOC.
          </p>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Hanya untuk personel terdaftar. Aktivitas login dicatat secara OOC.</p>
        </div>
      </div>
    </div>
  );
}
