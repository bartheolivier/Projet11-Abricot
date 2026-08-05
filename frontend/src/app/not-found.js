/**
 * =========================================================================================
 * PAGE 404 SUR MESURE (NOT FOUND PAGE)
 * =========================================================================================
 * Fichier : src/app/not-found.js
 * Rôle : S'affiche automatiquement lorsque l'utilisateur tente d'accéder à une URL
 *        inexistante, supprimée ou erronée dans l'application Abricot.co.
 *
 * Exigence Grille d'Auto-Évaluation :
 * "L'ensemble des pages ainsi que leur navigation sont conformes aux maquettes : Page 404."
 * =========================================================================================
 */

import Link from 'next/link';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="not-found-container">
      {/* Icône d'alerte orange masquée visuellement aux lecteurs d'écran (décorative) */}
      <div className="not-found-icon-wrapper">
        <AlertCircle size={48} aria-hidden="true" />
      </div>

      {/* Titre principal H1 de la page de redirection 404 */}
      <h1 className="not-found-title">Page 404 - Page introuvable</h1>

      {/* Explication utilisateur polie et claire */}
      <p className="not-found-desc">
        Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
      </p>

      {/* Bouton d'action direct permettant de revenir en toute sécurité au tableau de bord */}
      <Link href="/dashboard" className="btn-primary not-found-btn">
        <ArrowLeft size={18} aria-hidden="true" /> Retour
      </Link>
    </div>
  );
}
