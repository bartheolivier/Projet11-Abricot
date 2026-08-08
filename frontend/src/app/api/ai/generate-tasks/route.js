/**
 * =========================================================================================
 * ROUTE API BACKEND RAG (RETRIEVAL-AUGMENTED GENERATION) AVEC LLAMAINDEX.TS & GEMINI
 * =========================================================================================
 * Fichier : src/app/api/ai/generate-tasks/route.js
 * Rôle : Route Handler Next.js (serveur) orchestrant la génération intelligente de tâches.
 *
 * CONCEPT PÉDAGOGIQUE CLÉ - QU'EST-CE QUE LA RAG ET LLAMAINDEX.TS ?
 * -----------------------------------------------------------------------------------------
 * 1. RAG (Retrieval-Augmented Generation) :
 *    Une IA comme Gemini possède une culture générale vaste mais NE CONNAÎT PAS le contexte
 *    privé de votre application (vos projets, vos tâches existantes).
 *    La RAG résout ce problème en 2 temps :
 *    - RETRIEVAL (Récupération) : On extrait les données privées existantes (ici : le projet et ses tâches).
 *    - AUGMENTED GENERATION (Génération Augmentée) : On injecte ce contexte au LLM pour qu'il
 *      génère des tâches hyper-pertinentes et SANS DOUBLONS.
 *
 * 2. LLAMAINDEX.TS :
 *    C'est le framework orchestrateur spécialisé dans la connexion entre vos données privées et les LLM.
 *    Il fournit des abstractions clés :
 *    - `Document` : Conteneur structuré de texte et métadonnées.
 *    - `SummaryIndex` : Indexation contextuelle résumant les documents.
 *    - `Settings` : Configuration globale unifiée (LLM Gemini + Modèle d'Embeddings).
 *    - `asQueryEngine()` : Transforme l'index en moteur d'interrogation intelligent.
 * =========================================================================================
 */

import { NextResponse } from 'next/server';
import { Document, SummaryIndex, Settings } from 'llamaindex';
import {
  Gemini,
  GEMINI_MODEL,
  GeminiEmbedding,
  GEMINI_EMBEDDING_MODEL,
} from '@llamaindex/google';

/**
 * GESTIONNAIRE DE REQUÊTE HTTP POST (/api/ai/generate-tasks)
 */
export async function POST(request) {
  try {
    // -------------------------------------------------------------------------------------
    // 1. EXTRACTION ET VALIDATION DES DONNÉES ENTRANTES DU CLIENT
    // -------------------------------------------------------------------------------------
    const authHeader = request.headers.get('authorization');
    const body = await request.json();
    const { projectId, prompt } = body;

    if (!projectId || !prompt || !prompt.trim()) {
      return NextResponse.json(
        { message: 'Le projet et la description (prompt) sont requis.' },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------------------------------
    // 2. SÉCURISATION ET CONFIGURATION DE LA CLÉ D'API GEMINI (CÔTÉ SERVEUR)
    // -------------------------------------------------------------------------------------
    // La clé API reste strictement confidentielle sur le serveur et n'est jamais exposée au navigateur.
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('votre_cle')) {
      return NextResponse.json(
        {
          message:
            'Clé API Gemini non configurée. Veuillez définir GEMINI_API_KEY dans frontend/.env.local',
          requiresKey: true,
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------------------------------
    // 3. INITIALISATION DU FRAMEWORK LLAMAINDEX.TS (MODÈLE LLM & EMBEDDINGS)
    // -------------------------------------------------------------------------------------
    // Sélection du modèle LLM Gemini officiel (Gemini 2.5 Flash / Gemini 1.5 Flash)
    const modelEnum =
      GEMINI_MODEL.GEMINI_2_5_FLASH_LATEST ||
      GEMINI_MODEL.GEMINI_PRO_1_5_FLASH_LATEST ||
      GEMINI_MODEL.GEMINI_PRO;

    // Instanciation de l'agent de génération de texte (LLM Gemini)
    const geminiLlm = new Gemini({
      apiKey: apiKey,
      model: modelEnum,
    });

    // Instanciation du modèle d'Embeddings (Vectorisation sémantique du texte)
    const geminiEmbed = new GeminiEmbedding({
      apiKey: apiKey,
      model: GEMINI_EMBEDDING_MODEL.TEXT_EMBEDDING_004 || 'text-embedding-004',
    });

    // Configuration des métadonnées de la fenêtre de contexte
    geminiEmbed.metadata = {
      model: GEMINI_EMBEDDING_MODEL.TEXT_EMBEDDING_004 || 'text-embedding-004',
      contextWindow: 2048,
    };

    // Injection globale des configurations dans le Singleton Settings de LlamaIndex.TS
    Settings.llm = geminiLlm;
    Settings.embedModel = geminiEmbed;

    // -------------------------------------------------------------------------------------
    // 4. PHASE RETRIEVAL : RÉCUPÉRATION DU CONTEXTE EXPLICITE (PROJET + TÂCHES EXISTANTES)
    // -------------------------------------------------------------------------------------
    let existingTasks = [];
    let projectDetails = null;

    try {
      // Récupération des tâches existantes pour alimenter la mémoire anti-doublon
      const tasksRes = await fetch(
        `http://localhost:3000/api/projects/${projectId}/tasks`,
        {
          headers: { Authorization: authHeader || '' },
        }
      );
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        existingTasks = tasksData.data?.tasks || [];
      }

      // Récupération des métadonnées du projet (Nom et Description)
      const projRes = await fetch(
        `http://localhost:3000/api/projects/${projectId}`,
        {
          headers: { Authorization: authHeader || '' },
        }
      );
      if (projRes.ok) {
        const projData = await projRes.json();
        projectDetails = projData.data?.project || null;
      }
    } catch (err) {
      console.warn(
        'Impossible de charger le contexte existant du projet:',
        err.message
      );
    }

    // -------------------------------------------------------------------------------------
    // 5. PHASE INDEXATION : CRÉATION DU DOCUMENT CONTEXTUEL LLAMAINDEX.TS
    // -------------------------------------------------------------------------------------
    const projectInfoText = `Nom du Projet: ${projectDetails?.name || 'Projet'}
Description: ${projectDetails?.description || 'Aucune description'}`;

    const tasksInfoText =
      existingTasks.length > 0
        ? existingTasks
            .map(
              (t, idx) =>
                `Tâche ${idx + 1}: ${t.title} | Description: ${t.description || 'Sans description'}`
            )
            .join('\n')
        : 'Aucune tâche existante.';

    // Création d'un objet Document LlamaIndex contenant l'intégralité du contexte métier
    const contextDocument = new Document({
      text: `INFORMATIONS DU PROJET:\n${projectInfoText}\n\nTÂCHES DÉJÀ EXISTANTES DANS CE PROJET (MEMOIRE ANTI-DOUBLON):\n${tasksInfoText}`,
      metadata: { projectId, tasksCount: existingTasks.length },
    });

    // -------------------------------------------------------------------------------------
    // 6. PHASE AUGMENTED GENERATION : INTERROGATION DU QUERY ENGINE RAG
    // -------------------------------------------------------------------------------------
    // Construit l'index de synthèse SummaryIndex à partir du Document LlamaIndex
    const index = await SummaryIndex.fromDocuments([contextDocument]);

    // Transforme l'index en moteur de requête connecté au LLM Gemini
    const queryEngine = index.asQueryEngine({
      llm: geminiLlm,
    });

    // Prompt fortement ancré (Prompt Engineering) imposant la structure et le format JSON
    const ragQuery = `Vous êtes un assistant expert en gestion de projet agile.
Sur la base du contexte du projet et des tâches existantes fournies dans le document :
Demande de l'utilisateur : "${prompt.trim()}"

Consignes strictes :
1. Analysez la demande de l'utilisateur : si un nombre précis de tâches est demandé (ex: "une tâche", "1 tâche", "3 tâches"), générez EXACTEMENT le nombre de tâches demandé. Si aucune quantité n'est spécifiée, générez entre 1 et 3 tâches pertinentes.
2. Évitez STRICTEMENT tout doublon ou redondance avec les tâches déjà existantes.
3. Votre réponse DOIT ÊTRE STRICTEMENT un tableau JSON valide respectant le schéma ci-dessous, sans aucun texte ou balise markdown avant ou après :
[
  {
    "title": "Titre explicite de la tâche",
    "description": "Description détaillée du travail à effectuer"
  }
]`;

    // -------------------------------------------------------------------------------------
    // 7. EXÉCUTION DU QUERY ENGINE ET PARSING DU JSON STRUCTURÉ
    // -------------------------------------------------------------------------------------
    const response = await queryEngine.query({ query: ragQuery });
    const textOutput = response.toString();

    let generatedTasks = [];
    try {
      // Nettoyage des éventuelles balises markdown ```json et ``` injectées par le LLM
      const cleanJson = textOutput
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      generatedTasks = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error(
        'Erreur de parsing du JSON renvoyé par LlamaIndex.TS:',
        parseErr,
        textOutput
      );
      return NextResponse.json(
        {
          message:
            "Le format de réponse de l'IA via LlamaIndex.TS n'a pas pu être analysé.",
          rawText: textOutput,
        },
        { status: 500 }
      );
    }

    // -------------------------------------------------------------------------------------
    // 8. RENVOI DE LA RÉPONSE AU CLIENT
    // -------------------------------------------------------------------------------------
    return NextResponse.json({
      success: true,
      tasks: generatedTasks,
      ragContextCount: existingTasks.length,
      framework: 'LlamaIndex.TS',
    });
  } catch (err) {
    console.error('Erreur interne lors du traitement RAG LlamaIndex.TS:', err);
    return NextResponse.json(
      {
        message:
          err.message ||
          "Une erreur interne est survenue lors de l'exécution de LlamaIndex.TS.",
      },
      { status: 500 }
    );
  }
}
