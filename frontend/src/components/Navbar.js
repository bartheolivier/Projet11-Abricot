"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [initials, setInitials] = useState("");

    useEffect(() => {
        // Ne pas fetch le profil si on est sur la page de connexion ou d'inscription
        if (pathname === "/" || pathname === "/register") return;

        console.log("Navbar: Tentative de récupération du profil...");

        const fetchProfile = async () => {
        try {
            const token = document.cookie
            .split("; ")
            .find((row) => row.startsWith("token="))
            ?.split("=")[1];

            if (!token) {
            console.log("Navbar: Aucun token trouvé dans les cookies.");
            setInitials("");
            return;
            }

            console.log("Navbar: Token trouvé, appel de l'API profil...");
            const response = await fetch("/api/auth/profile", {
            headers: { Authorization: `Bearer ${token}` },
            });

            console.log("Navbar: Réponse reçue, statut :", response.status);

            if (response.ok) {
            const responseJson = await response.json();
            // Selon la documentation Swagger, la réponse contient directement les données utilisateur dans "data"
            const userData = responseJson.data;
            console.log("Navbar: Données utilisateur reçues :", userData);
            
            if (userData?.name) {
                const nameParts = userData.name.trim().split(/\s+/);
                let initials = "";
                if (nameParts.length >= 2) {
                    initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
                } else if (nameParts.length === 1 && nameParts[0].length > 0) {
                    initials = nameParts[0].substring(0, 2).toUpperCase();
                }
                setInitials(initials);
            } else {
                setInitials("");
            }
            } else {
            console.error("Navbar: Erreur API profil, statut :", response.status);
            setInitials("");
            }
        } catch (error) {
            console.error("Navbar: Erreur réseau ou autre :", error);
            setInitials("");
        }
        };

    fetchProfile();
  }, [pathname]);

  if (pathname === "/" || pathname === "/register") return null;

  // Détermination de l'état actif
  const isDashboardActive = pathname === "/dashboard";
  const isProjectsActive = pathname === "/projects";

  return (
    <nav className="main-navbar">
      <div className="navbar-logo">
        <img src="/images/Logo_orange.png" alt="Abricot Logo" height="28" />
      </div>
      
      <div className="navbar-links">
        <Link 
          href="/dashboard"
          className={`nav-item ${isDashboardActive ? "active" : ""}`}
        >
          {/* Si actif, on affiche l'icône noire (fond du bouton noir), sinon la blanche */}
          <img 
            src={isDashboardActive ? "/images/Dashboard_noir.png" : "/images/Dashboard_blanc.png"} 
            alt="Dashboard" 
            height="78" 
          />
        </Link>

        <Link 
          href="/projects"
          className={`nav-item ${isProjectsActive ? "active" : ""}`}
        >
          <img 
            src={isProjectsActive ? "/images/Projets_noir.png" : "/images/Projets_blanc.png"} 
            alt="Projets" 
            height="78" 
          />
        </Link>
      </div>

      <div className="navbar-user">
        <Link href="/profile" style={{ textDecoration: "none", display: "flex" }}>
          <div className={`avatar-circle ${pathname === "/profile" ? "active" : ""}`}>
            {initials}
          </div>
        </Link>
      </div>
    </nav>
  );
}