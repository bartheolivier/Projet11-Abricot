"use client";

import React, { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, ChevronDown, ChevronUp, Search, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCreateProjectMutation } from "@/hooks/useProjectsQuery";
import { api } from "@/lib/api";

export default function CreateProjectModal({ isOpen, onClose, onProjectCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const dropdownRef = useRef(null);

  const createProjectMutation = useCreateProjectMutation({
    onSuccess: () => {
      setName("");
      setDescription("");
      setSelectedUsers([]);
      setSearchQuery("");
      if (onProjectCreated) onProjectCreated();
      onClose();
    },
  });

  // Fermer le dropdown de recherche si on clique en dehors
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Rechercher des utilisateurs via le client API
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const json = await api.searchUsers(searchQuery);
        setSearchResults(json.data?.users || []);
      } catch (err) {
        console.error("Erreur recherche utilisateurs:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      toast.error("Veuillez remplir le titre et la description.");
      return;
    }

    const contributors = selectedUsers.map((u) => u.email);
    createProjectMutation.mutate({
      name: name.trim(),
      description: description.trim(),
      contributors,
    });
  };

  const isFormValid = name.trim().length > 0 && description.trim().length > 0;
  const isSubmitting = createProjectMutation.isPending;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="radix-overlay" />
        <Dialog.Content className="radix-content" aria-describedby={undefined}>
          <Dialog.Close
            className="modal-close-btn"
            aria-label="Fermer la modale de création de projet"
            title="Fermer"
          >
            <X size={20} aria-hidden="true" />
          </Dialog.Close>

          <Dialog.Title className="modal-title">
            Créer un projet
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="modal-form">
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

            <div className="form-group" ref={dropdownRef}>
              <label id="contributors-label">Contributeurs</label>
              <div 
                className="contributors-select-input" 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setIsDropdownOpen(!isDropdownOpen);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-haspopup="listbox"
                aria-expanded={isDropdownOpen}
                aria-labelledby="contributors-label"
              >
                <span className={selectedUsers.length === 0 ? "placeholder-text" : "selected-count-text"}>
                  {selectedUsers.length === 0 
                    ? "Choisir un ou plusieurs collaborateurs" 
                    : `${selectedUsers.length} collaborateur${selectedUsers.length > 1 ? "s" : ""}`
                  }
                </span>
                {isDropdownOpen ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
              </div>

              {isDropdownOpen && (
                <div className="contributors-dropdown-menu" role="listbox">
                  <div className="search-input-wrapper">
                    <Search size={14} className="search-icon" aria-hidden="true" />
                    <input
                      type="text"
                      placeholder="Rechercher par nom ou e-mail..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="dropdown-search-input"
                      onClick={(e) => e.stopPropagation()}
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
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleToggleUser(user);
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
                          <span className="option-name">{user.name || "Utilisateur sans nom"}</span>
                          <span className="option-email">{user.email}</span>
                        </div>
                      </div>
                    ))}

                    {isSearching ? (
                      <div className="dropdown-status-item">
                        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                        <span>Recherche...</span>
                      </div>
                    ) : searchResults.length === 0 ? (
                      searchQuery.trim().length >= 2 ? (
                        <div className="dropdown-status-item">Aucun utilisateur trouvé</div>
                      ) : (
                        selectedUsers.length === 0 && (
                          <div className="dropdown-status-item instructions">
                            Saisissez au moins 2 caractères pour rechercher
                          </div>
                        )
                      )
                    ) : (
                      searchResults
                        .filter((user) => !selectedUsers.some((u) => u.id === user.id))
                        .map((user) => (
                          <div 
                            key={user.id}
                            className="contributor-option-item"
                            onClick={() => handleToggleUser(user)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleToggleUser(user);
                              }
                            }}
                            tabIndex={0}
                            role="option"
                            aria-selected="false"
                          >
                            <div className="option-checkbox" />
                            <div className="option-details">
                              <span className="option-name">{user.name || "Utilisateur sans nom"}</span>
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
              className={`modal-btn-submit ${isFormValid ? "active" : "disabled"}`}
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Création...
                </>
              ) : (
                "Ajouter un projet"
              )}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
