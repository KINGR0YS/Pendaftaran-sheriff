'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import { Eye, ShieldAlert, XCircle, CheckCircle2, Trash2 } from 'lucide-react';

export default function ApplicationsPage() {
  const { showToast } = useToast();
  const [apps, setApps] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadApplications();
  }, [statusFilter]);

  async function loadApplications() {
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
    }
  }

  const logActivity = (text: string) => {
    const logs = JSON.parse(localStorage.getItem('activity_logs') || '[]');
    logs.unshift({ time: new Date().toISOString(), text });
    localStorage.setItem('activity_logs', JSON.stringify(logs.slice(0, 10)));
  };

  const handleApprove = async (app: any) => {
    if (!confirm(`Apakah Anda yakin ingin MENERIMA pendaftaran dari ${app.ic_name}?`)) return;

    try {
      // 1. Update status
      const { error: appErr } = await supabase.from('applications').update({ status: 'approved' }).eq('id', app.id);
      if (appErr) throw appErr;

      // 2. Insert to roster (optional but good practice)
      const callsign = "PROB-" + Math.random().toString(36).substr(2, 5).toUpperCase();
      const { error: rosterErr } = await supabase.from('roster').insert([{
        ic_name: app.ic_name,
        callsign,
        rank: 'Cadet',
        division: 'Patrol',
        status: 'Active',
        batch: app.batch
      }]);
      if (rosterErr) console.warn("Roster insert failed/skipped:", rosterErr.message);

      logActivity(`Pimpinan menyetujui formulir <strong>${app.ic_name}</strong>`);
      showToast('Formulir berhasil disetujui.', 'success');
      setIsModalOpen(false);
      loadApplications();
    } catch (err: any) {
      showToast('Gagal menyetujui formulir.', 'error');
    }
  };

  const handleReject = async (app: any) => {
    const reason = prompt("Masukkan alasan penolakan (opsional):");
    if (reason === null) return;
    const finalReason = reason.trim() || "Ditolak oleh Administrator";

    try {
      const { error } = await supabase.from('applications').update({
        status: 'rejected',
        rejection_reason: finalReason
      }).eq('id', app.id);
      if (error) throw error;

      logActivity(`Pimpinan menolak formulir <strong>${app.ic_name}</strong>. Alasan: ${finalReason}`);
      showToast('Formulir telah ditolak.', 'info');
      setIsModalOpen(false);
      loadApplications();
    } catch (err: any) {
      showToast('Gagal menolak formulir.', 'error');
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
    <div>
      <div className="header-action-row">
        <h2 className="dashboard-title">Evaluasi Formulir Pendaftaran</h2>
        <div className="filter-actions">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="pending">Menunggu Review</option>
            <option value="approved">Diterima</option>
            <option value="rejected">Ditolak</option>
            <option value="all">Semua Status</option>
          </select>
        </div>
      </div>

      <div className="applications-list-wrapper">
        {apps.length === 0 ? (
          <div className="no-data-msg">Tidak ada formulir pendaftaran ditemukan untuk filter ini.</div>
        ) : (
          apps.map((app) => (
            <div key={app.id} className="glass-card app-card">
              <div className="app-info-left">
                <div className="app-name-row">
                  <h3>{app.ic_name}</h3>
                  <span className={`badge-status ${app.status}`}>
                    {app.status === 'approved' ? 'Diterima' : app.status === 'rejected' ? 'Ditolak' : 'Pending'}
                  </span>
                </div>
                <div className="app-ooc-sub">Pendaftar OOC: <strong>{app.ooc_name}</strong> (Umur: {app.ooc_age})</div>
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
          ))
        )}
      </div>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Detail Formulir Pendaftaran"
        footer={
          selectedApp?.status === 'pending' ? (
            <>
              <button className="btn btn-secondary" onClick={() => handleReject(selectedApp)}>
                Tolak Formulir <XCircle size={16} />
              </button>
              <button className="btn btn-success" onClick={() => handleApprove(selectedApp)}>
                Terima Formulir <CheckCircle2 size={16} />
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
          <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
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
                  <span>{selectedApp.ooc_age} Tahun</span>
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
                <div className="detail-label-value" style={{ gridColumn: 'span 2', marginTop: '0.5rem' }}>
                  <span>Pengalaman RP</span>
                  <span>{selectedApp.rp_experience_ooc || '-'}</span>
                </div>
                <div className="detail-label-value" style={{ gridColumn: 'span 2', marginTop: '0.5rem' }}>
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
                  <span>{selectedApp.ic_age} Tahun</span>
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
                <div className="detail-label-value" style={{ gridColumn: 'span 2', marginTop: '0.5rem' }}>
                  <span>Riwayat Pengalaman LEO</span>
                  <span>{selectedApp.experience}</span>
                </div>
              </div>
            </div>

            {/* QUESTIONS & SCENARIOS */}
            <div className="modal-detail-section">
              <h4>Kualifikasi Personal</h4>
              <div className="modal-question-box">
                <p>Kasus Kriminal:</p>
                <p>{selectedApp.criminal_record || '-'}</p>
              </div>
              <div className="modal-question-box">
                <p>Pengalaman Kerja Sebelumnya:</p>
                <p>{selectedApp.work_experience_ic || '-'}</p>
              </div>
              <div className="modal-question-box">
                <p>Kenapa ingin mendaftar di Sheriff Kerajaan Roxwood?</p>
                <p>{selectedApp.motivation_roxwood || '-'}</p>
              </div>
              <div className="modal-question-box">
                <p>Mengapa kami harus menerima Anda menjadi bagian dari Sheriff Kerajaan Roxwood?</p>
                <p>{selectedApp.why_accept_roxwood || '-'}</p>
              </div>
              <div className="modal-question-box">
                <p>Jam Aktif Berdinas:</p>
                <p>{selectedApp.active_hours || '-'}</p>
              </div>
            </div>

            {selectedApp.status === 'rejected' && (
              <div className="decision-box reject">
                <h4>Alasan Penolakan Formulir:</h4>
                <p>{selectedApp.rejection_reason || 'Tidak ada alasan yang diberikan.'}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
