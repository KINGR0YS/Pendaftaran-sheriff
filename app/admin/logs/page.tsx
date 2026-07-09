'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { Search, Inbox, ShieldAlert, Check, RefreshCw, Trash2, History } from 'lucide-react';
import RoleGuard from '@/components/RoleGuard';

interface ActivityLog {
  id: string;
  username: string;
  role: string;
  action: string;
  created_at: string;
}

export default function LogsPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('dismag');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const role = session.user.user_metadata?.role || 'dismag';
        const normalizedRole = role === 'admin' ? 'dismag' : (role === 'trainer' ? 'pelatih' : role);
        setCurrentUserRole(normalizedRole);
      }
    });
    loadLogs();
  }, []);

  async function loadLogs() {
    setIsLoading(true);
    setDbError(null);
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        if (error.message.includes('relation') || error.code === '42P01') {
          setDbError('Tabel database activity_logs belum dibuat di Supabase.');
        } else {
          throw error;
        }
      } else {
        setLogs(data || []);
      }
    } catch (err: any) {
      showToast('Gagal memuat log aktivitas: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }

  const handleClearLogs = async () => {
    if (currentUserRole !== 'superadmin') {
      showToast('Hanya Superadmin yang dapat menghapus log aktivitas.', 'error');
      return;
    }

    if (!confirm('Apakah Anda yakin ingin menghapus seluruh log aktivitas secara permanen?')) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from('activity_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      showToast('Seluruh log aktivitas berhasil dihapus.', 'success');
      loadLogs();
    } catch (err: any) {
      showToast('Gagal menghapus log: ' + err.message, 'error');
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || log.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeClass = (role: string) => {
    return `badge-role ${role}`;
  };

  if (dbError) {
    return (
      <RoleGuard allowedRoles={['dismag']}>
        <div className="glass-card db-error-card">
          <div className="db-error-header">
            <ShieldAlert size={40} />
            <h2>Migrasi Database Diperlukan</h2>
          </div>
          <p>
            Tabel untuk fitur **Log Aktivitas** belum dibuat di database Supabase Anda. 
            Silakan jalankan skrip SQL berikut di **SQL Editor Supabase** proyek Anda:
          </p>

          <pre className="db-error-sql">
{`CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  role TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;`}
          </pre>

          <button className="btn btn-primary" onClick={loadLogs} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Check size={16} /> Saya sudah menjalankan SQL, Coba Lagi
          </button>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['dismag']}>
      <div>
        
        {/* Header Action Row */}
        <div className="header-action-row">
          <h2 className="dashboard-title">
            <History size={24} /> Log Aktivitas Sistem
            <span className="count-badge">
              {isLoading ? '...' : `${filteredLogs.length} Log`}
            </span>
          </h2>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-sm btn-secondary" onClick={loadLogs} disabled={isLoading}>
              <RefreshCw size={14} className={isLoading ? 'spin' : ''} /> Segarkan
            </button>
            {currentUserRole === 'superadmin' && (
              <button className="btn btn-sm btn-danger" onClick={handleClearLogs} disabled={isLoading}>
                <Trash2 size={14} /> Bersihkan Log
              </button>
            )}
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="filter-bar">
          <div className="search-input-wrapper">
            <Search size={16} />
            <input
              type="text"
              placeholder="Cari berdasarkan nama atau tindakan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="role-filter">Filter Peran:</label>
            <select
              id="role-filter"
              className="filter-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">Semua Peran</option>
              <option value="superadmin">Superadmin</option>
              <option value="dismag">Dismag</option>
              <option value="pelatih">Pelatih</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>Memuat log aktivitas...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="empty-state">
            <Inbox />
            <h3>Tidak Ada Log Aktivitas</h3>
            <p>Belum ada aktivitas yang tercatat atau cocok dengan filter Anda.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="roster-table">
              <thead>
                <tr>
                  <th style={{ width: '180px' }}>Waktu</th>
                  <th style={{ width: '180px' }}>Pengguna</th>
                  <th style={{ textAlign: 'center', width: '120px' }}>Peran</th>
                  <th>Tindakan / Aktivitas</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="log-time-cell">
                      {new Date(log.created_at).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="log-user-cell">
                      {log.username}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={getRoleBadgeClass(log.role)}>
                        {log.role === 'superadmin' ? 'Superadmin' : (log.role === 'dismag' ? 'Dismag' : 'Pelatih')}
                      </span>
                    </td>
                    <td className="log-action-cell">
                      <span dangerouslySetInnerHTML={{ __html: log.action }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </RoleGuard>
  );
}
