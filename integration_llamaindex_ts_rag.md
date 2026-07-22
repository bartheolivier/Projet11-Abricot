# Fiche Pédagogique : Intégration Officielle du Framework LlamaIndex.TS & RAG Adaptatif

Ce document pédagogique détaille l'intégration du framework officiel **LlamaIndex.TS** et du connecteur **@llamaindex/google** dans notre application Next.js, conformément aux contraintes techniques exigées par le cahier des charges.

---

## 1. Contexte & Contraintes Techniques du Cahier des Charges

Le tableau des contraintes techniques impose explicitement :
> **Framework de RAG :** *LlamaIndex.TS pour l'implémentation du RAG (seulement le framework, sans utiliser le service Cloud LlamaIndex).*

Pour répondre à cette contrainte, nous avons directement intégré les packages officiels dans le fichier [frontend/package.json](file:///home/obarthe/Bureau/Formation_Dev_IA/Projet11New/frontend/package.json) :
*   `llamaindex` : Le framework RAG de référence pour TypeScript/JavaScript.
*   `@llamaindex/google` : Le module officiel d'interfaçage avec les modèles LLM et Embedding de Google (Gemini).

---

## 2. Architecture du Pipeline RAG LlamaIndex.TS

La route serveur [route.js](file:///home/obarthe/Bureau/Formation_Dev_IA/Projet11New/frontend/src/app/api/ai/generate-tasks/route.js) met en œuvre le pipeline RAG canonique :

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                Route API Server Next.js                                 │
│                         /api/ai/generate-tasks/route.js                                 │
│                                                                                         │
│  1. Retrieval          2. LlamaIndex Document        3. Settings Initialization        │
│  GET /projects/:id  ──>  new Document({ text })   ──>  Settings.llm = Gemini            │
│  GET /tasks              (Ancrage anti-doublon)       Settings.embedModel = GeminiEmbed │
│                                                                 │                       │
│                                                                 ▼                       │
│  5. Parsing JSON       4. QueryEngine RAG             SummaryIndex.fromDocuments        │
│  [ {title, desc} ]  <──  index.asQueryEngine(...)  <──  Moteur d'indexation             │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### A. Encapsulation des Données dans la classe `Document`
Les données du projet (nom, description) et la liste des tâches existantes sont récupérées depuis le backend Express et encapsulées dans la classe `Document` de LlamaIndex.TS :
```javascript
import { Document, SummaryIndex, Settings } from "llamaindex";

const contextDocument = new Document({
  text: `INFORMATIONS DU PROJET:\n${projectInfoText}\n\nTÂCHES DÉJÀ EXISTANTES (NE PAS DUPLIQUER):\n${tasksInfoText}`,
  metadata: { projectId, tasksCount: existingTasks.length },
});
```

### B. Configuration Globale des Modèles (`Settings`)
LlamaIndex.TS s'appuie sur un singleton `Settings` pour orchestrer le LLM et le modèle d'Embedding :
```javascript
import { Gemini, GEMINI_MODEL, GeminiEmbedding, GEMINI_EMBEDDING_MODEL } from "@llamaindex/google";

const geminiLlm = new Gemini({
  apiKey: apiKey,
  model: GEMINI_MODEL.GEMINI_2_5_FLASH_LATEST || GEMINI_MODEL.GEMINI_PRO_1_5_FLASH_LATEST,
});

const geminiEmbed = new GeminiEmbedding({
  apiKey: apiKey,
  model: GEMINI_EMBEDDING_MODEL.TEXT_EMBEDDING_004 || "text-embedding-004",
});

// Correctif indispensable : initialisation des métadonnées de l'Embedding
geminiEmbed.metadata = {
  model: GEMINI_EMBEDDING_MODEL.TEXT_EMBEDDING_004 || "text-embedding-004",
  contextWindow: 2048,
};

Settings.llm = geminiLlm;
Settings.embedModel = geminiEmbed;
```

### C. Moteur d'Indexation & Syntaxe RAG
```javascript
// Indexation des documents par LlamaIndex.TS
const index = await SummaryIndex.fromDocuments([contextDocument]);

// Instanciation du moteur de requêtes RAG
const queryEngine = index.asQueryEngine({ llm: geminiLlm });

// Exécution de la génération augmentée
const response = await queryEngine.query({ query: ragQuery });
```

---

## 3. Optimisation du Prompt : Adaptation Dynamique du Nombre de Tâches

### Problematic & Solution
Auparavant, le prompt système imposait une contrainte fixe (`"Générez entre 2 et 5 tâches"`), ce qui empêchait l'utilisateur d'obtenir une seule tâche lorsqu'il le demandait spécifiquement.

Le prompt RAG dans [route.js](file:///home/obarthe/Bureau/Formation_Dev_IA/Projet11New/frontend/src/app/api/ai/generate-tasks/route.js) a été amélioré avec une instruction d'analyse adaptative :

```javascript
Consignes :
1. Analysez la demande de l'utilisateur : si un nombre précis de tâches est demandé (ex: "une tâche", "1 tâche", "3 tâches"), générez EXACTEMENT le nombre de tâches demandé. Si aucune quantité précise n'est spécifiée dans la demande, générez entre 1 et 3 tâches pertinentes.
2. Évitez TOUT doublon avec les tâches existantes.
3. Votre réponse DOIT ÊTRE STRICTEMENT un tableau JSON valide au format [{ "title": "...", "description": "..." }].
```

**Résultat :**
*   Demande : *"Ajoute 1 tâche pour l'intégration de Stripe"* ➔ **1 tâche générée**.
*   Demande générale : *"Ajouter le module de facturation"* ➔ **1 à 3 tâches adaptées**.

---

## 4. Correction de l'Intégration UI (`projects/[id]/page.js`)

Lors de la validation des tâches générées dans la modale [AiTaskGenerationModal.js](file:///home/obarthe/Bureau/Formation_Dev_IA/Projet11New/frontend/src/components/AiTaskGenerationModal.js), la modale déclenche le callback `onTasksAdded()`. 

Une erreur de référence (`fetchProjectData is not defined`) a été corrigée dans [projects/[id]/page.js](file:///home/obarthe/Bureau/Formation_Dev_IA/Projet11New/frontend/src/app/projects/%5Bid%5D/page.js) en appelant la fonction réelle de rechargement des données `fetchData()` :

```javascript
<AiTaskGenerationModal
  isOpen={isAiModalOpen}
  project={project}
  onClose={() => setIsAiModalOpen(false)}
  onTasksAdded={() => {
    fetchData(); // Correctif : appel de la fonction réelle de rafraîchissement
  }}
/>
```

---

## 5. Points Clés à Présenter lors de la Soutenance

Si les évaluateurs examinent votre RAG :

1.  **Conformité avec le sujet :**
    *   Le framework officiel **LlamaIndex.TS** est utilisé côté serveur via les classes canoniques `Document`, `SummaryIndex`, `Settings`, `Gemini` et `GeminiEmbedding`.
2.  **Sobriété & Absence de Cloud tiers :**
    *   Seul le framework local LlamaIndex.TS est exploité. Aucun service Cloud ou payant de LlamaIndex n'est appelé.
3.  **Gestion des Embeddings & LLM :**
    *   L'intégration utilise la clé Gemini du projet pour alimenter à la fois le modèle de génération (`gemini-2.5-flash`) et le modèle d'embedding (`text-embedding-004`).
4.  **Ergonomie et Robustesse :**
    *   L'IA s'adapte au nombre exact de tâches demandé par l'utilisateur et recharge le projet en temps réel sans rafraîchissement complet de la page.
