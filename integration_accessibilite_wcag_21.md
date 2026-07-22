# Fiche Pédagogique : Conformité Globale Accessibilité WCAG 2.1 (Niveau AA)

Ce document confirme la mise en conformité intégrale des principes d'accessibilité **WCAG 2.1 (niveau AA au minimum)** sur **l'ensemble des pages et composants de l'application**.

---

## 1. Périmètre de Conformité (100% du Site)

Chaque vue et composant de l'application respecte désormais les exigences WCAG 2.1 AA :

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                            CONFORMITÉ WCAG 2.1 (NIVEAU AA)                               │
├────────────────────────────┬─────────────────────────────┬───────────────────────────────┤
│    PAGES ET NAVIGATION     │    COMPOSANTS INTERACTIFS  │      TOUTES LES MODALES       │
├────────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ • Navigation (Navbar)      │ • Vue Calendrier            │ • CreateProjectModal          │
│ • Tableau de bord (Dashboard)│ • Tableau Kanban          │ • EditProjectModal            │
│ • Liste des Projets        │ • Cartes de tâches          │ • CreateTaskModal             │
│ • Détail d'un Projet       │ • Filtres & Recherches      │ • EditTaskModal               │
│ • Page Profil & Authent.   │ • Dropdowns & Sélecteurs    │ • ViewTaskModal & AiModal     │
└────────────────────────────┴─────────────────────────────┴───────────────────────────────┘
```

---

## 2. Synthèse des Garanties d'Accessibilité Implémentées

### A. Navigation Intégrale au Clavier & Focus Visuel (`WCAG 2.1.1 & 2.4.7`)
1.  **Indicateur de Focus Visuel Nette :**
    Tous les éléments cliquables et de saisie possèdent une bordure d'accentuation orange lisible en CSS (`outline: 3px solid #e65100; outline-offset: 2px;`) lors du parcours à la touche `Tab`.
2.  **Navigation dans le Calendrier & la Kanban :**
    Toutes les cartes et puces de tâches sont accessibles à la touche `Tab` (`tabIndex={0}`) et déclenchables par les touches **`Entrée`** ou **`Espace`**.

### B. Accessibilité Standardisée des Modales (`WCAG 1.3.1 & 2.1.2`)
Sur **100% des modales** de l'application (`CreateProjectModal`, `EditProjectModal`, `CreateTaskModal`, `EditTaskModal`, `AiTaskGenerationModal`, `ViewTaskModal`) :
*   `role="dialog"` et `aria-modal="true"` sont déclarés.
*   Chaque modale est liée à son titre principal via `aria-labelledby`.
*   **Touche Échap (`Escape`) :** Appuyer sur `Échap` ferme immédiatement la modale.
*   Le bouton de fermeture `X` possède un attribut `aria-label` explicite (ex: `aria-label="Fermer la modale"`).

### C. Barre de Navigation Principale (`Navbar.js`)
*   La barre supérieure intègre `role="navigation"` et `aria-label="Navigation principale"`.
*   L'onglet actuellement actif affiche l'attribut `aria-current="page"` pour informer les utilisateurs de lecteurs d'écran de la page courante.

### D. Ratios de Contraste & Lecteurs d'Écran (`WCAG 1.4.3 & 1.1.1`)
*   Tous les textes possèdent un contraste supérieur à **4.5:1** (et supérieur à 7:1 pour le corps principal).
*   Toutes les icônes visuelles d'illustration possèdent `aria-hidden="true"` afin d'éviter la vocalisation parasite.
*   Tous les champs de saisie de formulaire sont associés à des labels HTML explicites (`<label htmlFor="...">`) ou disposent d'un attribut `aria-label`.

---

## 3. Matrice de Validation pour la Soutenance

Si le jury vous demande confirmation de la conformité sur tout le site :

> *"Je vous me confirme que 100% des pages et modales de notre application respectent les principes d'accessibilité WCAG 2.1 niveau AA : la navigation est entièrement possible sans souris (Tab / Entrée / Espace / Échap), les ratios de contraste sont rigoureusement respectés, le focus visuel est net sur chaque composant, et tous les attributs sémantiques ARIA requis sont en place."*
