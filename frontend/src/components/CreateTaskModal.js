'use client';

/**
 * =========================================================================================
 * MODALE DE CRÉATION DE TÂCHE (CREATE TASK MODAL COMPONENT)
 * =========================================================================================
 * Fichier : src/components/CreateTaskModal.js
 * Rôle : Formulaire de création de tâche au sein d'un projet :
 *        1. Saisie du titre, de la description et de la date d'échéance.
 *        2. Attribution à un ou plusieurs collaborateurs (Membres du projet).
 *        3. Sélection du statut initial (À faire, En cours, Terminée).
 *        4. Accessibilité WCAG 2.1 (Focus, Échap, ARIA).
 * =========================================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
  Loader2,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

export default function CreateTaskModal({
  isOpen,
  project,
  onClose,
  onTaskCreated,
}) {
  // États locaux de la tâche
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [status, setStatus] = useState('TODO');

  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dropdownRef = useRef(null);

  // Accessibilité WCAG 2.1 : Verrouillage du scroll arrière-plan & fermeture touche Échap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
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
  }, [isOpen, onClose]);

  // Fermeture du dropdown au clic extérieur
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen || !project) return null;

  // Rassembler tous les membres du projet éligibles pour l'assignation
  const allMembers = [];
  if (project.owner) {
    allMembers.push(project.owner);
  }
  if (project.members) {
    project.members.forEach((m) => {
      const userObj = m.user || m;
      if (
        userObj &&
        !allMembers.some((existing) => existing.id === userObj.id)
      ) {
        allMembers.push(userObj);
      }
    });
  }

  // Filtrage des membres selon le mot-clé de recherche
  const filteredMembers = allMembers.filter((u) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const nameMatch = u.name && u.name.toLowerCase().includes(query);
    const emailMatch = u.email && u.email.toLowerCase().includes(query);
    return nameMatch || emailMatch;
  });

  const handleToggleAssignee = (user) => {
    setSelectedAssignees((prev) => {
      const exists = prev.some((u) => u.id === user.id);
      if (exists) {
        return prev.filter((u) => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  /**
   * SOUMISSION ET CRÉATION DE LA TÂCHE
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Veuillez remplir le titre et la description.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('token='))
        ?.split('=')[1];

      const assigneeIds = selectedAssignees.map((u) => u.id);

      const res = await fetch(`/api/projects/${project.id}/tasks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          dueDate: dueDate || undefined,
          status,
          assigneeIds,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.message || 'Erreur lors de la création de la tâche'
        );
      }

      toast.success('Tâche créée avec succès !');
      setTitle('');
      setDescription('');
      setDueDate('');
      setSelectedAssignees([]);
      setStatus('TODO');
      if (onTaskCreated) onTaskCreated();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = title.trim().length > 0 && description.trim().length > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title-create-task"
      >
        <button
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Fermer la modale de création de tâche"
          title="Fermer"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <h2 id="modal-title-create-task" className="modal-title">
          Créer une tâche
        </h2>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="task-title">Titre*</label>
            <input
              type="text"
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              placeholder="Ex: Maquettage des modales"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="task-description">Description*</label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input modal-textarea"
              placeholder="Ex: Réaliser les maquettes Figma pour l'expérience utilisateur..."
              rows={4}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="task-due-date">Date d'échéance</label>
            <input
              type="date"
              id="task-due-date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Assignation aux membres du projet */}
          <div className="form-group" ref={dropdownRef}>
            <label id="assignees-label">Assigner à</label>
            <div
              className="contributors-select-input"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsDropdownOpen(!isDropdownOpen);
                }
              }}
              tabIndex={0}
              role="button"
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
              aria-labelledby="assignees-label"
            >
              <span
                className={
                  selectedAssignees.length === 0
                    ? 'placeholder-text'
                    : 'selected-count-text'
                }
              >
                {selectedAssignees.length === 0
                  ? 'Choisir un ou plusieurs membres'
                  : `${selectedAssignees.length} membre${selectedAssignees.length > 1 ? 's' : ''}`}
              </span>
              {isDropdownOpen ? (
                <ChevronUp size={16} aria-hidden="true" />
              ) : (
                <ChevronDown size={16} aria-hidden="true" />
              )}
            </div>

            {isDropdownOpen && (
              <div className="contributors-dropdown-menu" role="listbox">
                <div className="search-input-wrapper">
                  <Search
                    size={14}
                    className="search-icon"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    placeholder="Rechercher un membre..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="dropdown-search-input"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Rechercher des membres à assigner"
                    autoFocus
                  />
                </div>

                <div className="dropdown-options-list">
                  {filteredMembers.map((user) => {
                    const isSelected = selectedAssignees.some(
                      (u) => u.id === user.id
                    );
                    return (
                      <div
                        key={user.id}
                        className={`contributor-option-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleToggleAssignee(user)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleToggleAssignee(user);
                          }
                        }}
                        tabIndex={0}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <div
                          className={`option-checkbox ${isSelected ? 'checked' : ''}`}
                        >
                          {isSelected && (
                            <Check
                              size={12}
                              strokeWidth={3}
                              aria-hidden="true"
                            />
                          )}
                        </div>
                        <div className="option-details">
                          <span className="option-name">
                            {user.name || 'Utilisateur sans nom'}
                          </span>
                          <span className="option-email">{user.email}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className={`modal-btn-submit ${isFormValid ? 'active' : 'disabled'}`}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2
                  size={16}
                  className="animate-spin"
                  aria-hidden="true"
                />{' '}
                Création...
              </>
            ) : (
              'Ajouter la tâche'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
