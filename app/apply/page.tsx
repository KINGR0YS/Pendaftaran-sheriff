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
    <div className="apply-page-root">
      <div className="glow-bg glow-1"></div>
      <div className="glow-bg glow-2"></div>

      <div className="glass-card apply-card">
        <div className="apply-header">
          <h2 className="apply-title">Formulir Pendaftaran Probatus</h2>
          <p className="apply-subtitle">Lengkapi formulir dengan jujur. Semua informasi akan ditinjau oleh anggota DISMAG.</p>

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
              <h3 className="step-heading">Bagian 1: Informasi Out Of Character (Dunia Nyata)</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="ooc_name">Nama Lengkap (OOC) <span className="required">*</span></label>
                  <input type="text" id="ooc_name" value={formData.ooc_name} onChange={handleChange} placeholder="Contoh: Roys M. Hawkins" required />
                </div>
                <div className="form-group">
                  <label htmlFor="passport_name_ooc">Nama Paspor (OOC) <span className="required">*</span></label>
                  <input type="text" id="passport_name_ooc" value={formData.passport_name_ooc} onChange={handleChange} placeholder="Contoh: Roys_Hawkins" required />
                </div>
                <div className="form-group">
                  <label htmlFor="ooc_age">Umur Real Life <span className="required">*</span></label>
                  <input type="number" id="ooc_age" value={formData.ooc_age} onChange={handleChange} min="1" max="60" placeholder="Contoh: 18" required />
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
                  <input type="text" id="discord_id" value={formData.discord_id} onChange={handleChange} placeholder="Contoh: Roys_123" required />
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
              <div className="form-actions-end">
                <button type="button" className="btn btn-primary" onClick={nextStep}>
                  Selanjutnya <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="form-step active">
              <h3 className="step-heading">Bagian 2: Informasi In Character (Karakter Game)</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="ic_name">Nama Karakter (IC) <span className="required">*</span></label>
                  <input type="text" id="ic_name" value={formData.ic_name} onChange={handleChange} placeholder="Contoh: Roys M. Hawkins" required />
                </div>
                <div className="form-group">
                  <label htmlFor="ic_age">Umur Karakter <span className="required">*</span></label>
                  <input type="number" id="ic_age" value={formData.ic_age} onChange={handleChange} min="1" max="100" placeholder="Contoh: 25" required />
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
              <div className="form-actions-between">
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
              <h3 className="step-heading">Bagian 3: Kualifikasi Personal</h3>
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
              <div className="form-actions-between">
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
        <div className="modal open success-modal-overlay">
          <div className="modal-content glass-card success-notification-box success-modal-card">
            <div className="success-icon-wrapper">
              <CheckCircle2 className="success-icon" />
            </div>
            <h3 className="success-title">Pendaftaran Berhasil Dikirim!</h3>
            <p className="success-message">Terimakasih telah mendaftar untuk menjadi bagian dari Sheriff kerajaan roxwood.</p>

            <div className="discord-box">
              <h4 className="discord-box-title">
                <MessageSquare style={{ width: '18px', height: '18px' }} /> MASUK LINK DISCORD PROBATUS
              </h4>
              <a href="https://discord.gg/DqZxnF5zbr" target="_blank" rel="noopener noreferrer" className="discord-link-btn">
                Hubungkan ke Discord <ExternalLink className="inline-icon" />
              </a>
            </div>

            <div className="interview-box">
              <p>
                Bagi yang sudah mengisi formulir, bisa langsung datang ke <strong>kantor sheriff Kerajaan Roxwood (Koordinat 928)</strong> untuk melakukan interview.
              </p>
              <div className="interview-warning">
                <AlertTriangle style={{ width: '18px', height: '18px', flexShrink: 0, marginTop: '2px' }} />
                <span>Jangan lupa untuk membawa/membuat dokumen wajib berikut: <strong>KTP, SKCS, Surat Kesehatan, dan SIM Roxwood</strong>.</span>
              </div>
            </div>

            <button type="button" className="btn btn-success btn-back-home" onClick={() => window.location.href = '/'}>
              Saya Mengerti & Kembali <ArrowRight className="inline-icon" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
