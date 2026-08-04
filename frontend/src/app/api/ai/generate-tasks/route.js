/**
 * =========================================================================================
 * ROUTE API BACKEND RAG (RETRIEVAL-AUGMENTED GENERATION) AVEC LLAMAINDEX.TS & GEMINI
 * =========================================================================================
 * Fichier : src/app/api/ai/generate-tasks/route.js
 * Rôle : Route API serveur (Next.js Route Handler) qui orchestre l'IA générative :
 *        1. Masque et protège la clé d'API Google Gemini côté serveur.
 *        2. Charge les tâches existantes du projet (Phase 1 : Retrieval).
 *        3. Crée un document d'indexation vectorielle via LlamaIndex.TS (Document & SummaryIndex).
 *        4. Transmet le prompt ancré au QueryEngine LLM Gemini (Phase 2 : Augmented Generation).
 *        5. Nettoie et valide la réponse au format JSON structuré.
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

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const body = await request.json();
    const { projectId, prompt } = body;

    // Validation des données entrantes du client
    if (!projectId || !prompt || !prompt.trim()) {
      return NextResponse.json(
        { message: 'Le projet et la description (prompt) sont requis.' },
        { status: 400 }
      );
    }

    // Vérification de la configuration de la clé API Gemini
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

    // Sélection dynamique du modèle LLM Gemini officiel dans LlamaIndex.TS
    const modelEnum =
      GEMINI_MODEL.GEMINI_2_5_FLASH_LATEST ||
      GEMINI_MODEL.GEMINI_PRO_1_5_FLASH_LATEST ||
      GEMINI_MODEL.GEMINI_PRO;

    // Configuration de l'agent LLM Gemini et du modèle de Vector Embeddings
    const geminiLlm = new Gemini({
      apiKey: apiKey,
      model: modelEnum,
    });

    const geminiEmbed = new GeminiEmbedding({
      apiKey: apiKey,
      model: GEMINI_EMBEDDING_MODEL.TEXT_EMBEDDING_004 || 'text-embedding-004',
    });

    // Patch d'optimisation LlamaIndex.TS pour définir les métadonnées de contexte Embedding
    geminiEmbed.metadata = {
      model: GEMINI_EMBEDDING_MODEL.TEXT_EMBEDDING_004 || 'text-embedding-004',
      contextWindow: 2048,
    };

    // Attribution globale dans les paramètres LlamaIndex.TS
    Settings.llm = geminiLlm;
    Settings.embedModel = geminiEmbed;

    // -------------------------------------------------------------------------------------
    // ÉTAPE 1 : RETRIEVAL (RECUPÉRATION DU CONTEXTE DU PROJET ET DES TÂCHES EXISTANTES)
    // -------------------------------------------------------------------------------------
    let existingTasks = [];
    let projectDetails = null;

    try {
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
      console.warn('Impossible de charger les données du projet:', err.message);
    }

    // -------------------------------------------------------------------------------------
    // ÉTAPE 2 : INDEXATION ET DOCUMENTATION CONTEXTUELLE LLAMAINDEX.TS
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

    // Instanciation de la classe Document officielle LlamaIndex.TS
    const contextDocument = new Document({
      text: `INFORMATIONS DU PROJET:\n${projectInfoText}\n\nTÂCHES DÉJÀ EXISTANTES DANS CE PROJET (NE PAS DUPLIQUER):\n${tasksInfoText}`,
      metadata: { projectId, tasksCount: existingTasks.length },
    });

    // -------------------------------------------------------------------------------------
    // ÉTAPE 3 : CRÉATION DE L'INDEX SUMMARYINDEX ET DU QUERY ENGINE RAG
    // -------------------------------------------------------------------------------------
    const index = await SummaryIndex.fromDocuments([contextDocument]);
    const queryEngine = index.asQueryEngine({
      llm: geminiLlm,
    });

    // Prompt fortement ancré transmis au QueryEngine
    const ragQuery = `Vous êtes un assistant expert en gestion de projet.
Sur la base du contexte du projet et des tâches existantes fournies dans le document :
Demande de l'utilisateur : "${prompt.trim()}"

Consignes :
1. Analysez la demande de l'utilisateur : si un nombre précis de tâches est demandé (ex: "une tâche", "1 tâche", "3 tâches"), générez EXACTEMENT le nombre de tâches demandé. Si aucune quantité précise n'est spécifiée dans la demande, générez entre 1 et 3 tâches pertinentes.
2. Évitez TOUT doublon avec les tâches existantes.
3. Votre réponse DOIT ÊTRE STRICTEMENT un tableau JSON valide au format suivant, sans aucun texte ou balise markdown avant ou après :
[
  {
    "title": "Titre explicite de la tâche",
    "description": "Description détaillée du travail à effectuer"
  }
]`;

    // -------------------------------------------------------------------------------------
    // ÉTAPE 4 : EXÉCUTION DE LA REQUÊTE ET PARSING JSON
    // -------------------------------------------------------------------------------------
    const response = await queryEngine.query({ query: ragQuery });
    const textOutput = response.toString();

    let generatedTasks = [];
    try {
      const cleanJson = textOutput
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      generatedTasks = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error(
        'Erreur de parsing du JSON LlamaIndex.TS:',
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

    return NextResponse.json({
      success: true,
      tasks: generatedTasks,
      ragContextCount: existingTasks.length,
      framework: 'LlamaIndex.TS',
    });
  } catch (err) {
    console.error('Erreur interne lors du RAG LlamaIndex.TS:', err);
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
