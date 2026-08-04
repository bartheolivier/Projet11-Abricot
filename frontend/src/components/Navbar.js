'use client';

/**
 * =========================================================================================
 * BARRE DE NAVIGATION PRINCIPALE (MAIN NAVBAR COMPONENT)
 * =========================================================================================
 * Fichier : src/components/Navbar.js
 * Rôle : En-tête de navigation supérieur de l'application Abricot.co :
 *        1. Masquée automatiquement sur les pages publiques (Connexion `/` et Inscription `/register`).
 *        2. Affiche les liens d'accès rapide avec surbrillance dynamique de la page active (`aria-current="page"`).
 *        3. Récupère dynamiquement le profil utilisateur pour générer les initiales dans la pastille d'avatar.
 *        4. Conforme aux standards d'accessibilité WCAG 2.1 AA (`role="navigation"`, `aria-label`).
 * =========================================================================================
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Hook Next.js permettant de connaître l'URL courante
import { useEffect, useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [initials, setInitials] = useState('');

  /**
   * Effet de chargement du profil utilisateur pour générer les initiales dans l'avatar
   */
  useEffect(() => {
    // Si l'utilisateur est sur la page de connexion ou d'inscription, ne rien charger
    if (pathname === '/' || pathname === '/register') return;

    const fetchProfile = async () => {
      try {
        const token = document.cookie
          .split('; ')
          .find((row) => row.startsWith('token='))
          ?.split('=')[1];

        if (!token) {
          setInitials('');
          return;
        }

        const response = await fetch('/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const responseJson = await response.json();
          const userData = responseJson.data;

          // Extraction des initiales du prénom et du nom
          if (userData?.name) {
            const nameParts = userData.name.trim().split(/\s+/);
            let userInitials = '';
            if (nameParts.length >= 2) {
              userInitials = (
                nameParts[0][0] + nameParts[nameParts.length - 1][0]
              ).toUpperCase();
            } else if (nameParts.length === 1 && nameParts[0].length > 0) {
              userInitials = nameParts[0].substring(0, 2).toUpperCase();
            }
            setInitials(userInitials);
          } else {
            setInitials('');
          }
        } else {
          setInitials('');
        }
      } catch (error) {
        setInitials('');
      }
    };

    fetchProfile();
  }, [pathname]);

  // Si on est sur l'écran d'accueil ou d'inscription, la navbar ne s'affiche pas
  if (pathname === '/' || pathname === '/register') return null;

  // Calcul des états d'activation des liens de navigation
  const isDashboardActive = pathname === '/dashboard';
  const isProjectsActive = pathname.startsWith('/projects');
  const isProfileActive = pathname === '/profile';

  return (
    <nav
      className="main-navbar"
      role="navigation"
      aria-label="Navigation principale"
    >
      {/* Logo Abricot */}
      <div className="navbar-logo">
        <img
          src="/images/Logo_orange.png"
          alt="Logo Abricot SaaS"
          height="28"
        />
      </div>

      {/* Liens centraux de la Navbar (Tableau de bord, Projets) */}
      <div className="navbar-links">
        <Link
          href="/dashboard"
          className={`nav-item ${isDashboardActive ? 'active' : ''}`}
          aria-current={isDashboardActive ? 'page' : undefined}
          aria-label="Accéder au tableau de bord"
        >
          <img
            src={
              isDashboardActive
                ? '/images/Dashboard_noir.png'
                : '/images/Dashboard_blanc.png'
            }
            alt="Tableau de bord"
            height="78"
          />
        </Link>

        <Link
          href="/projects"
          className={`nav-item ${isProjectsActive ? 'active' : ''}`}
          aria-current={isProjectsActive ? 'page' : undefined}
          aria-label="Accéder aux projets"
        >
          <img
            src={
              isProjectsActive
                ? '/images/Projets_noir.png'
                : '/images/Projets_blanc.png'
            }
            alt="Projets"
            height="78"
          />
        </Link>
      </div>

      {/* Profil utilisateur à droite (Avatar avec initiales) */}
      <div className="navbar-user">
        <Link
          href="/profile"
          className="navbar-brand-link"
          aria-current={isProfileActive ? 'page' : undefined}
          aria-label="Accéder à mon profil utilisateur"
        >
          <div className={`avatar-circle ${isProfileActive ? 'active' : ''}`}>
            {initials || 'PROFIL'}
          </div>
        </Link>
      </div>
    </nav>
  );
}
