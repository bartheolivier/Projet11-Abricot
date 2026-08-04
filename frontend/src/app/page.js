'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Permet de gérer les redirections
import Link from 'next/link';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const router = useRouter(); // Initialisation du router

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // 1. Envoi de la requête au back-end
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      // 2. Gestion des erreurs (mauvais mot de passe, compte inexistant...)
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la connexion');
      }

      // 3. On extrait le token (selon la documentation Swagger, il est dans l'objet "data")
      const token = data.data.token;

      // Stockage sécurisé du token dans un Cookie
      document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Strict`;

      // 4. Redirection vers le tableau de bord
      router.push('/dashboard');
    } catch (err) {
      // On affiche le message d'erreur dans l'interface
      setError(err.message);
    }
  };

  return (
    <div className="auth-screen">
      {/* Partie Gauche : Formulaire */}
      <div className="auth-left-pane">
        <div className="auth-form-container">
          <div className="auth-logo-container">
            <img
              src="/images/Logo_orange.png"
              alt="Abricot Logo"
              className="auth-logo"
            />
          </div>

          <h1 className="auth-title">Connexion</h1>

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

      {/* Partie Droite : Image */}
      <div className="auth-right-pane">
        <div className="auth-bg-image auth-bg-login" />
      </div>
    </div>
  );
}
