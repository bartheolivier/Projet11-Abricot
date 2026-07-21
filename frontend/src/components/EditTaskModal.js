"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown, ChevronUp, Search, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function EditTaskModal({ isOpen, project, task, onClose, onTaskUpdated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [status, setStatus] = useState("TODO"); // TODO, IN_PROGRESS, DONE
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dropdownRef = useRef(null);

  // Verrouiller le défilement du fond quand la modale est ouverte
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Charger les données de la tâche
  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      
      // Formater la date en YYYY-MM-DD pour l'input date HTML
      if (task.dueDate) {
        const d = new Date(task.dueDate);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        setDueDate(`${year}-${month}-${day}`);
      } else {
        setDueDate("");
      }

      // Initialiser les assignés à partir de la structure de l'API
      const initialUsers = (task.assignees || []).map((a) => a.user);
      setSelectedAssignees(initialUsers);

      setStatus(task.status || "TODO");
    }
  }, [task, isOpen]);

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

  if (!isOpen || !project || !task) return null;

  // Rassembler tous les membres du projet éligibles pour l'assignation
  const allMembers = [];
  if (project.owner) {
    allMembers.push(project.owner);
  }
  if (project.members) {
    project.members.forEach((m) => {
      if (!allMembers.some((u) => u.id === m.user.id)) {
        allMembers.push(m.user);
      }
    });
  }

  // Filtrer localement les membres selon la recherche
  const filteredMembers = allMembers.filter((u) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      (u.name && u.name.toLowerCase().includes(query)) ||
      u.email.toLowerCase().includes(query)
    );
  });

  const handleToggleAssignee = (user) => {
    setSelectedAssignees((prev) => {
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
    if (!title.trim() || !description.trim() || !dueDate) {
      toast.error("Veuillez remplir le titre, la description et l'échéance.");
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

      const assigneeIds = selectedAssignees.map((u) => u.id);

      const response = await fetch(`/api/projects/${project.id}/tasks/${task.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          status,
          dueDate,
          assigneeIds,
          priority: task.priority || "MEDIUM",
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || "Erreur de modification de la tâche");
      }

      toast.success("Tâche modifiée avec succès !");
      onTaskUpdated(); // Recharger les tâches
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = title.trim().length > 0 && description.trim().length > 0 && dueDate !== "";

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close-btn" onClick={onClose} title="Fermer">
          <X size={20} />
        </button>

        <h2 className="modal-title">Modifier</h2>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="edit-task-title">Titre</label>
            <input
              type="text"
              id="edit-task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              placeholder="Titre de la tâche"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-task-description">Description</label>
            <textarea
              id="edit-task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input modal-textarea"
              placeholder="Description de la tâche"
              rows={3}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-task-duedate">Échéance</label>
            <input
              type="date"
              id="edit-task-duedate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="form-input"
              required
            />
          </div>

          {/* Assignation */}
          <div className="form-group" ref={dropdownRef}>
            <label>Assigné à :</label>
            <div 
              className="contributors-select-input" 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className={selectedAssignees.length === 0 ? "placeholder-text" : "selected-count-text"}>
                {selectedAssignees.length === 0 
                  ? "Choisir un ou plusieurs collaborateurs" 
                  : `${selectedAssignees.length} collaborateur${selectedAssignees.length > 1 ? "s" : ""}`
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
                    placeholder="Rechercher un membre du projet..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="dropdown-search-input"
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                </div>

                <div className="dropdown-options-list">
                  {/* Affichage des personnes sélectionnées en premier */}
                  {selectedAssignees.map((user) => (
                    <div 
                      key={`sel-${user.id}`}
                      className="contributor-option-item selected"
                      onClick={() => handleToggleAssignee(user)}
                    >
                      <div className="option-checkbox checked">
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <div className="option-details">
                        <span className="option-name">{user.name || "Collaborateur"}</span>
                        <span className="option-email">{user.email}</span>
                      </div>
                    </div>
                  ))}

                  {/* Affichage des autres membres filtrés */}
                  {filteredMembers
                    .filter((user) => !selectedAssignees.some((u) => u.id === user.id))
                    .map((user) => (
                      <div 
                        key={user.id}
                        className="contributor-option-item"
                        onClick={() => handleToggleAssignee(user)}
                      >
                        <div className="option-checkbox" />
                        <div className="option-details">
                          <span className="option-name">{user.name || "Collaborateur"}</span>
                          <span className="option-email">{user.email}</span>
                        </div>
                      </div>
                    ))
                  }

                  {filteredMembers.length === 0 && (
                    <div className="dropdown-status-item">Aucun membre trouvé</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Choix du statut */}
          <div className="form-group">
            <label>Statut :</label>
            <div className="status-pill-group">
              <button
                type="button"
                onClick={() => setStatus("TODO")}
                className={`status-pill-btn todo-pill ${status === "TODO" ? "active" : ""}`}
              >
                À faire
              </button>
              <button
                type="button"
                onClick={() => setStatus("IN_PROGRESS")}
                className={`status-pill-btn progress-pill ${status === "IN_PROGRESS" ? "active" : ""}`}
              >
                En cours
              </button>
              <button
                type="button"
                onClick={() => setStatus("DONE")}
                className={`status-pill-btn done-pill ${status === "DONE" ? "active" : ""}`}
              >
                Terminée
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className={`modal-btn-submit ${isFormValid ? "active" : "disabled"}`}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Enregistrement...
              </>
            ) : (
              "Enregistrer"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
