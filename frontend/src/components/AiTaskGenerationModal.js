'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Plus, Trash2, Edit3, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function AiTaskGenerationModal({
  isOpen,
  project,
  onClose,
  onTasksAdded,
}) {
  const [prompt, setPrompt] = useState('');
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const queryClient = useQueryClient();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen || !project) return null;

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) {
      toast.error('Veuillez saisir une description de la tâche à générer.');
      return;
    }

    setIsLoading(true);
    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('token='))
        ?.split('=')[1];

      const response = await fetch('/api/ai/generate-tasks', {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          prompt: prompt.trim(),
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || 'Erreur lors de la génération IA.');
      }

      if (json.tasks && Array.isArray(json.tasks)) {
        setGeneratedTasks((prev) => [...prev, ...json.tasks]);
        toast.success(`${json.tasks.length} tâche(s) générée(s) par l'IA !`);
        setPrompt('');
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
      toast.error('Le titre ne peut pas être vide.');
      return;
    }
    setGeneratedTasks((prev) =>
      prev.map((t, i) =>
        i === index
          ? { ...t, title: editTitle.trim(), description: editDesc.trim() }
          : t
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
      const formattedDueDate = defaultDueDate.toISOString().split('T')[0];

      let addedCount = 0;

      for (const t of generatedTasks) {
        try {
          await api.createTask({
            projectId: project.id,
            title: t.title,
            description: t.description || '',
            dueDate: formattedDueDate,
            priority: 'MEDIUM',
          });
          addedCount++;
        } catch (e) {
          console.error('Erreur création tâche IA', e);
        }
      }

      toast.success(
        `${addedCount} tâche(s) ajoutée(s) au projet avec succès !`
      );

      // Invalidation automatique des requêtes React Query pour synchroniser instantanément l'UI
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });

      setGeneratedTasks([]);
      setPrompt('');
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
        className="modal-content ai-modal-container"
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

        {/* En-tête conforme à la maquette : icône étincelle orange + titre */}
        <div className="ai-modal-header">
          <Sparkles size={24} className="ai-sparkle-icon" aria-hidden="true" />
          <h2 id="modal-title-ai" className="ai-title">
            {generatedTasks.length > 0 ? 'Vos tâches...' : 'Créer une tâche'}
          </h2>
        </div>

        {/* Corps principal : chargement ou liste de cartes générées */}
        <div className="ai-modal-body">
          {isLoading ? (
            <div className="ai-loading-state">
              <Loader2
                size={32}
                className="animate-spin ai-spinner"
                aria-hidden="true"
              />
              <p className="ai-loading-text">
                Génération des tâches par l'IA en cours...
              </p>
            </div>
          ) : generatedTasks.length > 0 ? (
            <div className="ai-tasks-cards-list">
              {generatedTasks.map((t, idx) => {
                const isEditing = editingIndex === idx;

                return (
                  <div key={idx} className="ai-generated-task-card">
                    {isEditing ? (
                      <div className="ai-card-edit-mode">
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
                        <button
                          type="button"
                          className="btn-save-inline"
                          onClick={() => handleSaveEdit(idx)}
                        >
                          <Check size={14} aria-hidden="true" /> Valider
                        </button>
                      </div>
                    ) : (
                      <>
                        <h3 className="ai-card-title">{t.title}</h3>
                        <p className="ai-card-desc">
                          {t.description || 'Aucune description fournie.'}
                        </p>
                        <div className="ai-card-actions">
                          <button
                            type="button"
                            className="ai-action-btn delete"
                            onClick={() => handleDeleteCard(idx)}
                            aria-label={`Supprimer la tâche ${t.title}`}
                          >
                            <Trash2 size={14} aria-hidden="true" /> Supprimer
                          </button>
                          <span className="ai-actions-separator">|</span>
                          <button
                            type="button"
                            className="ai-action-btn edit"
                            onClick={() => handleStartEdit(idx, t)}
                            aria-label={`Modifier la tâche ${t.title}`}
                          >
                            <Edit3 size={14} aria-hidden="true" /> Modifier
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

              <div className="ai-submit-tasks-wrapper">
                <button
                  type="button"
                  className="ai-btn-add-all"
                  onClick={handleConfirmAddTasks}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                        aria-hidden="true"
                      />{' '}
                      Ajout au projet...
                    </>
                  ) : (
                    <>
                      <Plus size={18} aria-hidden="true" /> Ajouter les tâches
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Barre de saisie en bas (Pill shape) conforme à la maquette */}
        <form onSubmit={handleGenerate} className="ai-prompt-bar-container">
          <div className="ai-prompt-bar">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Décrivez les tâches que vous souhaitez ajouter..."
              className="ai-prompt-input"
              disabled={isLoading || isSubmitting}
              aria-label="Décrivez les tâches que vous souhaitez ajouter"
            />
            <button
              type="submit"
              className={`ai-prompt-send-btn ${prompt.trim() && !isLoading && !isSubmitting ? 'active' : ''}`}
              disabled={!prompt.trim() || isLoading || isSubmitting}
              aria-label="Envoyer"
            >
              {isLoading ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Plus size={20} aria-hidden="true" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
