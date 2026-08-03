"use client";

/**
 * =========================================================================================
 * PAGE D'ACCUEIL & FORMULAIRE DE CONNEXION (LOGIN)
 * =========================================================================================
 * Fichier : src/app/page.js
 * Rôle : Gère l'authentification de l'utilisateur, le stockage du jeton JWT dans un Cookie,
 *        et la redirection automatique vers le Tableau de Bord (/dashboard).
 * 
 * Notion Clé Next.js : "use client" au sommet indique qu'il s'agit d'un Client Component React
 * (indispensable dès qu'on utilise des hooks comme useState, useRouter ou des événements onClick/onSubmit).
 * =========================================================================================
 */

import { useState } from "react";
import { useRouter } from "next/navigation"; // Hook Next.js pour la navigation programmatique (redirection)
import Link from "next/link"; // Composant Next.js pour la navigation sans rechargement de page (SPA)

export default function Home() {
  // ---------------------------------------------------------------------------------------
  // ÉTATS REACT (LOCAL STATE)
  // ---------------------------------------------------------------------------------------
  const [email, setEmail] = useState("");         // Stocke la saisie de l'email
  const [password, setPassword] = useState("");   // Stocke la saisie du mot de passe
  const [error, setError] = useState("");         // Stocke le message d'erreur éventuel en cas d'échec
  
  const router = useRouter(); // Initialisation du routeur Next.js pour effectuer la redirection après connexion

  /**
   * SOUMISSION DU FORMULAIRE DE CONNEXION
   * Effectue un appel réseau POST vers le serveur backend proxy /api/auth/login.
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Empêche le rechargement par défaut du navigateur lors de la soumission du formulaire
    setError("");       // Réinitialise les erreurs précédentes

    try {
      // 1. Envoi de la requête réseau de connexion au serveur backend (API REST Express)
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      // 2. Gestion des erreurs HTTP (ex: 401 Unauthorized, 404 User Not Found)
      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de la connexion. Veuillez vérifier vos identifiants.");
      }

      // 3. Extraction du jeton de session JWT (JSON Web Token) renvoyé par le backend
      const token = data.data.token;
      
      // 4. Stockage sécurisé du jeton dans les cookies du navigateur
      // - path=/ : Accessible sur l'ensemble du site
      // - max-age=86400 : Durée de validité de 24h
      // - SameSite=Strict : Protection contre les attaques CSRF (Cross-Site Request Forgery)
      document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Strict`;

      // 5. Redirection de l'utilisateur connecté vers son Tableau de Bord
      router.push("/dashboard");

    } catch (err) {
      // Capture et affichage du message d'erreur dans l'interface utilisateur
      setError(err.message);
    }
  };

  return (
    <div className="auth-screen">
      {/* Panneau de Gauche : Formulaire de connexion accessible WCAG 2.1 */}
      <div className="auth-left-pane">
        <div className="auth-form-container">
          {/* Logo Abricot.co avec texte alternatif alt explicite pour l'accessibilité */}
          <div className="auth-logo-container">
            <img src="/images/Logo_orange.png" alt="Logo de l'application SaaS Abricot" className="auth-logo" />
          </div>

          <h1 className="auth-title">Connexion</h1>
          
          {/* Alerte visuelle en cas d'erreur de saisie ou d'identifiants incorrects */}
          {error && <p className="auth-error-msg" role="alert">{error}</p>}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Champ Adresse Email */}
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@exemple.com"
                required
                className="form-input"
              />
            </div>

            {/* Champ Mot de passe */}
            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="form-input"
              />
            </div>

            {/* Bouton de soumission */}
            <button type="submit" className="auth-btn-submit">
              Se connecter
            </button>
          </form>

          <div className="auth-forgot-password">
            <Link href="/forgot-password">Mot de passe oublié ?</Link>
          </div>
          
          <div className="auth-footer">
            Pas encore de compte ? <Link href="/register">Créer un compte</Link>
          </div>
        </div>
      </div>

      {/* Panneau de Droite : Arrière-plan visuel branding */}
      <div className="auth-right-pane">
        <div className="auth-bg-image auth-bg-login" role="img" aria-label="Illustration de présentation Abricot" />
      </div>
    </div>
  );
}