'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { BarChart2, ClipboardList, ClipboardX, UsersRound, Settings } from 'lucide-react';

const sidebarItems = [
  { href: '/admin', label: 'Ringkasan Utama', icon: <BarChart2 size={16} />, exact: true },
  { href: '/admin/applications', label: 'Formulir Masuk', icon: <ClipboardList size={16} /> },
  { href: '/admin/rejected', label: 'Riwayat Penolakan', icon: <ClipboardX size={16} /> },
  { href: '/admin/roster', label: 'Pendataan Probatus', icon: <UsersRound size={16} /> },
  { href: '/admin/settings', label: 'Pengaturan', icon: <Settings size={16} /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState('admin@roxwood.gov');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
        return;
      }
      setUserEmail(session.user.email || 'admin@roxwood.gov');
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 70px)' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Memuat dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div style={{ padding: '0 1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ border: '1px solid rgba(251, 191, 36, 0.3)', background: 'rgba(15, 23, 42, 0.6)', padding: '0.25rem', borderRadius: 8, width: 40, height: 40 }}>
              <Image src="/logo.png" alt="Logo" width={32} height={32} style={{ objectFit: 'contain' }} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>{userEmail}</h4>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Commanding Officer</span>
            </div>
          </div>
        </div>
        <nav className="sidebar-menu">
          {sidebarItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-menu-item ${isActive ? 'active' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                {item.icon} {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="dashboard-main-content">
        {children}
      </div>
    </div>
  );
}
