'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MailWarning, CheckCircle2 } from 'lucide-react';

export default function AdminStatsPage() {
  const [pendingCount, setPendingCount] = useState(0);
  const [acceptedCount, setAcceptedCount] = useState(0);
  const [activityLogs, setActivityLogs] = useState<{ time: string; text: string }[]>([]);

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

      // Load activity logs from localStorage
      const logs = JSON.parse(localStorage.getItem('activity_logs') || '[]');
      setActivityLogs(logs.slice(0, 10));
    } catch (e) {
      console.error(e);
    }
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
      </div>

      <div className="dashboard-sections-split">
        <div className="glass-card section-card">
          <h3>Aktivitas Roster Terbaru</h3>
          <div className="activity-log">
            {activityLogs.length === 0 ? (
              <div className="log-item">Belum ada aktivitas.</div>
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
            <p>Situs web terhubung ke: <strong style={{ color: 'var(--color-success)' }}>Supabase Cloud Database</strong></p>
            <p>Kredensial dikonfigurasi melalui variabel environment (`.env.local`).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
