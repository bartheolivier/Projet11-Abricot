# ⚙️ Architecture et Fonctionnement du Backend (État actuel)

Ce document pédagogique présente l'architecture de la partie backend (API REST) de notre application de gestion de projets "Abricot". Il fonctionne de pair avec le document sur le frontend.

---

## 1. Stack Technique

Le projet backend (situé dans le dossier `backend/`) repose sur un écosystème robuste et typé :
*   **Environnement d'exécution :** Node.js
*   **Framework Web :** [Express.js](https://expressjs.com/) (pour la création de l'API REST).
*   **Langage :** TypeScript, qui apporte un typage statique au JavaScript, évitant ainsi de nombreux bugs.
*   **ORM (Object-Relational Mapping) :** [Prisma](https://www.prisma.io/). C'est l'outil qui fait le lien entre notre code et la base de données.
*   **Base de données :** SQLite (choisie pour sa simplicité de mise en place, la base de données est stockée dans un simple fichier local).

---

## 2. Structure des Dossiers

Le code source est organisé selon le modèle classique MVC (Modèle-Vue-Contrôleur) adapté pour une API REST :

```text
backend/
├── prisma/
│   └── schema.prisma       # Le modèle de la base de données (Tables et Relations)
├── src/
│   ├── index.ts            # Point d'entrée de l'application (Démarrage du serveur)
│   ├── config/             # Fichiers de configuration (ex: Swagger pour la doc)
│   ├── routes/             # Définition des URLs de l'API (Endpoints)
│   ├── controllers/        # Logique métier (Que faire quand une route est appelée ?)
│   ├── middleware/         # Fonctions intermédiaires (ex: Vérification du token de sécurité)
│   ├── lib/                # Code utilitaire global (ex: instance de connexion Prisma)
│   ├── types/              # Définitions TypeScript personnalisées
│   └── utils/              # Fonctions d'aide (helpers)
└── package.json            # Dépendances et scripts du projet
```

---

## 3. Le Modèle de Données (Prisma)

Le fichier `prisma/schema.prisma` est le cœur de notre base de données. Actuellement, il définit plusieurs "Modèles" (tables) et leurs relations :
*   **`User` (Utilisateur) :** Possède un email, un mot de passe (qui sera haché), et des relations vers les projets créés ou rejoints.
*   **`Project` (Projet) :** Possède un nom, une description, un créateur (`owner`) et peut contenir plusieurs tâches et membres.
*   **`ProjectMember` :** Une table de liaison qui gère les rôles (ADMIN ou CONTRIBUTOR) des utilisateurs dans les projets.
*   **`Task` (Tâche) :** Associée à un projet, avec un statut (TODO, IN_PROGRESS...), une priorité, et des personnes assignées (`TaskAssignee`).
*   **`Comment` (Commentaire) :** Associé à une tâche et écrit par un utilisateur.

> [!TIP]
> Lorsque le schéma Prisma est modifié, on utilise la commande `npx prisma db push` (ou `prisma migrate dev`) pour appliquer les changements à la base de données SQLite.

---

## 4. Le Flux d'une Requête (Architecture de l'API)

Voici comment une requête venant du frontend (ex: la connexion) est traitée par notre API :

### A. Point d'entrée (`src/index.ts`)
Toutes les requêtes passent d'abord par `index.ts`. Ce fichier initialise Express et applique des middlewares globaux :
*   `helmet()` : Renforce la sécurité en ajoutant des en-têtes HTTP de protection.
*   `cors()` : Autorise le frontend (Next.js sur le port 3000) à communiquer avec l'API (sur le port 8000).
*   `express.json()` : Permet à l'API de comprendre le format JSON envoyé par le frontend.

### B. Le Routage (`src/routes/`)
Une fois les middlewares globaux passés, la requête est dirigée vers le bon "routeur".
Par exemple, dans `index.ts`, on trouve : `app.use("/auth", authRoutes);`
Cela signifie que toute URL commençant par `/auth` sera gérée par `authRoutes.ts`.

### C. La Logique Métier (`src/controllers/`)
Dans `authRoutes.ts`, la route `POST /login` fait appel à une fonction spécifique dans `authController.ts`. C'est le contrôleur qui fait le vrai travail :
1.  Il récupère l'email et le mot de passe depuis la requête.
2.  Il demande à **Prisma** de chercher l'utilisateur dans la base de données SQLite.
3.  Il utilise la librairie `bcryptjs` pour comparer le mot de passe fourni avec le mot de passe haché enregistré en base.
4.  Si tout est bon, il utilise `jsonwebtoken` pour générer un **Token JWT** (le fameux token stocké en cookie sur le frontend) et le renvoie au client.

### D. La Sécurisation des Routes (`src/middleware/auth.ts`)
Pour protéger les routes privées (comme la création d'un projet), l'API utilise un **Middleware d'authentification** (`authenticateToken`).
*   Il s'intercale entre la route et le contrôleur.
*   Il vérifie si la requête contient un Token JWT valide dans ses en-têtes (Header `Authorization: Bearer <token>`).
*   Si le token est absent ou invalide, il renvoie une erreur 401 ou 403, et le contrôleur n'est jamais exécuté.

---

## 5. Documentation de l'API (Swagger)

Le backend intègre un outil très pratique : **Swagger**.
Il s'agit d'une interface web générée automatiquement (disponible sur l'URL de base `/api-docs`) qui répertorie toutes les routes de l'API (les points d'accès `endpoints` listés dans `index.ts` comme `/projects`, `/tasks`, etc.), les paramètres attendus et les réponses possibles. C'est le "mode d'emploi" de l'API pour le développeur Frontend.

---

## En Résumé

1. Le **Frontend (Next.js)** envoie une requête JSON à l'API (`http://localhost:8000/...`).
2. **Express** reçoit la requête dans `index.ts`.
3. Les **Routes** dirigent la requête (éventuellement après un passage par le **Middleware** de sécurité).
4. Le **Contrôleur** traite la demande en utilisant **Prisma** pour lire ou écrire dans la **Base de données (SQLite)**.
5. L'API renvoie une réponse JSON au Frontend.
