'use client';

/**
 * =========================================================================================
 * MODALE DE MODIFICATION DE TÂCHE (EDIT TASK MODAL COMPONENT)
 * =========================================================================================
 * Fichier : src/components/EditTaskModal.js
 * Rôle : Formulaire d'édition d'une tâche existante :
 *        1. Pré-remplissage dynamique du titre, de la description, de la date d'échéance et du statut.
 *        2. Modification des assignés (membres du projet).
 *        3. Transmission de la requête `PUT /api/projects/:projectId/tasks/:taskId`.
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
} from 'lucide-react';
import { toast } from 'sonner';

export default function EditTaskModal({
  isOpen,
  project,
  task,
  currentUserId,
  onClose,
  onTaskUpdated,
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [status, setStatus] = useState('TODO');

  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dropdownRef = useRef(null);
  const isOwner = project?.ownerId === currentUserId;

  // Pré-remplissage des champs de la tâche sélectionnée
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setStatus(task.status || 'TODO');

      if (task.dueDate) {
        const formattedDate = new Date(task.dueDate)
          .toISOString()
          .split('T')[0];
        setDueDate(formattedDate);
      } else {
        setDueDate('');
      }

      if (task.assignees) {
        const currentAssignees = task.assignees.map((a) => a.user || a);
        setSelectedAssignees(currentAssignees);
      } else {
        setSelectedAssignees([]);
      }
    }
  }, [task, isOpen]);

  const modalRef = useRef(null);

  // Accessibilité WCAG 2.1 : Touche Échap, scroll et Focus Trap (Tab/Shift+Tab)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isDropdownOpen) {
          e.preventDefault();
          e.stopPropagation();
          setIsDropdownOpen(false);
          const selectTrigger = dropdownRef.current?.querySelector(
            '.contributors-select-input'
          );
          if (selectTrigger) selectTrigger.focus();
          return;
        }
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
            'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])'
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
  }, [isOpen, isDropdownOpen, onClose]);

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

  // Auto-focus du premier membre lors de l'ouverture du menu déroulant
  useEffect(() => {
    if (isDropdownOpen) {
      const timer = setTimeout(() => {
        const firstOpt = dropdownRef.current?.querySelector(
          '.contributor-option-item'
        );
        if (firstOpt) {
          firstOpt.focus();
        } else {
          const searchInput = dropdownRef.current?.querySelector(
            '.dropdown-search-input'
          );
          if (searchInput) searchInput.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isDropdownOpen]);

  if (!isOpen || !project || !task) return null;

  // Rassembler tous les membres du projet éligibles
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

  const filteredMembers = allMembers.filter((u) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const nameMatch = u.name && u.name.toLowerCase().includes(query);
    const emailMatch = u.email && u.email.toLowerCase().includes(query);
    return nameMatch || emailMatch;
  });

  const handleToggleAssignee = (user) => {
    if (!isOwner) return; // Seul le propriétaire du projet peut réattribuer des membres
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
   * SOUMISSION ET MISE À JOUR DE LA TÂCHE (PUT)
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

      const res = await fetch(`/api/projects/${project.id}/tasks/${task.id}`, {
        method: 'PUT',
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
          json.message || 'Erreur lors de la modification de la tâche'
        );
      }

      toast.success('Tâche modifiée avec succès !');
      if (onTaskUpdated) onTaskUpdated();
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
        ref={modalRef}
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title-edit-task"
      >
        <button
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Fermer la modale de modification de tâche"
          title="Fermer"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <h2 id="modal-title-edit-task" className="modal-title">
          Modifier la tâche
        </h2>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="edit-task-title">Titre*</label>
            <input
              type="text"
              id="edit-task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-task-description">Description*</label>
            <textarea
              id="edit-task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input modal-textarea"
              rows={4}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-task-status">Statut</label>
            <select
              id="edit-task-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="form-input"
            >
              <option value="TODO">À faire</option>
              <option value="IN_PROGRESS">En cours</option>
              <option value="DONE">Terminée</option>
              <option value="CANCELLED">Annulée</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="edit-task-due-date">Date d'échéance</label>
            <input
              type="date"
              id="edit-task-due-date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Assignation aux membres du projet */}
          <div className="form-group" ref={dropdownRef}>
            <span className="form-label" id="edit-assignees-label">
              Assigner à
            </span>
            <div
              className={`contributors-select-input ${!isOwner ? 'disabled-input' : ''}`}
              onClick={() => {
                if (isOwner) setIsDropdownOpen(!isDropdownOpen);
              }}
              onKeyDown={(e) => {
                if (
                  isOwner &&
                  (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')
                ) {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDropdownOpen(!isDropdownOpen);
                }
              }}
              tabIndex={isOwner ? 0 : -1}
              role={isOwner ? 'button' : 'region'}
              aria-haspopup={isOwner ? 'listbox' : undefined}
              aria-expanded={isOwner ? isDropdownOpen : undefined}
              aria-labelledby="edit-assignees-label"
              style={
                !isOwner
                  ? { cursor: 'not-allowed', backgroundColor: '#f9fafb' }
                  : {}
              }
            >
              <span
                className={
                  selectedAssignees.length === 0
                    ? 'placeholder-text'
                    : 'selected-count-text'
                }
              >
                {selectedAssignees.length === 0
                  ? 'Aucun membre attribué'
                  : selectedAssignees.map((u) => u.name || u.email).join(', ')}
              </span>
              {isOwner &&
                (isDropdownOpen ? (
                  <ChevronUp size={16} aria-hidden="true" />
                ) : (
                  <ChevronDown size={16} aria-hidden="true" />
                ))}
            </div>
            {!isOwner && (
              <small
                style={{
                  color: '#595959',
                  fontSize: '0.8rem',
                  marginTop: '0.25rem',
                  display: 'block',
                }}
              >
                Seul le propriétaire du projet peut modifier les membres
                attribués à cette tâche.
              </small>
            )}

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
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Tab') {
                        setIsDropdownOpen(false);
                      } else if (e.key === 'ArrowDown' || e.key === 'Enter') {
                        const firstOption = e.currentTarget
                          .closest('.contributors-dropdown-menu')
                          ?.querySelector('.contributor-option-item');
                        if (firstOption) {
                          e.preventDefault();
                          firstOption.focus();
                        }
                      }
                    }}
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
                          if (e.key === 'Tab') {
                            setIsDropdownOpen(false);
                          } else if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            handleToggleAssignee(user);
                          } else if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            const next = e.currentTarget.nextElementSibling;
                            if (
                              next &&
                              next.classList.contains('contributor-option-item')
                            ) {
                              next.focus();
                            }
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            const prev = e.currentTarget.previousElementSibling;
                            if (
                              prev &&
                              prev.classList.contains('contributor-option-item')
                            ) {
                              prev.focus();
                            } else {
                              const searchInput = e.currentTarget
                                .closest('.contributors-dropdown-menu')
                                ?.querySelector('.dropdown-search-input');
                              if (searchInput) searchInput.focus();
                            }
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
                Sauvegarde...
              </>
            ) : (
              'Sauvegarder les modifications'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
