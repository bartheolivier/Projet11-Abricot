"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown, ChevronUp, Search, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CreateProjectModal({ isOpen, onClose, onProjectCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dropdownRef = useRef(null);

  // Verrouiller le défilement du fond + Touche Échap (WCAG 2.1)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
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
  }, [isOpen, onClose]);

  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Rechercher des utilisateurs via l'API
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1];

        if (!token) return;

        const response = await fetch(`/api/users/search?query=${encodeURIComponent(searchQuery)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const json = await response.json();
          setSearchResults(json.data?.users || []);
        }
      } catch (err) {
        console.error("Erreur recherche utilisateurs:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  if (!isOpen) return null;

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      toast.error("Veuillez remplir le titre et la description.");
      return;
    }

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

      const contributors = selectedUsers.map((u) => u.email);

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          contributors,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || "Erreur de création du projet");
      }

      toast.success("Projet créé avec succès !");
      onProjectCreated();
      
      setName("");
      setDescription("");
      setSelectedUsers([]);
      setSearchQuery("");
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
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title-create-project"
      >
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
      </div>
    </div>
  );
}
