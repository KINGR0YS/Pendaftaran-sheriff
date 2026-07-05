'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import { Search, Inbox, Eye } from 'lucide-react';

export default function NilaiProbatusPage() {
  const { showToast } = useToast();
  const [roster, setRoster] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [adminEmail, setAdminEmail] = useState('System Admin');
  const [isLoading, setIsLoading] = useState(true);

  // States untuk Nilai Probatus
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [evalType, setEvalType] = useState<'tambah' | 'kurangi'>('tambah');
  const [evalAmount, setEvalAmount] = useState<string>('');
  const [evalReason, setEvalReason] = useState('');
  const [evalTargetMember, setEvalTargetMember] = useState<any>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyTargetMember, setHistoryTargetMember] = useState<any>(null);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // State untuk Nama Pelatih/Penilai input manual
  const [evaluatorName, setEvaluatorName] = useState('');
  
  // State untuk rekap absensi harian
  const [attendanceSummaryMap, setAttendanceSummaryMap] = useState<Record<string, { Hadir: number; Izin: number; Terlambat: number; Alfa: number }>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setAdminEmail(session.user.email);
      }
    });
  }, []);

  useEffect(() => {
    loadTrainees();
    loadAttendanceSummary();
  }, []);

  async function loadTrainees() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('status', 'approved')
        .eq('training_status', 'sedang dalam pelatihan')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRoster(data || []);
    } catch (err) {
      showToast('Gagal memuat data dari database cloud.', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadAttendanceSummary() {
    try {
      const { data, error } = await supabase
        .from('probatus_attendance')
        .select('application_id, status');
      if (error) throw error;

      const summary: Record<string, { Hadir: number; Izin: number; Terlambat: number; Alfa: number }> = {};
      data?.forEach(row => {
        if (!summary[row.application_id]) {
          summary[row.application_id] = { Hadir: 0, Izin: 0, Terlambat: 0, Alfa: 0 };
        }
        const s = row.status;
        if (s === 'HADIR') {
          summary[row.application_id].Hadir++;
        } else if (s === 'IZIN' || s === 'NGEJAR MATERI') {
          summary[row.application_id].Izin++;
        } else if (s === 'TERLAMBAT' || s === 'TIDAK SAMPAI SELESAI') {
          summary[row.application_id].Terlambat++;
        } else if (s === 'TIDAK HADIR') {
          summary[row.application_id].Alfa++;
        }
      });
      setAttendanceSummaryMap(summary);
    } catch (err) {
      console.error('Gagal memuat rekap absensi:', err);
    }
  }

  const logActivity = (text: string) => {
    const logs = JSON.parse(localStorage.getItem('activity_logs') || '[]');
    logs.unshift({ time: new Date().toISOString(), text });
    localStorage.setItem('activity_logs', JSON.stringify(logs.slice(0, 10)));
  };

  const filtered = roster.filter(member =>
    member.ic_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.steam_hex?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openEvaluationModal = (member: any, type: 'tambah' | 'kurangi') => {
    setEvalTargetMember(member);
    setEvalType(type);
    setEvalAmount('');
    setEvalReason('');
    setIsEvalModalOpen(true);
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalTargetMember) return;
    if (!evaluatorName.trim()) {
      showToast('Nama pelatih/penilai wajib diisi.', 'error');
      return;
    }
    const numericAmount = parseInt(evalAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      showToast('Jumlah nilai harus berupa angka positif lebih dari 0.', 'error');
      return;
    }
    if (!evalReason.trim()) {
      showToast('Keterangan/Alasan wajib diisi.', 'error');
      return;
    }

    const change = evalType === 'tambah' ? numericAmount : -numericAmount;
    const currentScore = evalTargetMember.probatus_score ?? 0;
    const newScore = currentScore + change;

    try {
      const { error: historyError } = await supabase
        .from('probatus_evaluations')
        .insert([{
          application_id: evalTargetMember.id,
          amount: change,
          evaluation_type: evalType,
          reason: evalReason.trim(),
          evaluator_name: evaluatorName.trim()
        }]);

      if (historyError) throw historyError;

      const { error: appError } = await supabase
        .from('applications')
        .update({ probatus_score: newScore })
        .eq('id', evalTargetMember.id);

      if (appError) throw appError;

      // Update local state
      setRoster(prev => prev.map(m => m.id === evalTargetMember.id ? { ...m, probatus_score: newScore } : m));
      
      logActivity(`Penilaian ${evalType} (${change > 0 ? '+' : ''}${change}) diberikan untuk <strong>${evalTargetMember.ic_name}</strong> oleh ${evaluatorName.trim()}`);
      showToast('Penilaian berhasil disimpan.', 'success');
      setIsEvalModalOpen(false);
    } catch (err: any) {
      showToast(`Gagal menyimpan penilaian: ${err.message}`, 'error');
    }
  };

  const openHistoryModal = async (member: any) => {
    setHistoryTargetMember(member);
    setIsHistoryModalOpen(true);
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('probatus_evaluations')
        .select('*')
        .eq('application_id', member.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setHistoryLogs(data || []);
    } catch (err: any) {
      showToast(`Gagal memuat riwayat: ${err.message}`, 'error');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  return (
    <div>
      <div className="header-action-row">
        <h2 className="dashboard-title">
          Penilaian Probatus
          <span style={{ marginLeft: '0.75rem', fontSize: '0.8rem', background: 'var(--color-bg-card)', padding: '0.2rem 0.6rem', borderRadius: '12px', border: '1px solid var(--color-border-custom)', color: 'var(--color-text-secondary)' }}>
            {isLoading ? '...' : `${roster.length} Anggota Pelatihan`}
          </span>
        </h2>
      </div>

      <div className="search-input-wrapper" style={{ maxWidth: 400, marginBottom: '1.5rem' }}>
        <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input
          type="text"
          placeholder="Cari berdasarkan nama/steam hex..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ paddingLeft: '2.25rem' }}
        />
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem' }}>
          <div className="loading-spinner" />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Memuat data...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Inbox />
          <h3>Tidak Ada Anggota</h3>
          <p>
            {roster.length === 0
              ? 'Tidak ada anggota yang sedang dalam status pelatihan.'
              : 'Tidak ditemukan anggota pelatihan yang cocok dengan pencarian Anda.'}
          </p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="roster-table">
            <thead>
              <tr>
                <th>Nama Karakter (IC)</th>
                <th>Steam HEX Code</th>
                <th>Angkatan</th>
                <th style={{ textAlign: 'center' }}>Total Nilai</th>
                <th style={{ textAlign: 'center' }}>Aksi Penilaian</th>
                <th style={{ textAlign: 'center' }}>Rekap Absensi</th>
                <th>Riwayat</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((member) => (
                <tr key={member.id}>
                  <td>
                    <strong>{member.ic_name}</strong>
                  </td>
                  <td><code>{member.steam_hex || '-'}</code></td>
                  <td>Angkatan {member.batch || '1'}</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.05rem', color: (member.probatus_score ?? 0) >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                    {member.probatus_score ?? 0}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button 
                        className="btn btn-sm btn-success" 
                        onClick={() => openEvaluationModal(member, 'tambah')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.35rem 0.75rem' }}
                      >
                        + Tambah
                      </button>
                      <button 
                        className="btn btn-sm btn-danger" 
                        onClick={() => openEvaluationModal(member, 'kurangi')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.35rem 0.75rem' }}
                      >
                        - Kurang
                      </button>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', fontSize: '0.75rem' }}>
                    {(() => {
                      const counts = attendanceSummaryMap[member.id] || { Hadir: 0, Izin: 0, Terlambat: 0, Alfa: 0 };
                      return (
                        <div style={{ display: 'inline-flex', gap: '0.5rem', fontFamily: 'monospace' }}>
                          <span style={{ color: 'var(--color-success)' }} title="Hadir">H:{counts.Hadir}</span>
                          <span style={{ color: 'var(--color-gold)' }} title="Izin / Ngejar Materi">I:{counts.Izin}</span>
                          <span style={{ color: '#fb923c' }} title="Terlambat / Tidak Selesai">T:{counts.Terlambat}</span>
                          <span style={{ color: 'var(--color-error)' }} title="Tidak Hadir / Alfa">A:{counts.Alfa}</span>
                        </div>
                      );
                    })()}
                  </td>
                  <td>
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => openHistoryModal(member)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <Eye size={14} /> Lihat Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Evaluation Modal */}
      <Modal
        open={isEvalModalOpen}
        onClose={() => setIsEvalModalOpen(false)}
        title={`Penilaian Probatus: ${evalType === 'tambah' ? 'Tambah Nilai (+)' : 'Kurangi Nilai (-)'}`}
        footer={null}
      >
        {evalTargetMember && (
          <form onSubmit={handleSaveEvaluation}>
            <div style={{ marginBottom: '1.25rem', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '6px', border: '1px solid var(--color-border-custom)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                <div><strong>Nama IC:</strong> {evalTargetMember.ic_name}</div>
                <div><strong>Steam HEX:</strong> <code>{evalTargetMember.steam_hex}</code></div>
                <div style={{ gridColumn: 'span 2', marginTop: '0.5rem' }}>
                  <strong>Total Nilai Saat Ini:</strong>{' '}
                  <span style={{ fontWeight: 'bold', color: (evalTargetMember.probatus_score ?? 0) >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                    {evalTargetMember.probatus_score ?? 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="eval-name">Nama Pelatih / Penilai <span className="required">*</span></label>
              <input
                type="text"
                id="eval-name"
                required
                value={evaluatorName}
                onChange={(e) => setEvaluatorName(e.target.value)}
                placeholder="Masukkan nama Anda (Pelatih)"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="eval-amount">Jumlah Nilai (Positif) <span className="required">*</span></label>
              <input
                type="number"
                id="eval-amount"
                min="1"
                required
                value={evalAmount}
                onChange={(e) => setEvalAmount(e.target.value)}
                placeholder="Masukkan angka, contoh: 10"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="eval-reason">Keterangan / Alasan Penilaian <span className="required">*</span></label>
              <textarea
                id="eval-reason"
                required
                rows={3}
                value={evalReason}
                onChange={(e) => setEvalReason(e.target.value)}
                placeholder="Tulis alasan atau rincian kegiatan penilaian..."
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  background: 'rgba(5, 7, 13, 0.6)',
                  border: '1px solid var(--color-border-custom)',
                  borderRadius: '6px',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsEvalModalOpen(false)}>Batal</button>
              <button 
                type="submit" 
                className={`btn ${evalType === 'tambah' ? 'btn-success' : 'btn-danger'}`}
              >
                {evalType === 'tambah' ? 'Tambah Nilai' : 'Kurangi Nilai'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* History Modal */}
      <Modal
        open={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`Riwayat Penilaian: ${historyTargetMember?.ic_name || ''}`}
        footer={<button className="btn btn-secondary" onClick={() => setIsHistoryModalOpen(false)}>Tutup</button>}
      >
        <div style={{ minHeight: '200px' }}>
          {isLoadingHistory ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '1rem' }}>
              <div className="loading-spinner" />
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Memuat riwayat...</p>
            </div>
          ) : historyLogs.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              Belum ada riwayat penilaian untuk anggota ini.
            </div>
          ) : (
            <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="roster-table" style={{ width: '100%', fontSize: '0.8rem' }}>
                <thead>
                  <tr>
                    <th>Waktu & Tanggal</th>
                    <th>Jenis</th>
                    <th>Nilai</th>
                    <th>Keterangan</th>
                    <th>Penilai</th>
                  </tr>
                </thead>
                <tbody>
                  {historyLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{new Date(log.created_at).toLocaleString('id-ID')}</td>
                      <td>
                        <span className={`badge ${log.evaluation_type === 'tambah' ? 'badge-success' : 'badge-danger'}`} style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          background: log.evaluation_type === 'tambah' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: log.evaluation_type === 'tambah' ? 'var(--color-success)' : 'var(--color-error)',
                          border: log.evaluation_type === 'tambah' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                        }}>
                          {log.evaluation_type === 'tambah' ? 'Tambah' : 'Kurangi'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 'bold', color: log.amount >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                        {log.amount >= 0 ? `+${log.amount}` : log.amount}
                      </td>
                      <td>{log.reason}</td>
                      <td>
                        <span className="processed-by-badge" style={{ fontSize: '0.7rem' }}>
                          {log.evaluator_name || 'Admin'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
