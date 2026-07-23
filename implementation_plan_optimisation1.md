# Plan d'Implémentation : Refactoring de l'état et des requêtes avec TanStack Query & Zustand

Ce plan détaille la simplification de l'architecture frontend de l'application **Abricot.co** en remplaçant la gestion manuelle des requêtes (`fetch`, `useEffect`, `useState` répétés) et la passe de callbacks par **TanStack Query (React Query)** et **Zustand**.

## Objectif & Gains pour la Soutenance
1. **Élimination du code boilerplate** : Suppression de plus de 50% du code répétitif lié aux requêtes HTTP, aux indicateurs de chargement et à la gestion des erreurs.
2. **Invalidation automatique du cache (*Mutations*)** : Lorsqu'une tâche ou un projet est créé/modifié/supprimé, TanStack Query rafraîchit automatiquement et immédiatement les vues concernées (Liste, Kanban, Dashboard, Calendrier) sans avoir à faire passer de fonctions de rafraîchissement manuelles (`fetchData()`).
3. **State Global Centralisé (Zustand)** : Gestion élégante et simplifiée du profil de l'utilisateur connecté et des paramètres globaux.
4. **Explication simple lors de la soutenance** : Permet de démontrer l'utilisation des meilleures pratiques actuelles du marché (React Query + Zustand) utilisées par les équipes SaaS modernes.

---

## Proposed Changes

### 1. Installation des Dépendances
- Install `@tanstack/react-query` et `zustand` dans le projet `frontend`.

### 2. Configuration du Provider (`QueryClientProvider`)
#### [NEW] [QueryProvider.js](file:///home/obarthe/Bureau/Formation_Dev_IA/Projet11New/frontend/src/components/QueryProvider.js)
- Création d'un composant Provider client englobant pour initialiser le `QueryClient` de TanStack Query.

#### [MODIFY] [layout.js](file:///home/obarthe/Bureau/Formation_Dev_IA/Projet11New/frontend/src/app/layout.js)
- Englober l'application dans `<QueryProvider>`.

---

### 3. State Management Global (Zustand) & Helper API Centralisé
#### [NEW] [useUserStore.js](file:///home/obarthe/Bureau/Formation_Dev_IA/Projet11New/frontend/src/lib/useUserStore.js)
- Store Zustand léger pour stocker les informations de l'utilisateur connecté et simplifier la récupération du token JWT depuis les cookies.

#### [NEW] [api.js](file:///home/obarthe/Bureau/Formation_Dev_IA/Projet11New/frontend/src/lib/api.js)
- Centralisation des fonctions d'appel API REST (`fetchProjects`, `fetchProjectById`, `fetchTasks`, `createProject`, `updateTask`, etc.) pour éviter la duplication des en-têtes et de l'URL de base.

---

### 4. Custom Hooks React Query (`useProjects`, `useTasks`, `useAuth`)
#### [NEW] [useProjectsQuery.js](file:///home/obarthe/Bureau/Formation_Dev_IA/Projet11New/frontend/src/hooks/useProjectsQuery.js)
- Hooks personnalisés React Query :
  - `useProjects()` : Récupération en cache des projets.
  - `useProjectDetails(id)` : Récupération du détail d'un projet.
  - `useCreateProjectMutation()` : Création de projet + invalidation automatique des projets.
  - `useUpdateProjectMutation()` & `useDeleteProjectMutation()`.

#### [NEW] [useTasksQuery.js](file:///home/obarthe/Bureau/Formation_Dev_IA/Projet11New/frontend/src/hooks/useTasksQuery.js)
- Hooks personnalisés React Query :
  - `useProjectTasks(projectId)` : Récupération des tâches d'un projet.
  - `useUserAssignedTasks()` : Récupération des tâches assignées sur le Dashboard.
  - `useCreateTaskMutation()` & `useUpdateTaskMutation()` & `useDeleteTaskMutation()` : Invalidation automatique du cache pour mettre à jour instantanément la vue Liste, Kanban et Calendrier.

---

### 5. Refactoring des Composants & Pages

#### [MODIFY] [Navbar.js](file:///home/obarthe/Bureau/Formation_Dev_IA/Projet11New/frontend/src/components/Navbar.js)
- Remplacement du `useEffect` manuel par le hook Zustand / React Query du profil utilisateur.

#### [MODIFY] [dashboard/page.js](file:///home/obarthe/Bureau/Formation_Dev_IA/Projet11New/frontend/src/app/dashboard/page.js)
- Simplification drastique de la page : remplacement des 3 blocs `useEffect`/`fetch` par `useUserAssignedTasks()` et `useProjects()`.

#### [MODIFY] [projects/page.js](file:///home/obarthe/Bureau/Formation_Dev_IA/Projet11New/frontend/src/app/projects/page.js)
- Utilisation de `useProjects()` et des mutations de création/suppression.

#### [MODIFY] [projects/[id]/page.js](file:///home/obarthe/Bureau/Formation_Dev_IA/Projet11New/frontend/src/app/projects/[id]/page.js)
- Remplacement de la gestion d'état locale complexe par `useProjectDetails(id)` et `useProjectTasks(id)`.

#### [MODIFY] Modales (`CreateProjectModal`, `CreateTaskModal`, `EditTaskModal`, `AiTaskGenerationModal`)
- Utilisation directe des mutations React Query (`mutateAsync`) pour soumettre les formulaires. Suppression du passage manuel de callbacks de rafraîchissement.

---

## Verification Plan

### Tests Automatisés
- Compilation de l'application Next.js (`npm run build`) pour s'assurer qu'aucun warning TypeScript/React ou erreur de build n'apparaît.

### Vérification Manuelle
- Connexion et vérification de la persistance de l'utilisateur dans la Navbar.
- Création d'un projet : vérification que la liste des projets se met à jour immédiatement sur `/projects` et `/dashboard`.
- Création et modification d'une tâche (manuelle ou via IA) : vérification de la mise à jour simultanée sur la Vue Liste, Kanban et Calendrier.
- Vérification que la navigation au clavier et la conformité WCAG 2.1 AA restent 100% intactes.
