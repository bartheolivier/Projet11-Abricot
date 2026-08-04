'use client';

import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  // On masque le footer sur les pages de connexion et d'inscription
  if (pathname === '/' || pathname === '/register') return null;

  return (
    <footer className="main-footer">
      <div>
        <img src="/images/Logo_noir.png" alt="Abricot Logo" height="12.86" />
      </div>
      <div className="footer-text">Abricot {currentYear}</div>
    </footer>
  );
}
