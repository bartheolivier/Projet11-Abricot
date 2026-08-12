'use client';

/**
 * =========================================================================================
 * MODALE DE MODIFICATION DE PROJET (EDIT PROJECT MODAL WITH RADIX UI DIALOG)
 * =========================================================================================
 * Fichier : src/components/EditProjectModal.js (Branche optimisation - Test Radix UI)
 * Rôle : Modale de modification de projet propulsée par Radix UI Dialog :
 *        1. Verrouillage du scroll et Focus Trap gérés nativement par Radix UI.
 *        2. Sélection de collaborateurs avec liste stable (Piste 1).
 *        3. Accessibilité WCAG 2.1 AA intégrée sans boilerplate manuel.
 * =========================================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
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
  project,
  isOpen,
  onClose,
  onProjectUpdated,
}) {
  // États locaux du formulaire et de la recherche
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

  // Fermer le menu déroulant au clic extérieur
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

  // Recherche dynamique des utilisateurs avec debounce (300ms)
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

  const initialProjectMembers = (project?.members || [])
    .map((m) => m.user || m)
    .filter((u) => u.id !== project?.ownerId);

  // Liste stable des utilisateurs (Piste 1 : ne détruit pas les divs au décochage)
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
      toast.error('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('token='))
        ?.split('=')[1];

      const memberIds = selectedUsers.map((u) => u.id);

      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          memberIds,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(
          json.message || 'Erreur lors de la mise à jour du projet.'
        );
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

  const isFormValid = name.trim() !== '' && description.trim() !== '';

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className="modal-content" aria-describedby={undefined}>
          {/* Bouton de fermeture de la modale */}
          <Dialog.Close asChild>
            <button className="modal-close-btn" aria-label="Fermer la modale">
              <X size={20} aria-hidden="true" />
            </button>
          </Dialog.Close>

          {/* Titre de la modale */}
          <Dialog.Title className="modal-title">
            Modifier le projet
          </Dialog.Title>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
              <label htmlFor="edit-modal-name">Titre du projet*</label>
              <input
                type="text"
                id="edit-modal-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                placeholder="Ex: Refonte du site web"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-modal-description">Description*</label>
              <textarea
                id="edit-modal-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-input modal-textarea"
                placeholder="Saisissez la description du projet"
                rows={4}
                required
              />
            </div>

            {/* Champ Sélecteur de Contributeurs */}
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

              {/* Menu déroulant de recherche */}
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
                  Mise à jour...
                </>
              ) : (
                'Enregistrer les modifications'
              )}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
