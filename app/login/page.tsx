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
    <div className="login-page-root">
      <div className="glow-bg glow-1"></div>
      <div className="glow-bg glow-2"></div>

      <div className="login-container glass-card">
        <div className="login-header">
          <div className="login-logo-row">
            <Image src="/logo.png" alt="Roxwood Sheriff Logo" width={100} height={100} className="login-logo-img" />
            <Image src="/logo-dismag.png" alt="DISMAG Logo" width={100} height={100} className="login-logo-img" />
          </div>
          <h2>Akses database Probatus</h2>
          <p>Silahkan login menggunakan akun yang sudah di siapkan untuk mengakses database.</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group login-form-group">
            <label htmlFor="login-email" className="login-label">
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
          <div className="form-group login-form-group-last">
            <label htmlFor="login-password" className="login-label">
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
          <button type="submit" className="btn btn-block btn-primary login-submit-btn" disabled={loading}>
            {loading ? 'Mengautentikasi...' : <>Autentikasi Akses <ShieldCheck size={16} /></>}
          </button>
        </form>

        <div className="login-warning-box">
          <h4 className="login-warning-title">Peringatan</h4>
          <p className="login-warning-text">
            Gunakan akses dengan bijak jangan mengedit atau menghapus data tanpa konfirmasi Anggota Dismag lain nya.
          </p>
        </div>

        <div className="login-footer">
          <p className="login-footer-text">Hanya untuk personel terdaftar. Aktivitas login dicatat secara OOC.</p>
        </div>
      </div>
    </div>
  );
}
