'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { BarChart2, ClipboardList, ClipboardX, UsersRound, Settings } from 'lucide-react';

const sidebarItems = [
  { href: '/admin', label: 'Ringkasan Utama', icon: <BarChart2 size={16} />, exact: true },
  { href: '/admin/applications', label: 'Formulir Masuk', icon: <ClipboardList size={16} /> },
  { href: '/admin/rejected', label: 'Riwayat Penolakan', icon: <ClipboardX size={16} /> },
  { href: '/admin/roster', label: 'Pendataan Probatus', icon: <UsersRound size={16} /> },
  { href: '/admin/settings', label: 'Pengaturan', icon: <Settings size={16} /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [displayName, setDisplayName] = useState('DISMAG ON FIRE');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      const user = session.user;
      const name = user.user_metadata?.display_name
        || user.user_metadata?.full_name
        || user.email?.split('@')[0]
        || 'DISMAG ON FIRE';
      setDisplayName(name);
    });
  }, []);

  return (
    <aside className="dashboard-sidebar">
      <div style={{ padding: '0 1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ border: '1px solid rgba(251, 191, 36, 0.3)', background: 'rgba(15, 23, 42, 0.6)', padding: '0.25rem', borderRadius: 8, width: 40, height: 40, flexShrink: 0 }}>
            <Image src="/logo.png" alt="Logo" width={32} height={32} style={{ objectFit: 'contain' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</h4>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>DISMAG ON FIRE</span>
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
  );
}
