'use client';
import { useEffect, useState, Fragment } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import { UserPlus, Eye, Search, Inbox } from 'lucide-react';
import RoleGuard from '@/components/RoleGuard';


export default function RosterPage() {
  const { showToast } = useToast();
  const [roster, setRoster] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [activeBatch, setActiveBatch] = useState('1');
  const [adminEmail, setAdminEmail] = useState('System Admin');
  const [isLoading, setIsLoading] = useState(true);

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
    setActiveBatch(localStorage.getItem('active_batch') || '1');
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

  const logActivity = (text: string) => {
    const logs = JSON.parse(localStorage.getItem('activity_logs') || '[]');
    logs.unshift({ time: new Date().toISOString(), text });
    localStorage.setItem('activity_logs', JSON.stringify(logs.slice(0, 10)));
  };

  const filtered = roster.filter(member =>
    member.ic_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.steam_hex?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedAndFiltered = [...filtered].sort((a, b) => {
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
  });


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
          <span style={{ marginLeft: '0.75rem', fontSize: '0.8rem', background: 'var(--color-bg-card)', padding: '0.2rem 0.6rem', borderRadius: '12px', border: '1px solid var(--color-border-custom)', color: 'var(--color-text-secondary)' }}>
            {isLoading ? '...' : `${roster.length} Probatus`}
          </span>
        </h2>
        <button className="btn btn-sm btn-success" onClick={() => setIsAddModalOpen(true)}>
          <UserPlus size={14} /> Tambah Anggota Manual
        </button>
      </div>

      <div className="search-input-wrapper" style={{ maxWidth: 400 }}>
        <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input
          type="text"
          placeholder="Cari berdasarkan nama/callsign..."
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
                  const showDivider = lastBatch !== member.batch;
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
                            style={{
                              background: 'rgba(5, 7, 13, 0.6)',
                              border: '1px solid var(--color-border-custom)',
                              padding: '0.4rem 0.6rem',
                              borderRadius: '6px',
                              color: 'var(--color-text-primary)',
                              fontSize: '0.75rem',
                              outline: 'none',
                              cursor: 'pointer'
                            }}
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
                            style={{
                              background: 'rgba(5, 7, 13, 0.6)',
                              border: '1px solid var(--color-border-custom)',
                              padding: '0.4rem 0.6rem',
                              borderRadius: '6px',
                              color: 'var(--color-text-primary)',
                              fontSize: '0.75rem',
                              outline: 'none',
                              cursor: 'pointer'
                            }}
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Batal</button>
            <button type="submit" className="btn btn-success">Simpan Data</button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        open={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detail Formulir Pendaftaran"
        footer={<button className="btn btn-secondary" onClick={() => setIsDetailModalOpen(false)}>Tutup</button>}
      >
        {selectedMember && (
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
      </Modal>
    </div>
    </RoleGuard>
  );
}
