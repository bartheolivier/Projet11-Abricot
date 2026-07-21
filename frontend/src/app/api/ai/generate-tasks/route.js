import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    const body = await request.json();
    const { projectId, prompt } = body;

    if (!projectId || !prompt || !prompt.trim()) {
      return NextResponse.json(
        { message: "Le projet et la description (prompt) sont requis." },
        { status: 400 }
      );
    }

    // 1. Récupération des tâches existantes pour constituer le contexte RAG
    let existingTasks = [];
    let projectDetails = null;

    try {
      // Récupération des tâches existantes depuis l'API backend
      const tasksRes = await fetch(`http://localhost:3000/api/projects/${projectId}/tasks`, {
        headers: { Authorization: authHeader || "" },
      });
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        existingTasks = tasksData.data?.tasks || [];
      }

      // Récupération du détail du projet
      const projRes = await fetch(`http://localhost:3000/api/projects/${projectId}`, {
        headers: { Authorization: authHeader || "" },
      });
      if (projRes.ok) {
        const projData = await projRes.json();
        projectDetails = projData.data?.project || null;
      }
    } catch (err) {
      console.warn("Impossible de charger le contexte RAG depuis le backend:", err.message);
    }

    // 2. Construction du Prompt Augmenté (RAG)
    const existingTasksContext = existingTasks.length > 0
      ? existingTasks.map((t) => `- Titre: "${t.title}" | Description: "${t.description || ""}"`).join("\n")
      : "Aucune tâche existante.";

    const systemPrompt = `Vous êtes un assistant expert en gestion de projet et création de tâches.

Contexte du Projet :
- Nom : "${projectDetails?.name || "Projet"}"
- Description : "${projectDetails?.description || ""}"

Tâches déjà existantes dans le projet (Ne PAS créer de doublons) :
${existingTasksContext}

Demande de l'utilisateur :
"${prompt.trim()}"

Instructions :
1. Générez entre 2 et 5 tâches précises et concrètes pour répondre à la demande de l'utilisateur.
2. Assurez-vous que les nouvelles tâches soient complémentaires et ne dupliquent pas les tâches existantes.
3. Répondez STRICTEMENT sous forme d'un tableau JSON d'objets, sans aucun texte ou balise markdown avant ou après :
[
  {
    "title": "Titre court et clair de la tâche",
    "description": "Description explicite de ce qu'il faut accomplir"
  }
]`;

    // 3. Appel sécurisé à l'API Gemini côté serveur
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.includes("votre_cle")) {
      return NextResponse.json(
        { 
          message: "Clé API Gemini non configurée. Veuillez définir GEMINI_API_KEY dans frontend/.env.local",
          requiresKey: true 
        },
        { status: 400 }
      );
    }

    // Essayer les modèles Gemini 2.5 Flash, 2.0 Flash puis 1.5 Flash en fallback
    const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
    let geminiResponse = null;
    let geminiData = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        const res = await fetch(geminiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: systemPrompt }],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.7,
            },
          }),
        });

        const data = await res.json();

        if (res.ok) {
          geminiResponse = res;
          geminiData = data;
          break; // Modèle fonctionnel trouvé !
        } else {
          lastError = data;
          console.warn(`Le modèle ${modelName} a échoué:`, data.error?.message);
        }
      } catch (e) {
        console.warn(`Erreur lors de l'appel au modèle ${modelName}:`, e.message);
      }
    }

    if (!geminiResponse || !geminiData) {
      console.error("Tous les modèles Gemini ont échoué:", lastError);
      const errMsg = lastError?.error?.message || "Erreur de communication avec l'API Gemini.";
      
      return NextResponse.json(
        { 
          message: `Erreur API Gemini: ${errMsg}. Vérifiez votre clé sur https://aistudio.google.com/app/apikey`,
          errorDetails: lastError?.error
        },
        { status: 400 }
      );
    }

    // 4. Extraction et nettoyage du résultat JSON généré par Gemini
    const textOutput = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    let generatedTasks = [];

    try {
      // Nettoyer d'éventuelles balises ```json si présent
      const cleanJson = textOutput.replace(/```json/g, "").replace(/```/g, "").trim();
      generatedTasks = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error("Erreur de parsing du JSON Gemini:", parseErr, textOutput);
      return NextResponse.json(
        { message: "Le format de réponse de l'IA n'a pas pu être analysé.", rawText: textOutput },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tasks: generatedTasks,
      ragContextCount: existingTasks.length,
    });
  } catch (err) {
    console.error("Erreur interne lors de la génération IA:", err);
    return NextResponse.json(
      { message: err.message || "Une erreur interne est survenue." },
      { status: 500 }
    );
  }
}
