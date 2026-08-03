"use client";

/**
 * =========================================================================================
 * TABLEAU DE BORD PRINCIPAL (DASHBOARD PAGE)
 * =========================================================================================
 * Fichier : src/app/dashboard/page.js
 * Rôle : Affiche l'espace de travail principal de l'utilisateur connecté :
 *        1. Salutation personnalisée et statistiques globales.
 *        2. Bascule dynamique entre 2 vues : Vue "Liste" et Vue "Kanban".
 *        3. Barre de recherche et filtrage en temps réel des tâches assignées.
 *        4. Intégration des modales de création de projet et de consultation de tâche.
 * =========================================================================================
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LayoutList, Kanban, Plus, Folder, Calendar, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import CreateProjectModal from "@/components/CreateProjectModal";
import ViewTaskModal from "@/components/ViewTaskModal";

export default function Dashboard() {
  const router = useRouter();
  
  // ---------------------------------------------------------------------------------------
  // ÉTATS REACT (LOCAL STATE)
  // ---------------------------------------------------------------------------------------
  const [view, setView] = useState("list");                 // Mode d'affichage ("list" ou "kanban")
  const [tasks, setTasks] = useState([]);                   // Liste globale des tâches assignées à l'utilisateur
  const [searchQuery, setSearchQuery] = useState("");       // Mot-clé de recherche pour le filtre
  const [isLoading, setIsLoading] = useState(true);          // Indicateur de chargement réseau
  const [userName, setUserName] = useState("");             // Nom complet de l'utilisateur connecté
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // État de la modale Créer un projet
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);     // État de la modale Consulter une tâche
  const [taskToView, setTaskToView] = useState(null);               // Tâche sélectionnée pour la vue détaillée

  /**
   * Ouvre la modale de consultation de la tâche sélectionnée
   */
  const handleOpenViewModal = (task) => {
    setTaskToView(task);
    setIsViewModalOpen(true);
  };

  /**
   * RÉCUPÉRATION DU PROFIL UTILISATEUR
   * Interroge /api/auth/profile pour récupérer le nom de l'utilisateur connecté.
   */
  const fetchProfile = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      if (!token) return;

      const response = await fetch("/api/auth/profile", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const responseJson = await response.json();
        setUserName(responseJson.data?.name || "");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du profil", error);
    }
  };

  /**
   * RÉCUPÉRATION DES TÂCHES ASSIGNÉES
   * Interroge /api/dashboard/assigned-tasks pour charger les tâches de l'utilisateur.
   */
  const fetchTasks = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      const response = await fetch("/api/dashboard/assigned-tasks", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      // Si la session est expirée (401 Unauthorized), réinitialise le cookie et redirige vers /
      if (!response.ok) {
        if (response.status === 401) {
          document.cookie = "token=; path=/; max-age=0; SameSite=Strict";
          router.push("/"); 
          return;
        }
        throw new Error("Erreur lors de la récupération des tâches");
      }

      const responseJson = await response.json();
      setTasks(responseJson.data.tasks);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Chargement initial des données au montage du composant
  useEffect(() => {
    fetchProfile();
    fetchTasks();
  }, []);

  /**
   * Fonction utilitaire : Traduit le statut Enum de l'API en libellé français et classe CSS
   */
  const getStatusBadge = (status) => {
    switch(status) {
      case "TODO":
        return { class: "status-todo", text: "À faire" };
      case "IN_PROGRESS":
        return { class: "status-in-progress", text: "En cours" };
      case "DONE":
        return { class: "status-done", text: "Terminée" };
      default:
        return { class: "status-todo", text: status };
    }
  };

  // ---------------------------------------------------------------------------------------
  // FILTRAGE ET TRI DYNAMIQUES EN MÉMOIRE
  // ---------------------------------------------------------------------------------------
  
  // 1. Filtrage par mot-clé (Titre ou Description)
  const filteredTasks = tasks.filter((task) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const titleMatch = task.title && task.title.toLowerCase().includes(query);
    const descMatch = task.description && task.description.toLowerCase().includes(query);
    return titleMatch || descMatch;
  });

  // 2. Séparation par colonnes Kanban
  const todoTasks = filteredTasks.filter((t) => t.status === "TODO");
  const inProgressTasks = filteredTasks.filter((t) => t.status === "IN_PROGRESS");
  const doneTasks = filteredTasks.filter((t) => t.status === "DONE");

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <p className="loading-text">Chargement du tableau de bord...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* En-tête principal du tableau de bord */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Bonjour{userName ? `, ${userName}` : ""}</h1>
          <p className="dashboard-subtitle">Voici vos tâches du jour et l'avancement de vos projets</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-primary" 
            onClick={() => setIsCreateModalOpen(true)}
            aria-label="Créer un nouveau projet"
          >
            <Plus size={18} aria-hidden="true" /> Nouveau Projet
          </button>
        </div>
      </div>

      {/* Barre d'outils : Commutation de vue Liste / Kanban */}
      <div className="view-toggles" role="tablist" aria-label="Affichage des tâches">
        <button 
          className={`btn-toggle ${view === 'list' ? 'active' : ''}`}
          onClick={() => setView('list')}
          role="tab"
          aria-selected={view === 'list'}
        >
          <LayoutList size={18} aria-hidden="true" /> Liste
        </button>
        <button 
          className={`btn-toggle ${view === 'kanban' ? 'active' : ''}`}
          onClick={() => setView('kanban')}
          role="tab"
          aria-selected={view === 'kanban'}
        >
          <Kanban size={18} aria-hidden="true" /> Kanban
        </button>
      </div>

      {/* Rendu Conditionnel : Vue Liste OU Vue Kanban */}
      {view === "list" ? (
        <div className="task-list-container">
          <div className="task-list-header">
            <h2>Mes Tâches ({filteredTasks.length})</h2>
            
            {/* Barre de recherche instantanée */}
            <div className="search-bar">
              <input
                type="text"
                placeholder="Rechercher une tâche..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                aria-label="Rechercher une tâche"
              />
            </div>
          </div>

          <div className="task-list">
            {filteredTasks && filteredTasks.length > 0 ? (
              filteredTasks.map((task) => {
                const badge = getStatusBadge(task.status);
                
                return (
                  <div key={task.id} className="task-card">
                    <div>
                      <h3 className="task-title">{task.title}</h3>
                      <p className="task-desc">{task.description}</p>
                      
                      <div className="task-meta">
                        <span className="meta-item-inline">
                          <Folder size={14} aria-hidden="true" /> {task.project?.name || "Sans projet"}
                        </span>
                        {task.dueDate && (
                          <span className="meta-item-inline">
                            <Calendar size={14} aria-hidden="true" /> {new Date(task.dueDate).toLocaleDateString("fr-FR")}
                          </span>
                        )}
                        <span className="meta-item-inline">
                          <MessageSquare size={14} aria-hidden="true" /> {task.comments?.length || 0}
                        </span>
                      </div>
                    </div>

                    <div className="task-actions">
                      <span className={`badge-status ${badge.class}`}>
                        {badge.text}
                      </span>
                      <button 
                        className="btn-secondary"
                        onClick={() => handleOpenViewModal(task)}
                      >
                        Voir
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="empty-search-msg">
                {searchQuery.trim() 
                  ? `Aucune tâche ne correspond à la recherche "${searchQuery}".` 
                  : "Aucune tâche assignée pour le moment."}
              </p>
            )}
          </div>
        </div>
      ) : (
        /* VUE KANBAN (3 Colonnes : À faire, En cours, Terminées) */
        <div className="kanban-board">
          {/* Colonne "À faire" */}
          <div className="kanban-column">
            <div className="kanban-column-header">
              <h2>À faire</h2>
              <span className="kanban-column-count">{todoTasks.length}</span>
            </div>
            <div className="kanban-column-tasks">
              {todoTasks.map((task) => {
                const badge = getStatusBadge(task.status);
                return (
                  <div key={task.id} className="kanban-card">
                    <div className="kanban-card-header">
                      <h3 className="kanban-card-title">{task.title}</h3>
                      <span className={`badge-status ${badge.class}`}>
                        {badge.text}
                      </span>
                    </div>
                    <p className="kanban-card-desc">{task.description}</p>
                    <div className="kanban-card-meta">
                      <span className="meta-item-inline">
                        <Folder size={14} aria-hidden="true" /> {task.project?.name || "Sans projet"}
                      </span>
                      {task.dueDate && (
                        <span className="meta-item-inline">
                          <Calendar size={14} aria-hidden="true" /> {new Date(task.dueDate).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                      <span className="meta-item-inline">
                        <MessageSquare size={14} aria-hidden="true" /> {task.comments?.length || 0}
                      </span>
                    </div>
                    <div className="kanban-card-actions">
                      <button 
                        className="btn-secondary"
                        onClick={() => handleOpenViewModal(task)}
                      >
                        Voir
                      </button>
                    </div>
                  </div>
                );
              })}
              {todoTasks.length === 0 && (
                <p className="kanban-empty-msg">Aucune tâche À faire</p>
              )}
            </div>
          </div>

          {/* Colonne "En cours" */}
          <div className="kanban-column">
            <div className="kanban-column-header">
              <h2>En cours</h2>
              <span className="kanban-column-count">{inProgressTasks.length}</span>
            </div>
            <div className="kanban-column-tasks">
              {inProgressTasks.map((task) => {
                const badge = getStatusBadge(task.status);
                return (
                  <div key={task.id} className="kanban-card">
                    <div className="kanban-card-header">
                      <h3 className="kanban-card-title">{task.title}</h3>
                      <span className={`badge-status ${badge.class}`}>
                        {badge.text}
                      </span>
                    </div>
                    <p className="kanban-card-desc">{task.description}</p>
                    <div className="kanban-card-meta">
                      <span className="meta-item-inline">
                        <Folder size={14} aria-hidden="true" /> {task.project?.name || "Sans projet"}
                      </span>
                      {task.dueDate && (
                        <span className="meta-item-inline">
                          <Calendar size={14} aria-hidden="true" /> {new Date(task.dueDate).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                      <span className="meta-item-inline">
                        <MessageSquare size={14} aria-hidden="true" /> {task.comments?.length || 0}
                      </span>
                    </div>
                    <div className="kanban-card-actions">
                      <button 
                        className="btn-secondary"
                        onClick={() => handleOpenViewModal(task)}
                      >
                        Voir
                      </button>
                    </div>
                  </div>
                );
              })}
              {inProgressTasks.length === 0 && (
                <p className="kanban-empty-msg">Aucune tâche En cours</p>
              )}
            </div>
          </div>

          {/* Colonne "Terminées" */}
          <div className="kanban-column">
            <div className="kanban-column-header">
              <h2>Terminées</h2>
              <span className="kanban-column-count">{doneTasks.length}</span>
            </div>
            <div className="kanban-column-tasks">
              {doneTasks.map((task) => {
                const badge = getStatusBadge(task.status);
                return (
                  <div key={task.id} className="kanban-card">
                    <div className="kanban-card-header">
                      <h3 className="kanban-card-title">{task.title}</h3>
                      <span className={`badge-status ${badge.class}`}>
                        {badge.text}
                      </span>
                    </div>
                    <p className="kanban-card-desc">{task.description}</p>
                    <div className="kanban-card-meta">
                      <span className="meta-item-inline">
                        <Folder size={14} aria-hidden="true" /> {task.project?.name || "Sans projet"}
                      </span>
                      {task.dueDate && (
                        <span className="meta-item-inline">
                          <Calendar size={14} aria-hidden="true" /> {new Date(task.dueDate).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                      <span className="meta-item-inline">
                        <MessageSquare size={14} aria-hidden="true" /> {task.comments?.length || 0}
                      </span>
                    </div>
                    <div className="kanban-card-actions">
                      <button 
                        className="btn-secondary"
                        onClick={() => handleOpenViewModal(task)}
                      >
                        Voir
                      </button>
                    </div>
                  </div>
                );
              })}
              {doneTasks.length === 0 && (
                <p className="kanban-empty-msg">Aucune tâche terminée</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modale de création de projet */}
      <CreateProjectModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={() => {
          fetchTasks(); 
        }}
      />

      {/* Modale de consultation détaillée de tâche */}
      <ViewTaskModal
        isOpen={isViewModalOpen}
        task={taskToView}
        onClose={() => {
          setIsViewModalOpen(false);
          setTaskToView(null);
        }}
      />
    </div>
  );
}