import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="footer" style={{ marginTop: 'auto' }}>
      <div className="footer-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Image src="/logo.png" alt="Logo" width={45} height={45} style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 5px rgba(212,175,55,0.25))' }} />
          <div>
            <h4 style={{ fontFamily: 'var(--font-header)', fontSize: '1rem', color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1.2 }}>
              Sheriff Kerajaan Roxwood
            </h4>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Departemen Hukum Kerajaan Roxwood - Indopride</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>&copy; 2026 Sheriff Kerajaan Roxwood.</p>
        </div>
      </div>
    </footer>
  );
}
