'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { ShieldAlert, LayoutDashboard, LogOut, Menu } from 'lucide-react';
import Image from 'next/image';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [recruitmentStatus, setRecruitmentStatus] = useState('open');
  const [activeBatch, setActiveBatch] = useState('1');
  const { showToast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    setRecruitmentStatus(localStorage.getItem('recruitment_status') || 'open');
    setActiveBatch(localStorage.getItem('active_batch') || '1');
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleApplyNavClick = (e: React.MouseEvent) => {
    e.preventDefault();
    showToast('Silakan baca persyaratan di halaman utama sampai paling bawah untuk mendaftar!', 'warning');
    if (pathname !== '/') {
      window.location.href = '/';
    }
  };

  const isClosed = recruitmentStatus === 'closed';
  const dotClass = isClosed ? 'pulse-dot closed' : 'pulse-dot active';
  const statusText = isClosed ? 'REKRUTMEN: TUTUP' : `REKRUTMEN: BUKA (ANGKATAN ${activeBatch})`;

  return (
    <header className="navbar">
      <div className="nav-container">
        <Link href="/" className="nav-logo" style={{ textDecoration: 'none' }}>
          <Image src="/logo.png" alt="Roxwood Sheriff Logo" width={42} height={42} style={{ objectFit: 'contain' }} />
          <div className="nav-title-group">
            <span className="nav-logo-text">ROXWOOD</span>
            <span className="nav-subtitle">SHERIFF DEPARTMENT</span>
          </div>
        </Link>

        <nav className={`nav-links ${mobileOpen ? 'open' : ''}`}>
          <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
            Halaman Utama
          </Link>
          <Link href="/" className={`nav-link ${pathname === '/apply' ? 'active' : ''}`} onClick={handleApplyNavClick}>
            Pendaftaran
          </Link>
          {!user ? (
            <Link href="/login" className={`nav-link ${pathname === '/login' ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
              <ShieldAlert size={14} /> Admin Panel
            </Link>
          ) : (
            <>
              <Link href="/admin" className={`nav-link ${pathname.startsWith('/admin') ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
                <LayoutDashboard size={14} /> Dashboard
              </Link>
              <button className="nav-link" onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                Keluar <LogOut size={14} />
              </button>
            </>
          )}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="nav-status-badge">
            <span className={dotClass}></span>
            <span className="status-text">{statusText}</span>
          </div>
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
            <Menu />
          </button>
        </div>
      </div>
    </header>
  );
}
