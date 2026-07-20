# Intégration des Maquettes : Modales de Gestion des Projets et des Tâches

Ce document résume l'intégration et la logique fonctionnelle des 4 fenêtres modales développées pour la gestion de l'application, en accord avec les maquettes Figma, les contraintes de l'API REST et les règles de rôles (permissions).

---

## 1. Vue d'ensemble des Composants Modales

Les modales ont été créées sous forme de composants React client réutilisables dans le répertoire [frontend/src/components/](file:///home/obarthe/Bureau/Formation_Dev_IA/Projet11New/frontend/src/components) :

| Nom du Composant | Rôle | Emplacement | Déclencheurs |
| :--- | :--- | :--- | :--- |
| **`CreateProjectModal`** | Créer un projet | [CreateProjectModal.js](file:///home/obarthe/Bureau/Formation_Dev_IA/Projet11New/frontend/src/components/CreateProjectModal.js) | Bouton **"+ Créer un projet"** (Dashboard & Liste Projets) |
| **`EditProjectModal`** | Modifier un projet | [EditProjectModal.js](file:///home/obarthe/Bureau/Formation_Dev_IA/Projet11New/frontend/src/components/EditProjectModal.js) | Bouton Crayon (Cartes de projets) & Lien **"Modifier"** (En-tête Détail) |
| **`CreateTaskModal`** | Créer une tâche | [CreateTaskModal.js](file:///home/obarthe/Bureau/Formation_Dev_IA/Projet11New/frontend/src/components/CreateTaskModal.js) | Bouton **"+ Créer une tâche"** (Détail du projet) |
| **`EditTaskModal`** | Modifier une tâche | [EditTaskModal.js](file:///home/obarthe/Bureau/Formation_Dev_IA/Projet11New/frontend/src/components/EditTaskModal.js) | Option **"Modifier"** du menu contextuel `...` (Carte de tâche) |

---

## 2. Modales de Projets

```
[CreateProjectModal] ➡️ POST /api/projects
[EditProjectModal]   ➡️ PUT /api/projects/:id (Infos)
                     ➡️ POST /api/projects/:id/contributors (Ajouts différentiels)
                     ➡️ DELETE /api/projects/:id/contributors/:userId (Retraits différentiels)
```

### A. Création de projet
*   **Validation des champs :** Le bouton "Ajouter un projet" est désactivé si le titre ou la description sont vides.
*   **Dropdown multi-sélection des collaborateurs :**
    *   Saisie de minimum 2 caractères ➡️ Appel dynamique à l'API de recherche globale `GET /api/users/search?query=...`.
    *   Sélection par cases à cocher. Les utilisateurs sélectionnés remontent instantanément en haut de la liste pour être identifiables.

### B. Modification de projet (Synchronisation différentielle)
*   L'API backend `PUT /api/projects/:id` ne permettant de mettre à jour que le titre et la description, la gestion des contributeurs utilise une comparaison d'états (différentiel) :
    *   **Contributeurs ajoutés :** Appel de `POST /api/projects/:id/contributors` (avec l'email).
    *   **Contributeurs retirés :** Appel de `DELETE /api/projects/:id/contributors/:userId` (avec l'identifiant).
    *   **Règle de gestion :** Le propriétaire du projet est filtré et exclu de cette liste pour empêcher qu'il se retire lui-même.

---

## 3. Modales de Tâches

### A. Création de tâche
*   **Champs obligatoires :** Titre, Description et Échéance. Le bouton "+ Ajouter une tâche" est verrouillé tant que ces trois champs ne sont pas remplis.
*   **Dropdown d'assignation localisé :** Les utilisateurs assignables sont extraits directement de la liste des membres du projet (Propriétaire + Contributeurs). La recherche s'effectue localement (filtrage instantané côté client), optimisant les performances.
*   **Sélecteur de statut visuel :** Boutons pilules colorés (`À faire`, `En cours`, `Terminée`).
*   **Contournement d'API :** L'API `POST /projects/:id/tasks` créant par défaut les tâches avec le statut `TODO`, si l'utilisateur choisit un statut différent (ex: `En cours`), la modale enchaîne automatiquement une requête `PUT /projects/:id/tasks/:taskId` pour appliquer le statut choisi.

### B. Modification de tâche
*   **Pré-remplissage :** Les données de la tâche (titre, description, date d'échéance formatée `YYYY-MM-DD` pour l'input natif HTML, statut, assignés) sont chargées à l'ouverture.
*   La soumission transmet directement le tableau d'identifiants d'assignations (`assigneeIds`) à `PUT /api/projects/:id/tasks/:taskId` pour synchroniser la base de données.

---

## 4. Intégration du menu d'actions rapides et Permissions

### A. Menu Contextuel `...`
Chaque carte de tâche affiche un bouton `...`. Un clic ouvre un menu contextuel absolu permettant de modifier ou de supprimer la tâche (qui appelle `DELETE /api/projects/:id/tasks/:taskId`).
Un écouteur global détecte le clic en dehors :
```javascript
if (!e.target.closest(".task-menu-btn") && !e.target.closest(".task-action-dropdown-menu")) {
  setActiveTaskMenu(null);
}
```
Ce correctif évite la fermeture instantanée du menu lors du clic sur le déclencheur `...`.

### B. Sécurisation par Rôle (Permissions)
*   **Propriétaire / Admin :** Peut modifier ou supprimer **toutes les tâches** du projet.
*   **Contributeur :** Ne peut modifier ou supprimer **que les tâches dont il est le créateur** (`task.creatorId === currentUserId`). Le bouton `...` est masqué sur les tâches créées par d'autres.

---

## 5. Modifications CSS associées (`globals.css`)

Les styles suivants ont été ajoutés pour concrétiser les visuels Figma :
*   Overlay de fond avec floutage (`backdrop-filter: blur(4px)`) et animation d'apparition en fondu.
*   Design du dropdown de collaborateurs (hauteur max, ascenseur, barre de recherche intégrée, style de surbrillance orange Abricot sur les options sélectionnées).
*   Styles des pilules radio de sélection de statut actives/inactives avec surbrillance par ombrage (`box-shadow: 0 0 0 2px color`).
*   Positionnement absolu et effet de survol du menu contextuel `...`.
