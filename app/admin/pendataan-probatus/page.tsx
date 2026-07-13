'use client';
import { useEffect, useState, Fragment } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import { UserPlus, Eye, Search, Inbox, Trash2, FileText, ClipboardList } from 'lucide-react';
import RoleGuard from '@/components/RoleGuard';
import { logActivity } from '@/lib/activity-log';
import { getSystemSettings } from '@/lib/settings';


export default function RosterPage() {
  const { showToast } = useToast();
  const [roster, setRoster] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [detailTab, setDetailTab] = useState<'form' | 'assessment'>('form');
  const [activeBatch, setActiveBatch] = useState('1');
  const [adminEmail, setAdminEmail] = useState('System Admin');
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'batch' | 'name-asc' | 'name-desc'>('batch');

  const [form, setForm] = useState({
    ic_name: '',
    steam_hex: '',
    ic_gender: 'Laki-laki',
    ic_dob: ''
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setAdminEmail(session.user.email);
      }
    });
  }, []);

  useEffect(() => {
    loadRoster();
    getSystemSettings().then((settings) => {
      setActiveBatch(settings.active_batch);
    });
  }, []);

  async function loadRoster() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRoster(data || []);
    } catch (err) {
      showToast('Gagal memuat data dari database cloud.', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  const filtered = roster.filter(member =>
    member.ic_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.steam_hex?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedAndFiltered = [...filtered].sort((a, b) => {
    if (sortBy === 'batch') {
      const batchA = parseFloat(a.batch) || 0;
      const batchB = parseFloat(b.batch) || 0;
      if (batchB !== batchA) {
        return batchB - batchA; // Newest batch first (descending)
      }
      // If float values are equal, compare exact batch strings to prevent interleaving of any different textual batches
      const batchStrA = a.batch || '';
      const batchStrB = b.batch || '';
      if (batchStrB !== batchStrA) {
        return batchStrB.localeCompare(batchStrA);
      }
      return (a.ic_name || '').localeCompare(b.ic_name || '');
    } else if (sortBy === 'name-asc') {
      return (a.ic_name || '').localeCompare(b.ic_name || '');
    } else {
      return (b.ic_name || '').localeCompare(a.ic_name || '');
    }
  });

  const handleDeleteMember = async (id: string, name: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus data anggota ${name}? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }
    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showToast(`Data ${name} berhasil dihapus.`, 'success');
      logActivity(`Menghapus data anggota roster: ${name}`);
      setIsDetailModalOpen(false);
      setSelectedMember(null);
      loadRoster();
    } catch (err: any) {
      showToast(`Gagal menghapus data: ${err.message}`, 'error');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const appData = {
      ic_name: form.ic_name,
      steam_hex: form.steam_hex,
      ic_gender: form.ic_gender,
      ic_dob: form.ic_dob,
      ooc_name: 'Manual Entry',
      passport_name_ooc: 'Manual Entry',
      ooc_age: 18,
      ooc_gender: form.ic_gender,
      discord_id: 'Manual Entry',
      playtime: 'Manual Entry',
      rp_experience_ooc: 'Manual Entry',
      obligations_other_cities: 'Manual Entry',
      ic_age: 18,
      phone_number: 'Manual Entry',
      origin: '-',
      experience: 'Manual Entry',
      criminal_record: 'Manual Entry',
      work_experience_ic: 'Manual Entry',
      motivation_roxwood: 'Manual Entry',
      why_accept_roxwood: 'Manual Entry',
      active_hours: 'Manual Entry',
      chain_of_command: '-',
      scenario_use_of_force: '-',
      batch: activeBatch,
      status: 'approved',
      processed_by: adminEmail,
      badge_status: '',
      training_status: '',
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('applications').insert([appData]);
      if (error) throw error;
      logActivity(`Anggota baru terdaftar manual: <strong>${form.ic_name}</strong>`);
      showToast('Anggota berhasil didaftarkan.', 'success');
      setIsAddModalOpen(false);
      setForm({ ic_name: '', steam_hex: '', ic_gender: 'Laki-laki', ic_dob: '' });
      loadRoster();
    } catch (err: any) {
      showToast(`Gagal memproses data: ${err.message}`, 'error');
    }
  };

  const updateStatus = async (id: string, field: string, value: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ [field]: value })
        .eq('id', id);
      if (error) throw error;
      showToast('Status anggota berhasil diperbarui.', 'success');
      setRoster(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
      logActivity(`Status ${field} diperbarui menjadi: ${value}`);
    } catch (err: any) {
      showToast(`Gagal memperbarui status: ${err.message}`, 'error');
    }
  };

  return (
    <RoleGuard allowedRoles={['dismag']}>
    <div>
      <div className="header-action-row">
        <h2 className="dashboard-title">
          Direktori Probatus Roxwood
          <span className="count-badge">
            {isLoading ? '...' : `${roster.length} Probatus`}
          </span>
        </h2>
        <button className="btn btn-sm btn-success" onClick={() => setIsAddModalOpen(true)}>
          <UserPlus size={14} /> Tambah Anggota Manual
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} />
          <input
            type="text"
            placeholder="Cari berdasarkan nama/callsign..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <label>Urutkan:</label>
          <select
            className="filter-select"
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
          >
            <option value="batch">Angkatan (Terbaru)</option>
            <option value="name-asc">Nama (A - Z)</option>
            <option value="name-desc">Nama (Z - A)</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Memuat data...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Inbox />
          <h3>Tidak Ada Probatus</h3>
          <p>
            {roster.length === 0
              ? 'Belum ada anggota yang terdaftar/diterima.'
              : 'Tidak ditemukan anggota yang cocok dengan pencarian Anda.'}
          </p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="roster-table">
            <thead>
              <tr>
                <th>Nama Karakter</th>
                <th>Steam HEX Code</th>
                <th>Jenis Kelamin</th>
                <th>Tanggal Lahir IC</th>
                <th>Angkatan</th>
                <th>Diterima Oleh</th>
                <th>Status Lencana</th>
                <th>Status Pelatihan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                let lastBatch: string | null = null;
                return sortedAndFiltered.map((member) => {
                  const showDivider = sortBy === 'batch' && lastBatch !== member.batch;
                  lastBatch = member.batch;
                  
                  return (
                    <Fragment key={member.id}>
                      {showDivider && (
                        <tr style={{ background: 'rgba(212, 175, 55, 0.04)', borderLeft: '3px solid var(--color-gold)' }}>
                          <td colSpan={9} style={{ padding: '0.6rem 1rem', color: 'var(--color-gold)', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
                            ⚡ ANGKATAN {member.batch || '1'}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td>
                          <strong>{member.ic_name}</strong>
                          {((parseInt(member.ooc_age) < 17) || (parseInt(member.ic_age) < 17)) && (
                            <span style={{ color: 'var(--color-error)', marginLeft: '0.4rem', fontSize: '0.7rem', fontWeight: 'bold' }} title="Pendaftar atau karakter di bawah 17 tahun">
                              ⚠️ <span style={{ textDecoration: 'underline' }}>Di Bawah Umur</span>
                            </span>
                          )}
                        </td>
                        <td><code>{member.steam_hex || '-'}</code></td>
                        <td>{member.ic_gender || '-'}</td>
                        <td>{member.ic_dob || '-'}</td>
                        <td>Angkatan {member.batch || '1'}</td>
                        <td>
                          <span className="processed-by-badge" title={member.processed_by || 'Admin'}>
                            {member.processed_by || 'Admin'}
                          </span>
                        </td>
                        <td>
                          <select
                            value={member.badge_status || ''}
                            onChange={(e) => updateStatus(member.id, 'badge_status', e.target.value)}
                            className="filter-select"
                            style={{ fontSize: '0.75rem', padding: '0.4rem 0.6rem' }}
                          >
                            <option value="">-- Pilih Status --</option>
                            <option value="lencana aktif">Lencana Aktif</option>
                            <option value="lencana tidak aktif">Lencana Tidak Aktif</option>
                          </select>
                        </td>
                        <td>
                          <select
                            value={member.training_status || ''}
                            onChange={(e) => updateStatus(member.id, 'training_status', e.target.value)}
                            className="filter-select"
                            style={{ fontSize: '0.75rem', padding: '0.4rem 0.6rem' }}
                          >
                            <option value="">-- Pilih Status --</option>
                            <option value="sedang dalam pelatihan">Sedang Pelatihan</option>
                            <option value="lulus">Lulus</option>
                            <option value="tidak lulus">Tidak Lulus</option>
                          </select>
                        </td>
                        <td>
                          <button className="btn btn-primary btn-sm" onClick={() => { setSelectedMember(member); setIsDetailModalOpen(true); }}>
                            <Eye size={14} /> Lihat Detail
                          </button>
                        </td>
                      </tr>
                    </Fragment>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Member Modal */}
      <Modal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Anggota Probatus Manual"
        footer={null}
      >
        <form onSubmit={handleAddMember}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="member-ic-name">Nama Karakter (IC) <span className="required">*</span></label>
            <input
              type="text"
              id="member-ic-name"
              value={form.ic_name}
              onChange={(e) => setForm(prev => ({ ...prev, ic_name: e.target.value }))}
              required
              placeholder="Contoh: Frank Austin"
            />
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="member-steam-hex">Steam HEX Code <span className="required">*</span></label>
            <input
              type="text"
              id="member-steam-hex"
              value={form.steam_hex}
              onChange={(e) => setForm(prev => ({ ...prev, steam_hex: e.target.value }))}
              required
              placeholder="Contoh: steam:11000010abcde12"
            />
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="member-ic-gender">Jenis Kelamin (IC) <span className="required">*</span></label>
              <select
                id="member-ic-gender"
                value={form.ic_gender}
                onChange={(e) => setForm(prev => ({ ...prev, ic_gender: e.target.value }))}
                required
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="member-ic-dob">Tanggal Lahir (IC) <span className="required">*</span></label>
              <input
                type="date"
                id="member-ic-dob"
                value={form.ic_dob}
                onChange={(e) => setForm(prev => ({ ...prev, ic_dob: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Batal</button>
            <button type="submit" className="btn btn-success">Simpan Data</button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        open={isDetailModalOpen}
        onClose={() => { setIsDetailModalOpen(false); setDetailTab('form'); }}
        title="Detail Probatus"
        wide
        footer={
          <>
            <button 
              className="btn btn-danger" 
              onClick={() => selectedMember && handleDeleteMember(selectedMember.id, selectedMember.ic_name)}
              style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Trash2 size={14} /> Hapus Data
            </button>
            <button className="btn btn-secondary" onClick={() => { setIsDetailModalOpen(false); setDetailTab('form'); }}>Tutup</button>
          </>
        }
      >
        {selectedMember && (
          <div>
            {/* Tab Navigation */}
            <div className="detail-tabs">
              <button
                className={`detail-tab ${detailTab === 'form' ? 'active' : ''}`}
                onClick={() => setDetailTab('form')}
              >
                <FileText size={14} /> Detail Formulir Pendaftaran
              </button>
              <button
                className={`detail-tab ${detailTab === 'assessment' ? 'active' : ''}`}
                onClick={() => setDetailTab('assessment')}
              >
                <ClipboardList size={14} /> Penilaian Interview
              </button>
            </div>

            {/* Tab Content: Form Detail */}
            {detailTab === 'form' && (
              <div>
                <div className="modal-detail-section">
                  <h4>Informasi Out Of Character (OOC)</h4>
                  <div className="detail-row-grid">
                    <div className="detail-label-value"><span>Nama Asli</span><span>{selectedMember.ooc_name}</span></div>
                    <div className="detail-label-value">
                      <span>Umur</span>
                      <span>
                        {selectedMember.ooc_age} Tahun
                        {parseInt(selectedMember.ooc_age) < 17 && (
                          <span style={{ color: 'var(--color-error)', marginLeft: '0.5rem', fontWeight: 'bold' }}>
                            ⚠️ Di Bawah Umur
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="detail-label-value"><span>Discord Username</span><span>{selectedMember.discord_id}</span></div>
                    <div className="detail-label-value"><span>Steam Hex</span><span><code>{selectedMember.steam_hex}</code></span></div>
                    <div className="detail-label-value"><span>Lama RP</span><span>{selectedMember.playtime}</span></div>
                    <div className="detail-label-value"><span>Angkatan</span><span>Angkatan {selectedMember.batch || '1'}</span></div>
                  </div>
                </div>
                <div className="modal-detail-section">
                  <h4>Informasi In Character (IC)</h4>
                  <div className="detail-row-grid">
                    <div className="detail-label-value"><span>Nama Karakter</span><span><strong>{selectedMember.ic_name}</strong></span></div>
                    <div className="detail-label-value">
                      <span>Umur Karakter</span>
                      <span>
                        {selectedMember.ic_age} Tahun
                        {parseInt(selectedMember.ic_age) < 17 && (
                          <span style={{ color: 'var(--color-error)', marginLeft: '0.5rem', fontWeight: 'bold' }}>
                            ⚠️ Di Bawah Umur
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="detail-label-value"><span>Nomor HP</span><span>{selectedMember.phone_number}</span></div>
                  </div>
                </div>
                <div className="modal-detail-section">
                  <h4>Kualifikasi</h4>
                  <div className="modal-question-box">
                    <p>Pernahkah Anda terlibat kasus kriminal?</p>
                    <p>{selectedMember.criminal_record || '-'}</p>
                  </div>
                  <div className="modal-question-box">
                    <p>Apakah memiliki pengalaman kerja sebelumnya?</p>
                    <p>{selectedMember.work_experience_ic || '-'}</p>
                  </div>
                  <div className="modal-question-box">
                    <p>Kenapa Anda ingin mendaftar di Sheriff Kerajaan Roxwood?</p>
                    <p>{selectedMember.motivation_roxwood || '-'}</p>
                  </div>
                  <div className="modal-question-box">
                    <p>Mengapa kami harus menerima Anda menjadi bagian dari Sheriff Kerajaan Roxwood?</p>
                    <p>{selectedMember.why_accept_roxwood || '-'}</p>
                  </div>
                  <div className="modal-question-box">
                    <p>Jam Aktif Di Kota:</p>
                    <p>{selectedMember.active_hours || '-'}</p>
                  </div>
                </div>
                <div className="decision-box" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
                  <h4 style={{ color: 'var(--color-success)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Status Formulir: Diterima</h4>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Diproses oleh: {selectedMember.processed_by || 'Admin'}
                  </div>
                </div>
              </div>
            )}

            {/* TAB Content: Assessment */}
            {detailTab === 'assessment' && (
              <div>
                {selectedMember.interview_evaluator ? (
                  <>
                    <div className="modal-detail-section">
                      <h4>Penilaian Interview (1-100)</h4>
                      <div className="assessment-result-grid">
                        <div className="assessment-result-item">
                          <span className="assessment-result-label">Etika</span>
                          <span className="assessment-result-score" style={{ color: selectedMember.interview_etika >= 70 ? 'var(--color-success)' : selectedMember.interview_etika >= 40 ? 'var(--color-warning)' : 'var(--color-error)' }}>
                            {selectedMember.interview_etika ?? '-'}
                          </span>
                        </div>
                        <div className="assessment-result-item">
                          <span className="assessment-result-label">Komunikasi</span>
                          <span className="assessment-result-score" style={{ color: selectedMember.interview_komunikasi >= 70 ? 'var(--color-success)' : selectedMember.interview_komunikasi >= 40 ? 'var(--color-warning)' : 'var(--color-error)' }}>
                            {selectedMember.interview_komunikasi ?? '-'}
                          </span>
                        </div>
                        <div className="assessment-result-item">
                          <span className="assessment-result-label">Penampilan</span>
                          <span className="assessment-result-score" style={{ color: selectedMember.interview_penampilan >= 70 ? 'var(--color-success)' : selectedMember.interview_penampilan >= 40 ? 'var(--color-warning)' : 'var(--color-error)' }}>
                            {selectedMember.interview_penampilan ?? '-'}
                          </span>
                        </div>
                        <div className="assessment-result-item">
                          <span className="assessment-result-label">Pemahaman Peraturan</span>
                          <span className="assessment-result-score" style={{ color: selectedMember.interview_pemahaman_peraturan >= 70 ? 'var(--color-success)' : selectedMember.interview_pemahaman_peraturan >= 40 ? 'var(--color-warning)' : 'var(--color-error)' }}>
                            {selectedMember.interview_pemahaman_peraturan ?? '-'}
                          </span>
                        </div>
                        <div className="assessment-result-item">
                          <span className="assessment-result-label">Pemahaman Kasus</span>
                          <span className="assessment-result-score" style={{ color: selectedMember.interview_pemahaman_kasus >= 70 ? 'var(--color-success)' : selectedMember.interview_pemahaman_kasus >= 40 ? 'var(--color-warning)' : 'var(--color-error)' }}>
                            {selectedMember.interview_pemahaman_kasus ?? '-'}
                          </span>
                        </div>
                      </div>
                      {/* Average Score */}
                      {(() => {
                        const scores = [
                          selectedMember.interview_etika,
                          selectedMember.interview_komunikasi,
                          selectedMember.interview_penampilan,
                          selectedMember.interview_pemahaman_peraturan,
                          selectedMember.interview_pemahaman_kasus
                        ].filter((s: number) => s != null);
                        if (scores.length > 0) {
                          const avg = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
                          return (
                            <div style={{
                              marginTop: '1rem',
                              padding: '0.75rem 1rem',
                              background: avg >= 70 ? 'rgba(16, 185, 129, 0.06)' : avg >= 40 ? 'rgba(245, 158, 11, 0.06)' : 'rgba(239, 68, 68, 0.06)',
                              border: `1px solid ${avg >= 70 ? 'rgba(16, 185, 129, 0.2)' : avg >= 40 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                              borderRadius: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Rata-rata Nilai</span>
                              <span style={{
                                fontSize: '1.3rem',
                                fontWeight: 800,
                                fontFamily: 'var(--font-header)',
                                color: avg >= 70 ? 'var(--color-success)' : avg >= 40 ? 'var(--color-warning)' : 'var(--color-error)'
                              }}>
                                {avg}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <div className="modal-detail-section">
                      <h4>Penilaian Tambahan</h4>
                      <div className="modal-question-box">
                        <p>Pengalaman Organisasi</p>
                        <p>{selectedMember.interview_pengalaman_organisasi || 'Tidak ada catatan.'}</p>
                      </div>
                      <div className="modal-question-box">
                        <p>Pengalaman Instansi</p>
                        <p>{selectedMember.interview_pengalaman_instansi || 'Tidak ada catatan.'}</p>
                      </div>
                    </div>
                    <div className="assessment-info-box">
                      <h4>Informasi Penilaian</h4>
                      <div className="assessment-info-meta">
                        <span>Dinilai oleh: <strong>{selectedMember.interview_evaluator || 'Admin'}</strong></span>
                        {selectedMember.interview_assessed_at && (
                          <span>{new Date(selectedMember.interview_assessed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="empty-state" style={{ padding: '2rem' }}>
                    <ClipboardList size={48} />
                    <h3>Belum Ada Penilaian</h3>
                    <p>Anggota ini belum memiliki penilaian interview.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
    </RoleGuard>
  );
}
