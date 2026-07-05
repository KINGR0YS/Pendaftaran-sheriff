'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { Search, Inbox, Calendar, UserPlus, Trash2, ShieldAlert, Check } from 'lucide-react';
import Modal from '@/components/Modal';
import RoleGuard from '@/components/RoleGuard';
import { listRegisteredAccounts, addStaffMember, removeStaffMember } from './actions';

export default function AbsensiPelatihPage() {
  const { showToast } = useToast();
  
  // States
  const [staffRoster, setStaffRoster] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('pelatih');
  
  // Tanggal Mulai Pelatihan (7 Hari)
  const getInitialStartDate = () => {
    const today = new Date();
    today.setDate(today.getDate() - 6); // Hari ini sebagai hari ke-7
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  const [startDate, setStartDate] = useState(getInitialStartDate());
  const [evaluatorName, setEvaluatorName] = useState('');
  const [attendanceMatrix, setAttendanceMatrix] = useState<Record<string, Record<string, string>>>({});

  // Modal Tambah Anggota Absen
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [registeredAccounts, setRegisteredAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Generate 7 tanggal berurutan
  const getDatesArray = (startStr: string) => {
    const dates = [];
    const baseDate = new Date(startStr);
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const datesList = getDatesArray(startDate);

  useEffect(() => {
    // Ambil nama pencatat dari email/username session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const name = session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'Admin';
        setEvaluatorName(name);
        
        const role = session.user.user_metadata?.role || 'dismag';
        const normalizedRole = role === 'admin' ? 'dismag' : (role === 'trainer' ? 'pelatih' : role);
        setCurrentUserRole(normalizedRole);
      }
    });
    
    loadStaffRoster();
  }, []);

  useEffect(() => {
    if (!dbError && staffRoster.length > 0) {
      loadAttendanceData();
    }
  }, [startDate, staffRoster, dbError]);

  async function loadStaffRoster() {
    setIsLoading(true);
    setDbError(null);
    try {
      const { data, error } = await supabase
        .from('staff_attendance_members')
        .select('*')
        .order('username', { ascending: true });
        
      if (error) {
        if (error.message.includes('relation') || error.code === '42P01') {
          setDbError('Tabel database staff_attendance_members belum dibuat di Supabase.');
        } else {
          throw error;
        }
      } else {
        setStaffRoster(data || []);
      }
    } catch (err: any) {
      showToast('Gagal memuat daftar anggota absensi staff: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadAttendanceData() {
    try {
      const startStr = datesList[0].toISOString().split('T')[0];
      const endStr = datesList[6].toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('staff_attendance')
        .select('user_id, attendance_date, status')
        .gte('attendance_date', startStr)
        .lte('attendance_date', endStr);

      if (error) {
        if (error.message.includes('relation') || error.code === '42P01') {
          setDbError('Tabel database staff_attendance belum dibuat di Supabase.');
          return;
        }
        throw error;
      }

      const matrix: Record<string, Record<string, string>> = {};
      staffRoster.forEach(m => {
        matrix[m.user_id] = {};
      });

      data?.forEach(row => {
        if (matrix[row.user_id]) {
          matrix[row.user_id][row.attendance_date] = row.status;
        }
      });

      setAttendanceMatrix(matrix);
    } catch (err: any) {
      console.error('Gagal memuat data absensi staff:', err.message);
    }
  }

  // Load registered accounts to show in Add Member dropdown
  const handleOpenAddModal = async () => {
    setIsAddModalOpen(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const res = await listRegisteredAccounts(session.access_token);
      if (res.success && res.users) {
        // Filter out users that are already in the staffRoster
        const currentIds = staffRoster.map(s => s.user_id);
        const filteredUsers = res.users.filter(u => !currentIds.includes(u.id));
        setRegisteredAccounts(filteredUsers);
        if (filteredUsers.length > 0) {
          setSelectedAccountId(filteredUsers[0].id);
        } else {
          setSelectedAccountId('');
        }
      } else {
        showToast(res.message || 'Gagal memuat daftar akun.', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId) {
      showToast('Pilih akun terlebih dahulu.', 'error');
      return;
    }

    const selectedAcc = registeredAccounts.find(u => u.id === selectedAccountId);
    if (!selectedAcc) return;

    setIsSubmittingAdd(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sesi tidak ditemukan.');

      const res = await addStaffMember(
        session.access_token,
        selectedAcc.id,
        selectedAcc.username,
        selectedAcc.role
      );

      if (res.success) {
        showToast(res.message || 'Anggota berhasil ditambahkan.', 'success');
        setIsAddModalOpen(false);
        loadStaffRoster();
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus ${name} dari daftar absensi staff?\nRiwayat absensi orang ini pada tabel juga akan dihapus permanen.`)) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sesi tidak ditemukan.');

      const res = await removeStaffMember(session.access_token, userId);
      if (res.success) {
        showToast(res.message || 'Anggota berhasil dihapus.', 'success');
        loadStaffRoster();
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSaveAttendance = async (memberId: string, dateStr: string, status: string) => {
    if (!evaluatorName.trim()) {
      showToast('Nama Pencatat wajib diisi di bagian atas untuk mencatat absensi.', 'error');
      return;
    }

    try {
      if (!status) {
        // Hapus record absensi jika dikosongkan
        const { error } = await supabase
          .from('staff_attendance')
          .delete()
          .eq('user_id', memberId)
          .eq('attendance_date', dateStr);
        if (error) throw error;

        setAttendanceMatrix(prev => {
          const next = { ...prev };
          if (next[memberId]) {
            delete next[memberId][dateStr];
          }
          return next;
        });
        showToast('Absensi berhasil dihapus.', 'success');
      } else {
        // Upsert record absensi
        const { error } = await supabase
          .from('staff_attendance')
          .upsert({
            user_id: memberId,
            attendance_date: dateStr,
            status: status,
            recorded_by: evaluatorName.trim()
          }, {
            onConflict: 'user_id,attendance_date'
          });
        if (error) throw error;

        setAttendanceMatrix(prev => {
          const next = { ...prev };
          if (!next[memberId]) next[memberId] = {};
          next[memberId][dateStr] = status;
          return next;
        });
        showToast(`Absensi dicatat: ${status}`, 'success');
      }
    } catch (err: any) {
      showToast(`Gagal mencatat absensi: ${err.message}`, 'error');
    }
  };

  const getSelectStyle = (value: string) => {
    let bg = 'rgba(15, 23, 42, 0.4)';
    let color = 'var(--color-text-secondary)';
    let border = '1px solid var(--color-border-custom)';
    
    if (value === 'HADIR') {
      bg = 'rgba(16, 185, 129, 0.2)';
      color = '#10b981';
      border = '1px solid rgba(16, 185, 129, 0.4)';
    } else if (value === 'IZIN') {
      bg = 'rgba(251, 191, 36, 0.2)';
      color = '#fbbf24';
      border = '1px solid rgba(251, 191, 36, 0.4)';
    } else if (value === 'SAKIT') {
      bg = 'rgba(59, 130, 246, 0.2)';
      color = '#60a5fa';
      border = '1px solid rgba(59, 130, 246, 0.4)';
    } else if (value === 'TIDAK HADIR') {
      bg = 'rgba(220, 38, 38, 0.35)';
      color = '#f87171';
      border = '1px solid rgba(220, 38, 38, 0.5)';
    } else if (value === 'TIDAK SAMPAI SELESAI') {
      bg = 'rgba(245, 158, 11, 0.2)';
      color = '#f59e0b';
      border = '1px solid rgba(245, 158, 11, 0.4)';
    } else if (value === 'TERLAMBAT') {
      bg = 'rgba(239, 68, 68, 0.2)';
      color = '#ef4444';
      border = '1px solid rgba(239, 68, 68, 0.4)';
    }
    
    return {
      background: bg,
      color: color,
      border: border,
      padding: '0.25rem 0.2rem',
      borderRadius: '4px',
      fontSize: '0.65rem',
      fontWeight: value ? 'bold' : ('normal' as any),
      outline: 'none',
      cursor: 'pointer',
      width: '100px',
      textAlign: 'center' as const
    };
  };

  const countPresents = (memberId: string) => {
    const memberAttendance = attendanceMatrix[memberId] || {};
    let count = 0;
    datesList.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      if (memberAttendance[dateStr] === 'HADIR') {
        count++;
      }
    });
    return count;
  };

  const calculateStaffSalary = (memberId: string, role: string) => {
    const memberAttendance = attendanceMatrix[memberId] || {};
    let total = 0;
    const isTrainer = role === 'pelatih';
    const presentRate = isTrainer ? 100000 : 120000;
    const lateOrIncompleteRate = isTrainer ? 50000 : 60000;

    datesList.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      const status = memberAttendance[dateStr];
      if (status === 'HADIR') {
        total += presentRate;
      } else if (status === 'TERLAMBAT' || status === 'TIDAK SAMPAI SELESAI') {
        total += lateOrIncompleteRate;
      }
    });
    return total;
  };

  const formatRupiah = (amount: number) => {
    return 'Rp' + amount.toLocaleString('id-ID');
  };

  const calculateTotalGroupSalary = (list: any[]) => {
    let total = 0;
    list.forEach(m => {
      total += calculateStaffSalary(m.user_id, m.role);
    });
    return total;
  };

  const filtered = staffRoster.filter(member =>
    member.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pisahkan Pelatih dan Pengawas
  const pelatihList = filtered.filter(m => m.role === 'pelatih');
  const pengawasList = filtered.filter(m => m.role === 'dismag' || m.role === 'superadmin');

  if (dbError) {
    return (
      <RoleGuard allowedRoles={['pelatih', 'dismag', 'superadmin']}>
        <div style={{ maxWidth: 800, margin: '2rem auto', padding: '2rem' }} className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--color-error)', marginBottom: '1.5rem' }}>
            <ShieldAlert size={40} />
            <h2 style={{ margin: 0 }}>Migrasi Database Diperlukan</h2>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6', fontSize: '0.95rem' }}>
            Tabel untuk fitur **Absensi Staff** belum dibuat di database Supabase Anda. 
            Silakan jalankan skrip SQL berikut di **SQL Editor Supabase** proyek Anda:
          </p>

          <pre style={{
            background: 'rgba(5, 7, 13, 0.8)',
            border: '1px solid var(--color-border-custom)',
            padding: '1.25rem',
            borderRadius: '8px',
            color: '#60a5fa',
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            overflowX: 'auto',
            margin: '1.5rem 0',
            lineHeight: '1.4'
          }}>
{`CREATE TABLE IF NOT EXISTS staff_attendance_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL,
  username TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES staff_attendance_members(user_id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL,
  recorded_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, attendance_date)
);

ALTER TABLE staff_attendance_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_attendance DISABLE ROW LEVEL SECURITY;`}
          </pre>

          <button className="btn btn-primary" onClick={loadStaffRoster} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Check size={16} /> Saya sudah menjalankan SQL, Coba Lagi
          </button>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['pelatih', 'dismag', 'superadmin']}>
      <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
        
        {/* Header Action Row */}
        <div className="header-action-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 className="dashboard-title" style={{ margin: 0 }}>
            Absensi Pelatih & Pengawas (1 Minggu)
            <span style={{ marginLeft: '0.75rem', fontSize: '0.8rem', background: 'var(--color-bg-card)', padding: '0.2rem 0.6rem', borderRadius: '12px', border: '1px solid var(--color-border-custom)', color: 'var(--color-text-secondary)' }}>
              {isLoading ? '...' : `${staffRoster.length} Staff`}
            </span>
          </h2>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-sm btn-success" onClick={handleOpenAddModal}>
              <UserPlus size={14} /> Tambah Anggota Absen
            </button>

            <div className="form-group" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label htmlFor="top-evaluator-name" style={{ margin: 0, fontSize: '0.85rem', whiteSpace: 'nowrap', fontWeight: 600 }}>Nama Pencatat:</label>
              <input
                type="text"
                id="top-evaluator-name"
                value={evaluatorName}
                onChange={(e) => setEvaluatorName(e.target.value)}
                placeholder="Nama Pencatat (Wajib)"
                style={{
                  padding: '0.4rem 0.6rem',
                  fontSize: '0.85rem',
                  width: '180px',
                  background: 'rgba(5, 7, 13, 0.6)',
                  border: '1px solid var(--color-border-custom)',
                  borderRadius: '6px',
                  color: 'var(--color-text-primary)',
                  outline: 'none'
                }}
              />
            </div>

            <div className="form-group" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label htmlFor="start-date-picker" style={{ margin: 0, fontSize: '0.85rem', whiteSpace: 'nowrap', fontWeight: 600 }}>Tanggal Mulai:</label>
              <input
                type="date"
                id="start-date-picker"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  padding: '0.4rem 0.6rem',
                  fontSize: '0.85rem',
                  background: 'rgba(5, 7, 13, 0.6)',
                  border: '1px solid var(--color-border-custom)',
                  borderRadius: '6px',
                  color: 'var(--color-text-primary)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="search-input-wrapper" style={{ maxWidth: 400, marginBottom: '1.5rem' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="Cari berdasarkan nama staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem' }}>
            <div className="loading-spinner" />
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Memuat data absensi...</p>
          </div>
        ) : staffRoster.length === 0 ? (
          <div className="empty-state">
            <Inbox />
            <h3>Belum Ada Anggota Roster Absensi</h3>
            <p>Silakan tambah anggota dari akun terdaftar menggunakan tombol di atas.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            
            {/* TABEL PELATIH */}
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#60a5fa', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '0.5px' }}>
                🛡️ ABSENSI PELATIH 
                <span style={{ fontSize: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '0.15rem 0.5rem', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  {pelatihList.length} Anggota
                </span>
              </h3>
              {pelatihList.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.85rem' }}>Tidak ada anggota Pelatih dalam daftar absensi.</p>
                </div>
              ) : (
                <div className="table-responsive" style={{ overflowX: 'auto', border: '1px solid var(--color-border-custom)', borderRadius: '8px', background: 'var(--color-bg-card)' }}>
                  <table className="roster-table" style={{ borderCollapse: 'collapse', width: '100%', minWidth: '1100px' }}>
                    <thead>
                      <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '2px solid var(--color-border-custom)' }}>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', minWidth: '220px', position: 'sticky', left: 0, zIndex: 10, background: '#0e1320', borderRight: '2px solid var(--color-border-custom)' }}>
                          NAMA STAFF (IC)
                        </th>
                        {datesList.map((date, idx) => (
                          <th key={idx} style={{ padding: '0.75rem 0.5rem', textAlign: 'center', minWidth: '110px', fontSize: '0.75rem', background: 'rgba(59, 130, 246, 0.08)', color: '#93c5fd' }}>
                            {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            <div style={{ fontSize: '0.65rem', color: 'rgba(147,197,253,0.6)', marginTop: '2px', fontWeight: 'normal' }}>ABSEN</div>
                          </th>
                        ))}
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', minWidth: '80px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 'bold' }}>
                          HADIR
                        </th>
                        {currentUserRole !== 'pelatih' && (
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'center', minWidth: '130px', background: 'rgba(21, 128, 61, 0.1)', color: '#10b981', fontWeight: 'bold' }}>
                            GAJI
                          </th>
                        )}
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', minWidth: '60px' }}>
                          AKSI
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pelatihList.map((member) => (
                        <tr key={member.user_id} style={{ borderBottom: '1px solid var(--color-border-custom)' }}>
                          <td style={{ padding: '0.75rem 1rem', position: 'sticky', left: 0, zIndex: 5, background: '#0d111d', borderRight: '2px solid var(--color-border-custom)', fontWeight: 'bold' }}>
                            {member.username}
                          </td>
                          {datesList.map((date, idx) => {
                            const dateStr = date.toISOString().split('T')[0];
                            const currentVal = attendanceMatrix[member.user_id]?.[dateStr] || '';
                            return (
                              <td key={idx} style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>
                                <select
                                  value={currentVal}
                                  onChange={(e) => handleSaveAttendance(member.user_id, dateStr, e.target.value)}
                                  style={getSelectStyle(currentVal)}
                                >
                                  <option value="" style={{ background: '#0e1320', color: 'var(--color-text-secondary)' }}>-</option>
                                  <option value="HADIR" style={{ background: '#0e1320', color: '#10b981' }}>HADIR</option>
                                  <option value="TIDAK SAMPAI SELESAI" style={{ background: '#0e1320', color: '#f59e0b' }}>TIDAK SELESAI</option>
                                  <option value="TERLAMBAT" style={{ background: '#0e1320', color: '#ef4444' }}>TERLAMBAT</option>
                                  <option value="IZIN" style={{ background: '#0e1320', color: '#fbbf24' }}>IZIN</option>
                                  <option value="SAKIT" style={{ background: '#0e1320', color: '#60a5fa' }}>SAKIT</option>
                                  <option value="TIDAK HADIR" style={{ background: '#0e1320', color: '#f87171' }}>TIDAK HADIR</option>
                                </select>
                              </td>
                            );
                          })}
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 'bold', color: '#10b981', background: 'rgba(16, 185, 129, 0.04)' }}>
                            {countPresents(member.user_id)} Hari
                          </td>
                          {currentUserRole !== 'pelatih' && (
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 'bold', color: '#10b981', background: 'rgba(16, 185, 129, 0.04)' }}>
                              {formatRupiah(calculateStaffSalary(member.user_id, member.role))}
                            </td>
                          )}
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                            <button
                              onClick={() => handleRemoveMember(member.user_id, member.username)}
                              style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0.2rem' }}
                              title="Hapus dari daftar absensi"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {currentUserRole !== 'pelatih' && (
                      <tfoot>
                        <tr style={{ borderTop: '2px solid var(--color-border-custom)', background: 'rgba(16, 185, 129, 0.05)' }}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: '#10b981', position: 'sticky', left: 0, zIndex: 5, background: '#0d111d', borderRight: '2px solid var(--color-border-custom)' }}>
                            TOTAL GAJI PELATIH
                          </td>
                          <td colSpan={9} style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>
                            {formatRupiah(calculateTotalGroupSalary(pelatihList))}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}
            </div>

            {/* TABEL PENGAWAS */}
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#fbbf24', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '0.5px' }}>
                👑 ABSENSI PENGAWAS 
                <span style={{ fontSize: '0.75rem', background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', padding: '0.15rem 0.5rem', borderRadius: '10px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                  {pengawasList.length} Anggota
                </span>
              </h3>
              {pengawasList.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.85rem' }}>Tidak ada anggota Pengawas dalam daftar absensi.</p>
                </div>
              ) : (
                <div className="table-responsive" style={{ overflowX: 'auto', border: '1px solid var(--color-border-custom)', borderRadius: '8px', background: 'var(--color-bg-card)' }}>
                  <table className="roster-table" style={{ borderCollapse: 'collapse', width: '100%', minWidth: '1100px' }}>
                    <thead>
                      <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '2px solid var(--color-border-custom)' }}>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', minWidth: '220px', position: 'sticky', left: 0, zIndex: 10, background: '#0e1320', borderRight: '2px solid var(--color-border-custom)' }}>
                          NAMA STAFF (IC)
                        </th>
                        {datesList.map((date, idx) => (
                          <th key={idx} style={{ padding: '0.75rem 0.5rem', textAlign: 'center', minWidth: '110px', fontSize: '0.75rem', background: 'rgba(251, 191, 36, 0.06)', color: '#fcd34d' }}>
                            {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            <div style={{ fontSize: '0.65rem', color: 'rgba(252,211,77,0.6)', marginTop: '2px', fontWeight: 'normal' }}>ABSEN</div>
                          </th>
                        ))}
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', minWidth: '80px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 'bold' }}>
                          HADIR
                        </th>
                        {currentUserRole !== 'pelatih' && (
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'center', minWidth: '130px', background: 'rgba(21, 128, 61, 0.1)', color: '#10b981', fontWeight: 'bold' }}>
                            GAJI
                          </th>
                        )}
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', minWidth: '60px' }}>
                          AKSI
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pengawasList.map((member) => (
                        <tr key={member.user_id} style={{ borderBottom: '1px solid var(--color-border-custom)' }}>
                          <td style={{ padding: '0.75rem 1rem', position: 'sticky', left: 0, zIndex: 5, background: '#0d111d', borderRight: '2px solid var(--color-border-custom)', fontWeight: 'bold' }}>
                            {member.username} 
                            <span style={{ fontSize: '0.65rem', color: member.role === 'superadmin' ? '#f87171' : '#fbbf24', marginLeft: '0.5rem', border: `1px solid ${member.role === 'superadmin' ? 'rgba(239,68,68,0.2)' : 'rgba(251,191,36,0.2)'}`, padding: '0.1rem 0.3rem', borderRadius: '4px', background: member.role === 'superadmin' ? 'rgba(239,68,68,0.05)' : 'rgba(251,191,36,0.05)' }}>
                              {member.role === 'superadmin' ? 'Superadmin' : 'Dismag'}
                            </span>
                          </td>
                          {datesList.map((date, idx) => {
                            const dateStr = date.toISOString().split('T')[0];
                            const currentVal = attendanceMatrix[member.user_id]?.[dateStr] || '';
                            return (
                              <td key={idx} style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>
                                <select
                                  value={currentVal}
                                  onChange={(e) => handleSaveAttendance(member.user_id, dateStr, e.target.value)}
                                  style={getSelectStyle(currentVal)}
                                >
                                  <option value="" style={{ background: '#0e1320', color: 'var(--color-text-secondary)' }}>-</option>
                                  <option value="HADIR" style={{ background: '#0e1320', color: '#10b981' }}>HADIR</option>
                                  <option value="TIDAK SAMPAI SELESAI" style={{ background: '#0e1320', color: '#f59e0b' }}>TIDAK SELESAI</option>
                                  <option value="TERLAMBAT" style={{ background: '#0e1320', color: '#ef4444' }}>TERLAMBAT</option>
                                  <option value="IZIN" style={{ background: '#0e1320', color: '#fbbf24' }}>IZIN</option>
                                  <option value="SAKIT" style={{ background: '#0e1320', color: '#60a5fa' }}>SAKIT</option>
                                  <option value="TIDAK HADIR" style={{ background: '#0e1320', color: '#f87171' }}>TIDAK HADIR</option>
                                </select>
                              </td>
                            );
                          })}
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 'bold', color: '#10b981', background: 'rgba(16, 185, 129, 0.04)' }}>
                            {countPresents(member.user_id)} Hari
                          </td>
                          {currentUserRole !== 'pelatih' && (
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 'bold', color: '#10b981', background: 'rgba(16, 185, 129, 0.04)' }}>
                              {formatRupiah(calculateStaffSalary(member.user_id, member.role))}
                            </td>
                          )}
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                            <button
                              onClick={() => handleRemoveMember(member.user_id, member.username)}
                              style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0.2rem' }}
                              title="Hapus dari daftar absensi"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {currentUserRole !== 'pelatih' && (
                      <tfoot>
                        <tr style={{ borderTop: '2px solid var(--color-border-custom)', background: 'rgba(16, 185, 129, 0.05)' }}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: '#10b981', position: 'sticky', left: 0, zIndex: 5, background: '#0d111d', borderRight: '2px solid var(--color-border-custom)' }}>
                            TOTAL GAJI PENGAWAS
                          </td>
                          <td colSpan={9} style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>
                            {formatRupiah(calculateTotalGroupSalary(pengawasList))}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* MODAL TAMBAH ANGGOTA STAFF */}
        <Modal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Tambah Anggota Absensi Staff">
          <form onSubmit={handleAddMemberSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
              Pilih akun terdaftar dari sistem yang ingin dimasukkan ke dalam daftar absensi Staff (Pelatih & Pengawas).
            </p>
            
            <div className="form-group">
              <label htmlFor="select-account-dropdown">Akun Terdaftar</label>
              {registeredAccounts.length === 0 ? (
                <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', fontSize: '0.85rem' }}>
                  Tidak ada akun terdaftar baru yang tersedia untuk ditambahkan (semua akun aktif mungkin sudah masuk daftar absensi).
                </div>
              ) : (
                <select
                  id="select-account-dropdown"
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    background: 'rgba(5, 7, 13, 0.6)',
                    border: '1px solid var(--color-border-custom)',
                    borderRadius: '6px',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {registeredAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.username} ({acc.email}) - Role: {acc.role === 'superadmin' ? 'Superadmin' : (acc.role === 'dismag' ? 'Dismag' : 'Pelatih')}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsAddModalOpen(false)}>
                Batal
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmittingAdd || registeredAccounts.length === 0}>
                {isSubmittingAdd ? 'Menambahkan...' : 'Tambah ke Daftar'}
              </button>
            </div>
          </form>
        </Modal>

      </div>
    </RoleGuard>
  );
}
