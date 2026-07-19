# 🏗️ Architecture et Fonctionnement du Frontend (État actuel)

Ce document pédagogique présente l'architecture actuelle de la partie frontend de notre application SaaS "Abricot". Il est conçu pour t'aider à comprendre comment les différents fichiers et concepts s'articulent entre eux.

---

## 1. Stack Technique

Le projet repose sur une pile technologique moderne :
*   **Framework :** [Next.js](https://nextjs.org/) (Version 16.2), qui est un framework basé sur React permettant notamment le rendu côté serveur (SSR) et une gestion simplifiée du routage.
*   **Bibliothèque UI :** React (Version 19).
*   **Architecture de routage :** **App Router** (introduit de manière stable dans les versions récentes de Next.js, caractérisé par le dossier `src/app`).
*   **Stylisation :** CSS classique (`globals.css`) combiné avec des styles "en ligne" (inline styles) directement dans les composants React.

---

## 2. Structure des Dossiers

Tout le code source du frontend est concentré dans le dossier `src/`. Voici une vue d'ensemble des éléments clés :

```text
frontend/src/
├── app/                  # Cœur de l'application (App Router)
│   ├── dashboard/        # Route: /dashboard
│   │   └── page.js       # Page du tableau de bord
│   ├── profile/          # Route: /profile
│   ├── projects/         # Route: /projects
│   ├── register/         # Route: /register
│   ├── globals.css       # Styles globaux et variables CSS (ex: --primary-color)
│   ├── layout.js         # Composant parent englobant toutes les pages
│   └── page.js           # Page d'accueil (Route: / - Page de connexion)
└── proxy.js              # Middleware pour la protection des routes
```

---

## 3. Le Routage (App Router)

Next.js utilise un système de **routage basé sur les fichiers**. Chaque dossier à l'intérieur de `app/` correspond à une route (URL) de l'application, à condition qu'il contienne un fichier `page.js`.

### `layout.js` : Le squelette commun
Le fichier `src/app/layout.js` agit comme une coquille vide dans laquelle vient s'insérer chaque page. 
*   Il contient la structure HTML de base (`<html>`, `<body>`).
*   Il intègre une barre de navigation (`<nav>`) commune à toutes les pages de l'application.
*   Il utilise la balise spéciale `{children}` qui sera remplacée dynamiquement par le contenu de la page actuellement visitée.

### `page.js` : Les vues spécifiques
*   **Accueil (`app/page.js`) :** C'est le point d'entrée. Il contient le formulaire de connexion.
*   **Tableau de bord (`app/dashboard/page.js`) :** Affiche la vue principale une fois l'utilisateur connecté.

> [!TIP]
> Dans Next.js, on utilise le composant `<Link>` (importé depuis `next/link`) au lieu des balises `<a>` traditionnelles. Cela permet une navigation fluide sans rechargement complet de la page (comportement d'une *Single Page Application*).

---

## 4. Flux de Données et Authentification

L'état actuel du développement met en place un flux d'authentification fonctionnel :

### A. Connexion (`app/page.js`)
1.  **Formulaire contrôlé :** Les champs "email" et "mot de passe" sont gérés par le *hook* React `useState`. Chaque frappe met à jour l'état local du composant.
2.  **Requête API :** Lors de la soumission (`handleSubmit`), une requête `fetch` est envoyée à l'API backend (`/api/auth/login`).
3.  **Stockage du Token :** Si la connexion réussit, le backend renvoie un *token* (généralement un JWT). Ce token est stocké côté client dans un **Cookie** via `document.cookie`. L'utilisation d'un cookie avec les attributs `max-age` (durée de vie) et `SameSite=Strict` sécurise la session.
4.  **Redirection :** L'utilisateur est ensuite redirigé vers le `/dashboard` grâce au *hook* `useRouter()`.

### B. Déconnexion (`app/dashboard/page.js`)
La déconnexion suit la logique inverse :
1.  Le cookie contenant le token est "écrasé" en mettant sa durée de vie à zéro (`max-age=0`).
2.  L'utilisateur est redirigé vers la page d'accueil (formulaire de connexion).

### C. Protection des Routes (`proxy.js`)
Pour empêcher un utilisateur non connecté d'accéder au tableau de bord, on utilise un concept de **Middleware** (nommé ici `proxy.js`).
*   À chaque requête vers des routes sensibles (`/dashboard`, `/profile`, `/projects`), ce script est exécuté avant même que la page ne s'affiche.
*   Il vérifie la présence du `token` dans les cookies.
*   S'il n'y a pas de token, l'utilisateur est automatiquement renvoyé vers la page d'accueil (`/`).

> [!IMPORTANT]
> Dans l'écosystème Next.js standard, le fichier gérant la protection des routes devrait idéalement s'appeler `middleware.js` (ou `.ts`) et être placé à la racine du dossier `src/` pour être détecté automatiquement par le framework. 

---

## 5. Gestion du Style

Actuellement, le projet n'utilise pas de framework CSS complexe comme Tailwind. Le design s'appuie sur :
1.  **`globals.css` :** Il définit les variables CSS globales (`--primary-color`, `--background-color`, `--error` que nous avons ajoutée, etc.) dans la pseudo-classe `:root`. Cela permet de garder une cohérence visuelle facilement modifiable. Il applique également le reset CSS de base sur la balise `body`.
2.  **Styles en ligne (Inline Styles) :** La majorité des composants (boutons, formulaires) utilisent l'attribut `style={{ ... }}` dans le code React. Bien que pratique pour un prototypage rapide, cela peut devenir difficile à maintenir à mesure que l'application grandira.

---

## Prochaines étapes suggérées (Bonnes Pratiques)

*   **Refactorisation du CSS :** Passer à des **CSS Modules** (ex: `page.module.css`) pour isoler les styles de chaque composant et nettoyer le code JSX.
*   **Composants réutilisables :** Extraire les éléments redondants (comme les boutons ou les champs de formulaire) dans un dossier `src/components/` pour éviter de répéter le code de style en ligne.
*   **Gestion des variables d'environnement :** S'assurer que l'URL de l'API cible n'est pas codée en dur mais utilise une variable d'environnement (ex: `process.env.NEXT_PUBLIC_API_URL`).
