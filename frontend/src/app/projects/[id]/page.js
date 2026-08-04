'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  LayoutList,
  ChevronDown,
  ChevronUp,
  Plus,
  Sparkles,
  MoreHorizontal,
  Send,
  Loader2,
} from 'lucide-react';
import EditProjectModal from '@/components/EditProjectModal';
import CreateTaskModal from '@/components/CreateTaskModal';
import EditTaskModal from '@/components/EditTaskModal';
import AiTaskGenerationModal from '@/components/AiTaskGenerationModal';
import ViewTaskModal from '@/components/ViewTaskModal';
import ProjectCalendarView from '@/components/ProjectCalendarView';
import { useProjectDetailsQuery } from '@/hooks/useProjectsQuery';
import {
  useProjectTasksQuery,
  useDeleteTaskMutation,
  useAddCommentMutation,
} from '@/hooks/useTasksQuery';
import { useProfileQuery } from '@/hooks/useProfileQuery';

export default function ProjectDetails({ params }) {
  const { id: projectId } = use(params);

  // Custom Hooks React Query
  const { data: userProfile } = useProfileQuery();
  const { data: project, isLoading: isProjectLoading } =
    useProjectDetailsQuery(projectId);
  const { data: tasks = [], isLoading: isTasksLoading } =
    useProjectTasksQuery(projectId);

  const deleteTaskMutation = useDeleteTaskMutation();
  const addCommentMutation = useAddCommentMutation();

  const currentUserId = userProfile?.id;

  // États pour les modales
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [activeView, setActiveView] = useState('list');
  const [isViewTaskModalOpen, setIsViewTaskModalOpen] = useState(false);
  const [taskToView, setTaskToView] = useState(null);

  // États pour filtre et recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeTaskMenu, setActiveTaskMenu] = useState(null);

  // États pour les commentaires
  const [expandedComments, setExpandedComments] = useState({});
  const [newComments, setNewComments] = useState({});

  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (
        !e.target.closest('.task-menu-btn') &&
        !e.target.closest('.task-action-dropdown-menu')
      ) {
        setActiveTaskMenu(null);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
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
          setNewComments((prev) => ({ ...prev, [taskId]: '' }));
        },
      }
    );
  };

  const getStatusDetails = (status) => {
    switch (status) {
      case 'TODO':
        return { label: 'À faire', className: 'badge-todo' };
      case 'IN_PROGRESS':
        return { label: 'En cours', className: 'badge-progress' };
      case 'DONE':
        return { label: 'Terminée', className: 'badge-done' };
      case 'CANCELLED':
        return { label: 'Annulée', className: 'badge-cancelled' };
      default:
        return { label: status, className: '' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Aucune';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  };

  const colors = [
    '#ffe8d6',
    '#e2ece9',
    '#f0efeb',
    '#ddbea9',
    '#a8dadc',
    '#f4a261',
  ];
  const getAvatarColor = (name) => {
    if (!name) return colors[0];
    const charCodeSum = name
      .split('')
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[charCodeSum % colors.length];
  };

  const getInitials = (name) => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0] ? parts[0].substring(0, 2).toUpperCase() : '';
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
        <Link href="/projects" className="btn-secondary">
          Retour aux projets
        </Link>
      </div>
    );
  }

  const otherMembers = (project.members || []).filter(
    (m) => (m.user?.id || m.id) !== project.ownerId
  );
  const isAdmin =
    project.userRole === 'ADMIN' || project.ownerId === currentUserId;

  return (
    <div className="project-details-container">
      {/* Ligne d'en-tête principale */}
      <div className="project-details-header">
        <div className="title-section-wrapper">
          <Link
            href="/projects"
            className="btn-back"
            title="Retour aux projets"
          >
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
              {project.description || 'Aucune description fournie.'}
            </p>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="btn-primary"
            onClick={() => setIsCreateTaskModalOpen(true)}
          >
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
          Contributeurs{' '}
          <span className="light-text">
            {1 + otherMembers.length} personnes
          </span>
        </span>
        <div className="contributors-list">
          {project.owner && (
            <div className="contributor-capsule">
              <div
                className="capsule-avatar"
                style={{
                  backgroundColor: getAvatarColor(
                    project.owner.name || project.owner.email
                  ),
                }}
              >
                {getInitials(project.owner.name) ||
                  getInitials(project.owner.email)}
              </div>
              <span className="capsule-name owner-badge">Propriétaire</span>
            </div>
          )}

          {otherMembers.map((member) => (
            <div
              className="contributor-capsule"
              key={member.user?.id || member.id}
            >
              <div
                className="capsule-avatar"
                style={{
                  backgroundColor: getAvatarColor(
                    member.user?.name || member.user?.email
                  ),
                }}
              >
                {getInitials(member.user?.name) ||
                  getInitials(member.user?.email)}
              </div>
              <span className="capsule-name">
                {member.user?.name || member.user?.email}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Liste des Tâches */}
      <div className="tasks-section-card">
        <div className="tasks-section-header">
          <div>
            <h2 className="tasks-section-title">Tâches</h2>
            <p className="tasks-section-subtitle">Par ordre de priorité</p>
          </div>

          <div className="tasks-section-controls">
            <div className="segmented-toggle">
              <button
                className={`segmented-btn ${activeView === 'list' ? 'active' : ''}`}
                onClick={() => setActiveView('list')}
              >
                <LayoutList size={16} /> Liste
              </button>
              <button
                className={`segmented-btn ${activeView === 'calendar' ? 'active' : ''}`}
                onClick={() => setActiveView('calendar')}
              >
                <Calendar size={16} /> Calendrier
              </button>
            </div>

            <div className="control-select">
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
              <ChevronDown size={14} className="control-select-icon" />
            </div>

            <div className="control-search">
              <input
                type="text"
                placeholder="Rechercher une tâche"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Vue Liste ou Vue Calendrier */}
        {(() => {
          const filteredTasks = tasks.filter((t) => {
            if (statusFilter !== 'ALL' && t.status !== statusFilter) {
              return false;
            }
            const query = searchQuery.trim().toLowerCase();
            if (!query) return true;
            const titleMatch = t.title && t.title.toLowerCase().includes(query);
            const descMatch =
              t.description && t.description.toLowerCase().includes(query);
            return titleMatch || descMatch;
          });

          if (activeView === 'calendar') {
            return (
              <ProjectCalendarView
                tasks={filteredTasks}
                onSelectTask={(task) => {
                  setTaskToView(task);
                  setIsViewTaskModalOpen(true);
                }}
              />
            );
          }

          if (filteredTasks.length === 0) {
            return (
              <div className="tasks-empty-state">
                <p className="empty-title">
                  {tasks.length === 0 ? 'Aucune tâche' : 'Aucun résultat'}
                </p>
                <p className="empty-subtitle">
                  {tasks.length === 0
                    ? "Il n'y a pas encore de tâche dans ce projet."
                    : 'Aucune tâche ne correspond au filtre et au mot-clé sélectionnés.'}
                </p>
              </div>
            );
          }

          return (
            <div className="project-tasks-list">
              {filteredTasks.map((task) => {
                const status = getStatusDetails(task.status);
                const isCommentsOpen = !!expandedComments[task.id];
                const isTaskCreator =
                  task.creatorId === currentUserId ||
                  task.creator?.id === currentUserId;
                const canManageTask = isAdmin || isTaskCreator;

                return (
                  <div key={task.id} className="task-card">
                    {/* Titre de tâche et badges */}
                    <div className="task-card-header">
                      <div className="task-title-group">
                        <h3 className="task-card-title">{task.title}</h3>
                        <span className={`status-badge ${status.className}`}>
                          {status.label}
                        </span>
                      </div>

                      {canManageTask && (
                        <>
                          <button
                            className="task-menu-btn"
                            onClick={(e) => handleToggleMenu(e, task.id)}
                            title="Actions"
                          >
                            <MoreHorizontal size={18} />
                          </button>

                          {activeTaskMenu === task.id && (
                            <div className="task-action-dropdown-menu">
                              <button
                                onClick={(e) => handleEditTaskClick(e, task)}
                                className="dropdown-menu-item"
                              >
                                Modifier
                              </button>
                              <button
                                onClick={(e) =>
                                  handleDeleteTask(e, task.id, task.title)
                                }
                                className="dropdown-menu-item delete"
                              >
                                Supprimer
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <p className="task-card-desc">
                      {task.description || 'Aucune description fournie.'}
                    </p>

                    <div className="task-card-meta">
                      <div className="meta-item">
                        <span className="meta-label">Échéance :</span>
                        <Calendar size={14} className="meta-icon" />
                        <span className="meta-value">
                          {formatDate(task.dueDate)}
                        </span>
                      </div>

                      {task.assignees && task.assignees.length > 0 && (
                        <div className="meta-item assignees-meta">
                          <span className="meta-label">Assigné à :</span>
                          <div className="assignees-capsules-list">
                            {task.assignees.map((assignee) => {
                              const userObj = assignee.user || assignee;
                              return (
                                <div
                                  className="assignee-capsule"
                                  key={userObj.id || userObj.email}
                                >
                                  <div
                                    className="assignee-capsule-avatar"
                                    style={{
                                      backgroundColor: getAvatarColor(
                                        userObj.name || userObj.email
                                      ),
                                    }}
                                  >
                                    {getInitials(userObj.name) ||
                                      getInitials(userObj.email)}
                                  </div>
                                  <span className="assignee-capsule-name">
                                    {userObj.name || userObj.email}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Section Commentaires Rétractable */}
                    <div className="task-comments-section">
                      <button
                        onClick={() => toggleComments(task.id)}
                        className="comments-toggle-btn"
                      >
                        <span>Commentaires ({task.comments?.length || 0})</span>
                        {isCommentsOpen ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>

                      {isCommentsOpen && (
                        <div className="comments-expanded-content">
                          {/* Liste des commentaires */}
                          {task.comments && task.comments.length > 0 ? (
                            <div className="comments-list">
                              {task.comments.map((comment) => {
                                const authorObj =
                                  comment.author || comment.user || {};
                                const authorName =
                                  authorObj.name ||
                                  authorObj.email ||
                                  'Utilisateur';
                                return (
                                  <div
                                    className="comment-item"
                                    key={comment.id}
                                  >
                                    <div className="comment-header">
                                      <div className="comment-author-info">
                                        <div
                                          className="comment-author-avatar"
                                          style={{
                                            backgroundColor:
                                              getAvatarColor(authorName),
                                          }}
                                        >
                                          {getInitials(authorName)}
                                        </div>
                                        <span className="comment-author-name">
                                          {authorName}
                                        </span>
                                      </div>
                                      <span className="comment-date">
                                        Le {formatDate(comment.createdAt)}
                                      </span>
                                    </div>
                                    <p className="comment-content">
                                      {comment.content}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="no-comments-text">
                              Aucun commentaire pour le moment.
                            </p>
                          )}

                          {/* Formulaire d'ajout de commentaire */}
                          <form
                            onSubmit={(e) => handleAddComment(e, task.id)}
                            className="comment-form"
                          >
                            <input
                              type="text"
                              placeholder="Écrivez un commentaire..."
                              value={newComments[task.id] || ''}
                              onChange={(e) =>
                                handleCommentChange(task.id, e.target.value)
                              }
                              className="comment-input"
                              required
                            />
                            <button
                              type="submit"
                              className="comment-submit-btn"
                              disabled={addCommentMutation.isPending}
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
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

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
