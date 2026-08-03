"use client";

/**
 * =========================================================================================
 * PAGE D'INSCRIPTION (REGISTER PAGE)
 * =========================================================================================
 * Fichier : src/app/register/page.js
 * Rôle : Permet aux nouveaux utilisateurs de créer un compte sur la plateforme SaaS Abricot.co.
 *        Après création du compte, le jeton JWT est enregistré et l'utilisateur est redirigé vers /dashboard.
 * =========================================================================================
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Register() {
  // États locaux React pour la saisie des identifiants et l'affichage des erreurs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  const router = useRouter();

  /**
   * Gestion de la soumission du formulaire d'inscription
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Annule le rechargement par défaut du navigateur
    setError(""); 

    try {
      // Appel vers le routeur API backend Express /api/auth/register
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de l'inscription. Veuillez vérifier les informations saisies.");
      }
      
      const token = data.data?.token;

      // Si le backend renvoie directement le jeton JWT lors de l'inscription, on le stocke dans le cookie
      if (token) {
        document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Strict`;
        router.push("/dashboard");
      } else {
        router.push("/"); // Sinon redirection vers la page de connexion
      }

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-screen">
      {/* Partie Gauche : Formulaire d'inscription */}
      <div className="auth-left-pane">
        <div className="auth-form-container">
          <div className="auth-logo-container">
            <img src="/images/Logo_orange.png" alt="Logo Abricot SaaS" className="auth-logo" />
          </div>

          <h1 className="auth-title">Inscription</h1>
          
          {error && <p className="auth-error-msg" role="alert">{error}</p>}

          <form onSubmit={handleSubmit} className="auth-form">
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

            <button type="submit" className="auth-btn-submit">
              S'inscrire
            </button>
          </form>

          <div className="auth-footer">
            Déjà inscrit ? <Link href="/">Se connecter</Link>
          </div>
        </div>
      </div>

      {/* Partie Droite : Image de fond d'inscription */}
      <div className="auth-right-pane">
        <div className="auth-bg-image auth-bg-register" role="img" aria-label="Visuel de bienvenue Abricot" />
      </div>
    </div>
  );
}