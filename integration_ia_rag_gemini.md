# Fiche Pédagogique : Génération Automatique de Tâches par IA (RAG & Google Gemini)

Ce document résume l'architecture, le fonctionnement théorique, les choix de conception et l'implémentation pratique de la fonctionnalité de génération automatique de tâches assistée par l'Intelligence Artificielle (**RAG + Google Gemini 2.5 Flash**).

---

## 1. Concepts Clés : Qu'est-ce que le RAG ?

**RAG** signifie **Retrieval-Augmented Generation** (Génération Augmentée par Récupération).

### Pourquoi utiliser le RAG au lieu d'un prompt simple ?
Si on demande directement à un modèle LLM (comme Gemini) *"Génère des tâches pour le projet"*, le modèle n'a aucune connaissance du contexte de votre projet spécifique (quelles tâches ont déjà été créées, qui travaille dessus, quelle est la description du projet). Il risque donc de créer des tâches hors sujet ou **des doublons de tâches déjà existantes**.

Le RAG résout ce problème en 3 étapes distinctes :
1.  **Retrieval (Récupération) :** Le serveur extrait les données existantes de la base de données (nom du projet, description, et la liste de toutes les tâches actuelles).
2.  **Augmentation (Enrichissement) :** Ces données sont injectées dans le prompt envoyé au modèle sous forme de "contexte d'ancrage".
3.  **Generation (Génération) :** Le modèle d'IA analyse le prompt utilisateur ET le contexte du projet pour produire de nouvelles tâches 100% complémentaires et sans doublon.

---

## 2. Architecture Technique & Sécurité

```
┌────────────────────────┐      ┌─────────────────────────────┐      ┌────────────────────────┐
│  Client (Navigateur)   │ ───> │ API Next.js (Server Route)  │ ───> │  Express Backend (DB)  │
│  AiTaskGenerationModal │ <─── │ /api/ai/generate-tasks      │ <─── │ GET /projects/:id/tasks│
└────────────────────────┘      └──────────────┬──────────────┘      └────────────────────────┘
                                               │
                                               │ (Clé API Gemini sécurisée en .env.local)
                                               ▼
                                 ┌───────────────────────────┐
                                 │   Google Gemini 2.5 Flash │
                                 │   (Model JSON Output)     │
                                 └───────────────────────────┘
```

### A. Sécurisation de la Clé API
*   La clé API Gemini est stockée dans le fichier [frontend/.env.local](file:///home/obarthe/Bureau/Formation_Dev_IA/Projet11New/frontend/.env.local) sous le nom `GEMINI_API_KEY`.
*   Les requêtes vers Google Gemini sont exécutées **uniquement côté serveur** dans la Route API Next.js [route.js](file:///home/obarthe/Bureau/Formation_Dev_IA/Projet11New/frontend/src/app/api/ai/generate-tasks/route.js).
*   La clé n'est ainsi jamais envoyée ni visible dans le code JavaScript exécuté chez le client.

### B. Choix et Fallback du Modèle Gemini
*   **Modèle Principal :** `gemini-2.5-flash` (le modèle de dernière génération de Google, optimisé pour la rapidité et le raisonnement structuré).
*   **Cascade de Repli (Fallback) :** En cas de non-disponibilité temporaire ou d'erreur spécifique sur un endpoint régional, le code bascule automatiquement vers `gemini-2.0-flash` puis `gemini-1.5-flash`.

---

## 3. Workflow Utilisateur et Composants

### A. Saisie du Prompt et Chargement
*   L'utilisateur clique sur le bouton **`✨ IA`** sur la page de détail du projet pour ouvrir la modale [AiTaskGenerationModal.js](file:///home/obarthe/Bureau/Formation_Dev_IA/Projet11New/frontend/src/components/AiTaskGenerationModal.js).
*   Dans la barre de prompt en bas (`Décrivez les tâches que vous souhaitez ajouter...`), l'utilisateur saisit son besoin en langage naturel (ex: *"Ajouter les tâches relatives au paiement Stripe et à la facturation PDF"*).
*   Pendant la requête, un spinner `Loader2` s'affiche avec le message de chargement.

### B. Prévisualisation, Édition et Validation
*   Les tâches générées s'affichent sous forme de cartes d'aperçu (`✨ Vos tâches...`).
*   **Actions interactives par carte :**
    *   **Supprimer (🗑️) :** Retire une tâche générée si elle n'est pas jugée utile.
    *   **Modifier (✏️) :** Bascule la carte en édition inline pour ajuster le titre ou la description avant l'intégration.
*   **Intégration finale :** Le bouton principal **`+ Ajouter les tâches`** envoie les tâches validées au backend Express (`POST /api/projects/:id/tasks`) et rafraîchit la page projet en temps réel.

---

## 4. Choix d'Architecture : Pourquoi ne pas avoir utilisé LlamaIndex.TS et qu'a-t-on fait à la place ?

### A. Pourquoi ne pas avoir utilisé LlamaIndex.TS ?
1.  **Surpondération du Projet & Dépendances lourdes :** LlamaIndex.TS est un framework très complet conçu pour traiter de grands volumes de données non structurées (indexation de milliers de fichiers PDF, intégration avec des bases de données vectorielles comme Pinecone/Chroma, découpage en chunks, etc.). Pour notre besoin (générer 2 à 5 tâches en se basant sur les quelques dizaines de tâches existantes d'un projet), l'installation de LlamaIndex.TS aurait ajouté des dizaines de mégaoctets de dépendances secondaires dans `package.json`.
2.  **Règle de Sobriété du projet :** Le sujet demandant de **justifier chaque librairie en soutenance** et de privilégier des solutions simples sans *"utiliser un char d'assaut pour écraser une mouche"*, utiliser un framework RAG complet pour formater une liste de tâches était disproportionné.
3.  **Fiabilité & Stabilité du Build :** LlamaIndex.TS présente parfois des conflits de modules avec Turbopack / App Router sous Next.js 16/React 19. L'utilisation directe des API REST natives élimine tout risque de cassure au build.

### B. Qu'a-t-on fait à la place ? (Pipeline RAG Léger & Natif)
Nous avons conçu une **pipeline RAG personnalisée, légère et 100% native** dans notre Route API Next.js [route.js](file:///home/obarthe/Bureau/Formation_Dev_IA/Projet11New/frontend/src/app/api/ai/generate-tasks/route.js) :

1.  **Retrieval (Extraction) :** La Route API interroge notre backend REST Express (`GET /api/projects/:id/tasks`) pour récupérer les tâches actuellement enregistrées dans le projet.
2.  **Context Augmentation (Injection de Contexte) :** Le serveur formate dynamiquement ces tâches existantes dans un prompt système d'ancrage clair.
3.  **Generation Structurée avec Gemini 2.5 Flash :** Le serveur envoie la requête à l'API Google Gemini en activant l'option native `responseMimeType: "application/json"`. Gemini renvoie directement un tableau JSON strict `[{ title, description }]` parfaitement typé, sans nécessiter de parser complexe ni de dépendance externe.

---

## 5. Argumentaire pour la Soutenance

Si le jury vous interroge sur cette partie :

1.  **Pourquoi Gemini plutôt que Mistral ?**
    *   Le sujet autorisait le choix du LLM. Gemini 2.5 Flash offre d'excellentes performances pour le rendu JSON natif (`responseMimeType: "application/json"`), garantissant une réponse sans erreurs de parsing.
2.  **Pourquoi pas LlamaIndex.TS ?**
    *   LlamaIndex.TS est idéal pour indexer des bases documentaires volumineuses. Dans notre cas, un RAG natif via l'injection de contexte dans une Route API serveur Next.js offre le même résultat fonctionnel avec **0 dépendance supplémentaire**, un code 100% maîtrisé et une vitesse d'exécution optimale.
3.  **Comment sont gérées les erreurs ?**
    *   Gestion d'erreur à 3 niveaux : notification toast en cas de problème réseau, message d'avertissement explicite si la clé est manquante ou invalide, et boucle de secours automatique entre les modèles Gemini.
