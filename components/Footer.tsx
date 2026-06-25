import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="footer" style={{ marginTop: 'auto' }}>
      <div className="footer-container">
        <div className="footer-left">
          <Image
            src="/logo.png"
            alt="Roxwood Sheriff Logo"
            width={50}
            height={50}
            style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 5px rgba(212, 175, 55, 0.25))' }}
          />
          <div>
            <h4>Sheriff Kerajaan Roxwood</h4>
            <p>Departemen Hukum Kerajaan Roxwood - Indopride</p>
          </div>
        </div>
        
        <div className="footer-center">
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-header)', fontWeight: 600, letterSpacing: '1.5px', opacity: 0.6 }}>
            direct by Cimolbojot
          </p>
        </div>
        
        <div className="footer-right">
          <a href="https://discord.gg/DqZxnF5zbr" target="_blank" rel="noopener noreferrer" className="credit-badge">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 1-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z" />
            </svg>
            <span>probatus sheriff</span>
          </a>
          <p>&copy; 2026 Sheriff Kerajaan Roxwood.</p>
        </div>
      </div>
    </footer>
  );
}

