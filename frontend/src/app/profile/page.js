'use client';

/**
 * =========================================================================================
 * PAGE PROFIL UTILISATEUR & COMPTE (USER PROFILE PAGE)
 * =========================================================================================
 * Fichier : src/app/profile/page.js
 * Rôle : Permet à l'utilisateur de consulter et mettre à jour ses informations personnelles :
 *        1. Modification du nom, prénom et adresse e-mail.
 *        2. Modification sécurisée du mot de passe (nécessite la confirmation du mot de passe actuel).
 *        3. Déconnexion avec réinitialisation du cookie de session JWT.
 * =========================================================================================
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function Profile() {
  const router = useRouter();

  // États locaux de gestion du profil utilisateur
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userFullName, setUserFullName] = useState('');

  /**
   * CHARGEMENT DU PROFIL UTILISATEUR DEPUIS L'API BACKEND
   */
  const fetchProfile = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        router.push('/');
        return;
      }

      const response = await fetch('/api/auth/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          document.cookie = 'token=; path=/; max-age=0; SameSite=Strict';
          router.push('/');
          return;
        }
        throw new Error('Erreur lors de la récupération du profil');
      }

      const responseJson = await response.json();
      const userData = responseJson.data;

      if (userData) {
        const fullName = userData.name || '';
        setUserFullName(fullName);
        setEmail(userData.email || '');

        // Décomposition du nom complet en prénom et nom de famille
        const nameParts = fullName.trim().split(/\s+/);
        if (nameParts.length >= 2) {
          setFirstName(nameParts[0]);
          setLastName(nameParts.slice(1).join(' '));
        } else if (nameParts.length === 1) {
          setFirstName(nameParts[0]);
          setLastName('');
        } else {
          setFirstName('');
          setLastName('');
        }
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  /**
   * SOUMISSION DES MODIFICATIONS DU PROFIL ET/OU MOT DE PASSE
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        router.push('/');
        return;
      }

      const fullName = `${firstName} ${lastName}`.trim();

      // 1. Mise à jour du nom complet et de l'adresse e-mail via PUT /api/auth/profile
      const profileResponse = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: fullName, email }),
      });

      const profileData = await profileResponse.json();

      if (!profileResponse.ok) {
        throw new Error(
          profileData.message || 'Erreur de mise à jour du profil'
        );
      }

      // 2. Si un nouveau mot de passe a été saisi, appel de l'API de modification du mot de passe
      if (password) {
        if (!currentPassword) {
          throw new Error(
            'Le mot de passe actuel est requis pour valider le changement'
          );
        }

        const passwordResponse = await fetch('/api/auth/password', {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ currentPassword, newPassword: password }),
        });

        const passwordData = await passwordResponse.json();

        if (!passwordResponse.ok) {
          throw new Error(
            passwordData.message || 'Erreur de mise à jour du mot de passe'
          );
        }
      }

      toast.success('Informations mises à jour avec succès !');
      setPassword('');
      setCurrentPassword('');
      setIsChangingPassword(false);

      await fetchProfile();
      window.location.reload(); // Rafraîchissement de l'application pour mettre à jour la Navbar
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * DÉCONNEXION DE L'UTILISATEUR (LOGOUT)
   * Supprime le cookie "token" en fixant sa durée max-age=0 et redirige vers la page d'accueil.
   */
  const handleLogout = () => {
    document.cookie = 'token=; path=/; max-age=0; SameSite=Strict';
    router.push('/');
  };

  if (isLoading && !email) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <p className="loading-text">Chargement de vos informations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h1 className="profile-title">Mon compte</h1>
        <p className="profile-subtitle">{userFullName || 'Utilisateur'}</p>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="lastName">Nom</label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="form-input"
              placeholder="Ex: Dupont"
            />
          </div>

          <div className="form-group">
            <label htmlFor="firstName">Prénom</label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="form-input"
              placeholder="Ex: Amélie"
            />
          </div>

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
            <div className="password-input-wrapper">
              <input
                type="password"
                id="password"
                value={isChangingPassword ? password : '••••••••••••'}
                disabled={!isChangingPassword}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input password-input"
                placeholder={
                  isChangingPassword ? 'Saisissez un nouveau mot de passe' : ''
                }
                required={isChangingPassword}
              />
              {!isChangingPassword ? (
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(true)}
                  className="btn-password-change"
                >
                  Modifier
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPassword('');
                    setCurrentPassword('');
                  }}
                  className="btn-password-cancel"
                >
                  Annuler
                </button>
              )}
            </div>
          </div>

          {isChangingPassword && (
            <div className="form-group">
              <label htmlFor="currentPassword">Mot de passe actuel</label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="form-input"
                placeholder="Confirmez votre mot de passe actuel"
              />
            </div>
          )}

          <div className="profile-form-actions">
            <button type="submit" className="profile-btn-submit">
              Modifier les informations
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="btn-danger profile-btn-logout"
            >
              Se déconnecter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
