'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import {
  BarChart2, ClipboardList, ClipboardX, UsersRound,
  Settings, Award, Calendar, LogOut, Shield, UserCog
} from 'lucide-react';

const adminItems = [
  { href: '/admin', label: 'Ringkasan Utama', icon: <BarChart2 size={16} />, exact: true },
  { href: '/admin/formulir-masuk', label: 'Formulir Masuk', icon: <ClipboardList size={16} /> },
  { href: '/admin/riwayat-penolakan', label: 'Riwayat Penolakan', icon: <ClipboardX size={16} /> },
  { href: '/admin/pendataan-probatus', label: 'Pendataan Probatus', icon: <UsersRound size={16} /> },
];

const trainingItems = [
  { href: '/admin/nilai-probatus', label: 'Nilai Probatus', icon: <Award size={16} /> },
  { href: '/admin/absensi-probatus', label: 'Absensi Probatus', icon: <Calendar size={16} /> },
  { href: '/admin/absensi-pelatih', label: 'Absensi Pelatih', icon: <Calendar size={16} /> },
];

const settingsItems = [
  { href: '/admin/settings', label: 'Pengaturan', icon: <Settings size={16} /> },
];

interface SidebarGroup {
  label: string;
  items: typeof adminItems;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('Admin');
  const [role, setRole] = useState<string>('dismag');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      const user = session.user;
      const name = user.user_metadata?.username
        || user.user_metadata?.display_name
        || user.user_metadata?.full_name
        || user.email?.split('@')[0]
        || 'Admin';
      setDisplayName(name);
      setRole(user.user_metadata?.role || 'dismag');
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const isTrainer = role === 'pelatih';
  const isSuperAdmin = role === 'superadmin';
  
  let RoleIcon = Shield;
  let roleLabel = 'DISMAG';
  let roleBg = 'rgba(212,175,55,0.12)';
  let roleColor = '#d4af37';
  let roleBorder = 'rgba(212,175,55,0.3)';

  if (isTrainer) {
    RoleIcon = UserCog;
    roleLabel = 'PELATIH';
    roleBg = 'rgba(59,130,246,0.12)';
    roleColor = '#60a5fa';
    roleBorder = 'rgba(59,130,246,0.3)';
  } else if (isSuperAdmin) {
    RoleIcon = Shield;
    roleLabel = 'SUPERADMIN';
    roleBg = 'rgba(239,68,68,0.12)';
    roleColor = '#f87171';
    roleBorder = 'rgba(239,68,68,0.3)';
  }

  const groups: SidebarGroup[] = [
    { label: 'ADMIN PANEL', items: adminItems },
    { label: 'TRAINING', items: trainingItems },
    { 
      label: 'SISTEM', 
      items: [
        ...settingsItems,
        ...(isSuperAdmin ? [{ href: '/admin/manage-accounts', label: 'Manajemen Akun', icon: <UserCog size={16} /> }] : [])
      ] 
    },
  ];

  const renderItem = (item: typeof adminItems[0]) => {
    const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`sidebar-menu-item ${isActive ? 'active' : ''}`}
        style={{ textDecoration: 'none' }}
      >
        <span className="sidebar-item-icon">{item.icon}</span>
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className="dashboard-sidebar">
      {/* User Profile Header */}
      <div className="sidebar-profile">
        <div className="sidebar-avatar">
          <Image src="/logo.png" alt="Logo" width={32} height={32} style={{ objectFit: 'contain' }} />
        </div>
        <div className="sidebar-user-info">
          <h4 className="sidebar-username">{displayName}</h4>
          <div className="sidebar-role-badge" style={{ background: roleBg, color: roleColor, border: `1px solid ${roleBorder}` }}>
            <RoleIcon size={10} />
            <span>{roleLabel}</span>
          </div>
        </div>
      </div>

      <div className="sidebar-divider" />

      {/* Nav Groups */}
      <nav className="sidebar-nav">
        {groups.map((group) => (
          <div key={group.label} className="sidebar-group">
            <span className="sidebar-group-label">{group.label}</span>
            <div className="sidebar-menu">
              {group.items.map(renderItem)}
            </div>
          </div>
        ))}
      </nav>

      <div className="sidebar-divider" style={{ marginTop: 'auto' }} />

      {/* Logout */}
      <div style={{ padding: '0.75rem' }}>
        <button onClick={handleLogout} className="sidebar-logout-btn">
          <LogOut size={15} />
          <span>Keluar dari Akun</span>
        </button>
      </div>
    </aside>
  );
}
