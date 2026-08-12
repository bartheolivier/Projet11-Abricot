'use client';

/**
 * =========================================================================================
 * MODALE D'ÉDITION DE PROJET (EDIT PROJECT MODAL COMPONENT)
 * =========================================================================================
 * Fichier : src/components/EditProjectModal.js
 * Rôle : Formulaire de modification d'un projet existant (Réservé aux Administrateurs) :
 *        1. Pré-remplissage automatique du nom, de la description et des membres actuels.
 *        2. Ajout/Suppression de collaborateurs.
 *        3. Envoi des modifications au backend via `PUT /api/projects/:id`.
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

export default function EditProjectModal({
  isOpen,
  project,
  onClose,
  onProjectUpdated,
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dropdownRef = useRef(null);

  // Pré-remplissage des champs lors de l'ouverture
  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setDescription(project.description || '');

      const currentMembers = (project.members || [])
        .map((m) => m.user || m)
        .filter((u) => u.id !== project.ownerId);

      setSelectedUsers(currentMembers);
    }
  }, [project, isOpen]);

  const modalRef = useRef(null);

  // Accessibilité WCAG 2.1 : Touche Échap, défilement et Focus Trap (Tab/Shift+Tab)
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
  }, [isOpen, isDropdownOpen, onClose]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus du premier contributeur lors de l'ouverture du menu déroulant
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

  // Recherche dynamique des utilisateurs avec debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const token = document.cookie
          .split('; ')
          .find((row) => row.startsWith('token='))
          ?.split('=')[1];

        const res = await fetch(
          `/api/users/search?query=${encodeURIComponent(searchQuery.trim())}&q=${encodeURIComponent(searchQuery.trim())}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.ok) {
          const json = await res.json();
          setSearchResults(json.data?.users || []);
        }
      } catch (err) {
        console.error('Erreur recherche utilisateurs:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  if (!isOpen || !project) return null;

  const initialProjectMembers = (project.members || [])
    .map((m) => m.user || m)
    .filter((u) => u.id !== project.ownerId);

  // Piste 1 : Liste stable des utilisateurs (ne supprime pas les divs du DOM au décochage)
  const displayedUsers = (() => {
    if (searchQuery.trim().length >= 2) {
      const combined = [...searchResults];
      selectedUsers.forEach((u) => {
        if (!combined.some((item) => item.id === u.id)) {
          combined.unshift(u);
        }
      });
      return combined;
    }
    const list = [...initialProjectMembers];
    selectedUsers.forEach((u) => {
      if (!list.some((item) => item.id === u.id)) {
        list.push(u);
      }
    });
    return list;
  })();

  const handleToggleUser = (user) => {
    setSelectedUsers((prev) => {
      const isAlreadySelected = prev.some((u) => u.id === user.id);
      if (isAlreadySelected) {
        return prev.filter((u) => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  /**
   * SOUMISSION ET MISE À JOUR DU PROJET (PUT /api/projects/:id)
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      toast.error('Veuillez remplir le titre et la description.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('token='))
        ?.split('=')[1];

      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.message || 'Erreur lors de la modification du projet'
        );
      }

      // 2. Gérer l'ajout et la suppression des collaborateurs
      // Car la route PUT de Next.js/Backend n'inclut pas les contributeurs
      const originalMemberIds = (project.members || []).map(
        (m) => m.userId || m.user?.id
      );
      const newSelectedIds = selectedUsers.map((u) => u.id);

      // Utilisateurs à ajouter
      const usersToAdd = selectedUsers.filter(
        (u) => !originalMemberIds.includes(u.id)
      );
      for (const user of usersToAdd) {
        if (user.email) {
          await fetch(`/api/projects/${project.id}/contributors`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: user.email }),
          });
        }
      }

      // Utilisateurs à supprimer
      const membersToRemove = (project.members || []).filter(
        (m) =>
          (m.userId || m.user?.id) &&
          !newSelectedIds.includes(m.userId || m.user?.id)
      );
      for (const member of membersToRemove) {
        const userId = member.userId || member.user?.id;
        await fetch(`/api/projects/${project.id}/contributors/${userId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      toast.success('Projet mis à jour avec succès !');
      if (onProjectUpdated) onProjectUpdated();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = name.trim().length > 0 && description.trim().length > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title-edit-project"
      >
        <button
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Fermer la modale de modification de projet"
          title="Fermer"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <h2 id="modal-title-edit-project" className="modal-title">
          Modifier le projet
        </h2>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="edit-modal-title">Titre*</label>
            <input
              type="text"
              id="edit-modal-title"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-modal-description">Description*</label>
            <textarea
              id="edit-modal-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input modal-textarea"
              rows={4}
              required
            />
          </div>

          <div className="form-group" ref={dropdownRef}>
            <span className="form-label" id="edit-contributors-label">
              Contributeurs
            </span>
            <div
              className="contributors-select-input"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              onKeyDown={(e) => {
                if (
                  e.key === 'Enter' ||
                  e.key === ' ' ||
                  e.key === 'ArrowDown'
                ) {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDropdownOpen(!isDropdownOpen);
                }
              }}
              tabIndex={0}
              role="button"
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
              aria-labelledby="edit-contributors-label"
            >
              <span
                className={
                  selectedUsers.length === 0
                    ? 'placeholder-text'
                    : 'selected-count-text'
                }
              >
                {selectedUsers.length === 0
                  ? 'Choisir un ou plusieurs collaborateurs'
                  : `${selectedUsers.length} collaborateur${selectedUsers.length > 1 ? 's' : ''}`}
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
                    placeholder="Rechercher par nom ou e-mail..."
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
                    aria-label="Rechercher des contributeurs"
                    autoFocus
                  />
                </div>

                <div className="dropdown-options-list">
                  {isSearching ? (
                    <div className="dropdown-status-item">
                      <Loader2
                        size={16}
                        className="animate-spin"
                        aria-hidden="true"
                      />
                      <span>Recherche...</span>
                    </div>
                  ) : displayedUsers.length === 0 ? (
                    <div className="dropdown-status-item">
                      {searchQuery.trim().length >= 2
                        ? 'Aucun utilisateur trouvé'
                        : 'Saisissez au moins 2 caractères pour rechercher'}
                    </div>
                  ) : (
                    displayedUsers.map((user) => {
                      const isSelected = selectedUsers.some(
                        (u) => u.id === user.id
                      );
                      return (
                        <div
                          key={user.id}
                          className={`contributor-option-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleToggleUser(user)}
                          onKeyDown={(e) => {
                            if (e.key === 'Tab') {
                              setIsDropdownOpen(false);
                            } else if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              handleToggleUser(user);
                            } else if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              const next = e.currentTarget.nextElementSibling;
                              if (
                                next &&
                                next.classList.contains(
                                  'contributor-option-item'
                                )
                              ) {
                                next.focus();
                              }
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              const prev =
                                e.currentTarget.previousElementSibling;
                              if (
                                prev &&
                                prev.classList.contains(
                                  'contributor-option-item'
                                )
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
                    })
                  )}
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
