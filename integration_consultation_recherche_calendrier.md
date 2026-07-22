# Fiche Pédagogique : Consultation de Tâche, Recherche/Filtres & Vue Calendrier

Ce document pédagogique résume les récents développements apportés à l'application : la modale de consultation de tâches en lecture seule, le verrouillage universel du défilement d'arrière-plan, le moteur de recherche et de filtrage dynamique, ainsi que la vue **Calendrier interactive** et son sélecteur d'onglets ergonomique (*Segmented Control*).

---

## 1. Modale de Consultation de Tâche (`ViewTaskModal`)

### A. Besoin Ergonomique
Sur le Tableau de bord (onglets Liste et Kanban), les boutons **"Voir"** étaient inactifs. Plutôt que de surcharger l'écran avec une modale d'édition modifiable, nous avons conçu une modale de consultation en **lecture seule**, épurée et très lisible.

### B. Caractéristiques du Composant [ViewTaskModal.js](file:///home/obarthe/Bureau/Formation_Dev_IA/Projet11New/frontend/src/components/ViewTaskModal.js)
*   **En-tête :** Titre `"Détails de la tâche"` avec bouton de fermeture `X`.
*   **Contenu :**
    *   **Titre & Description :** Présentés dans un encadré grisé `desc-value` pour un confort de lecture optimal.
    *   **Projet associé & Échéance :** Affichés avec icônes `Folder` et `Calendar`.
    *   **Collaborateurs assignés :** Présentés sous forme de capsules visuelles avec avatar coloré (initiales de l'utilisateur) sans passer par un menu déroulant.
    *   **Statut :** Positionné en bas du corps de la modale avec un badge de couleur pastel (`À faire`, `En cours`, `Terminée`).
    *   **Section Commentaires :** Liste des commentaires publiés sur la tâche (auteur, date, texte) ou message d'état vide.
*   **Ascenseur Unique :** Pour éviter le problème des barres de défilement imbriquées (*Double Scrollbars*), un seul ascenseur englobant a été conservé au niveau de `.view-modal-body`.

---

## 2. Sécurisation du Défilement d'Arrière-Plan (*Body Scroll Lock*)

### A. Problématique (*Scroll Chaining*)
Lorsqu'une modale était ouverte et que l'utilisateur faisait défiler la molette de la souris, le défilement atteignait la fin de la modale et faisait bouger la page en arrière-plan.

### B. Solution Implémentée (Dual Protection JS + CSS)
1.  **Verrouillage JS Dynamique :**
    Dans les 6 modales de l'application (`CreateProjectModal`, `EditProjectModal`, `CreateTaskModal`, `EditTaskModal`, `AiTaskGenerationModal`, `ViewTaskModal`), un hook `useEffect` bloque le défilement du corps du document :
    ```javascript
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
      return () => {
        document.body.style.overflow = "";
      };
    }, [isOpen]);
    ```
2.  **Neutralisation CSS (`overscroll-behavior: contain`) :**
    Ajout de la propriété `overscroll-behavior: contain;` sur `.modal-overlay` et `.modal-content` dans [globals.css](file:///home/obarthe/Bureau/Formation_Dev_IA/Projet11New/frontend/src/app/globals.css) pour stopper la propagation des événements de molette au document parent.

---

## 3. Moteur de Recherche et Filtres par Statut

### A. Recherche sur le Tableau de bord (`/dashboard`)
*   Le champ de recherche de l'onglet Liste filtre en temps réel les tâches assignées sur :
    *   Le **titre** de la tâche.
    *   La **description** de la tâche.
    *   Le nom du **projet** associé.
*   Synchronisation automatique avec le tableau Kanban.

### B. Recherche & Filtre par Statut sur le Détail d'un Projet (`/projects/[id]`)
*   **Filtre Statut (`Dropdown`) :** Permet de cibler `Tous les statuts`, `À faire`, `En cours` ou `Terminée`.
*   **Recherche Textuelle :** Recherche dans les titres et descriptions des tâches du projet.
*   Les filtres sont **cumulatifs** et affichent un message explicite d'état vide si aucun résultat n'est trouvé.

---

## 4. Onglets "Segmented Control" & Vue Calendrier Interactive (`ProjectCalendarView`)

### A. Sélecteur d'Onglets Modernisé (*Segmented Control*)
Substitué aux simples boutons texte par un sélecteur capsule style SaaS/iOS :
*   Arrière-plan gris clair encapsulé.
*   Icônes illustratives `LayoutList` et `Calendar`.
*   Bouton actif blanc en relief avec ombre douce et accents orange `#e65100`.

```
┌──────────────────────────────────────────────────────────┐
│  [ ≡ Liste ]    [ 📅 Calendrier ]                        │
└──────────────────────────────────────────────────────────┘
```

### B. Composant Calendrier [ProjectCalendarView.js](file:///home/obarthe/Bureau/Formation_Dev_IA/Projet11New/frontend/src/components/ProjectCalendarView.js)
1.  **Changement Rapide de Mois et d'Année :**
    *   **Menu déroulant direct (`<select>`) :** Choix direct du mois et de l'année en 1 seul clic.
    *   **Boutons de navigation :** Flèches simples (`<` et `>`) pour changer de mois, et flèches doubles (`<<` et `>>`) pour reculer/avancer de **1 an complet**.
    *   Bouton de retour rapide **`Aujourd'hui`**.
2.  **Grille Mensuelle Responsive (Lun ➔ Dim) :**
    *   Cellules des jours avec mise en valeur de la date du jour (`today-badge`).
    *   Cellules du mois précédent et suivant avec opacité adoucie.
3.  **Positionnement Automatique des Tâches :**
    *   Chaque tâche est automatiquement placée sur sa case correspondant à sa date d'échéance (`dueDate`).
    *   **Chips colorés par statut :** Orange pour *À faire*, Bleu pour *En cours*, Vert pour *Terminée*.
    *   **Clic interactif :** Un clic sur n'importe quel chip du calendrier ouvre immédiatement la modale `ViewTaskModal` pour consulter les détails et commentaires de la tâche.

---

## 5. Bilan pour la Soutenance

Si le jury vous interroge sur ces développements :
1.  **Pourquoi avoir créé la vue Calendrier sans librairie lourde ?**
    *   L'utilisation d'une grosse bibliothèque tierce (ex: FullCalendar) aurait fortement alourdi le `package.json`. Nous avons créé un composant React natif léger, 100% sur-mesure, réactif et parfaitement intégré au design system de l'application.
2.  **Comment est géré l'accès aux détails des tâches depuis le tableau de bord ?**
    *   La modale `ViewTaskModal` offre un mode consultation en lecture seule avec affichage direct des collaborateurs sous forme de capsules et liste des commentaires, garantissant une excellente expérience utilisateur sans risque de modification involontaire.
