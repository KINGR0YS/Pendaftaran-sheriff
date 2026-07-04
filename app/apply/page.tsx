'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { ChevronRight, ChevronLeft, Check, MessageSquare, ExternalLink, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ApplyPage() {
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [activeBatch, setActiveBatch] = useState('1');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [formData, setFormData] = useState({
    ooc_name: '',
    passport_name_ooc: '',
    ooc_age: '',
    ooc_gender: '',
    discord_id: '',
    steam_hex: '',
    playtime: '',
    rp_experience_ooc: '',
    obligations_other_cities: '',
    ic_name: '',
    ic_age: '',
    ic_gender: '',
    ic_dob: '',
    phone_number: '',
    experience: '',
    criminal_record: '',
    work_experience_ic: '',
    motivation_roxwood: '',
    why_accept_roxwood: '',
    active_hours: '',
  });

  useEffect(() => {
    const recruitmentStatus = localStorage.getItem('recruitment_status') || 'open';
    const allowApplyAccess = localStorage.getItem('allowApplyAccess') === 'true';
    setActiveBatch(localStorage.getItem('active_batch') || '1');

    if (recruitmentStatus === 'closed') {
      showToast('Pendaftaran ditutup saat ini!', 'error');
      window.location.href = '/';
      return;
    }

    if (!allowApplyAccess) {
      showToast('Silakan gulir halaman utama sampai paling bawah untuk melakukan pendaftaran!', 'warning');
      window.location.href = '/';
      return;
    }

    // Reset izin agar tidak bisa di-bypass dengan reload atau bookmark langsung
    localStorage.removeItem('allowApplyAccess');
  }, [showToast]);

  const handleChange = (e: any) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const validateStep = (currentStep: number) => {
    let fields: string[] = [];
    if (currentStep === 1) {
      fields = ['ooc_name', 'passport_name_ooc', 'ooc_age', 'ooc_gender', 'discord_id', 'steam_hex', 'playtime', 'rp_experience_ooc', 'obligations_other_cities'];
    } else if (currentStep === 2) {
      fields = ['ic_name', 'ic_age', 'ic_gender', 'ic_dob', 'phone_number', 'experience'];
    }

    for (const field of fields) {
      if (!formData[field as keyof typeof formData]) {
        return false;
      }
    }

    if (currentStep === 1) {
      const age = parseInt(formData.ooc_age);
      if (isNaN(age) || age < 1 || age > 60) {
        showToast('Umur OOC harus valid (1 - 60 tahun)!', 'error');
        return false;
      }
    } else if (currentStep === 2) {
      const age = parseInt(formData.ic_age);
      if (isNaN(age) || age < 1 || age > 100) {
        showToast('Umur Karakter IC harus valid (1 - 100 tahun)!', 'error');
        return false;
      }
    }

    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
    } else {
      showToast('Harap lengkapi semua kolom wajib diisi (*)!', 'error');
    }
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fieldsStep3 = ['criminal_record', 'work_experience_ic', 'motivation_roxwood', 'why_accept_roxwood', 'active_hours'];
    for (const field of fieldsStep3) {
      if (!formData[field as keyof typeof formData]) {
        showToast('Harap lengkapi semua kolom wajib diisi (*)!', 'error');
        return;
      }
    }

    const payload = {
      ...formData,
      ooc_age: parseInt(formData.ooc_age),
      ic_age: parseInt(formData.ic_age),
      batch: activeBatch,
      status: 'pending',
      origin: '-',
      chain_of_command: '-',
      scenario_use_of_force: '-',
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('applications').insert([payload]);
      if (error) throw error;
      localStorage.removeItem('allowApplyAccess');
      setShowSuccessModal(true);
    } catch (err: any) {
      showToast(`Gagal mengirim pendaftaran: ${err.message}`, 'error');
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: 'calc(100vh - 70px)', padding: '2rem 1.5rem' }}>
      <div className="glow-bg glow-1"></div>
      <div className="glow-bg glow-2"></div>

      <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: 'var(--font-header)', fontSize: '1.8rem', color: 'var(--color-gold)' }}>Formulir Pendaftaran Probatus</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Lengkapi formulir dengan jujur. Semua informasi akan ditinjau oleh anggota DISMAG.</p>

          <div className="step-progress">
            <div className={`step-indicator ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>1 <span className="step-label">OOC</span></div>
            <div className={`step-line ${step > 1 ? 'completed' : ''}`}></div>
            <div className={`step-indicator ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>2 <span className="step-label">IC</span></div>
            <div className={`step-line ${step > 2 ? 'completed' : ''}`}></div>
            <div className={`step-indicator ${step >= 3 ? 'active' : ''}`}>3 <span className="step-label">Kualifikasi</span></div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="form-step active">
              <h3 style={{ fontFamily: 'var(--font-header)', fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-gold)' }}>Bagian 1: Informasi Out Of Character (Dunia Nyata)</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="ooc_name">Nama Lengkap (OOC) <span className="required">*</span></label>
                  <input type="text" id="ooc_name" value={formData.ooc_name} onChange={handleChange} placeholder="Contoh: Budi Santoso" required />
                </div>
                <div className="form-group">
                  <label htmlFor="passport_name_ooc">Nama Paspor (OOC) <span className="required">*</span></label>
                  <input type="text" id="passport_name_ooc" value={formData.passport_name_ooc} onChange={handleChange} placeholder="Contoh: Frank_Austin" required />
                </div>
                <div className="form-group">
                  <label htmlFor="ooc_age">Umur Real Life <span className="required">*</span></label>
                  <input type="number" id="ooc_age" value={formData.ooc_age} onChange={handleChange} min="17" max="60" placeholder="Contoh: 18" required />
                </div>
                <div className="form-group">
                  <label htmlFor="ooc_gender">Jenis Kelamin (OOC) <span className="required">*</span></label>
                  <select id="ooc_gender" value={formData.ooc_gender} onChange={handleChange} required className="form-select">
                    <option value="" disabled>Pilih Jenis Kelamin</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="discord_id">Discord ID / Username <span className="required">*</span></label>
                  <input type="text" id="discord_id" value={formData.discord_id} onChange={handleChange} placeholder="Contoh: budi#1234 atau budis" required />
                </div>
                <div className="form-group">
                  <label htmlFor="steam_hex">Steam HEX Code / License <span className="required">*</span></label>
                  <input type="text" id="steam_hex" value={formData.steam_hex} onChange={handleChange} placeholder="Contoh: steam:11000010abcde12" required />
                </div>
                <div className="form-group full-width">
                  <label htmlFor="playtime">Berapa lama pengalaman bermain role play? <span className="required">*</span></label>
                  <input type="text" id="playtime" value={formData.playtime} onChange={handleChange} placeholder="Contoh: 1 tahun" required />
                </div>
                <div className="form-group full-width">
                  <label htmlFor="rp_experience_ooc">Pengalaman RP apa saja yang sudah Anda lakukan? <span className="required">*</span></label>
                  <textarea id="rp_experience_ooc" value={formData.rp_experience_ooc} onChange={handleChange} rows={2} placeholder="Sebutkan server dan peran/faksi yang pernah Anda jalani..." required></textarea>
                </div>
                <div className="form-group full-width">
                  <label htmlFor="obligations_other_cities">Apakah memiliki tanggungan di kota lain? <span className="required">*</span></label>
                  <input type="text" id="obligations_other_cities" value={formData.obligations_other_cities} onChange={handleChange} placeholder="Contoh: Tidak ada / Ada, menjadi anggota LSPD di server X" required />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-primary" onClick={nextStep}>
                  Selanjutnya <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="form-step active">
              <h3 style={{ fontFamily: 'var(--font-header)', fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-gold)' }}>Bagian 2: Informasi In Character (Karakter Game)</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="ic_name">Nama Karakter (IC) <span className="required">*</span></label>
                  <input type="text" id="ic_name" value={formData.ic_name} onChange={handleChange} placeholder="Contoh: Frank Austin" required />
                </div>
                <div className="form-group">
                  <label htmlFor="ic_age">Umur Karakter <span className="required">*</span></label>
                  <input type="number" id="ic_age" value={formData.ic_age} onChange={handleChange} min="17" max="100" placeholder="Contoh: 25" required />
                </div>
                <div className="form-group">
                  <label htmlFor="ic_gender">Jenis Kelamin (IC) <span className="required">*</span></label>
                  <select id="ic_gender" value={formData.ic_gender} onChange={handleChange} required className="form-select">
                    <option value="" disabled>Pilih Jenis Kelamin</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="ic_dob">Tanggal Lahir Karakter (IC) <span className="required">*</span></label>
                  <input type="date" id="ic_dob" value={formData.ic_dob} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="phone_number">Nomor Telepon IC <span className="required">*</span></label>
                  <input type="text" id="phone_number" value={formData.phone_number} onChange={handleChange} placeholder="Contoh: 555-10293" required />
                </div>
                <div className="form-group full-width">
                  <label htmlFor="experience">Apakah memiliki pengalaman di LEO (Polisi/Sheriff) di server sebelumnya? Jelaskan detail pangkat terakhir. <span className="required">*</span></label>
                  <textarea id="experience" value={formData.experience} onChange={handleChange} rows={3} placeholder="Contoh: Pernah menjadi Deputy Cadet di server X selama 1 bulan." required></textarea>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={prevStep}>
                  <ChevronLeft size={16} /> Kembali
                </button>
                <button type="button" className="btn btn-primary" onClick={nextStep}>
                  Selanjutnya <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="form-step active">
              <h3 style={{ fontFamily: 'var(--font-header)', fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-gold)' }}>Bagian 3: Kualifikasi Personal</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="criminal_record">Pernahkah Anda terlibat kasus kriminal? <span className="required">*</span></label>
                  <textarea id="criminal_record" value={formData.criminal_record} onChange={handleChange} rows={2} placeholder="Jelaskan detail kasus kriminal jika ada, atau ketik 'TIDAK PERNAH'..." required></textarea>
                </div>
                <div className="form-group full-width">
                  <label htmlFor="work_experience_ic">Apakah memiliki pengalaman kerja sebelumnya? <span className="required">*</span></label>
                  <textarea id="work_experience_ic" value={formData.work_experience_ic} onChange={handleChange} rows={2} placeholder="Sebutkan pekerjaan karakter Anda sebelumnya..." required></textarea>
                </div>
                <div className="form-group full-width">
                  <label htmlFor="motivation_roxwood">Kenapa Anda ingin mendaftar di Sheriff Kerajaan Roxwood? <span className="required">*</span></label>
                  <textarea id="motivation_roxwood" value={formData.motivation_roxwood} onChange={handleChange} rows={3} placeholder="Jelaskan alasan mendaftar di Sheriff Kerajaan Roxwood..." required></textarea>
                </div>
                <div className="form-group full-width">
                  <label htmlFor="why_accept_roxwood">Mengapa kami harus menerima Anda menjadi bagian dari Sheriff Kerajaan Roxwood? <span className="required">*</span></label>
                  <textarea id="why_accept_roxwood" value={formData.why_accept_roxwood} onChange={handleChange} rows={3} placeholder="Sebutkan kelebihan Anda dan kontribusi yang akan diberikan..." required></textarea>
                </div>
                <div className="form-group full-width">
                  <label htmlFor="active_hours">Jam Aktif Di Kota <span className="required">*</span></label>
                  <input type="text" id="active_hours" value={formData.active_hours} onChange={handleChange} placeholder="Contoh: 19:00 - 23:00 WIB" required />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={prevStep}>
                  <ChevronLeft size={16} /> Kembali
                </button>
                <button type="submit" className="btn btn-success">
                  Kirim Pendaftaran <Check size={16} />
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {showSuccessModal && (
        <div className="modal open" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-content glass-card success-notification-box" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: '2.5rem', border: '1px solid rgba(16, 185, 129, 0.2)', backgroundColor: 'var(--color-bg-card, #111)', borderRadius: '16px' }}>
            <div className="success-notification-icon" style={{ fontSize: '3rem', color: 'var(--color-success)', marginBottom: '1.25rem' }}>
              <CheckCircle2 style={{ width: '72px', height: '72px', margin: '0 auto', color: 'var(--color-success)' }} />
            </div>
            <h3 style={{ fontSize: '1.6rem', marginBottom: '0.5rem', color: '#fff', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>Pendaftaran Berhasil Dikirim!</h3>
            <p style={{ color: 'var(--color-text-secondary, #aaa)', fontSize: '0.95rem', marginBottom: '2rem' }}>Terimakasih telah mendaftar untuk menjadi bagian dari Sheriff kerajaan roxwood.</p>

            {/* Discord Box */}
            <div style={{ background: 'rgba(88, 101, 242, 0.08)', border: '1px solid rgba(88, 101, 242, 0.25)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', textAlign: 'left', boxShadow: '0 4px 12px rgba(88, 101, 242, 0.05)' }}>
              <h4 style={{ color: '#7289da', marginTop: 0, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <MessageSquare style={{ width: '18px', height: '18px' }} /> MASUK LINK DISCORD PROBATUS
              </h4>
              <a href="https://discord.gg/DqZxnF5zbr" target="_blank" rel="noopener noreferrer" className="btn" style={{ backgroundColor: '#5865F2', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', textDecoration: 'none', padding: '0.85rem', borderRadius: '8px', fontWeight: 700, marginBottom: '0.5rem', transition: 'background 0.2s', boxShadow: '0 4px 12px rgba(88, 101, 242, 0.2)' }}>
                Hubungkan ke Discord <ExternalLink style={{ width: '16px', height: '16px' }} />
              </a>
            </div>

            {/* Interview Information */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', textAlign: 'left', fontSize: '0.95rem', lineHeight: '1.6' }}>
              <p style={{ marginTop: 0, marginBottom: '0.85rem', color: 'var(--color-text-primary, #fff)' }}>
                Bagi yang sudah mengisi formulir, bisa langsung datang ke <strong>kantor sheriff Kerajaan Roxwood (Koordinat 928)</strong> untuk melakukan interview.
              </p>
              <div style={{ background: 'rgba(245, 158, 11, 0.08)', borderLeft: '4px solid #f59e0b', padding: '0.85rem', borderRadius: '6px', fontSize: '0.9rem', color: '#fbbf24', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <AlertTriangle style={{ width: '18px', height: '18px', flexShrink: 0, marginTop: '2px' }} />
                <span>Jangan lupa untuk membawa/membuat dokumen wajib berikut: <strong>KTP, SKCS, Surat Kesehatan, dan SIM Roxwood</strong>.</span>
              </div>
            </div>

            <button type="button" className="btn btn-success" onClick={() => window.location.href = '/'} style={{ width: '100%', padding: '0.85rem', fontWeight: 700, borderRadius: '8px', cursor: 'pointer' }}>
              Saya Mengerti & Kembali <ArrowRight style={{ width: '16px', height: '16px', display: 'inline-block', verticalAlign: 'middle', marginLeft: '4px' }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
