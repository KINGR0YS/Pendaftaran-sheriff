'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MailWarning, CheckCircle2, XCircle, Users, Inbox } from 'lucide-react';
import RoleGuard from '@/components/RoleGuard';
import { getSystemSettings } from '@/lib/settings';
import { CardSkeleton } from '@/components/Skeleton';


export default function AdminStatsPage() {
  const [pendingCount, setPendingCount] = useState(0);
  const [acceptedCount, setAcceptedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [rosterCount, setRosterCount] = useState(0);
  const [activityLogs, setActivityLogs] = useState<{ time: string; text: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const { count: pending } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      setPendingCount(pending || 0);

      const settings = await getSystemSettings();
      const activeBatch = settings.active_batch;
      const { count: accepted } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
        .eq('batch', activeBatch);
      setAcceptedCount(accepted || 0);

      const { count: rejected } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rejected');
      setRejectedCount(rejected || 0);

      const { count: roster } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');
      setRosterCount(roster || 0);

      // Load activity logs from database
      const { data: dbLogs, error: logsError } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!logsError && dbLogs) {
        setActivityLogs(dbLogs.map(log => ({
          time: log.created_at,
          text: log.action.includes('(') ? log.action : `<strong>${log.username}</strong> (${log.role.toUpperCase()}): ${log.action}`
        })));
      } else {
        // Fallback to localStorage
        const logs = JSON.parse(localStorage.getItem('activity_logs') || '[]');
        setActivityLogs(logs.slice(0, 10));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div>
        <h2 className="dashboard-title">Ringkasan Operasional</h2>
        <div className="dashboard-stats-grid">
          {[1, 2, 3, 4].map(i => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="dashboard-sections-split mt-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['dismag']}>
      <div>
        <h2 className="dashboard-title">Ringkasan Operasional</h2>

        <div className="dashboard-stats-grid">
          <div className="stat-card">
            <div className="flex items-center gap-4">
              <div className="stat-card-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                <MailWarning size={24} />
              </div>
              <div>
                <div className="stat-card-value">{pendingCount}</div>
                <div className="stat-card-label">Butuh Review</div>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-4">
              <div className="stat-card-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <CheckCircle2 size={24} />
              </div>
              <div>
                <div className="stat-card-value">{acceptedCount}</div>
                <div className="stat-card-label">Diterima Angkatan Ini</div>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-4">
              <div className="stat-card-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                <XCircle size={24} />
              </div>
              <div>
                <div className="stat-card-value">{rejectedCount}</div>
                <div className="stat-card-label">Formulir Ditolak</div>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-4">
              <div className="stat-card-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                <Users size={24} />
              </div>
              <div>
                <div className="stat-card-value">{rosterCount}</div>
                <div className="stat-card-label">Total Anggota</div>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-sections-split">
          <div className="stat-card">
            <h3 style={{ fontFamily: 'var(--font-header)', fontSize: '1rem', marginBottom: '1rem', color: 'var(--color-text-primary)' }}>Aktivitas Terbaru</h3>
            <div className="activity-log">
              {activityLogs.length === 0 ? (
                <div className="empty-state">
                  <Inbox size={40} />
                  <p>Belum ada aktivitas tercatat.</p>
                </div>
              ) : (
                activityLogs.map((log, i) => (
                  <div key={i} className="log-item">
                    <span className="log-time">[{new Date(log.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}]</span>
                    <span dangerouslySetInnerHTML={{ __html: log.text }} />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="stat-card">
            <h3 style={{ fontFamily: 'var(--font-header)', fontSize: '1rem', marginBottom: '1rem', color: 'var(--color-text-primary)' }}>Informasi Sistem</h3>
            <div className="info-content-box">
              <p>Situs web terhubung ke: <strong style={{ color: 'var(--color-success)' }}>cloud database</strong></p>
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--color-border-custom)' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  Versi Aplikasi: <strong style={{ color: 'var(--color-text-secondary)' }}>v2.0</strong> — Sheriff Recruitment System
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
