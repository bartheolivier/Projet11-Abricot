/**
 * =========================================================================================
 * SCRIPT DE RÉFÉRENCE (APPROCHE NAÏVE PAR FETCH DIRECT VERS GEMINI REST API)
 * =========================================================================================
 * Fichier : src/app/api/ai/generate-tasks-simple-fetch-example.js
 * Rôle : Ce fichier est un SCRIPT DE DÉMONSTRATION ÉDUCATIF & COMPARATIF.
 *        Il illustre la manière dont la fonctionnalité aurait été codée en effectuant
 *        un appel `fetch()` HTTP direct vers l'API REST v1beta de Google Gemini,
 *        SANS utiliser le framework d'orchestration RAG LlamaIndex.TS.
 *
 * AVANTAGES DE CETTE APPROCHE :
 * - Aucune dépendance externe à installer (pas de package `llamaindex`).
 * - Code simple et linéaire pour un petit prototype.
 *
 * INCONVÉNIENTS & LIMITES EN PRODUCTION (POURQUOI L'APPROCHE LLAMAINDEX EST SUPÉRIEURE) :
 * 1. Couplage Fort (Vendor Lock-in) : Dépendance directe aux URL et structures JSON spécifiques de Google.
 * 2. Pas de recherche sémantique : Pas de découpage (*chunking*), pas de vectorisation (*embeddings*).
 * 3. Risque de saturation : Coller manuellement 200 tâches dans une chaîne brute fait exploser la fenêtre de contexte.
 * =========================================================================================
 */

import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // -------------------------------------------------------------------------------------
    // 1. EXTRACTION DES DONNÉES ENTRANTES ET VÉRIFICATION DE LA CLÉ SERVEUR
    // -------------------------------------------------------------------------------------
    const authHeader = request.headers.get('authorization');
    const { projectId, prompt } = await request.json();

    if (!projectId || !prompt || !prompt.trim()) {
      return NextResponse.json(
        { message: 'Le projet et la description (prompt) sont requis.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { message: 'Clé API Gemini non configurée.' },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------------------------------
    // 2. RÉCUPÉRATION MANUELLE DU CONTEXTE (RETRIEVAL ARTISANAL)
    // -------------------------------------------------------------------------------------
    let tasksInfoText = 'Aucune tâche existante.';

    try {
      const tasksRes = await fetch(
        `http://localhost:3000/api/projects/${projectId}/tasks`,
        { headers: { Authorization: authHeader || '' } }
      );
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        const existingTasks = tasksData.data?.tasks || [];
        if (existingTasks.length > 0) {
          tasksInfoText = existingTasks
            .map(
              (t, idx) =>
                `Tâche ${idx + 1}: ${t.title} | ${t.description || 'Sans description'}`
            )
            .join('\n');
        }
      }
    } catch (err) {
      console.warn('Erreur de chargement des tâches existantes:', err.message);
    }

    // -------------------------------------------------------------------------------------
    // 3. CONCATÉNATION MANUELLE ET BRUTE DU PROMPT (SANS VECTORISATION LLAMAINDEX)
    // -------------------------------------------------------------------------------------
    const systemPrompt = `Vous êtes un assistant expert en gestion de projet agile.

TÂCHES DÉJÀ EXISTANTES DANS CE PROJET (À NE PAS DUPLIQUER):
${tasksInfoText}

Demande de l'utilisateur: "${prompt.trim()}"

Consignes :
1. Générez 1 à 3 tâches pertinentes évitant strictement tout doublon avec les tâches existantes.
2. Répondez EXCLUSIVEMENT avec un tableau JSON valide au format exact :
[
  { "title": "Titre explicite de la tâche", "description": "Description détaillée" }
]`;

    // -------------------------------------------------------------------------------------
    // 4. APPEL HTTP FETCH DIRECT VERS L'API REST PROPRIÉTAIRE GOOGLE GEMINI
    // -------------------------------------------------------------------------------------
    // Point d'entrée v1beta officiel de Google Gemini (dépendance directe)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: systemPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json', // Option Gemini 1.5 pour forcer la réponse JSON
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      throw new Error(
        `Erreur API Gemini (${geminiResponse.status}): ${errorText}`
      );
    }

    const geminiData = await geminiResponse.json();

    // -------------------------------------------------------------------------------------
    // 5. EXTRACTION MANUELLE DU TEXTE ET PARSING JSON
    // -------------------------------------------------------------------------------------
    // Extraction dans l'arborescence propriétaire Gemini : candidates[0].content.parts[0].text
    const rawText =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

    const cleanJson = rawText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    const generatedTasks = JSON.parse(cleanJson);

    return NextResponse.json({
      success: true,
      tasks: generatedTasks,
      method: 'Direct REST fetch (sans LlamaIndex)',
    });
  } catch (err) {
    return NextResponse.json(
      { message: err.message || 'Erreur interne lors de la génération.' },
      { status: 500 }
    );
  }
}
