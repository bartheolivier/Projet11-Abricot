"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown, ChevronUp, Search, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUpdateTaskMutation } from "@/hooks/useTasksQuery";

export default function EditTaskModal({ isOpen, project, task, onClose, onTaskUpdated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [status, setStatus] = useState("TODO");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

  const updateTaskMutation = useUpdateTaskMutation({
    onSuccess: () => {
      if (onTaskUpdated) onTaskUpdated();
      onClose();
    },
  });

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

  // Charger les données de la tâche
  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      
      if (task.dueDate) {
        const d = new Date(task.dueDate);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        setDueDate(`${year}-${month}-${day}`);
      } else {
        setDueDate("");
      }

      const initialUsers = (task.assignees || []).map((a) => a.user || a);
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

  const allMembers = [];
  if (project.owner) {
    allMembers.push(project.owner);
  }
  if (project.members) {
    project.members.forEach((m) => {
      const u = m.user || m;
      if (u && !allMembers.some((existing) => existing.id === u.id)) {
        allMembers.push(u);
      }
    });
  }

  const filteredMembers = allMembers.filter((u) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      (u.name && u.name.toLowerCase().includes(query)) ||
      (u.email && u.email.toLowerCase().includes(query))
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !dueDate) {
      toast.error("Veuillez remplir le titre, la description et l'échéance.");
      return;
    }

    const assigneeIds = selectedAssignees.map((u) => u.id);

    updateTaskMutation.mutate({
      id: task.id,
      title: title.trim(),
      description: description.trim(),
      dueDate,
      status,
      assigneeIds,
    });
  };

  const isFormValid = title.trim().length > 0 && description.trim().length > 0 && dueDate.length > 0;
  const isSubmitting = updateTaskMutation.isPending;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
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
              placeholder="Saisissez le titre de la tâche"
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
              placeholder="Saisissez la description de la tâche"
              rows={3}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-task-duedate">Échéance*</label>
            <input
              type="date"
              id="edit-task-duedate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="form-input"
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
            </select>
          </div>

          <div className="form-group" ref={dropdownRef}>
            <label id="edit-assignees-label">Assigner à des collaborateurs</label>
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
              aria-labelledby="edit-assignees-label"
            >
              <span className={selectedAssignees.length === 0 ? "placeholder-text" : "selected-count-text"}>
                {selectedAssignees.length === 0
                  ? "Sélectionner un ou plusieurs membres"
                  : `${selectedAssignees.length} membre${selectedAssignees.length > 1 ? "s" : ""} assigné(s)`}
              </span>
              {isDropdownOpen ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
            </div>

            {isDropdownOpen && (
              <div className="contributors-dropdown-menu" role="listbox">
                <div className="search-input-wrapper">
                  <Search size={14} className="search-icon" aria-hidden="true" />
                  <input
                    type="text"
                    placeholder="Filtrer les membres..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="dropdown-search-input"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Rechercher des collaborateurs à assigner"
                    autoFocus
                  />
                </div>

                <div className="dropdown-options-list">
                  {filteredMembers.map((user) => {
                    const isSelected = selectedAssignees.some((u) => u.id === user.id);

                    return (
                      <div
                        key={user.id}
                        className={`contributor-option-item ${isSelected ? "selected" : ""}`}
                        onClick={() => handleToggleAssignee(user)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleToggleAssignee(user);
                          }
                        }}
                        tabIndex={0}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <div className={`option-checkbox ${isSelected ? "checked" : ""}`}>
                          {isSelected && <Check size={12} strokeWidth={3} aria-hidden="true" />}
                        </div>
                        <div className="option-details">
                          <span className="option-name">{user.name || user.email}</span>
                          <span className="option-email">{user.email}</span>
                        </div>
                      </div>
                    );
                  })}
                  {filteredMembers.length === 0 && (
                    <div className="dropdown-status-item">Aucun membre trouvé</div>
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
                <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Enregistrement...
              </>
            ) : (
              "Enregistrer les modifications"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
