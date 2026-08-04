'use client';

/**
 * =========================================================================================
 * PAGE LISTE DES PROJETS (PROJECTS OVERVIEW PAGE)
 * =========================================================================================
 * Fichier : src/app/projects/page.js
 * Rôle : Affiche la grille complète des projets auxquels l'utilisateur participe :
 *        1. En-tête "Mes projets" et sous-titre "Gérez vos projets" avec bouton "+ Créer un projet".
 *        2. Cartes de projets avec barre de progression ("Progression", "X/Y tâches terminées").
 *        3. Section équipe avec icône Users, avatar et badge "Propriétaire" + collaborateurs.
 *        4. Boutons d'édition et de suppression réservés aux administrateurs (RBAC).
 * =========================================================================================
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Folder, Users } from 'lucide-react';
import CreateProjectModal from '@/components/CreateProjectModal';
import EditProjectModal from '@/components/EditProjectModal';

export default function Projects() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  // États locaux de gestion des modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);

  /**
   * RÉCUPÉRATION DU PROFIL ET DE LA LISTE DES PROJETS AVEC PROGRESSION
   */
  const fetchProfileAndProjects = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        router.push('/');
        return;
      }

      // 1. Récupération de l'identifiant de l'utilisateur connecté
      const profileRes = await fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      let userId = null;
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        userId = profileData.data?.id;
        setCurrentUserId(userId);
      }

      // 2. Récupération des projets accessibles à l'utilisateur
      const projectsRes = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!projectsRes.ok) {
        throw new Error('Erreur de récupération des projets');
      }

      const responseJson = await projectsRes.json();
      const rawProjects = responseJson.data?.projects || [];

      // 3. Calcul parallèle du taux de complétion (% de tâches terminées) pour chaque projet
      const projectsWithProgress = await Promise.all(
        rawProjects.map(async (project) => {
          try {
            const tasksRes = await fetch(`/api/projects/${project.id}/tasks`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (tasksRes.ok) {
              const tasksJson = await tasksRes.json();
              const tasks = tasksJson.data?.tasks || [];
              const total = tasks.length;
              const done = tasks.filter((t) => t.status === 'DONE').length;
              const progress = total > 0 ? Math.round((done / total) * 100) : 0;
              return {
                ...project,
                progress,
                totalTasks: total,
                doneTasks: done,
              };
            }
          } catch (err) {
            console.error('Erreur calcul progression projet:', err);
          }
          return { ...project, progress: 0, totalTasks: 0, doneTasks: 0 };
        })
      );

      setProjects(projectsWithProgress);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndProjects();
  }, []);

  /**
   * SUPPRESSION D'UN PROJET (RÉSERVÉ AUX ADMINISTRATEURS)
   */
  const handleDeleteProject = async (e, projectId, projectName) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      !confirm(`Voulez-vous vraiment supprimer le projet "${projectName}" ?`)
    ) {
      return;
    }

    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('token='))
        ?.split('=')[1];

      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Impossible de supprimer ce projet');
      }

      toast.success('Projet supprimé avec succès.');
      fetchProfileAndProjects();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleEditClick = (e, project) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectToEdit(project);
    setIsEditModalOpen(true);
  };

  // Algorithme de génération de couleur d'avatar basée sur le nom
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
        <p className="loading-text">Chargement des projets...</p>
      </div>
    );
  }

  return (
    <div className="projects-container">
      {/* En-tête de la page projets conforme à la maquette */}
      <div className="projects-header">
        <div>
          <h1 className="projects-title">Mes projets</h1>
          <p className="projects-subtitle">Gérez vos projets</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus size={18} aria-hidden="true" /> Créer un projet
        </button>
      </div>

      {/* Grille des cartes de projets */}
      <div className="projects-grid">
        {projects.map((project) => {
          const isOwner = project.ownerId === currentUserId;
          const isAdmin = project.userRole === 'ADMIN' || isOwner;
          const otherMembers = (project.members || []).filter(
            (m) => (m.user?.id || m.id) !== project.ownerId
          );
          const totalTeamMembers = 1 + otherMembers.length;

          return (
            <Link
              href={`/projects/${project.id}`}
              key={project.id}
              className="project-card-link"
            >
              <div className="project-card">
                <div className="project-card-top">
                  <div className="project-icon-title">
                    <h2 className="project-card-title">{project.name}</h2>
                  </div>

                  {/* Boutons d'édition/suppression réservés aux administrateurs (RBAC) */}
                  {isAdmin && (
                    <div className="project-card-actions">
                      <button
                        className="card-action-btn"
                        onClick={(e) => handleEditClick(e, project)}
                        title="Modifier le projet"
                        aria-label={`Modifier le projet ${project.name}`}
                      >
                        <Edit2 size={16} aria-hidden="true" />
                      </button>
                      <button
                        className="card-action-btn delete-btn"
                        onClick={(e) =>
                          handleDeleteProject(e, project.id, project.name)
                        }
                        title="Supprimer le projet"
                        aria-label={`Supprimer le projet ${project.name}`}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="project-card-desc">
                  {project.description || 'Aucune description fournie.'}
                </p>

                {/* Barre de progression visuelle (%) */}
                <div className="project-progress-container">
                  <div className="project-progress-header">
                    <span>Progression</span>
                    <span className="progress-percentage">
                      {project.progress}%
                    </span>
                  </div>
                  <div className="project-progress-bar-bg">
                    <div
                      className="project-progress-bar-fill"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <span className="tasks-completed-text">
                    {project.doneTasks || 0}/{project.totalTasks || 0} tâches
                    terminées
                  </span>
                </div>

                {/* Liste des membres de l'équipe (Maquette avec badge Propriétaire) */}
                <div className="project-team-container">
                  <div className="project-team-header">
                    <Users size={14} aria-hidden="true" />
                    <span>Équipe ({totalTeamMembers})</span>
                  </div>
                  <div className="project-team-pills">
                    {project.owner && (
                      <div className="owner-pill-wrapper">
                        <div
                          className="project-member-avatar owner"
                          style={{ backgroundColor: '#ebdcd0' }}
                          title={`Propriétaire : ${project.owner.name || project.owner.email}`}
                        >
                          {getInitials(project.owner.name) ||
                            getInitials(project.owner.email)}
                        </div>
                        <span className="project-owner-pill">Propriétaire</span>
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
                        title={member.user?.name || member.user?.email}
                      >
                        {getInitials(member.user?.name) ||
                          getInitials(member.user?.email)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={fetchProfileAndProjects}
      />

      <EditProjectModal
        isOpen={isEditModalOpen}
        project={projectToEdit}
        onClose={() => {
          setIsEditModalOpen(false);
          setProjectToEdit(null);
        }}
        onProjectUpdated={fetchProfileAndProjects}
      />
    </div>
  );
}
