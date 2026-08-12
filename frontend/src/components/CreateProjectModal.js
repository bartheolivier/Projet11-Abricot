'use client';

/**
 * =========================================================================================
 * MODALE DE CRÉATION DE PROJET (CREATE PROJECT MODAL COMPONENT)
 * =========================================================================================
 * Fichier : src/components/CreateProjectModal.js
 * Rôle : Modale interactive permettant de créer un nouveau projet :
 *        1. Saisie du titre et de la description du projet.
 *        2. Recherche d'utilisateurs avec auto-complétion déboguée (Debounce 300ms).
 *        3. Sélection multiple de collaborateurs/contributeurs.
 *        4. Accessibilité WCAG 2.1 (Verrouillage du scroll, Échap, ARIA, Focus Trap).
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

export default function CreateProjectModal({
  isOpen,
  onClose,
  onProjectCreated,
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
  const modalRef = useRef(null);

  // Accessibilité WCAG 2.1 : Verrouiller le défilement + Touche Échap + Focus Trap (Tab/Shift+Tab)
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

  // Fermer la liste déroulante des utilisateurs si on clique en dehors du composant
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * RECHERCHE D'UTILISATEURS DYNAMIQUE AVEC ANTI-REBONDS (DEBOUNCE 300ms)
   * Évite de surcharger l'API backend à chaque touche pressée.
   */
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
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

  if (!isOpen) return null;

  /**
   * Bascule la sélection d'un collaborateur
   */
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
   * SOUMISSION ET CRÉATION DU PROJET
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

      const contributors = selectedUsers
        .map((u) => u.email?.trim())
        .filter((email) => email && email.includes('@'));

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          contributors,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || 'Erreur lors de la création du projet');
      }

      toast.success('Projet créé avec succès !');
      setName('');
      setDescription('');
      setSelectedUsers([]);
      setSearchQuery('');
      if (onProjectCreated) onProjectCreated();
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
        aria-labelledby="modal-title-create-project"
      >
        {/* Bouton de fermeture de la modale */}
        <button
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Fermer la modale de création de projet"
          title="Fermer"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <h2 id="modal-title-create-project" className="modal-title">
          Créer un projet
        </h2>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Champ Titre */}
          <div className="form-group">
            <label htmlFor="modal-title">Titre*</label>
            <input
              type="text"
              id="modal-title"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              placeholder="Saisissez le titre du projet"
              required
            />
          </div>

          {/* Champ Description */}
          <div className="form-group">
            <label htmlFor="modal-description">Description*</label>
            <textarea
              id="modal-description"
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
            <span className="form-label" id="contributors-label">
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
                  const nextState = !isDropdownOpen;
                  setIsDropdownOpen(nextState);
                  if (nextState) {
                    setTimeout(() => {
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
                  }
                }
              }}
              tabIndex={0}
              role="button"
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
              aria-labelledby="contributors-label"
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

            {/* Menu déroulant de recherche des collaborateurs */}
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
                  {selectedUsers.map((user) => (
                    <div
                      key={`sel-${user.id}`}
                      className="contributor-option-item selected"
                      onClick={() => handleToggleUser(user)}
                      onKeyDown={(e) => {
                        if (e.key === 'Tab') {
                          setIsDropdownOpen(false);
                        } else if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleToggleUser(user);
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
                      aria-selected="true"
                    >
                      <div className="option-checkbox checked">
                        <Check size={12} strokeWidth={3} aria-hidden="true" />
                      </div>
                      <div className="option-details">
                        <span className="option-name">
                          {user.name || 'Utilisateur sans nom'}
                        </span>
                        <span className="option-email">{user.email}</span>
                      </div>
                    </div>
                  ))}

                  {isSearching ? (
                    <div className="dropdown-status-item">
                      <Loader2
                        size={16}
                        className="animate-spin"
                        aria-hidden="true"
                      />
                      <span>Recherche...</span>
                    </div>
                  ) : searchResults.length === 0 ? (
                    searchQuery.trim().length >= 2 ? (
                      <div className="dropdown-status-item">
                        Aucun utilisateur trouvé
                      </div>
                    ) : (
                      selectedUsers.length === 0 && (
                        <div className="dropdown-status-item instructions">
                          Saisissez au moins 2 caractères pour rechercher
                        </div>
                      )
                    )
                  ) : (
                    searchResults
                      .filter(
                        (user) => !selectedUsers.some((u) => u.id === user.id)
                      )
                      .map((user) => (
                        <div
                          key={user.id}
                          className="contributor-option-item"
                          onClick={() => handleToggleUser(user)}
                          onKeyDown={(e) => {
                            if (e.key === 'Tab') {
                              setIsDropdownOpen(false);
                            } else if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
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
                          aria-selected="false"
                        >
                          <div className="option-checkbox" />
                          <div className="option-details">
                            <span className="option-name">
                              {user.name || 'Utilisateur sans nom'}
                            </span>
                            <span className="option-email">{user.email}</span>
                          </div>
                        </div>
                      ))
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
                Création...
              </>
            ) : (
              'Ajouter un projet'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
