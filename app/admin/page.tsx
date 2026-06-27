'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MailWarning, CheckCircle2, XCircle, Users, Inbox } from 'lucide-react';

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

      const activeBatch = localStorage.getItem('active_batch') || '1';
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

      // Load activity logs from localStorage
      const logs = JSON.parse(localStorage.getItem('activity_logs') || '[]');
      setActivityLogs(logs.slice(0, 10));
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
            <div key={i} className="skeleton skeleton-row" style={{ height: 90 }} />
          ))}
        </div>
        <div style={{ marginTop: '1.5rem' }}>
          <div className="skeleton skeleton-row" style={{ height: 200 }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="dashboard-title">Ringkasan Operasional</h2>

      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card">
          <div className="card-icon yellow"><MailWarning size={24} /></div>
          <div className="card-details">
            <h3>{pendingCount}</h3>
            <p>Pendaftaran Butuh Review</p>
          </div>
        </div>
        <div className="dashboard-stat-card">
          <div className="card-icon green"><CheckCircle2 size={24} /></div>
          <div className="card-details">
            <h3>{acceptedCount}</h3>
            <p>Penerimaan Angkatan Ini</p>
          </div>
        </div>
        <div className="dashboard-stat-card">
          <div className="card-icon red"><XCircle size={24} /></div>
          <div className="card-details">
            <h3>{rejectedCount}</h3>
            <p>Formulir Ditolak</p>
          </div>
        </div>
        <div className="dashboard-stat-card">
          <div className="card-icon blue"><Users size={24} /></div>
          <div className="card-details">
            <h3>{rosterCount}</h3>
            <p>Total Anggota Diterima</p>
          </div>
        </div>
      </div>

      <div className="dashboard-sections-split">
        <div className="glass-card section-card">
          <h3>Aktivitas Roster Terbaru</h3>
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

        <div className="glass-card section-card">
          <h3>Informasi Sistem Database</h3>
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
  );
}
