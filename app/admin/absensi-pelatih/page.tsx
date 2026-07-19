'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { Search, Inbox, Calendar, UserPlus, Trash2, ShieldAlert, Check } from 'lucide-react';
import Modal from '@/components/Modal';
import RoleGuard from '@/components/RoleGuard';
import { listRegisteredAccounts, addStaffMember, removeStaffMember } from './actions';
import { logActivity } from '@/lib/activity-log';
import { getDateSetting, updateSystemSetting } from '@/lib/settings';

export default function AbsensiPelatihPage() {
  const { showToast } = useToast();
  
  // States
  const [staffRoster, setStaffRoster] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('pelatih');
  
  // Tanggal Mulai Pelatihan — akan dimuat dari database saat mount
  const [startDate, setStartDate] = useState<string | null>(null);
  const [startDateLoaded, setStartDateLoaded] = useState(false);
  const [pendingDate, setPendingDate] = useState<string | null>(null);
  const [showDateConfirm, setShowDateConfirm] = useState(false);
  const [evaluatorName, setEvaluatorName] = useState('');
  const [attendanceMatrix, setAttendanceMatrix] = useState<Record<string, Record<string, string>>>({});

  // Modal Tambah Anggota Absen
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [registeredAccounts, setRegisteredAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Generate 7 tanggal berurutan
  const getDatesArray = (startStr: string | null) => {
    if (!startStr) return [];
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

    // Load start date from database (otomatis tersimpan jika belum ada)
    const defaultDate = (() => {
      const today = new Date();
      today.setDate(today.getDate() - 6);
      const offset = today.getTimezoneOffset();
      return new Date(today.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
    })();

    getDateSetting('absensi_pelatih_start_date', defaultDate).then(date => {
      setStartDate(date);
      setStartDateLoaded(true);
    });
    
    loadStaffRoster();
  }, []);

  useEffect(() => {
    if (startDateLoaded && startDate && !dbError && staffRoster.length > 0) {
      loadAttendanceData();
    }
  }, [startDate, startDateLoaded, startDate, staffRoster, dbError]);

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
    if (datesList.length === 0) return;
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
        logActivity(`Menambahkan <strong>${selectedAcc.username}</strong> (${selectedAcc.role.toUpperCase()}) ke daftar absensi staff`);
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
        logActivity(`Menghapus <strong>${name}</strong> dari daftar absensi staff`);
        loadStaffRoster();
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSaveAttendance = async (memberId: string, dateStr: string, status: string) => {
    const recorderName = evaluatorName.trim() || 'Admin';
    const member = staffRoster.find(m => m.user_id === memberId);
    const memberName = member ? member.username : 'Unknown';

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
        logActivity(`Menghapus absensi staff <strong>${memberName}</strong> pada tanggal ${dateStr}`);
        showToast('Absensi berhasil dihapus.', 'success');
      } else {
        // Upsert record absensi
        const { error } = await supabase
          .from('staff_attendance')
          .upsert({
            user_id: memberId,
            attendance_date: dateStr,
            status: status,
            recorded_by: recorderName
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
        logActivity(`Mencatat absensi staff <strong>${memberName}</strong> pada tanggal ${dateStr} sebagai <strong>${status}</strong>`);
        showToast(`Absensi dicatat: ${status}`, 'success');
      }
    } catch (err: any) {
      showToast(`Gagal mencatat absensi: ${err.message}`, 'error');
    }
  };

  const getSelectClass = (value: string) => {
    if (value === 'HADIR') return 'attendance-select hadir';
    if (value === 'IZIN') return 'attendance-select izin';
    if (value === 'SAKIT') return 'attendance-select sakit';
    if (value === 'TIDAK HADIR') return 'attendance-select tidak-hadir';
    if (value === 'TIDAK SAMPAI SELESAI') return 'attendance-select tidak-selesai';
    if (value === 'TERLAMBAT') return 'attendance-select terlambat';
    return 'attendance-select';
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
        <div className="db-error-card">
          <div className="db-error-header">
            <ShieldAlert size={40} />
            <h2>Migrasi Database Diperlukan</h2>
          </div>
          <p>
            Tabel untuk fitur **Absensi Staff** belum dibuat di database Supabase Anda. 
            Silakan jalankan skrip SQL berikut di **SQL Editor Supabase** proyek Anda:
          </p>

          <pre className="db-error-sql">
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

          <button className="btn btn-primary" onClick={loadStaffRoster}>
            <Check size={16} /> Saya sudah menjalankan SQL, Coba Lagi
          </button>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['pelatih', 'dismag', 'superadmin']}>
      <div className="page-container">
        
        {/* Header Action Row */}
        <div className="header-action-row">
          <h2 className="dashboard-title">
            Absensi Pelatih & Pengawas (1 Minggu)
            <span className="count-badge">
              {isLoading ? '...' : `${staffRoster.length} Staff`}
            </span>
          </h2>
          <button className="btn btn-sm btn-success" onClick={handleOpenAddModal}>
            <UserPlus size={14} /> Tambah Anggota Absen
          </button>
        </div>

        {/* Filter and Config Bar */}
        <div className="filter-bar">
          <div className="form-group attendance-date-group">
            <label htmlFor="start-date-picker">Tanggal Mulai:</label>
            <input
              type="date"
              id="start-date-picker"
              className={`attendance-date-input ${currentUserRole === 'pelatih' ? 'restricted' : ''}`}
              value={startDate ?? ''}
              onChange={(e) => {
                const newDate = e.target.value;
                if (currentUserRole === 'pelatih') {
                  showToast('Hanya Dismag & Superadmin yang dapat mengubah tanggal mulai.', 'error');
                  return;
                }
                setPendingDate(newDate);
                setShowDateConfirm(true);
              }}
            />
            {currentUserRole === 'pelatih' && (
              <span className="date-restricted-note">Hanya Dismag</span>
            )}
          </div>

          {/* Modal Konfirmasi 2x Ubah Tanggal */}
          {showDateConfirm && (
            <div className="modal-overlay">
              <div className="glass-card modal-question-box">
                <h3 className="modal-question-title">
                  ⚠️ Konfirmasi Ubah Tanggal
                </h3>
                <p className="modal-question-desc">
                  Anda akan mengubah tanggal mulai absensi menjadi:
                </p>
                <p className="modal-question-date">
                  {pendingDate ? new Date(pendingDate + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                </p>
                <p className="modal-question-warning">
                  Data absensi yang sudah tercatat sebelumnya <strong>tidak akan hilang</strong>, namun tampilan akan berubah.
                </p>
                <div className="modal-actions">
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      setShowDateConfirm(false);
                      setPendingDate(null);
                    }}
                  >
                    Batal
                  </button>
                  <button
                    className="btn btn-sm btn-primary btn-confirm-gold"
                    onClick={async () => {
                      if (pendingDate) {
                        const success = await updateSystemSetting('absensi_pelatih_start_date', pendingDate);
                        if (success) {
                          setStartDate(pendingDate);
                          showToast('Tanggal mulai absensi berhasil diubah.', 'success');
                        } else {
                          showToast('Gagal menyimpan tanggal ke database.', 'error');
                        }
                      }
                      setShowDateConfirm(false);
                      setPendingDate(null);
                    }}
                  >
                    Ya, Ubah Tanggal
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {!startDate || isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>Memuat data absensi...</p>
          </div>
        ) : staffRoster.length === 0 ? (
          <div className="empty-state">
            <Inbox />
            <h3>Belum Ada Anggota Roster Absensi</h3>
            <p>Silakan tambah anggota dari akun terdaftar menggunakan tombol di atas.</p>
          </div>
        ) : (
          <div className="attendance-tables-container">
            
            {/* TABEL PELATIH */}
            <div>
              <h3 className="attendance-section-title pelatih">
                🛡️ ABSENSI PELATIH 
                <span className="attendance-section-count">{pelatihList.length} Anggota</span>
              </h3>
              {pelatihList.length === 0 ? (
                <div className="empty-section">
                  <p>Tidak ada anggota Pelatih dalam daftar absensi.</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="roster-table">
                    <thead>
                      <tr>
                        <th className="attendance-header-cell name-col">NAMA STAFF (IC)</th>
                        {datesList.map((date, idx) => (
                          <th key={idx} className="attendance-header-cell date-col pelatih-bg">
                            <span className="attendance-header-sub">
                              {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              <span className="attendance-header-sub-text">ABSEN</span>
                            </span>
                          </th>
                        ))}
                        <th className="attendance-header-cell hadir-col">HADIR</th>
                        {currentUserRole !== 'pelatih' && (
                          <th className="attendance-header-cell gaji-col">GAJI</th>
                        )}
                        <th className="attendance-header-cell aksi-col">AKSI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pelatihList.map((member) => (
                        <tr key={member.user_id}>
                          <td className="member-name-cell-staff">{member.username}
                          </td>
                          {datesList.map((date, idx) => {
                            const dateStr = date.toISOString().split('T')[0];
                            const currentVal = attendanceMatrix[member.user_id]?.[dateStr] || '';
                            return (
                              <td key={idx} className="attendance-data-cell">
                                <select
                                  value={currentVal}
                                  onChange={(e) => handleSaveAttendance(member.user_id, dateStr, e.target.value)}
                                  className={getSelectClass(currentVal)}
                                >
                                  <option value="">-</option>
                                  <option value="HADIR">HADIR</option>
                                  <option value="TIDAK SAMPAI SELESAI">TIDAK SELESAI</option>
                                  <option value="TERLAMBAT">TERLAMBAT</option>
                                  <option value="IZIN">IZIN</option>
                                  <option value="SAKIT">SAKIT</option>
                                  <option value="TIDAK HADIR">TIDAK HADIR</option>
                                </select>
                              </td>
                            );
                          })}
                          <td className="attendance-hadir-count">{countPresents(member.user_id)} Hari</td>
                          {currentUserRole !== 'pelatih' && (
                            <td className="attendance-gaji-value">{formatRupiah(calculateStaffSalary(member.user_id, member.role))}</td>
                          )}
                          <td className="attendance-aksi-cell">
                            <button
                              onClick={() => handleRemoveMember(member.user_id, member.username)}
                              className="icon-btn delete-user"
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
                        <tr className="attendance-total-row">
                          <td className="attendance-total-label">
                            TOTAL GAJI PELATIH
                          </td>
                          <td colSpan={8} className="attendance-subtotal-label">
                            Subtotal Gaji:
                          </td>
                          <td className="attendance-total-value">
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
              <h3 className="attendance-section-title pengawas">
                👑 ABSENSI PENGAWAS 
                <span className="attendance-section-count">{pengawasList.length} Anggota</span>
              </h3>
              {pengawasList.length === 0 ? (
                <div className="empty-section">
                  <p>Tidak ada anggota Pengawas dalam daftar absensi.</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="roster-table">
                    <thead>
                      <tr>
                        <th className="attendance-header-cell name-col">NAMA STAFF (IC)</th>
                        {datesList.map((date, idx) => (
                          <th key={idx} className="attendance-header-cell date-col pengawas-bg">
                            <span className="attendance-header-sub">
                              {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              <span className="attendance-header-sub-text">ABSEN</span>
                            </span>
                          </th>
                        ))}
                        <th className="attendance-header-cell hadir-col">HADIR</th>
                        {currentUserRole !== 'pelatih' && (
                          <th className="attendance-header-cell gaji-col">GAJI</th>
                        )}
                        <th className="attendance-header-cell aksi-col">AKSI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pengawasList.map((member) => (
                        <tr key={member.user_id}>
                          <td className="member-name-cell-staff">
                            {member.username} 
                            <span className={`badge-role ${member.role === 'superadmin' ? 'superadmin' : 'dismag'}`}>
                              {member.role === 'superadmin' ? 'Superadmin' : 'Dismag'}
                            </span>
                          </td>
                          {datesList.map((date, idx) => {
                            const dateStr = date.toISOString().split('T')[0];
                            const currentVal = attendanceMatrix[member.user_id]?.[dateStr] || '';
                            return (
                              <td key={idx} className="attendance-data-cell">
                                <select
                                  value={currentVal}
                                  onChange={(e) => handleSaveAttendance(member.user_id, dateStr, e.target.value)}
                                  className={getSelectClass(currentVal)}
                                >
                                  <option value="">-</option>
                                  <option value="HADIR">HADIR</option>
                                  <option value="TIDAK SAMPAI SELESAI">TIDAK SELESAI</option>
                                  <option value="TERLAMBAT">TERLAMBAT</option>
                                  <option value="IZIN">IZIN</option>
                                  <option value="SAKIT">SAKIT</option>
                                  <option value="TIDAK HADIR">TIDAK HADIR</option>
                                </select>
                              </td>
                            );
                          })}
                          <td className="attendance-hadir-count">{countPresents(member.user_id)} Hari</td>
                          {currentUserRole !== 'pelatih' && (
                            <td className="attendance-gaji-value">{formatRupiah(calculateStaffSalary(member.user_id, member.role))}</td>
                          )}
                          <td className="attendance-aksi-cell">
                            <button
                              onClick={() => handleRemoveMember(member.user_id, member.username)}
                              className="icon-btn delete-user"
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
                        <tr className="attendance-total-row">
                          <td className="attendance-total-label">
                            TOTAL GAJI PENGAWAS
                          </td>
                          <td colSpan={8} className="attendance-subtotal-label">
                            Subtotal Gaji:
                          </td>
                          <td className="attendance-total-value">
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
          <form className="modal-form" onSubmit={handleAddMemberSubmit}>
            <p className="modal-form-desc">
              Pilih akun terdaftar dari sistem yang ingin dimasukkan ke dalam daftar absensi Staff (Pelatih & Pengawas).
            </p>
            
            <div className="form-group">
              <label htmlFor="select-account-dropdown">Akun Terdaftar</label>
              {registeredAccounts.length === 0 ? (
                <div className="empty-section">
                  Tidak ada akun terdaftar baru yang tersedia untuk ditambahkan (semua akun aktif mungkin sudah masuk daftar absensi).
                </div>
              ) : (
                <select
                  id="select-account-dropdown"
                  className="form-input"
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  required
                >
                  {registeredAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.username} ({acc.email}) - Role: {acc.role === 'superadmin' ? 'Superadmin' : (acc.role === 'dismag' ? 'Dismag' : 'Pelatih')}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="modal-actions">
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
