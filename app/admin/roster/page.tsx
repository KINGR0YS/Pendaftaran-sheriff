'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import { UserPlus, Eye, Search } from 'lucide-react';

export default function RosterPage() {
  const { showToast } = useToast();
  const [roster, setRoster] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [activeBatch, setActiveBatch] = useState('1');

  const [form, setForm] = useState({
    ic_name: '',
    steam_hex: '',
    ic_gender: 'Laki-laki',
    ic_dob: ''
  });

  useEffect(() => {
    loadRoster();
    setActiveBatch(localStorage.getItem('active_batch') || '1');
  }, []);

  async function loadRoster() {
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

  return (
    <div>
      <div className="header-action-row">
        <h2 className="dashboard-title">Direktori Probatus Roxwood</h2>
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

      <div className="table-responsive">
        <table className="roster-table">
          <thead>
            <tr>
              <th>Nama Karakter</th>
              <th>Steam HEX Code</th>
              <th>Jenis Kelamin</th>
              <th>Tanggal Lahir IC</th>
              <th>Angkatan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center">Belum ada anggota terdaftar.</td></tr>
            ) : (
              filtered.map(member => (
                <tr key={member.id}>
                  <td><strong>{member.ic_name}</strong></td>
                  <td><code>{member.steam_hex || '-'}</code></td>
                  <td>{member.ic_gender || '-'}</td>
                  <td>{member.ic_dob || '-'}</td>
                  <td>Angkatan {member.batch || '1'}</td>
                  <td>
                    <button className="btn btn-primary btn-sm" onClick={() => { setSelectedMember(member); setIsDetailModalOpen(true); }}>
                      <Eye size={14} /> Lihat Detail
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
          <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <div className="modal-detail-section">
              <h4>Informasi Out Of Character (OOC)</h4>
              <div className="detail-row-grid">
                <div className="detail-label-value"><span>Nama Asli</span><span>{selectedMember.ooc_name}</span></div>
                <div className="detail-label-value"><span>Umur</span><span>{selectedMember.ooc_age} Tahun</span></div>
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
                <div className="detail-label-value"><span>Umur Karakter</span><span>{selectedMember.ic_age} Tahun</span></div>
                <div className="detail-label-value"><span>Nomor HP</span><span>{selectedMember.phone_number}</span></div>
              </div>
            </div>
            <div className="modal-detail-section">
              <h4>Kualifikasi</h4>
              <div className="modal-question-box">
                <p>Kasus Kriminal:</p>
                <p>{selectedMember.criminal_record || '-'}</p>
              </div>
              <div className="modal-question-box">
                <p>Pengalaman Kerja:</p>
                <p>{selectedMember.work_experience_ic || '-'}</p>
              </div>
              <div className="modal-question-box">
                <p>Motivasi:</p>
                <p>{selectedMember.motivation_roxwood || '-'}</p>
              </div>
              <div className="modal-question-box">
                <p>Kenapa Diterima:</p>
                <p>{selectedMember.why_accept_roxwood || '-'}</p>
              </div>
              <div className="modal-question-box">
                <p>Jam Aktif:</p>
                <p>{selectedMember.active_hours || '-'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
