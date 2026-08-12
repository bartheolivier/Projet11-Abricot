'use client';

/**
 * =========================================================================================
 * MODALE DE GÉNÉRATION DE TÂCHES PAR IA (RAG & GEMINI LLM)
 * =========================================================================================
 * Fichier : src/components/AiTaskGenerationModal.js
 * Rôle : Composant d'assistance intelligente basé sur la RAG (Retrieval-Augmented Generation) :
 *
 * WORKFLOW TECHNIQUE & EXPÉRIENCE UTILISATEUR :
 * -----------------------------------------------------------------------------------------
 * 1. Saisie de l'intention utilisateur (Prompt) :
 *    L'utilisateur saisit en langage naturel les tâches souhaitées (ex: "Mettre en place la page de paiement Stripe").
 *
 * 2. Appel du Route Handler RAG (`/api/ai/generate-tasks`) :
 *    Transmet le `projectId` et le `prompt`. Le serveur backend instancie LlamaIndex.TS pour
 *    analyser le projet et ses tâches existantes, afin de produire des suggestions originales.
 *
 * 3. Prévisualisation & Édition Inline (UX Interactive) :
 *    Les tâches générées s'affichent sous forme de cartes d'action. L'utilisateur a le contrôle total :
 *    - Modifier le titre et la description directement dans la modale (✏️).
 *    - Supprimer une carte non pertinente (🗑️).
 *    - Régénérer ou ajouter d'autres suggestions via la barre de saisie.
 *
 * 4. Persistance séquentielle en Base de Données :
 *    Le clic sur "+ Ajouter les tâches" soumet séquentiellement la liste finale vers l'API REST
 *    (`POST /api/projects/:id/tasks`), garantissant l'intégrité de la base de données.
 * =========================================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Plus, Trash2, Edit3, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AiTaskGenerationModal({
  isOpen,
  project,
  currentUserId,
  onClose,
  onTasksAdded,
}) {
  const [prompt, setPrompt] = useState('');
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  const isOwner = project?.ownerId === currentUserId;

  // Édition d'une tâche individuelle dans la prévisualisation
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const modalRef = useRef(null);

  // Accessibilité WCAG 2.1 : Verrouillage du scroll arrière-plan & fermeture touche Échap & Focus Trap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = Array.from(
          modalRef.current.querySelectorAll(
            'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter(
          (el) =>
            el.offsetWidth > 0 ||
            el.offsetHeight > 0 ||
            el === document.activeElement
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (
            document.activeElement === firstElement ||
            !modalRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (
            document.activeElement === lastElement ||
            !modalRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    if (isOpen) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);

      const timer = setTimeout(() => {
        if (modalRef.current) {
          const firstInput = modalRef.current.querySelector(
            'input:not([disabled]), textarea:not([disabled]), button:not([disabled])'
          );
          if (firstInput) firstInput.focus();
        }
      }, 50);

      return () => {
        clearTimeout(timer);
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !project) return null;

  /**
   * SOUMISSION DU PROMPT DE GÉNÉRATION IA
   */
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

      // Envoi de la requête au backend RAG + LLM Gemini
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

  /**
   * Suppression d'une carte de la prévisualisation
   */
  const handleDeleteCard = (index) => {
    setGeneratedTasks((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  /**
   * Démarrage du mode édition inline pour une carte générée
   */
  const handleStartEdit = (index, task) => {
    setEditingIndex(index);
    setEditTitle(task.title);
    setEditDesc(task.description);
  };

  /**
   * Sauvegarde de l'édition inline
   */
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

  /**
   * VALIDATION FINALE : CRÉATION DE TOUTES LES TÂCHES GÉNÉRÉES DANS LE PROJET
   */
  const handleConfirmAddTasks = async () => {
    if (generatedTasks.length === 0) return;

    setIsSubmitting(true);
    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        toast.error('Session expirée. Veuillez vous reconnecter.');
        return;
      }

      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 7);
      const formattedDueDate = defaultDueDate.toISOString().split('T')[0];

      let addedCount = 0;

      // Si l'utilisateur est contributeur (non-propriétaire), les tâches générées lui sont attribuées
      const assigneeIds = !isOwner && currentUserId ? [currentUserId] : [];

      // Création séquentielle de chaque tâche prévisualisée dans le projet
      for (const t of generatedTasks) {
        const res = await fetch(`/api/projects/${project.id}/tasks`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: t.title,
            description: t.description || '',
            dueDate: formattedDueDate,
            priority: 'MEDIUM',
            assigneeIds,
          }),
        });

        if (res.ok) {
          addedCount++;
        }
      }

      toast.success(
        `${addedCount} tâche(s) ajoutée(s) au projet avec succès !`
      );

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
        ref={modalRef}
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

        {/* En-tête conforme aux maquettes officielles : Icône orange + Titre dynamique */}
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
                      /* Formulaire d'édition inline */
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
                      /* Carte de prévisualisation normale */
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

              {/* Bouton d'action principal "+ Ajouter les tâches" */}
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

        {/* Barre de saisie du prompt (Champ Pill shape) */}
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
