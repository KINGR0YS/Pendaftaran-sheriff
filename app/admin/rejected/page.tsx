'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import { Eye } from 'lucide-react';

export default function RejectedPage() {
  const { showToast } = useToast();
  const [rejected, setRejected] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => { loadRejected(); }, []);

  async function loadRejected() {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('status', 'rejected')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRejected(data || []);
    } catch (err) {
      showToast('Gagal memuat data dari database cloud.', 'error');
    }
  }

  const filtered = rejected.filter(app =>
    app.ic_name?.toLowerCase().includes(search.toLowerCase()) ||
    app.ooc_name?.toLowerCase().includes(search.toLowerCase()) ||
    app.rejection_reason?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h2 className="dashboard-title">Riwayat Formulir Ditolak</h2>

      <div className="search-input-wrapper" style={{ maxWidth: 400 }}>
        <input
          type="text"
          placeholder="Cari berdasarkan nama..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-responsive">
        <table className="roster-table">
          <thead>
            <tr>
              <th>Nama Karakter</th>
              <th>Nama OOC</th>
              <th>Discord ID</th>
              <th>Alasan Penolakan</th>
              <th>Tanggal Penolakan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center">Belum ada riwayat penolakan.</td></tr>
            ) : (
              filtered.map(app => (
                <tr key={app.id}>
                  <td><strong>{app.ic_name}</strong></td>
                  <td>{app.ooc_name || '-'}</td>
                  <td><code>{app.discord_id || '-'}</code></td>
                  <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-error)' }} title={app.rejection_reason || 'Tidak ada'}>
                    {app.rejection_reason || 'Tidak ada alasan'}
                  </td>
                  <td>{new Date(app.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedApp(app); setIsModalOpen(true); }}>
                      <Eye size={14} /> Lihat Detail
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Detail Formulir Ditolak"
        footer={<button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Tutup</button>}
      >
        {selectedApp && (
          <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <div className="modal-detail-section">
              <h4>Informasi OOC</h4>
              <div className="detail-row-grid">
                <div className="detail-label-value"><span>Nama Asli</span><span>{selectedApp.ooc_name}</span></div>
                <div className="detail-label-value"><span>Discord</span><span>{selectedApp.discord_id}</span></div>
              </div>
            </div>
            <div className="modal-detail-section">
              <h4>Informasi IC</h4>
              <div className="detail-row-grid">
                <div className="detail-label-value"><span>Nama Karakter</span><span><strong>{selectedApp.ic_name}</strong></span></div>
                <div className="detail-label-value"><span>Steam Hex</span><span><code>{selectedApp.steam_hex}</code></span></div>
              </div>
            </div>
            <div className="decision-box reject">
              <h4>Alasan Penolakan:</h4>
              <p>{selectedApp.rejection_reason || 'Tidak ada alasan yang diberikan.'}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
