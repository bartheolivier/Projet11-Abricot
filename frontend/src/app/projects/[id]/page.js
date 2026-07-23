"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Calendar,
  LayoutList,
  MessageSquare, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Sparkles, 
  MoreHorizontal,
  Send,
  Loader2
} from "lucide-react";
import EditProjectModal from "@/components/EditProjectModal";
import CreateTaskModal from "@/components/CreateTaskModal";
import EditTaskModal from "@/components/EditTaskModal";
import AiTaskGenerationModal from "@/components/AiTaskGenerationModal";
import ViewTaskModal from "@/components/ViewTaskModal";
import ProjectCalendarView from "@/components/ProjectCalendarView";
import { useProjectDetailsQuery } from "@/hooks/useProjectsQuery";
import { useProjectTasksQuery, useDeleteTaskMutation, useAddCommentMutation } from "@/hooks/useTasksQuery";
import { useProfileQuery } from "@/hooks/useProfileQuery";

export default function ProjectDetails({ params }) {
  const { id: projectId } = use(params);

  // Custom Hooks React Query (remplace les useEffect / fetch complexes)
  const { data: userProfile } = useProfileQuery();
  const { data: project, isLoading: isProjectLoading } = useProjectDetailsQuery(projectId);
  const { data: tasks = [], isLoading: isTasksLoading } = useProjectTasksQuery(projectId);

  const deleteTaskMutation = useDeleteTaskMutation();
  const addCommentMutation = useAddCommentMutation();

  const currentUserId = userProfile?.id;

  // États pour les modales
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [activeView, setActiveView] = useState("list");
  const [isViewTaskModalOpen, setIsViewTaskModalOpen] = useState(false);
  const [taskToView, setTaskToView] = useState(null);

  // État pour le filtre et la recherche
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeTaskMenu, setActiveTaskMenu] = useState(null);

  // États pour les commentaires
  const [expandedComments, setExpandedComments] = useState({});
  const [newComments, setNewComments] = useState({});

  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (!e.target.closest(".task-menu-btn") && !e.target.closest(".task-action-dropdown-menu")) {
        setActiveTaskMenu(null);
      }
    };
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  const handleToggleMenu = (e, taskId) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveTaskMenu((prev) => (prev === taskId ? null : taskId));
  };

  const handleEditTaskClick = (e, task) => {
    e.preventDefault();
    e.stopPropagation();
    setTaskToEdit(task);
    setIsEditTaskModalOpen(true);
    setActiveTaskMenu(null);
  };

  const handleDeleteTask = (e, taskId, taskTitle) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveTaskMenu(null);

    if (confirm(`Voulez-vous vraiment supprimer la tâche "${taskTitle}" ?`)) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const toggleComments = (taskId) => {
    setExpandedComments((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const handleCommentChange = (taskId, text) => {
    setNewComments((prev) => ({
      ...prev,
      [taskId]: text,
    }));
  };

  const handleAddComment = (e, taskId) => {
    e.preventDefault();
    const commentContent = newComments[taskId]?.trim();
    if (!commentContent) return;

    addCommentMutation.mutate(
      { projectId, taskId, content: commentContent },
      {
        onSuccess: () => {
          setNewComments((prev) => ({ ...prev, [taskId]: "" }));
        },
      }
    );
  };

  const getStatusDetails = (status) => {
    switch (status) {
      case "TODO":
        return { label: "À faire", className: "badge-todo" };
      case "IN_PROGRESS":
        return { label: "En cours", className: "badge-progress" };
      case "DONE":
        return { label: "Terminée", className: "badge-done" };
      case "CANCELLED":
        return { label: "Annulée", className: "badge-cancelled" };
      default:
        return { label: status, className: "" };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Aucune";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  };

  const colors = ["#ffe8d6", "#e2ece9", "#f0efeb", "#ddbea9", "#a8dadc", "#f4a261"];
  const getAvatarColor = (name) => {
    if (!name) return colors[0];
    const charCodeSum = name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[charCodeSum % colors.length];
  };

  const getInitials = (name) => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0] ? parts[0].substring(0, 2).toUpperCase() : "";
  };

  const isLoading = isProjectLoading || isTasksLoading;

  if (isLoading) {
    return (
      <div className="project-details-container">
        <p>Chargement des détails du projet...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="project-details-container">
        <p>Projet introuvable.</p>
        <Link href="/projects" className="btn-secondary">Retour aux projets</Link>
      </div>
    );
  }

  const otherMembers = (project.members || []).filter((m) => m.user?.id !== project.ownerId);
  const isAdmin = project.userRole === "ADMIN" || project.ownerId === currentUserId;

  // Filtrage des tâches
  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== "ALL" && t.status !== statusFilter) {
      return false;
    }
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const titleMatch = t.title && t.title.toLowerCase().includes(query);
    const descMatch = t.description && t.description.toLowerCase().includes(query);
    return titleMatch || descMatch;
  });

  return (
    <div className="project-details-container">
      {/* En-tête du projet */}
      <div className="project-details-header">
        <div className="title-section-wrapper">
          <Link href="/projects" className="btn-back" title="Retour aux projets">
            <ArrowLeft size={18} />
          </Link>
          <div className="project-details-info">
            <div className="project-title-row">
              <h1 className="project-details-title">{project.name}</h1>
              {isAdmin && (
                <button 
                  onClick={() => setIsEditModalOpen(true)} 
                  className="project-edit-link"
                >
                  Modifier
                </button>
              )}
            </div>
            <p className="project-details-desc">
              {project.description || "Aucune description fournie."}
            </p>
          </div>
        </div>

        <div className="header-actions">
          <button className="btn-primary" onClick={() => setIsCreateTaskModalOpen(true)}>
            <Plus size={16} /> Créer une tâche
          </button>
          <button className="btn-orange" onClick={() => setIsAiModalOpen(true)}>
            <Sparkles size={16} /> IA
          </button>
        </div>
      </div>

      {/* Barre des Contributeurs */}
      <div className="contributors-bar">
        <span className="contributors-count-label">
          Contributeurs <span className="light-text">{1 + otherMembers.length} personnes</span>
        </span>
        <div className="contributors-list">
          {project.owner && (
            <div className="contributor-capsule">
              <div 
                className="capsule-avatar"
                style={{ backgroundColor: getAvatarColor(project.owner.name || project.owner.email) }}
              >
                {getInitials(project.owner.name) || getInitials(project.owner.email)}
              </div>
              <span className="capsule-name owner-badge">Propriétaire</span>
            </div>
          )}

          {otherMembers.map((member) => (
            <div className="contributor-capsule" key={member.user?.id || member.id}>
              <div 
                className="capsule-avatar"
                style={{ backgroundColor: getAvatarColor(member.user?.name || member.user?.email) }}
              >
                {getInitials(member.user?.name) || getInitials(member.user?.email)}
              </div>
              <span className="capsule-name">
                {member.user?.name || member.user?.email}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Zone principale des tâches */}
      <div className="tasks-section-card">
        <div className="tasks-section-header">
          <div className="segmented-control" role="tablist" aria-label="Affichage des tâches">
            <button
              className={`segmented-btn ${activeView === "list" ? "active" : ""}`}
              onClick={() => setActiveView("list")}
              role="tab"
              aria-selected={activeView === "list"}
            >
              <LayoutList size={16} aria-hidden="true" />
              <span>Liste</span>
            </button>
            <button
              className={`segmented-btn ${activeView === "calendar" ? "active" : ""}`}
              onClick={() => setActiveView("calendar")}
              role="tab"
              aria-selected={activeView === "calendar"}
            >
              <Calendar size={16} aria-hidden="true" />
              <span>Calendrier</span>
            </button>
          </div>

          <div className="search-filter-bar">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Rechercher une tâche..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="task-search-input"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-filter-select"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="TODO">À faire</option>
              <option value="IN_PROGRESS">En cours</option>
              <option value="DONE">Terminée</option>
            </select>
          </div>
        </div>

        {activeView === "list" ? (
          <div className="project-tasks-list">
            {filteredTasks.length === 0 ? (
              <div className="no-tasks-state">
                <p>Aucune tâche ne correspond à vos critères.</p>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const statusDetails = getStatusDetails(task.status);
                const assignees = (task.assignees || []).map((a) => a.user || a);
                const comments = task.comments || [];
                const isCommentsExpanded = expandedComments[task.id];

                return (
                  <div key={task.id} className="project-task-item-card">
                    <div className="task-item-main-row">
                      <div className="task-item-info">
                        <h3 className="task-item-title">{task.title}</h3>
                        <p className="task-item-desc">{task.description}</p>
                      </div>

                      <div className="task-item-right-actions">
                        <span className={`status-badge ${statusDetails.className}`}>
                          {statusDetails.label}
                        </span>

                        <div className="task-item-menu-container">
                          <button 
                            className="task-menu-btn" 
                            onClick={(e) => handleToggleMenu(e, task.id)}
                            title="Actions"
                          >
                            <MoreHorizontal size={18} />
                          </button>

                          {activeTaskMenu === task.id && (
                            <div className="task-action-dropdown-menu">
                              <button onClick={(e) => handleEditTaskClick(e, task)}>
                                Modifier la tâche
                              </button>
                              <button 
                                onClick={(e) => handleDeleteTask(e, task.id, task.title)}
                                className="delete-action"
                              >
                                Supprimer la tâche
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="task-item-footer-row">
                      <div className="task-footer-left">
                        <div className="task-assignees-avatars">
                          {assignees.map((user) => (
                            <div
                              key={user.id || user.email}
                              className="mini-assignee-avatar"
                              style={{ backgroundColor: getAvatarColor(user.name || user.email) }}
                              title={user.name || user.email}
                            >
                              {getInitials(user.name || user.email)}
                            </div>
                          ))}
                        </div>

                        <div className="task-due-date-chip">
                          <Calendar size={14} />
                          <span>{formatDate(task.dueDate)}</span>
                        </div>
                      </div>

                      <div className="task-footer-right">
                        <button
                          className="btn-toggle-comments"
                          onClick={() => toggleComments(task.id)}
                        >
                          <MessageSquare size={14} />
                          <span>{comments.length} commentaire{comments.length > 1 ? "s" : ""}</span>
                          {isCommentsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Section Commentaires */}
                    {isCommentsExpanded && (
                      <div className="task-comments-collapsible-section">
                        <div className="comments-list">
                          {comments.map((c, idx) => {
                            const authorName = c.user?.name || c.user?.email || "Utilisateur";
                            return (
                              <div key={c.id || idx} className="comment-item">
                                <div
                                  className="comment-avatar"
                                  style={{ backgroundColor: getAvatarColor(authorName) }}
                                >
                                  {getInitials(authorName)}
                                </div>
                                <div className="comment-body-box">
                                  <div className="comment-meta-header">
                                    <span className="comment-author-name">{authorName}</span>
                                    {c.createdAt && (
                                      <span className="comment-date">
                                        {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                                      </span>
                                    )}
                                  </div>
                                  <p className="comment-text-content">{c.content}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Formulaire nouveau commentaire */}
                        <form onSubmit={(e) => handleAddComment(e, task.id)} className="add-comment-input-row">
                          <input
                            type="text"
                            placeholder="Écrire un commentaire..."
                            value={newComments[task.id] || ""}
                            onChange={(e) => handleCommentChange(task.id, e.target.value)}
                            className="comment-input-field"
                          />
                          <button
                            type="submit"
                            className="btn-send-comment"
                            disabled={!newComments[task.id]?.trim() || addCommentMutation.isPending}
                          >
                            {addCommentMutation.isPending ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Send size={16} />
                            )}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <ProjectCalendarView
            tasks={filteredTasks}
            onSelectTask={(task) => {
              setTaskToView(task);
              setIsViewTaskModalOpen(true);
            }}
          />
        )}
      </div>

      {/* Modales */}
      <EditProjectModal
        isOpen={isEditModalOpen}
        project={project}
        onClose={() => setIsEditModalOpen(false)}
      />

      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        project={project}
        onClose={() => setIsCreateTaskModalOpen(false)}
      />

      <EditTaskModal
        isOpen={isEditTaskModalOpen}
        project={project}
        task={taskToEdit}
        onClose={() => {
          setIsEditTaskModalOpen(false);
          setTaskToEdit(null);
        }}
      />

      <AiTaskGenerationModal
        isOpen={isAiModalOpen}
        project={project}
        onClose={() => setIsAiModalOpen(false)}
      />

      <ViewTaskModal
        isOpen={isViewTaskModalOpen}
        task={taskToView}
        onClose={() => {
          setIsViewTaskModalOpen(false);
          setTaskToView(null);
        }}
      />
    </div>
  );
}