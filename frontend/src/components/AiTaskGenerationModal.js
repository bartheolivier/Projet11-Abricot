"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, Plus, Trash2, Edit3, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function AiTaskGenerationModal({ isOpen, project, onClose, onTasksAdded }) {
  const [prompt, setPrompt] = useState("");
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const queryClient = useQueryClient();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
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
          "Authorization": token ? `Bearer ${token}` : "",
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
        setGeneratedTasks((prev) => [...prev, ...json.tasks]);
        toast.success(`${json.tasks.length} tâche(s) générée(s) par l'IA !`);
        setPrompt("");
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

  const handleDeleteCard = (index) => {
    setGeneratedTasks((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const handleStartEdit = (index, task) => {
    setEditingIndex(index);
    setEditTitle(task.title);
    setEditDesc(task.description);
  };

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

  const handleConfirmAddTasks = async () => {
    if (generatedTasks.length === 0) return;

    setIsSubmitting(true);
    try {
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 7);
      const formattedDueDate = defaultDueDate.toISOString().split("T")[0];

      let addedCount = 0;

      for (const t of generatedTasks) {
        try {
          await api.createTask({
            projectId: project.id,
            title: t.title,
            description: t.description || "",
            dueDate: formattedDueDate,
            priority: "MEDIUM",
          });
          addedCount++;
        } catch (e) {
          console.error("Erreur création tâche IA", e);
        }
      }

      toast.success(`${addedCount} tâche(s) ajoutée(s) au projet avec succès !`);
      
      // Invalidation automatique des requêtes React Query pour synchroniser instantanément l'UI
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });

      setGeneratedTasks([]);
      setPrompt("");
      if (onTasksAdded) onTasksAdded();
      onClose();
    } catch (err) {
      toast.error("Erreur lors de l'intégration des tâches.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content ai-modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title-ai"
      >
        <button
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Fermer la modale d'assistance IA"
          title="Fermer"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <div className="ai-modal-header">
          <div className="ai-modal-icon-badge">
            <Sparkles size={20} className="ai-badge-sparkle" aria-hidden="true" />
          </div>
          <div>
            <h2 id="modal-title-ai" className="modal-title">
              Générateur de Tâches IA (RAG & Gemini)
            </h2>
            <p className="modal-subtitle">
              Saisissez vos besoins et l'IA créera des tâches précises sans doublons pour <strong>{project.name}</strong>.
            </p>
          </div>
        </div>

        <div className="ai-modal-body">
          {generatedTasks.length > 0 ? (
            <div className="ai-generated-tasks-section">
              <div className="section-title-row">
                <h3>✨ Tâches générées ({generatedTasks.length})</h3>
                <span className="section-help-text">
                  Vous pouvez modifier ou supprimer les tâches avant de les ajouter au projet.
                </span>
              </div>

              <div className="ai-tasks-cards-grid">
                {generatedTasks.map((t, idx) => {
                  const isEditing = editingIndex === idx;

                  return (
                    <div key={idx} className="ai-task-card">
                      {isEditing ? (
                        <div className="ai-task-edit-form">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="form-input edit-title-input"
                            placeholder="Titre de la tâche"
                            aria-label="Titre de la tâche générée"
                            autoFocus
                          />
                          <textarea
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            className="form-input modal-textarea edit-desc-input"
                            placeholder="Description de la tâche"
                            aria-label="Description de la tâche générée"
                            rows={3}
                          />
                          <div className="ai-card-edit-actions">
                            <button
                              type="button"
                              className="btn-card-save"
                              onClick={() => handleSaveEdit(idx)}
                            >
                              <Check size={14} aria-hidden="true" /> Valider
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="ai-task-card-header">
                            <h4 className="ai-task-card-title">{t.title}</h4>
                            <div className="ai-task-card-actions">
                              <button
                                type="button"
                                className="btn-icon-action edit"
                                onClick={() => handleStartEdit(idx, t)}
                                title="Modifier cette tâche"
                                aria-label={`Modifier la tâche ${t.title}`}
                              >
                                <Edit3 size={15} aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                className="btn-icon-action delete"
                                onClick={() => handleDeleteCard(idx)}
                                title="Supprimer cette tâche"
                                aria-label={`Supprimer la tâche ${t.title}`}
                              >
                                <Trash2 size={15} aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                          <p className="ai-task-card-desc">
                            {t.description || "Aucune description fournie."}
                          </p>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="ai-empty-prompt-state">
              <Sparkles size={40} className="empty-sparkle-icon" aria-hidden="true" />
              <p>Décrivez ce que vous souhaitez accomplir ci-dessous pour générer des tâches sur mesure.</p>
            </div>
          )}
        </div>

        <form onSubmit={handleGenerate} className="ai-prompt-form-footer">
          <div className="ai-prompt-input-group">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Ajouter 2 tâches pour l'intégration de la facturation..."
              className="ai-prompt-input"
              disabled={isLoading || isSubmitting}
              aria-label="Saisir la description des tâches à générer"
            />
            <button
              type="submit"
              className="btn-ai-generate"
              disabled={!prompt.trim() || isLoading || isSubmitting}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Génération...
                </>
              ) : (
                <>
                  <Sparkles size={16} aria-hidden="true" /> Générer
                </>
              )}
            </button>
          </div>

          {generatedTasks.length > 0 && (
            <div className="ai-confirm-actions-row">
              <button
                type="button"
                className="btn-confirm-add-tasks"
                onClick={handleConfirmAddTasks}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Ajout au projet...
                  </>
                ) : (
                  <>
                    <Plus size={16} aria-hidden="true" /> Ajouter les {generatedTasks.length} tâche(s) au projet
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
