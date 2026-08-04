'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2, Folder } from 'lucide-react';
import CreateProjectModal from '@/components/CreateProjectModal';
import EditProjectModal from '@/components/EditProjectModal';
import {
  useProjectsQuery,
  useDeleteProjectMutation,
} from '@/hooks/useProjectsQuery';
import { useProfileQuery } from '@/hooks/useProfileQuery';

export default function Projects() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);

  // Custom Hooks React Query (remplace les useEffect / fetch complexes)
  const { data: userProfile } = useProfileQuery();
  const { data: projects = [], isLoading } = useProjectsQuery();
  const deleteProjectMutation = useDeleteProjectMutation();

  const currentUserId = userProfile?.id;

  const handleEditProject = (e, project) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectToEdit(project);
    setIsEditModalOpen(true);
  };

  const handleDeleteProject = (e, projectId, projectName) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      confirm(
        `Voulez-vous vraiment supprimer le projet "${projectName}" ? Cette action est irréversible.`
      )
    ) {
      deleteProjectMutation.mutate(projectId);
    }
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

  if (isLoading) {
    return (
      <div className="projects-container">
        <p>Chargement des projets...</p>
      </div>
    );
  }

  return (
    <div className="projects-container">
      <div className="projects-header">
        <div>
          <h1 className="projects-title">Mes projets</h1>
          <p className="projects-subtitle">Gérez vos projets</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus size={16} /> Créer un projet
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="projects-empty-state">
          <Folder size={48} className="empty-icon" />
          <p className="empty-title">Aucun projet trouvé</p>
          <p className="empty-subtitle">
            Vous n'êtes membre d'aucun projet pour le moment.
          </p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => {
            const otherMembers = (project.members || []).filter(
              (m) => m.user?.id !== project.ownerId
            );

            const isAdmin =
              project.userRole === 'ADMIN' || project.ownerId === currentUserId;

            // Calcul de la progression
            const tasksList = project.tasks || [];
            const totalTasks = tasksList.length;
            const completedTasks = tasksList.filter(
              (t) => t.status === 'DONE'
            ).length;
            const progress =
              totalTasks > 0
                ? Math.round((completedTasks / totalTasks) * 100)
                : 0;

            return (
              <Link
                href={`/projects/${project.id}`}
                key={project.id}
                className="project-card"
              >
                {isAdmin && (
                  <div className="project-card-actions">
                    <button
                      onClick={(e) => handleEditProject(e, project)}
                      className="card-action-btn edit-btn"
                      title="Modifier le projet"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={(e) =>
                        handleDeleteProject(e, project.id, project.name)
                      }
                      className="card-action-btn delete-btn"
                      title="Supprimer le projet"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                <h2 className="project-card-title">{project.name}</h2>
                <p className="project-card-desc">
                  {project.description ||
                    'Aucune description fournie pour ce projet.'}
                </p>

                <div className="project-progress-container">
                  <div className="project-progress-header">
                    <span>Progression</span>
                    <span className="progress-percentage">{progress}%</span>
                  </div>
                  <div className="project-progress-bar-bg">
                    <div
                      className="project-progress-bar-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="project-tasks-text">
                    {completedTasks}/{totalTasks} tâches terminées
                  </p>
                </div>

                <div className="project-team-container">
                  <p className="project-team-title">
                    Équipe ({1 + otherMembers.length})
                  </p>
                  <div className="project-team-members">
                    {project.owner && (
                      <div className="team-member-group">
                        <div
                          className="project-member-avatar owner-avatar"
                          style={{
                            backgroundColor: getAvatarColor(
                              project.owner.name || project.owner.email
                            ),
                          }}
                          title={`${project.owner.name || project.owner.email} (Propriétaire)`}
                        >
                          {getInitials(project.owner.name) ||
                            getInitials(project.owner.email)}
                        </div>
                        <span className="project-owner-badge">
                          Propriétaire
                        </span>
                      </div>
                    )}

                    {otherMembers.map((member) => (
                      <div
                        key={member.user?.id || member.id}
                        className="project-member-avatar"
                        style={{
                          backgroundColor: getAvatarColor(
                            member.user?.name || member.user?.email
                          ),
                        }}
                        title={`${member.user?.name || member.user?.email} (Contributeur)`}
                      >
                        {getInitials(member.user?.name) ||
                          getInitials(member.user?.email)}
                      </div>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <EditProjectModal
        isOpen={isEditModalOpen}
        project={projectToEdit}
        onClose={() => {
          setIsEditModalOpen(false);
          setProjectToEdit(null);
        }}
      />
    </div>
  );
}
