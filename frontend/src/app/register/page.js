"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setError(""); 

    try {
      // Appel à l'API pour l'inscription (grâce à notre proxy, /api remplace http://localhost:8000)
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de l'inscription");
      }
      
      const token = data.data?.token;

      if (token) {
        document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Strict`;
        router.push("/dashboard");
      } else {
        router.push("/");
      }

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-screen">
      {/* Partie Gauche : Formulaire */}
      <div className="auth-left-pane">
        <div className="auth-form-container">
          <div className="auth-logo-container">
            <img src="/images/Logo_orange.png" alt="Abricot Logo" className="auth-logo" />
          </div>

          <h1 className="auth-title">Inscription</h1>
          
          {error && <p className="auth-error-msg">{error}</p>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

      {/* Partie Droite : Image */}
      <div className="auth-right-pane">
        <div className="auth-bg-image auth-bg-register" />
      </div>
    </div>
  );
}