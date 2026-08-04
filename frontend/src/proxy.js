/**
 * =========================================================================================
 * MIDDLEWARE / PROXY DE PROTECTION DES ROUTES (MIDDLEWARE SECURITY)
 * =========================================================================================
 * Fichier : src/proxy.js
 * Rôle : Intercepte les requêtes HTTP côté serveur Next.js avant l'affichage des pages.
 *        Vérifie la présence du jeton de session JWT dans les cookies du navigateur.
 *        Si un utilisateur non authentifié tente d'accéder à une route privée (/dashboard, /projects, /profile),
 *        il est automatiquement redirigé vers la page de connexion (/).
 * =========================================================================================
 */

import { NextResponse } from 'next/server';

/**
 * Fonction de contrôle d'accès proxy
 */
export function proxy(request) {
  // 1. Récupération du jeton JWT stocké dans le cookie "token"
  const token = request.cookies.get('token')?.value;
  const path = request.nextUrl.pathname;

  // 2. Définition des routes privées nécessitant une authentification
  const isProtectedRoute =
    path.startsWith('/dashboard') ||
    path.startsWith('/profile') ||
    path.startsWith('/projects');

  // 3. Si l'utilisateur tente d'accéder à une route protégée sans token valide, redirection vers la page de login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 4. Sinon, poursuite normale du traitement de la requête
  return NextResponse.next();
}

/**
 * Configuration du filtre d'interception (Matcher)
 * Définit quelles routes de l'application déclenchent l'exécution du proxy middleware.
 */
export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/projects/:path*'],
};
