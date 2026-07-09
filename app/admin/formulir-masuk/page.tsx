'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import { Eye, ShieldAlert, XCircle, CheckCircle2, Trash2, Inbox, ClipboardList } from 'lucide-react';
import RoleGuard from '@/components/RoleGuard';
import { logActivity } from '@/lib/activity-log';


export default function ApplicationsPage() {
  const { showToast } = useToast();
  const [apps, setApps] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState('System Admin');
  const [isLoading, setIsLoading] = useState(true);

  // Reject Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [appToReject, setAppToReject] = useState<any>(null);
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);
  const [isSubmittingApprove, setIsSubmittingApprove] = useState(false);

  // Interview Assessment Modal State
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [appToAssess, setAppToAssess] = useState<any>(null);
  const [assessmentForm, setAssessmentForm] = useState({
    etika: '50',
    komunikasi: '50',
    penampilan: '50',
    pemahaman_peraturan: '50',
    pemahaman_kasus: '50',
    pengalaman_organisasi: '',
    pengalaman_instansi: ''
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const user = session.user;
        const name = user.user_metadata?.username
          || user.user_metadata?.display_name
          || user.user_metadata?.full_name
          || user.email?.split('@')[0]
          || 'System Admin';
        setDisplayName(name);
      }
    });
  }, []);

  useEffect(() => {
    loadApplications();
  }, [statusFilter]);

  async function loadApplications() {
    setIsLoading(true);
    try {
      let query = supabase.from('applications').select('*');
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setApps(data || []);
    } catch (err: any) {
      showToast('Gagal memuat pendaftaran dari database cloud.', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  const handleApproveClick = (app: any) => {
    setAppToAssess(app);
    setAssessmentForm({
      etika: '50',
      komunikasi: '50',
      penampilan: '50',
      pemahaman_peraturan: '50',
      pemahaman_kasus: '50',
      pengalaman_organisasi: '',
      pengalaman_instansi: ''
    });
    setIsAssessmentModalOpen(true);
  };

  const handleAssessmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appToAssess) return;

    setIsSubmittingApprove(true);
    try {
      // 1. Simpan penilaian ke database
      const { error: assessErr } = await supabase.from('applications').update({
        interview_etika: parseInt(assessmentForm.etika),
        interview_komunikasi: parseInt(assessmentForm.komunikasi),
        interview_penampilan: parseInt(assessmentForm.penampilan),
        interview_pemahaman_peraturan: parseInt(assessmentForm.pemahaman_peraturan),
        interview_pemahaman_kasus: parseInt(assessmentForm.pemahaman_kasus),
        interview_pengalaman_organisasi: assessmentForm.pengalaman_organisasi,
        interview_pengalaman_instansi: assessmentForm.pengalaman_instansi,
        interview_evaluator: displayName,
        interview_assessed_at: new Date().toISOString()
      }).eq('id', appToAssess.id);
      if (assessErr) throw assessErr;

      // 2. Update status and processed_by
      const { error: appErr } = await supabase.from('applications').update({ 
        status: 'approved',
        processed_by: displayName
      }).eq('id', appToAssess.id);
      if (appErr) throw appErr;

      // 3. Insert to roster
      const callsign = "PROB-" + Math.random().toString(36).substr(2, 5).toUpperCase();
      const { error: rosterErr } = await supabase.from('roster').insert([{
        ic_name: appToAssess.ic_name,
        callsign,
        rank: 'Cadet',
        division: 'Patrol',
        status: 'Active',
        batch: appToAssess.batch
      }]);
      if (rosterErr) console.warn("Roster insert failed/skipped:", rosterErr.message);

      logActivity(`Pimpinan menyetujui formulir <strong>${appToAssess.ic_name}</strong> dengan penilaian interview`);
      showToast('Formulir berhasil disetujui dengan penilaian.', 'success');
      setIsAssessmentModalOpen(false);
      setIsModalOpen(false);
      setAppToAssess(null);
      loadApplications();
    } catch (err: any) {
      showToast('Gagal menyetujui formulir: ' + err.message, 'error');
    } finally {
      setIsSubmittingApprove(false);
    }
  };

  const handleRejectClick = (app: any) => {
    setAppToReject(app);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appToReject) return;
    const finalReason = rejectReason.trim() || "Ditolak oleh Administrator";

    setIsSubmittingReject(true);
    try {
      const { error } = await supabase.from('applications').update({
        status: 'rejected',
        rejection_reason: finalReason,
        processed_by: displayName
      }).eq('id', appToReject.id);
      if (error) throw error;

      logActivity(`Pimpinan menolak formulir <strong>${appToReject.ic_name}</strong>. Alasan: ${finalReason}`);
      showToast('Formulir telah ditolak.', 'info');
      setIsRejectModalOpen(false);
      setAppToReject(null);
      setRejectReason('');
      setIsModalOpen(false);
      loadApplications();
    } catch (err: any) {
      showToast('Gagal menolak formulir.', 'error');
    } finally {
      setIsSubmittingReject(false);
    }
  };

  const handleDelete = async (app: any) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus ${app.ic_name} dari pendataan?`)) return;

    try {
      const { error } = await supabase.from('applications').delete().eq('id', app.id);
      if (error) throw error;

      // Try to clean from roster table too
      await supabase.from('roster').delete().eq('ic_name', app.ic_name);

      logActivity(`Anggota <strong>${app.ic_name}</strong> dihapus dari pendataan.`);
      showToast('Data berhasil dihapus.', 'info');
      setIsModalOpen(false);
      loadApplications();
    } catch (err: any) {
      showToast('Gagal menghapus data.', 'error');
    }
  };

  return (
    <RoleGuard allowedRoles={['dismag']}>
    <div>
      <div className="header-action-row">
        <h2 className="dashboard-title">
          Evaluasi Formulir Pendaftaran
          <span className="count-badge">
            {isLoading ? '...' : `${apps.length} formulir`}
          </span>
        </h2>
        <div className="filter-actions">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="pending">Menunggu Review</option>
            <option value="approved">Diterima</option>
            <option value="rejected">Ditolak</option>
            <option value="all">Semua Status</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Memuat daftar pendaftaran...</p>
        </div>
      ) : apps.length === 0 ? (
        <div className="empty-state">
          <Inbox />
          <h3>Tidak Ada Pendaftaran</h3>
          <p>Tidak ada formulir pendaftaran ditemukan dengan status '{statusFilter}'.</p>
        </div>
      ) : (
        <div className="applications-list-wrapper">
          {apps.map((app) => (
            <div key={app.id} className="glass-card app-card">
              <div className="app-info-left">
                <div className="app-name-row">
                  <h3>{app.ic_name}</h3>
                  <span className={`badge-status ${app.status}`}>
                    {app.status === 'approved' ? 'Diterima' : app.status === 'rejected' ? 'Ditolak' : 'Pending'}
                  </span>
                </div>
                <div className="app-ooc-sub">
                  Pendaftar OOC: <strong>{app.ooc_name}</strong> (Umur: {app.ooc_age} 
                  {parseInt(app.ooc_age) < 17 && <span style={{ color: 'var(--color-error)', fontWeight: 'bold' }}> ⚠️ DI BAWAH UMUR</span>})
                </div>
                <div className="app-details-quick">
                  <span>Discord: {app.discord_id}</span>
                  <span>Tanggal: {new Date(app.created_at).toLocaleDateString('id-ID')}</span>
                  <span>Angkatan: {app.batch || '1'}</span>
                </div>
              </div>
              <div className="app-card-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedApp(app); setIsModalOpen(true); }}>
                  Lihat Detail <Eye size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Detail Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Detail Formulir Pendaftaran"
        wide
        footer={
          selectedApp?.status === 'pending' ? (
            <>
              <button className="btn btn-secondary" onClick={() => handleRejectClick(selectedApp)} disabled={isSubmittingApprove}>
                Tolak Formulir <XCircle size={16} />
              </button>
              <button className="btn btn-success" onClick={() => handleApproveClick(selectedApp)} disabled={isSubmittingApprove}>
                {isSubmittingApprove ? 'Memproses...' : 'Terima & Nilai'} <CheckCircle2 size={16} />
              </button>
            </>
          ) : selectedApp?.status === 'approved' ? (
            <>
              <button className="btn btn-danger" onClick={() => handleDelete(selectedApp)} style={{ marginRight: 'auto' }}>
                <Trash2 size={16} /> Hapus Dari Pendataan
              </button>
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Tutup</button>
            </>
          ) : (
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Tutup</button>
          )
        }
      >
        {selectedApp && (
          <div>
            {/* OOC INFO */}
            <div className="modal-detail-section">
              <h4>Informasi Out Of Character (OOC)</h4>
              <div className="detail-row-grid">
                <div className="detail-label-value">
                  <span>Nama Asli</span>
                  <span>{selectedApp.ooc_name}</span>
                </div>
                <div className="detail-label-value">
                  <span>Nama Paspor (OOC)</span>
                  <span>{selectedApp.passport_name_ooc || '-'}</span>
                </div>
                <div className="detail-label-value">
                  <span>Umur</span>
                  <span>
                    {selectedApp.ooc_age} Tahun
                    {parseInt(selectedApp.ooc_age) < 17 && (
                      <span style={{ color: 'var(--color-error)', marginLeft: '0.5rem', fontWeight: 'bold' }}>
                        ⚠️ Di Bawah Umur
                      </span>
                    )}
                  </span>
                </div>
                <div className="detail-label-value">
                  <span>Jenis Kelamin</span>
                  <span>{selectedApp.ooc_gender || '-'}</span>
                </div>
                <div className="detail-label-value">
                  <span>Discord Username</span>
                  <span>{selectedApp.discord_id}</span>
                </div>
                <div className="detail-label-value">
                  <span>Steam Hex / License</span>
                  <span><code>{selectedApp.steam_hex}</code></span>
                </div>
                <div className="detail-label-value">
                  <span>Lama RP</span>
                  <span>{selectedApp.playtime}</span>
                </div>
                <div className="detail-label-value">
                  <span>Angkatan</span>
                  <span>Angkatan {selectedApp.batch || '1'}</span>
                </div>
                <div className="detail-label-value span-2">
                  <span>Pengalaman RP</span>
                  <span>{selectedApp.rp_experience_ooc || '-'}</span>
                </div>
                <div className="detail-label-value span-2">
                  <span>Tanggungan di Kota Lain</span>
                  <span>{selectedApp.obligations_other_cities || '-'}</span>
                </div>
              </div>
            </div>

            {/* IC INFO */}
            <div className="modal-detail-section">
              <h4>Informasi In Character (IC)</h4>
              <div className="detail-row-grid">
                <div className="detail-label-value">
                  <span>Nama Karakter</span>
                  <span><strong>{selectedApp.ic_name}</strong></span>
                </div>
                <div className="detail-label-value">
                  <span>Umur Karakter</span>
                  <span>
                    {selectedApp.ic_age} Tahun
                    {parseInt(selectedApp.ic_age) < 17 && (
                      <span style={{ color: 'var(--color-error)', marginLeft: '0.5rem', fontWeight: 'bold' }}>
                        ⚠️ Di Bawah Umur
                      </span>
                    )}
                  </span>
                </div>
                <div className="detail-label-value">
                  <span>Jenis Kelamin Karakter</span>
                  <span>{selectedApp.ic_gender || '-'}</span>
                </div>
                <div className="detail-label-value">
                  <span>Tanggal Lahir</span>
                  <span>{selectedApp.ic_dob || '-'}</span>
                </div>
                <div className="detail-label-value">
                  <span>Nomor HP</span>
                  <span>{selectedApp.phone_number}</span>
                </div>
                <div className="detail-label-value span-2">
                  <span>Riwayat Pengalaman LEO</span>
                  <span>{selectedApp.experience}</span>
                </div>
              </div>
            </div>

            {/* QUESTIONS & SCENARIOS */}
            <div className="modal-detail-section">
              <h4>Kualifikasi Personal</h4>
              <div className="modal-question-box">
                <p>Pernahkah Anda terlibat kasus kriminal?</p>
                <p>{selectedApp.criminal_record || '-'}</p>
              </div>
              <div className="modal-question-box">
                <p>Apakah memiliki pengalaman kerja sebelumnya?</p>
                <p>{selectedApp.work_experience_ic || '-'}</p>
              </div>
              <div className="modal-question-box">
                <p>Kenapa Anda ingin mendaftar di Sheriff Kerajaan Roxwood?</p>
                <p>{selectedApp.motivation_roxwood || '-'}</p>
              </div>
              <div className="modal-question-box">
                <p>Mengapa kami harus menerima Anda menjadi bagian dari Sheriff Kerajaan Roxwood?</p>
                <p>{selectedApp.why_accept_roxwood || '-'}</p>
              </div>
              <div className="modal-question-box">
                <p>Jam Aktif Di Kota:</p>
                <p>{selectedApp.active_hours || '-'}</p>
              </div>
            </div>

            {selectedApp.status === 'rejected' && (
              <div className="decision-box rejected">
                <h4>Alasan Penolakan Formulir:</h4>
                <p>{selectedApp.rejection_reason || 'Tidak ada alasan yang diberikan.'}</p>
                <div className="decision-meta">
                  Ditolak oleh: {selectedApp.processed_by || 'Admin'}
                </div>
              </div>
            )}
            
            {selectedApp.status === 'approved' && (
              <div className="decision-box approved">
                <h4>Status Formulir: Diterima</h4>
                <div className="decision-meta">
                  Diproses oleh: {selectedApp.processed_by || 'Admin'}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Custom Reject Reason Modal */}
      <Modal
        open={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Alasan Penolakan Formulir"
        footer={null}
      >
        <form onSubmit={handleRejectSubmit}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="reject-reason-input">Berikan Alasan Penolakan <span className="required">*</span></label>
            <textarea
              id="reject-reason-input"
              className="form-input"
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Contoh: Jawaban kualifikasi personal kurang lengkap / KTP/Steam HEX tidak valid."
              required
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsRejectModalOpen(false)} disabled={isSubmittingReject}>
              Batal
            </button>
            <button type="submit" className="btn btn-danger" disabled={isSubmittingReject}>
              {isSubmittingReject ? 'Memproses...' : 'Tolak Pendaftaran'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Interview Assessment Modal */}
      <Modal
        open={isAssessmentModalOpen}
        onClose={() => { if (!isSubmittingApprove) { setIsAssessmentModalOpen(false); setAppToAssess(null); } }}
        title="Penilaian Interview"
        wide
        footer={null}
      >
        <form onSubmit={handleAssessmentSubmit}>
          <div className="assessment-desc-box">
            <ClipboardList size={20} className="assessment-desc-icon" />
            <p className="assessment-desc-text">
              Berikan penilaian untuk <strong>{appToAssess?.ic_name}</strong> sebelum menyetujui formulir pendaftaran.
            </p>
          </div>

          {/* Penilaian Numerik 1-100 */}
          <div className="assessment-grid">
            <div className="form-group">
              <label>Etika <span className="required">*</span></label>
              <div className="assessment-slider-group">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={assessmentForm.etika}
                  onChange={(e) => setAssessmentForm(prev => ({ ...prev, etika: e.target.value }))}
                  className="assessment-slider"
                  required
                />
                <span className="assessment-value">{assessmentForm.etika}</span>
              </div>
            </div>
            <div className="form-group">
              <label>Komunikasi <span className="required">*</span></label>
              <div className="assessment-slider-group">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={assessmentForm.komunikasi}
                  onChange={(e) => setAssessmentForm(prev => ({ ...prev, komunikasi: e.target.value }))}
                  className="assessment-slider"
                  required
                />
                <span className="assessment-value">{assessmentForm.komunikasi}</span>
              </div>
            </div>
            <div className="form-group">
              <label>Penampilan <span className="required">*</span></label>
              <div className="assessment-slider-group">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={assessmentForm.penampilan}
                  onChange={(e) => setAssessmentForm(prev => ({ ...prev, penampilan: e.target.value }))}
                  className="assessment-slider"
                  required
                />
                <span className="assessment-value">{assessmentForm.penampilan}</span>
              </div>
            </div>
            <div className="form-group">
              <label>Pemahaman Peraturan <span className="required">*</span></label>
              <div className="assessment-slider-group">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={assessmentForm.pemahaman_peraturan}
                  onChange={(e) => setAssessmentForm(prev => ({ ...prev, pemahaman_peraturan: e.target.value }))}
                  className="assessment-slider"
                  required
                />
                <span className="assessment-value">{assessmentForm.pemahaman_peraturan}</span>
              </div>
            </div>
            <div className="form-group">
              <label>Pemahaman Kasus <span className="required">*</span></label>
              <div className="assessment-slider-group">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={assessmentForm.pemahaman_kasus}
                  onChange={(e) => setAssessmentForm(prev => ({ ...prev, pemahaman_kasus: e.target.value }))}
                  className="assessment-slider"
                  required
                />
                <span className="assessment-value">{assessmentForm.pemahaman_kasus}</span>
              </div>
            </div>
          </div>

          {/* Penilaian Manual */}
          <div className="assessment-manual-section">
            <h4>Penilaian Tambahan</h4>
            <div className="form-group">
              <label htmlFor="pengalaman-organisasi">Pengalaman Organisasi</label>
              <textarea
                id="pengalaman-organisasi"
                className="form-input"
                rows={3}
                value={assessmentForm.pengalaman_organisasi}
                onChange={(e) => setAssessmentForm(prev => ({ ...prev, pengalaman_organisasi: e.target.value }))}
                placeholder="Catat pengalaman organisasi yang dimiliki pendaftar..."
              />
            </div>
            <div className="form-group">
              <label htmlFor="pengalaman-instansi">Pengalaman Instansi</label>
              <textarea
                id="pengalaman-instansi"
                className="form-input"
                rows={3}
                value={assessmentForm.pengalaman_instansi}
                onChange={(e) => setAssessmentForm(prev => ({ ...prev, pengalaman_instansi: e.target.value }))}
                placeholder="Catat pengalaman instansi/pekerjaan yang dimiliki pendaftar..."
              />
            </div>
          </div>

          <div className="form-actions" style={{ borderTop: '1px solid var(--color-border-custom)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => { setIsAssessmentModalOpen(false); setAppToAssess(null); }} disabled={isSubmittingApprove}>
              Batal
            </button>
            <button type="submit" className="btn btn-success" disabled={isSubmittingApprove} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isSubmittingApprove ? 'Menyetujui...' : 'Setujui & Simpan Penilaian'} <CheckCircle2 size={16} />
            </button>
          </div>
        </form>
      </Modal>
    </div>
    </RoleGuard>
  );
}
