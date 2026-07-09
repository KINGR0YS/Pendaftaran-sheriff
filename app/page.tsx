'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Swords, Award, Scale, CheckSquare, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const handleApplyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.setItem('allowApplyAccess', 'true');
    window.location.href = '/apply';
  };

  return (
    <div className="home-root">
      <div className="glow-bg glow-1"></div>
      <div className="glow-bg glow-2"></div>

      <div className="section-container">
        {/* HERO */}
        <div className="hero-container">
          <div className="hero-text-col">
            <h2 className="hero-badge">SHERIFF KERAJAAN ROXWOOD</h2>
            <h1 className="hero-title">TO PROTECT<br/>AND TO SERVE</h1>
            <p className="hero-desc">
              Sheriff Kerajaan Roxwood adalah lembaga penegak hukum yang berperan menjaga keamanan, ketertiban, dan kedamaian masyarakat. Selain menegakkan hukum, lembaga ini menjadi pilar stabilitas sosial yang adaptif terhadap dinamika serta perubahan di Pulau Roxwood, demi menciptakan lingkungan yang harmonis dan berkelanjutan.
            </p>
          </div>
          <div className="hero-logo-col">
            <Image
              src="/logo.png"
              alt="Roxwood Sheriff Logo"
              width={380}
              height={380}
              className="hero-logo-img"
            />
          </div>
        </div>

        {/* VALUES */}
        <div className="section-spacer">
          <h2 className="section-title">Nilai Utama Kami</h2>
          <p className="section-subtitle">Nilai-nilai dasar yang dipegang teguh oleh setiap deputi dalam bertugas.</p>
          <div className="values-grid">
            <ValueCard icon={<ShieldCheck size={22} />} title="Integritas" desc="Menjunjung tinggi kejujuran, transparansi, dan kode etik moral dalam bertugas." />
            <ValueCard icon={<Swords size={22} />} title="Keberanian" desc="Siap menghadapi segala risiko bahaya demi melindungi warga Kerajaan Roxwood." />
            <ValueCard icon={<Award size={22} />} title="Disiplin" desc="Menjaga rantai komando, loyalitas faksi, dan dedikasi pelayanan berstandar tinggi." />
            <ValueCard icon={<Scale size={22} />} title="Keadilan" desc="Menegakkan hukum secara imparsial, adil, dan menghormati hak setiap warga." />
          </div>
        </div>

        {/* DIVISIONS */}
        <div className="section-spacer">
          <h2 className="section-title">Divisi Spesialis Kami</h2>
          <p className="section-subtitle">Peluang karir yang luas dengan berbagai spesialisasi taktis.</p>
          <div className="divisions-grid">
            <DivisionCard badge="LEGON" icon={<Scale size={14} />} items={['Menegakkan disiplin dalam tubuh Sheriff.', 'Menyelidiki pelanggaran etika, wewenang, dan kehormatan.', 'Menyusun laporan sidang disipliner dan vonis kehormatan.', 'Bertindak sebagai penjaga kemurnian tubuh Sheriff.']} />
            <DivisionCard badge="ARLION" icon={<Swords size={14} />} items={['Menangani huru-hara dan konflik bersenjata.', 'Intervensi penyanderaan besar, pengepungan, dan pengamanan tingkat tinggi.', 'Bertugas di zona peperangan atau daerah rawan.', 'Personel elit bersenjata berat dan bersertifikat taktis.']} />
            <DivisionCard badge="INREGIS" icon={<ShieldCheck size={14} />} items={['Menyelidiki kasus kriminal kelas tinggi (pembunuhan, makar, korupsi, dsb).', 'Penyamaran dan pengumpulan intelijen.', 'Pelacakan jejak konspirasi dan kejahatan politik.']} />
            <DivisionCard badge="DISMAG" icon={<Award size={14} />} items={['Menyelenggarakan pelatihan pertempuran, kehormatan, dan hukum.', 'Menyusun modul pendidikan Sheriff.', 'Mengelola Akademi Sheriff Kerajaan dan ujian kenaikan pangkat.', 'Mempersiapkan generasi Deputi Baru untuk mewarisi kepemimpinan selanjutnya.']} />
            <DivisionCard badge="VIGILIS" icon={<Scale size={14} />} items={['Patroli harian wilayah kota dan luar istana.', 'Penegakan hukum umum dan lalu lintas.', 'Menjaga keamanan lokasi umum dan jalan utama.', 'Bertugas mengawal parade dan upacara terbuka.']} />
            <DivisionCard badge="ICARUS" icon={<Award size={14} />} items={['Patroli udara dan perairan — menjadi "mata elang" bagi anggota darat.', 'Menindak kriminalitas skala besar, penyelundupan, perompakan laut, dll.', 'Menegakkan peraturan, mengurus perizinan udara/kelautan (lisensi).', 'Melaksanakan tugas SAR (Search and Rescue) di wilayah non-darat.']} />
            <DivisionCard badge="SMU" icon={<ShieldCheck size={14} />} items={['Menyelenggarakan pelayanan medis dan rehabilitasi bagi seluruh personel.', 'Melaksanakan pemeriksaan forensik medis TKP & barang bukti kejahatan.', 'Memberikan dukungan medis taktis (field medic) operasi berisiko tinggi.']} />
          </div>
        </div>

        {/* TIMELINE + REQUIREMENTS */}
        <div className="home-sections-grid section-spacer">
          <div>
            <h2 className="section-title section-title-left">Alur Penerimaan</h2>
            <p className="section-subtitle section-subtitle-left">Tahapan seleksi penerimaan anggota Sheriff Roxwood.</p>
            <div className="timeline-steps">
              {[
                ['Formulir Online', 'Mengisi seluruh data diri OOC dan IC, serta menjawab beberapa pertanyaan dan skenario yang telah disediakan dengan jujur.'],
                ['Evaluasi Berkas', 'Staff Sheriff akan meninjau kelengkapan dan kelayakan berkas pendaftaran, berupa SKCK, SIM Roxwood, dan Surat Keterangan Sehat.'],
                ['Interview & Uji Pengetahuan', 'Mengikuti sesi wawancara sebagai bagian dari proses seleksi penerimaan anggota Sheriff Roxwood.'],
                ['Masa Pelatihan (Probatus)', 'Peserta yang dinyatakan lulus akan menjalani masa pelatihan sebelum resmi bertugas sebagai anggota Sheriff Roxwood.'],
              ].map(([title, desc], i) => (
                <div key={i} className="timeline-item">
                  <div className="timeline-badge">{i + 1}</div>
                  <div className="timeline-content">
                    <div className="timeline-header"><h3>{title}</h3></div>
                    <p>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="section-title section-title-left">Persyaratan Umum</h2>
            <p className="section-subtitle section-subtitle-left">Pastikan Anda memenuhi syarat di bawah ini sebelum mendaftar.</p>
            <div className="reqs-list">
              {[
                'Berusia minimal 17 tahun (OOC) dan memiliki karakter berusia minimal 17 tahun (IC).',
                'Memahami dan mematuhi peraturan kota yang berlaku.',
                'Aktif, bertanggung jawab, dan mampu bekerja sama dalam tim.',
                'Tidak memiliki catatan kriminal berat di Kerajaan Roxwood.',
                'Memiliki sikap disiplin, sopan, dan siap menjalankan tugas sebagai Sheriff.',
              ].map((item, i) => (
                <div key={i} className="req-item">
                  <CheckSquare size={18} className="req-icon" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div id="cta" className="glass-card cta-card">
          <h2 className="cta-title">
            Siap Mengabdi untuk Kerajaan?
          </h2>
          <p className="cta-desc">
            Lindungi warga, tegakkan hukum, dan buktikan dedikasimu dalam menjaga keamanan Kerajaan Roxwood.
          </p>
          <button className="btn btn-primary cta-btn" onClick={handleApplyClick}>
            Gabung Sekarang <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ValueCard({ icon, title, desc }: any) {
  return (
    <div className="value-card">
      <div className="value-icon-box">{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}

function DivisionCard({ badge, icon, items }: { badge: string; icon: any; items: string[] }) {
  return (
    <div className="division-card">
      <div className="division-badge">{icon} {badge}</div>
      <h3>{badge}</h3>
      <ul>
        {items.map((item: string, i: number) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
