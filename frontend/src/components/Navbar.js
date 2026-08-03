"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [initials, setInitials] = useState("");

  useEffect(() => {
    if (pathname === "/" || pathname === "/register") return;

    const fetchProfile = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1];

        if (!token) {
          setInitials("");
          return;
        }

        const response = await fetch("/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const responseJson = await response.json();
          const userData = responseJson.data;
          
          if (userData?.name) {
            const nameParts = userData.name.trim().split(/\s+/);
            let userInitials = "";
            if (nameParts.length >= 2) {
              userInitials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
            } else if (nameParts.length === 1 && nameParts[0].length > 0) {
              userInitials = nameParts[0].substring(0, 2).toUpperCase();
            }
            setInitials(userInitials);
          } else {
            setInitials("");
          }
        } else {
          setInitials("");
        }
      } catch (error) {
        setInitials("");
      }
    };

    fetchProfile();
  }, [pathname]);

  if (pathname === "/" || pathname === "/register") return null;

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