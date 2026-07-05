'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import { Eye, Inbox, Search } from 'lucide-react';
import RoleGuard from '@/components/RoleGuard';


export default function RejectedPage() {
  const { showToast } = useToast();
  const [rejected, setRejected] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadRejected(); }, []);

  async function loadRejected() {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  }

  const filtered = rejected.filter(app =>
    app.ic_name?.toLowerCase().includes(search.toLowerCase()) ||
    app.ooc_name?.toLowerCase().includes(search.toLowerCase()) ||
    app.rejection_reason?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <RoleGuard allowedRoles={['admin']}>
    <div>
      <div className="header-action-row">
        <h2 className="dashboard-title">
          Riwayat Formulir Ditolak
          <span style={{ marginLeft: '0.75rem', fontSize: '0.8rem', background: 'var(--color-bg-card)', padding: '0.2rem 0.6rem', borderRadius: '12px', border: '1px solid var(--color-border-custom)', color: 'var(--color-text-secondary)' }}>
            {isLoading ? '...' : `${rejected.length} formulir`}
          </span>
        </h2>
      </div>

      <div className="search-input-wrapper" style={{ maxWidth: 400 }}>
        <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input
          type="text"
          placeholder="Cari berdasarkan nama..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: '2.25rem' }}
        />
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem' }}>
          <div className="loading-spinner" />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Memuat riwayat penolakan...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Inbox />
          <h3>Tidak Ada Riwayat</h3>
          <p>
            {rejected.length === 0
              ? 'Belum ada formulir pendaftaran yang ditolak.'
              : 'Tidak ditemukan riwayat penolakan yang cocok dengan pencarian Anda.'}
          </p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="roster-table">
            <thead>
              <tr>
                <th>Nama Karakter</th>
                <th>Nama OOC</th>
                <th>Discord ID</th>
                <th>Alasan Penolakan</th>
                <th>Tanggal Penolakan</th>
                <th>Ditolak Oleh</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(app => (
                <tr key={app.id}>
                  <td><strong>{app.ic_name}</strong></td>
                  <td>{app.ooc_name || '-'}</td>
                  <td><code>{app.discord_id || '-'}</code></td>
                  <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-error)' }} title={app.rejection_reason || 'Tidak ada'}>
                    {app.rejection_reason || 'Tidak ada alasan'}
                  </td>
                  <td>{new Date(app.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                  <td>
                    <span className="processed-by-badge" title={app.processed_by || 'Admin'}>
                      {app.processed_by || 'Admin'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedApp(app); setIsModalOpen(true); }}>
                      <Eye size={14} /> Lihat Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Detail Formulir Ditolak"
        footer={<button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Tutup</button>}
      >
        {selectedApp && (
          <div>
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
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Ditolak oleh: {selectedApp.processed_by || 'Admin'}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
    </RoleGuard>
  );
}
