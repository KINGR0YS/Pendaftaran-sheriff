'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import Image from 'next/image';
import { ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('LoginPage: Current session:', session);
      if (session) {
        console.log('LoginPage: Session active, redirecting to /admin');
        router.push('/admin');
      }
    });
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log('handleLogin: Attempting login with email:', email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      console.log('handleLogin: Supabase response data:', data, 'error:', error);
      if (error) throw error;
      showToast('Berhasil masuk! Selamat bekerja.', 'success');
      console.log('handleLogin: Success! Redirecting to /admin...');
      router.push('/admin');
    } catch (err: any) {
      console.error('handleLogin: Catch block error:', err);
      showToast(err.message || 'Gagal login. Cek lagi email dan password kamu.', 'error');
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
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <Image src="/logo.png" alt="Roxwood Sheriff Logo" width={100} height={100} style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(212, 175, 55, 0.25))' }} />
            <Image src="/logo-dismag.png" alt="DISMAG Logo" width={100} height={100} style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(212, 175, 55, 0.25))' }} />
          </div>
          <h2>Akses database Probatus</h2>
          <p>Silahkan login menggunakan akun yang sudah di siapkan untuk mengakses database.</p>
        </div>

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
        </form>

        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 8 }}>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--color-error)', marginBottom: '0.25rem' }}>Peringatan</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            Gunakan akses dengan bijak jangan mengedit atau menghapus data tanpa konfirmasi Anggota Dismag lain nya.
          </p>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Hanya untuk personel terdaftar. Aktivitas login dicatat secara OOC.</p>
        </div>
      </div>
    </div>
  );
}
