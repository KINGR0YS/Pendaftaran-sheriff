'use client';
import { useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldX, Loader2 } from 'lucide-react';

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setRole(session?.user?.user_metadata?.role || 'admin');
      setLoading(false);
    });
  }, []);

  // Saat masih loading, tampilkan konten tapi tanpa interaksi (prevent content leak)
  if (loading) {
    return (
      <div style={{ position: 'relative', minHeight: 200 }}>
        <div style={{ filter: 'blur(3px)', pointerEvents: 'none', opacity: 0.3 }}>
          {children}
        </div>
        <div style={{
          position: 'fixed',
          top: '82px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          padding: '0.9rem 1.5rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          <Loader2 size={16} color="var(--color-gold)" style={{ animation: 'spin 0.7s linear infinite' }} />
          <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>Memverifikasi akses…</span>
        </div>
      </div>
    );
  }

  const hasAccess = role === 'superadmin' || allowedRoles.includes(role!);

  return (
    <div style={{ position: 'relative' }}>
      {/* Konten halaman — blur jika tidak punya akses */}
      <div
        style={{
          filter: hasAccess ? 'none' : 'blur(1px)',
          pointerEvents: hasAccess ? 'auto' : 'none',
          userSelect: hasAccess ? 'auto' : 'none',
          transition: 'filter 0.3s ease',
          opacity: hasAccess ? 1 : 0.55,
        }}
      >
        {children}
      </div>

      {/* Overlay "Akses Terbatas" — fixed tepat di bawah topbar */}
      {!hasAccess && (
        <div
          style={{
            position: 'fixed',
            top: '82px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'rgba(10, 14, 26, 0.98)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '16px',
            padding: '1.75rem 2.5rem',
            boxShadow: '0 12px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(239,68,68,0.1)',
            width: '380px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1.5px solid rgba(239, 68, 68, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldX size={24} color="#ef4444" />
          </div>
          <h3
            style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              color: '#f87171',
              margin: 0,
              letterSpacing: '0.5px',
            }}
          >
            Akses Terbatas
          </h3>
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--color-text-secondary)',
              margin: 0,
              lineHeight: 1.65,
            }}
          >
            Kamu tidak memiliki akses edit di panel ini.
            <br />
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.73rem' }}>
              Silakan hubungi Admin untuk mendapatkan akses.
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
