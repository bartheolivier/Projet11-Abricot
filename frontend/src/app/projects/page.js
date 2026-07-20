"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Folder } from "lucide-react";
import CreateProjectModal from "@/components/CreateProjectModal";
import EditProjectModal from "@/components/EditProjectModal";

export default function Projects() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  // États pour les modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);

  const fetchProfileAndProjects = async () => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (!token) {
        router.push("/");
        return;
      }

      // 1. Récupérer le profil pour avoir l'ID utilisateur
      const profileRes = await fetch("/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      let userId = null;
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        userId = profileData.data?.id;
        setCurrentUserId(userId);
      }

      // 2. Récupérer les projets
      const projectsRes = await fetch("/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!projectsRes.ok) {
        throw new Error("Erreur de récupération des projets");
      }

      const responseJson = await projectsRes.json();
      const rawProjects = responseJson.data?.projects || [];

      // 3. Récupérer les tâches de chaque projet en parallèle pour calculer la progression
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
              const completed = tasks.filter((t) => t.status === "DONE").length;
              return {
                ...project,
                totalTasks: total,
                completedTasks: completed,
                progress: total > 0 ? Math.round((completed / total) * 100) : 0,
              };
            }
          } catch (err) {
            console.error("Erreur tasks pour projet", project.id, err);
          }
          return {
            ...project,
            totalTasks: 0,
            completedTasks: 0,
            progress: 0,
          };
        })
      );

      setProjects(projectsWithProgress);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndProjects();
  }, []);

  const handleEditProject = (e, project) => {
    e.preventDefault(); // Empêcher le clic de naviguer vers les détails du projet
    e.stopPropagation();
    setProjectToEdit(project);
    setIsEditModalOpen(true);
  };

  const handleDeleteProject = async (e, projectId, projectName) => {
    e.preventDefault(); // Empêcher le clic de naviguer vers les détails
    e.stopPropagation();

    if (!confirm(`Voulez-vous vraiment supprimer le projet "${projectName}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (!token) return;

      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorJson = await response.json();
        throw new Error(errorJson.message || "Erreur de suppression du projet");
      }

      toast.success("Projet supprimé avec succès !");
      fetchProfileAndProjects(); // Rafraîchir la liste
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Génération stable de couleurs pastels pour les avatars
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
          <p className="projects-subtitle">Gerez vos projets</p>
        </div>
        <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={16} /> Créer un projet
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="projects-empty-state">
          <Folder size={48} className="empty-icon" />
          <p className="empty-title">Aucun projet trouvé</p>
          <p className="empty-subtitle">Vous n'êtes membre d'aucun projet pour le moment.</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => {
            // Filtrer les autres membres pour ne pas afficher le propriétaire deux fois
            const otherMembers = project.members.filter(
              (m) => m.user.id !== project.ownerId
            );

            // Vérifier si l'utilisateur actuel est ADMIN ou le propriétaire du projet
            const isAdmin = project.userRole === "ADMIN" || project.ownerId === currentUserId;

            return (
              <Link 
                href={`/projects/${project.id}`} 
                key={project.id} 
                className="project-card"
              >
                {/* Actions rapides réservées aux administrateurs */}
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
                      onClick={(e) => handleDeleteProject(e, project.id, project.name)}
                      className="card-action-btn delete-btn"
                      title="Supprimer le projet"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                <h2 className="project-card-title">{project.name}</h2>
                <p className="project-card-desc">
                  {project.description || "Aucune description fournie pour ce projet."}
                </p>

                {/* Section Progression */}
                <div className="project-progress-container">
                  <div className="project-progress-header">
                    <span>Progression</span>
                    <span className="progress-percentage">{project.progress}%</span>
                  </div>
                  <div className="project-progress-bar-bg">
                    <div 
                      className="project-progress-bar-fill" 
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <p className="project-tasks-text">
                    {project.completedTasks}/{project.totalTasks} tâches terminées
                  </p>
                </div>

                {/* Section Équipe */}
                <div className="project-team-container">
                  <p className="project-team-title">
                    Équipe ({1 + otherMembers.length})
                  </p>
                  <div className="project-team-members">
                    {/* Propriétaire */}
                    <div className="team-member-group">
                      <div 
                        className="project-member-avatar owner-avatar"
                        style={{ backgroundColor: getAvatarColor(project.owner.name || project.owner.email) }}
                        title={`${project.owner.name || project.owner.email} (Propriétaire)`}
                      >
                        {getInitials(project.owner.name) || getInitials(project.owner.email)}
                      </div>
                      <span className="project-owner-badge">Propriétaire</span>
                    </div>

                    {/* Autres Membres */}
                    {otherMembers.map((member) => (
                      <div 
                        key={member.user.id}
                        className="project-member-avatar"
                        style={{ backgroundColor: getAvatarColor(member.user.name || member.user.email) }}
                        title={`${member.user.name || member.user.email} (Contributeur)`}
                      >
                        {getInitials(member.user.name) || getInitials(member.user.email)}
                      </div>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Rendu des modales */}
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
