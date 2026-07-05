'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { Search, Inbox, Calendar } from 'lucide-react';

export default function AbsensiProbatusPage() {
  const { showToast } = useToast();
  const [roster, setRoster] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // States untuk Absensi
  const [evaluatorName, setEvaluatorName] = useState('');
  
  // Tanggal Mulai Pelatihan (default: 13 hari sebelum hari ini agar hari ini jadi kolom terakhir)
  const getInitialStartDate = () => {
    const today = new Date();
    today.setDate(today.getDate() - 13);
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  const [startDate, setStartDate] = useState(getInitialStartDate());
  const [attendanceMatrix, setAttendanceMatrix] = useState<Record<string, Record<string, string>>>({});

  // Helper untuk generate 14 tanggal berurutan
  const getDatesArray = (startStr: string) => {
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
    loadTrainees();
  }, []);

  useEffect(() => {
    loadAttendanceData();
  }, [startDate, roster]);

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
    if (roster.length === 0) return;
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
    if (!evaluatorName.trim()) {
      showToast('Nama Pelatih wajib diisi di bagian atas untuk mencatat absensi.', 'error');
      return;
    }

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
        showToast('Absensi berhasil dihapus.', 'success');
      } else {
        // Upsert record absensi
        const { error } = await supabase
          .from('probatus_attendance')
          .upsert({
            application_id: memberId,
            attendance_date: dateStr,
            status: status,
            recorded_by: evaluatorName.trim()
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
    } else if (value === 'TIDAK SAMPAI SELESAI') {
      bg = 'rgba(245, 158, 11, 0.2)';
      color = '#f59e0b';
      border = '1px solid rgba(245, 158, 11, 0.4)';
    } else if (value === 'TERLAMBAT') {
      bg = 'rgba(239, 68, 68, 0.2)';
      color = '#ef4444';
      border = '1px solid rgba(239, 68, 68, 0.4)';
    } else if (value === 'IZIN') {
      bg = 'rgba(251, 191, 36, 0.2)';
      color = '#fbbf24';
      border = '1px solid rgba(251, 191, 36, 0.4)';
    } else if (value === 'TIDAK HADIR') {
      bg = 'rgba(220, 38, 38, 0.35)';
      color = '#f87171';
      border = '1px solid rgba(220, 38, 38, 0.5)';
    } else if (value === 'NGEJAR MATERI') {
      bg = 'rgba(156, 163, 175, 0.2)';
      color = '#9ca3af';
      border = '1px solid rgba(156, 163, 175, 0.4)';
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

  const filtered = roster.filter(member =>
    member.ic_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <div className="header-action-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 className="dashboard-title" style={{ margin: 0 }}>
          Absensi Probatus (14 Hari)
          <span style={{ marginLeft: '0.75rem', fontSize: '0.8rem', background: 'var(--color-bg-card)', padding: '0.2rem 0.6rem', borderRadius: '12px', border: '1px solid var(--color-border-custom)', color: 'var(--color-text-secondary)' }}>
            {isLoading ? '...' : `${roster.length} Siswa`}
          </span>
        </h2>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label htmlFor="top-evaluator-name" style={{ margin: 0, fontSize: '0.85rem', whiteSpace: 'nowrap', fontWeight: 600 }}>Nama Pelatih:</label>
            <input
              type="text"
              id="top-evaluator-name"
              value={evaluatorName}
              onChange={(e) => setEvaluatorName(e.target.value)}
              placeholder="Input Nama Pelatih (Wajib)"
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

      <div className="search-input-wrapper" style={{ maxWidth: 400, marginBottom: '1.5rem' }}>
        <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input
          type="text"
          placeholder="Cari berdasarkan nama karakter..."
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
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Inbox />
          <h3>Tidak Ada Siswa Pelatihan</h3>
          <p>
            {roster.length === 0
              ? 'Belum ada anggota yang terdaftar dengan status pelatihan.'
              : 'Tidak ditemukan anggota yang cocok dengan pencarian.'}
          </p>
        </div>
      ) : (
        <div className="table-responsive" style={{ overflowX: 'auto', border: '1px solid var(--color-border-custom)', borderRadius: '8px', background: 'var(--color-bg-card)' }}>
          <table className="roster-table" style={{ borderCollapse: 'collapse', width: '100%', minWidth: '1600px' }}>
            <thead>
              {/* Baris Keterangan Minggu */}
              <tr style={{ background: 'rgba(15, 23, 42, 0.95)' }}>
                <th style={{ padding: '0.4rem 1rem', position: 'sticky', left: 0, zIndex: 10, background: '#0e1320', borderRight: '2px solid var(--color-border-custom)' }} />
                <th
                  colSpan={7}
                  style={{
                    padding: '0.4rem 0.5rem',
                    textAlign: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '2px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: '#60a5fa',
                    borderBottom: '2px solid rgba(59, 130, 246, 0.35)',
                    borderRight: '2px solid rgba(59, 130, 246, 0.35)'
                  }}
                >
                  MINGGU 1 — PEMBUKAAN
                </th>
                <th
                  colSpan={7}
                  style={{
                    padding: '0.4rem 0.5rem',
                    textAlign: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '2px',
                    background: 'rgba(251, 191, 36, 0.12)',
                    color: '#fbbf24',
                    borderBottom: '2px solid rgba(251, 191, 36, 0.35)',
                    borderRight: '2px solid rgba(251, 191, 36, 0.25)'
                  }}
                >
                  MINGGU 2 — PELATIHAN
                </th>
                <th style={{ background: 'rgba(21, 128, 61, 0.1)' }} />
              </tr>
              <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '2px solid var(--color-border-custom)' }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', minWidth: '200px', position: 'sticky', left: 0, zIndex: 10, background: '#0e1320', borderRight: '2px solid var(--color-border-custom)' }}>
                  NAMA ANGOTA (IC)
                </th>
                {datesList.map((date, idx) => {
                  const isWeek1 = idx < 7;
                  const dayName = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                  return (
                    <th
                      key={idx}
                      style={{
                        padding: '0.75rem 0.5rem',
                        textAlign: 'center',
                        minWidth: '110px',
                        fontSize: '0.75rem',
                        letterSpacing: '0.5px',
                        background: isWeek1 ? 'rgba(59, 130, 246, 0.08)' : 'rgba(251, 191, 36, 0.06)',
                        color: isWeek1 ? '#93c5fd' : '#fcd34d',
                        borderRight: idx === 6 ? '2px solid rgba(251, 191, 36, 0.35)' : undefined
                      }}
                    >
                      {dayName}
                      <div style={{ fontSize: '0.65rem', color: isWeek1 ? 'rgba(147,197,253,0.6)' : 'rgba(252,211,77,0.6)', marginTop: '2px', fontWeight: 'normal' }}>ABSEN</div>
                    </th>
                  );
                })}
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', minWidth: '80px', background: 'rgba(21, 128, 61, 0.1)', color: '#10b981', fontWeight: 'bold' }}>
                  TOTAL
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((member) => (
                <tr key={member.id} style={{ borderBottom: '1px solid var(--color-border-custom)', transition: 'background-color 0.2s' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', fontSize: '0.85rem', position: 'sticky', left: 0, zIndex: 9, background: '#0e1320', borderRight: '2px solid var(--color-border-custom)' }}>
                    {member.ic_name}
                  </td>
                  {datesList.map((date, idx) => {
                    const dateStr = date.toISOString().split('T')[0];
                    const val = (attendanceMatrix[member.id] || {})[dateStr] || '';
                    const isWeek1 = idx < 7;
                    return (
                      <td key={idx} style={{ padding: '0.4rem 0.35rem', textAlign: 'center', background: isWeek1 ? 'rgba(59, 130, 246, 0.04)' : 'rgba(251, 191, 36, 0.03)', borderRight: idx === 6 ? '2px solid rgba(251, 191, 36, 0.25)' : undefined }}>
                        <select
                          value={val}
                          onChange={(e) => handleSaveAttendance(member.id, dateStr, e.target.value)}
                          style={getSelectStyle(val) as any}
                        >
                          <option value="" style={{ background: '#0e1320', color: 'var(--color-text-secondary)' }}>-</option>
                          <option value="HADIR" style={{ background: '#0e1320', color: '#10b981' }}>HADIR</option>
                          <option value="TIDAK SAMPAI SELESAI" style={{ background: '#0e1320', color: '#f59e0b' }}>TIDAK SAMPAI SELESAI</option>
                          <option value="TERLAMBAT" style={{ background: '#0e1320', color: '#ef4444' }}>TERLAMBAT</option>
                          <option value="IZIN" style={{ background: '#0e1320', color: '#fbbf24' }}>IZIN</option>
                          <option value="TIDAK HADIR" style={{ background: '#0e1320', color: '#f87171' }}>TIDAK HADIR</option>
                          <option value="NGEJAR MATERI" style={{ background: '#0e1320', color: '#9ca3af' }}>NGEJAR MATERI</option>
                        </select>
                      </td>
                    );
                  })}
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', background: 'rgba(21, 128, 61, 0.05)', color: '#10b981' }}>
                    {formatRupiah(calculateTotalSalary(member.id))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--color-border-custom)' }}>
                <td 
                  colSpan={15}
                  style={{ 
                    padding: '0.75rem 1rem', 
                    textAlign: 'center', 
                    fontWeight: 800, 
                    fontSize: '0.9rem', 
                    letterSpacing: '3px',
                    background: '#851c1c',
                    color: '#ffffff',
                  }}
                >
                  TOTAL
                </td>
                <td 
                  style={{ 
                    padding: '0.75rem 1rem', 
                    textAlign: 'center', 
                    fontWeight: 'bold', 
                    fontSize: '0.9rem', 
                    background: '#15803d',
                    color: '#ffffff',
                    whiteSpace: 'nowrap'
                  }}
                >
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
