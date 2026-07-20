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
    }, 300); // Debounce de 300ms

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
      onProjectCreated(); // Recharger les projets
      
      // Réinitialiser le formulaire et fermer
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
    <div className="modal-overlay">
      <div className="modal-content">
        {/* Bouton fermer en haut à droite */}
        <button className="modal-close-btn" onClick={onClose} title="Fermer">
          <X size={20} />
        </button>

        <h2 className="modal-title">Créer un projet</h2>

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

          {/* Sélecteur de collaborateurs / Contributeurs */}
          <div className="form-group" ref={dropdownRef}>
            <label>Contributeurs</label>
            <div 
              className="contributors-select-input" 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className={selectedUsers.length === 0 ? "placeholder-text" : "selected-count-text"}>
                {selectedUsers.length === 0 
                  ? "Choisir un ou plusieurs collaborateurs" 
                  : `${selectedUsers.length} collaborateur${selectedUsers.length > 1 ? "s" : ""}`
                }
              </span>
              {isDropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            {isDropdownOpen && (
              <div className="contributors-dropdown-menu">
                <div className="search-input-wrapper">
                  <Search size={14} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom ou e-mail..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="dropdown-search-input"
                    onClick={(e) => e.stopPropagation()} // Éviter de fermer le menu
                    autoFocus
                  />
                </div>

                <div className="dropdown-options-list">
                  {/* Affichage des utilisateurs sélectionnés en premier */}
                  {selectedUsers.map((user) => (
                    <div 
                      key={`sel-${user.id}`}
                      className="contributor-option-item selected"
                      onClick={() => handleToggleUser(user)}
                    >
                      <div className="option-checkbox checked">
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <div className="option-details">
                        <span className="option-name">{user.name || "Utilisateur sans nom"}</span>
                        <span className="option-email">{user.email}</span>
                      </div>
                    </div>
                  ))}

                  {/* Affichage des résultats de recherche non encore sélectionnés */}
                  {isSearching ? (
                    <div className="dropdown-status-item">
                      <Loader2 size={16} className="animate-spin" />
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
                <Loader2 size={16} className="animate-spin" /> Création...
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
