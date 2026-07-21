"use client";

import React, { useState } from "react";
import { X, Sparkles, Plus, Trash2, Edit3, Check, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function AiTaskGenerationModal({ isOpen, project, onClose, onTasksAdded }) {
  const [prompt, setPrompt] = useState("");
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  // Édition d'une tâche individuelle
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // Verrouiller le défilement du fond quand la modale est ouverte
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !project) return null;

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) {
      toast.error("Veuillez saisir une description de la tâche à générer.");
      return;
    }

    setIsLoading(true);
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      const response = await fetch("/api/ai/generate-tasks", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: project.id,
          prompt: prompt.trim(),
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || "Erreur lors de la génération IA.");
      }

      if (json.tasks && Array.isArray(json.tasks)) {
        // Ajouter les nouvelles tâches générées à la liste existante
        setGeneratedTasks((prev) => [...prev, ...json.tasks]);
        toast.success(`${json.tasks.length} tâche(s) générée(s) par l'IA !`);
        setPrompt(""); // Réinitialiser le prompt
      } else {
        toast.error("Aucune tâche n'a été renvoyée par l'IA.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Suppression d'une tâche de la prévisualisation
  const handleDeleteCard = (index) => {
    setGeneratedTasks((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  // Activer le mode édition d'une tâche
  const handleStartEdit = (index, task) => {
    setEditingIndex(index);
    setEditTitle(task.title);
    setEditDesc(task.description);
  };

  // Sauvegarder les modifications d'une tâche
  const handleSaveEdit = (index) => {
    if (!editTitle.trim()) {
      toast.error("Le titre ne peut pas être vide.");
      return;
    }
    setGeneratedTasks((prev) =>
      prev.map((t, i) =>
        i === index ? { ...t, title: editTitle.trim(), description: editDesc.trim() } : t
      )
    );
    setEditingIndex(null);
  };

  // Validation finale : Ajouter toutes les tâches validées au projet
  const handleConfirmAddTasks = async () => {
    if (generatedTasks.length === 0) return;

    setIsSubmitting(true);
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (!token) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
        return;
      }

      // Date d'échéance par défaut : Dans 7 jours
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 7);
      const formattedDueDate = defaultDueDate.toISOString().split("T")[0];

      let addedCount = 0;

      // Créer chaque tâche dans le backend
      for (const t of generatedTasks) {
        const res = await fetch(`/api/projects/${project.id}/tasks`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: t.title,
            description: t.description || "",
            dueDate: formattedDueDate,
            priority: "MEDIUM",
          }),
        });

        if (res.ok) {
          addedCount++;
        }
      }

      toast.success(`${addedCount} tâche(s) ajoutée(s) au projet avec succès !`);
      
      // Réinitialiser la modale
      setGeneratedTasks([]);
      setPrompt("");
      if (onTasksAdded) onTasksAdded();
      onClose();
    } catch (err) {
      toast.error(err.message || "Erreur lors de l'ajout des tâches au projet.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasTasks = generatedTasks.length > 0;

  return (
    <div className="modal-overlay">
      <div className="modal-content ai-modal-container">
        {/* Bouton fermer */}
        <button className="modal-close-btn" onClick={onClose} title="Fermer">
          <X size={20} />
        </button>

        {/* Titre dynamique avec icône étincelle */}
        <div className="ai-modal-header">
          <Sparkles className="ai-sparkle-icon" size={24} />
          <h2 className="modal-title ai-title">
            {hasTasks ? "Vos tâches..." : "Créer une tâche"}
          </h2>
        </div>

        {/* Corps de la modale */}
        <div className="ai-modal-body">
          {isLoading ? (
            <div className="ai-loading-state">
              <Loader2 size={32} className="animate-spin ai-spinner" />
              <p className="ai-loading-text">Analyse RAG du projet et génération des tâches par l'IA...</p>
            </div>
          ) : hasTasks ? (
            <div className="ai-tasks-preview-section">
              <div className="ai-tasks-cards-list">
                {generatedTasks.map((t, index) => (
                  <div key={index} className="ai-generated-task-card">
                    {editingIndex === index ? (
                      /* Mode Édition */
                      <div className="ai-card-edit-mode">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="form-input edit-title-input"
                          placeholder="Titre de la tâche"
                        />
                        <textarea
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="form-input modal-textarea edit-desc-input"
                          placeholder="Description de la tâche"
                          rows={2}
                        />
                        <button
                          type="button"
                          className="btn-save-inline"
                          onClick={() => handleSaveEdit(index)}
                        >
                          <Check size={14} /> Valider
                        </button>
                      </div>
                    ) : (
                      /* Mode Lecture */
                      <>
                        <h4 className="ai-card-title">{t.title}</h4>
                        <p className="ai-card-desc">{t.description || "Aucune description"}</p>
                        
                        <div className="ai-card-actions">
                          <button
                            type="button"
                            className="ai-action-btn delete"
                            onClick={() => handleDeleteCard(index)}
                          >
                            <Trash2 size={14} /> Supprimer
                          </button>
                          <span className="ai-actions-separator">|</span>
                          <button
                            type="button"
                            className="ai-action-btn edit"
                            onClick={() => handleStartEdit(index, t)}
                          >
                            <Edit3 size={14} /> Modifier
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Bouton principal Ajouter les tâches */}
              <div className="ai-submit-tasks-wrapper">
                <button
                  type="button"
                  onClick={handleConfirmAddTasks}
                  className="ai-btn-add-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Ajout en cours...
                    </>
                  ) : (
                    "+ Ajouter les tâches"
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="ai-empty-state">
              <p className="ai-empty-text">
                Utilisez l'IA pour générer automatiquement des tâches adaptées à votre projet.
              </p>
            </div>
          )}
        </div>

        {/* Barre de Prompt en bas (Conforme Figma) */}
        <form onSubmit={handleGenerate} className="ai-prompt-bar-container">
          <div className="ai-prompt-bar">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Décrivez les tâches que vous souhaitez ajouter..."
              className="ai-prompt-input"
              disabled={isLoading}
            />
            <button
              type="submit"
              className={`ai-prompt-send-btn ${prompt.trim() ? "active" : ""}`}
              disabled={!prompt.trim() || isLoading}
              title="Générer avec l'IA"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Plus size={18} />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
