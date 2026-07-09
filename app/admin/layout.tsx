'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import { ShieldAlert, LogOut } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isInactive, setIsInactive] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
        return;
      }
      if (session.user?.user_metadata?.status === 'inactive') {
        setIsInactive(true);
        setLoading(false);
        return;
      }
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 70px)', gap: '1rem' }}>
        <div className="loading-spinner" />
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Mengautentikasi sesi admin...</p>
      </div>
    );
  }

  if (isInactive) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh', 
        background: '#0a0e1a', 
        color: '#f8fafc',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '16px',
          padding: '2.5rem',
          maxWidth: '450px',
          boxShadow: '0 12px 48px rgba(0,0,0,0.5)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1.5px solid rgba(239, 68, 68, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <ShieldAlert size={32} color="#ef4444" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f87171', marginBottom: '0.75rem' }}>
            Akses Ditangguhkan
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Akun Anda telah dinonaktifkan oleh Superadmin. Anda tidak memiliki izin untuk mengakses menu admin.
          </p>
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/login');
            }}
            className="btn btn-primary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '44px' }}
          >
            <LogOut size={16} /> Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main-content">
        {children}
      </div>
    </div>
  );
}

