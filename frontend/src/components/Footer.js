'use client';

/**
 * =========================================================================================
 * PIED DE PAGE PRINCIPAL (MAIN FOOTER COMPONENT)
 * =========================================================================================
 * Fichier : src/components/Footer.js
 * Rôle : Pied de page global affiché en bas de chaque page privée :
 *        1. Masqué automatiquement sur l'accueil `/` et l'inscription `/register`.
 *        2. Affiche le logo noir Abricot et le copyright dynamique avec l'année en cours.
 * =========================================================================================
 */

import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear(); // Année courante dynamique

  // Masquage conditionnel du footer sur les écrans d'authentification
  if (pathname === '/' || pathname === '/register') return null;

  return (
    <footer
      className="main-footer"
      role="contentinfo"
      aria-label="Pied de page"
    >
      <div>
        <img
          src="/images/Logo_noir.png"
          alt="Logo Abricot SaaS"
          height="12.86"
        />
      </div>
      <div className="footer-text">Abricot {currentYear}</div>
    </footer>
  );
}
