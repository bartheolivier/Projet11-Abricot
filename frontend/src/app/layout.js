/**
 * =========================================================================================
 * LAYOUT PRINCIPAL DE L'APPLICATION (ROOT LAYOUT)
 * =========================================================================================
 * Fichier : src/app/layout.js
 * Rôle : Enveloppe globale pour toutes les pages de l'application Next.js App Router.
 *        Il définit la structure HTML de base (`<html>`, `<body>`), injecte le design system CSS
 *        global (`globals.css`), gère les notifications Toaster, et inclut la Navbar et le Footer.
 * =========================================================================================
 */

import { Toaster } from 'sonner';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './globals.css';

// Métadonnées SEO et titre d'onglet du navigateur
export const metadata = {
  title: 'Abricot - SaaS de gestion de projet',
  description: 'SaaS de gestion de projet collaborative boosté à l\'IA RAG et Gemini',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        {/* Composant de notifications Toaster (Sonner) pour afficher les messages de succès/erreur */}
        <Toaster position="bottom-right" richColors />
        
        {/* En-tête global avec barre de navigation responsive */}
        <Navbar />
        
        {/* Conteneur principal qui reçoit dynamiquement la page courante via la prop `children` */}
        <main className="app-main-content">
          {children}
        </main>

        {/* Pied de page global */}
        <Footer />
      </body>
    </html>
  );
}