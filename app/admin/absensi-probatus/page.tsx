'use client';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { Search, Inbox, Calendar } from 'lucide-react';
import { logActivity } from '@/lib/activity-log';
import { getDateSetting, updateSystemSetting } from '@/lib/settings';
import useDebounce from '@/app/hooks/useDebounce';
import { TableSkeleton } from '@/components/Skeleton';

export default function AbsensiProbatusPage() {
  const { showToast } = useToast();
  const [roster, setRoster] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [isLoading, setIsLoading] = useState(true);

  // States untuk Absensi
  const [evaluatorName, setEvaluatorName] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState<string>('pelatih');
  
  // Tanggal Mulai Pelatihan — akan dimuat dari database saat mount
  const [startDate, setStartDate] = useState<string | null>(null);
  const [startDateLoaded, setStartDateLoaded] = useState(false);
  const [pendingDate, setPendingDate] = useState<string | null>(null);
  const [showDateConfirm, setShowDateConfirm] = useState(false);
  const [attendanceMatrix, setAttendanceMatrix] = useState<Record<string, Record<string, string>>>({});

  // Helper untuk generate 14 tanggal berurutan
  const getDatesArray = (startStr: string | null) => {
    if (!startStr) return [];
    const dates = [];
    const baseDate = new Date(startStr);
    for (let i = 0; i < 14; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const datesList = getDatesArray(startDate);

  useEffect(() => {
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
      today.setDate(today.getDate() - 13);
      const offset = today.getTimezoneOffset();
      return new Date(today.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
    })();

    getDateSetting('absensi_probatus_start_date', defaultDate).then(date => {
      setStartDate(date);
      setStartDateLoaded(true);
    });
    
    loadTrainees();
  }, []);

  useEffect(() => {
    if (startDateLoaded && startDate) {
      loadAttendanceData();
    }
  }, [startDate, startDateLoaded, startDate, roster]);

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
      showToast('Gagal memuat data anggota dari database.', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadAttendanceData() {
    if (roster.length === 0 || datesList.length === 0) return;
    try {
      const startStr = datesList[0].toISOString().split('T')[0];
      const endStr = datesList[13].toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('probatus_attendance')
        .select('application_id, attendance_date, status')
        .gte('attendance_date', startStr)
        .lte('attendance_date', endStr);

      if (error) throw error;

      const matrix: Record<string, Record<string, string>> = {};
      roster.forEach(m => {
        matrix[m.id] = {};
      });

      data?.forEach(row => {
        if (matrix[row.application_id]) {
          matrix[row.application_id][row.attendance_date] = row.status;
        }
      });

      setAttendanceMatrix(matrix);
    } catch (err) {
      console.error('Gagal memuat data absensi harian:', err);
    }
  }

  const handleSaveAttendance = async (memberId: string, dateStr: string, status: string) => {
    const recorderName = evaluatorName.trim() || 'Admin';
    const member = roster.find(m => m.id === memberId);
    const memberName = member ? member.ic_name : 'Unknown';

    try {
      if (!status) {
        // Hapus record absensi jika dikosongkan
        const { error } = await supabase
          .from('probatus_attendance')
          .delete()
          .eq('application_id', memberId)
          .eq('attendance_date', dateStr);
        if (error) throw error;

        setAttendanceMatrix(prev => {
          const next = { ...prev };
          if (next[memberId]) {
            delete next[memberId][dateStr];
          }
          return next;
        });
        logActivity(`Menghapus absensi Probatus <strong>${memberName}</strong> pada tanggal ${dateStr}`);
        showToast('Absensi berhasil dihapus.', 'success');
      } else {
        // Upsert record absensi
        const { error } = await supabase
          .from('probatus_attendance')
          .upsert({
            application_id: memberId,
            attendance_date: dateStr,
            status: status,
            recorded_by: recorderName
          }, {
            onConflict: 'application_id,attendance_date'
          });
        if (error) throw error;

        setAttendanceMatrix(prev => {
          const next = { ...prev };
          if (!next[memberId]) next[memberId] = {};
          next[memberId][dateStr] = status;
          return next;
        });
        logActivity(`Mencatat absensi Probatus <strong>${memberName}</strong> pada tanggal ${dateStr} sebagai <strong>${status}</strong>`);
        showToast(`Absensi dicatat: ${status}`, 'success');
      }
    } catch (err: any) {
      showToast(`Gagal mencatat absensi: ${err.message}`, 'error');
    }
  };

  const getSelectClass = (value: string) => {
    if (value === 'HADIR') return 'attendance-select hadir';
    if (value === 'IZIN') return 'attendance-select izin';
    if (value === 'TIDAK HADIR') return 'attendance-select tidak-hadir';
    if (value === 'TIDAK SAMPAI SELESAI') return 'attendance-select tidak-selesai';
    if (value === 'TERLAMBAT') return 'attendance-select terlambat';
    if (value === 'NGEJAR MATERI') return 'attendance-select ngejar-materi';
    return 'attendance-select';
  };

  const calculateTotalSalary = (memberId: string) => {
    const memberAttendance = attendanceMatrix[memberId] || {};
    let total = 0;
    datesList.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      const status = memberAttendance[dateStr];
      if (status === 'HADIR') {
        total += 40000;
      } else if (status === 'TERLAMBAT' || status === 'TIDAK SAMPAI SELESAI') {
        total += 20000;
      }
    });
    return total;
  };

  const formatRupiah = (amount: number) => {
    return 'Rp' + amount.toLocaleString('id-ID');
  };

  const calculateGrandTotalSalary = () => {
    let grandTotal = 0;
    filtered.forEach(member => {
      grandTotal += calculateTotalSalary(member.id);
    });
    return grandTotal;
  };

  const filtered = useMemo(() => {
    return roster.filter(member =>
      member.ic_name?.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [roster, debouncedSearch]);



  return (
    <div className="page-container">
      <div className="header-action-row">
        <h2 className="dashboard-title">
          Absensi Probatus (14 Hari)
          <span className="count-badge">
            {isLoading ? '...' : `${roster.length} Siswa`}
          </span>
        </h2>

        <div className="filter-actions">
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
                if (currentUserRole === 'pimpinan') {
                  // Read-only role cannot change date
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
                        const success = await updateSystemSetting('absensi_probatus_start_date', pendingDate);
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
      </div>

      <div className="search-input-wrapper" style={{ maxWidth: 400 }}>
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Cari berdasarkan nama karakter..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {!startDate || isLoading ? (
        <TableSkeleton rows={5} columns={8} />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Inbox size={24} color="var(--color-text-muted)" />
          </div>
          <h3 className="empty-state-title">Tidak Ada Siswa Pelatihan</h3>
          <p className="empty-state-description">
            {roster.length === 0
              ? 'Belum ada anggota yang terdaftar dengan status pelatihan.'
              : 'Tidak ditemukan anggota yang cocok dengan pencarian.'}
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="roster-table">
            <thead>
              <tr className="probatus-week-row">
                <th className="probatus-week-corner" />
                <th colSpan={7} className="probatus-week-header minggu1">
                  MINGGU 1 - PEMBUKAAN
                </th>
                <th colSpan={7} className="probatus-week-header minggu2">
                  MINGGU 2 - PELATIHAN
                </th>
                <th className="probatus-week-total" />
              </tr>
              <tr>
                <th className="attendance-header-cell name-col">
                  NAMA ANGGOTA (IC)
                </th>
                {datesList.map((date, idx) => {
                  const isWeek1 = idx < 7;
                  const dayName = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                  return (
                    <th
                      key={idx}
                      className={`attendance-header-cell date-col ${isWeek1 ? 'pelatih-bg' : 'pengawas-bg'} ${idx === 6 ? 'week-divider' : ''}`}
                    >
                      <span className="attendance-header-sub">
                        {dayName}
                        <span className="attendance-header-sub-text">ABSEN</span>
                      </span>
                    </th>
                  );
                })}
                <th className="attendance-header-cell hadir-col">
                  TOTAL
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((member) => (
                <tr key={member.id}>
                  <td className="member-name-cell-staff">
                    {member.ic_name}
                  </td>
                  {datesList.map((date, idx) => {
                    const dateStr = date.toISOString().split('T')[0];
                    const val = (attendanceMatrix[member.id] || {})[dateStr] || '';
                    const isWeek1 = idx < 7;
                    return (
                      <td key={idx} className={`attendance-data-cell ${isWeek1 ? 'week1-bg' : 'week2-bg'} ${idx === 6 ? 'week-divider' : ''}`}>
                        <select
                          value={val}
                          onChange={(e) => handleSaveAttendance(member.id, dateStr, e.target.value)}
                          className={getSelectClass(val)}
                          disabled={currentUserRole === 'pimpinan'}
                        >
                          <option value="">-</option>
                          <option value="HADIR">HADIR</option>
                          <option value="TIDAK SAMPAI SELESAI">TIDAK SAMPAI SELESAI</option>
                          <option value="TERLAMBAT">TERLAMBAT</option>
                          <option value="IZIN">IZIN</option>
                          <option value="TIDAK HADIR">TIDAK HADIR</option>
                          <option value="NGEJAR MATERI">NGEJAR MATERI</option>
                        </select>
                      </td>
                    );
                  })}
                  <td className="attendance-gaji-value">
                    {formatRupiah(calculateTotalSalary(member.id))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="attendance-total-row">
                <td colSpan={15} className="probatus-grand-total-label">
                  TOTAL
                </td>
                <td className="probatus-grand-total-value">
                  {formatRupiah(calculateGrandTotalSalary())}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

