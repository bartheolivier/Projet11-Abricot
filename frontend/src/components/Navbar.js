"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProfileQuery } from "../hooks/useProfileQuery";
import { useUserStore } from "../lib/useUserStore";

export default function Navbar() {
  const pathname = usePathname();
  
  // Utilisation de React Query & Zustand (remplace les useEffect / fetch manuels)
  const { data: userData } = useProfileQuery({
    enabled: pathname !== "/" && pathname !== "/register",
  });

  const user = useUserStore((state) => state.user) || userData;

  if (pathname === "/" || pathname === "/register") return null;

  // Calcul des initiales utilisateur
  let initials = "";
  if (user?.name) {
    const nameParts = user.name.trim().split(/\s+/);
    if (nameParts.length >= 2) {
      initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    } else if (nameParts.length === 1 && nameParts[0].length > 0) {
      initials = nameParts[0].substring(0, 2).toUpperCase();
    }
  }

  const isDashboardActive = pathname === "/dashboard";
  const isProjectsActive = pathname === "/projects";
  const isProfileActive = pathname === "/profile";

  return (
    <nav className="main-navbar" role="navigation" aria-label="Navigation principale">
      <div className="navbar-logo">
        <img src="/images/Logo_orange.png" alt="Abricot Logo - Accueil" height="28" />
      </div>
      
      <div className="navbar-links">
        <Link 
          href="/dashboard"
          className={`nav-item ${isDashboardActive ? "active" : ""}`}
          aria-current={isDashboardActive ? "page" : undefined}
          aria-label="Tableau de bord"
        >
          <img 
            src={isDashboardActive ? "/images/Dashboard_noir.png" : "/images/Dashboard_blanc.png"} 
            alt="Tableau de bord" 
            height="78" 
          />
        </Link>

        <Link 
          href="/projects"
          className={`nav-item ${isProjectsActive ? "active" : ""}`}
          aria-current={isProjectsActive ? "page" : undefined}
          aria-label="Projets"
        >
          <img 
            src={isProjectsActive ? "/images/Projets_noir.png" : "/images/Projets_blanc.png"} 
            alt="Projets" 
            height="78" 
          />
        </Link>
      </div>

      <div className="navbar-user">
        <Link 
          href="/profile" 
          className="navbar-brand-link"
          aria-current={isProfileActive ? "page" : undefined}
          aria-label="Profil utilisateur"
        >
          <div className={`avatar-circle ${isProfileActive ? "active" : ""}`}>
            {initials || "PROFIL"}
          </div>
        </Link>
      </div>
    </nav>
  );
}