"use client";

/**
 * =========================================================================================
 * PAGE TABLEAU DE BORD (DASHBOARD PAGE COMPONENT)
 * =========================================================================================
 * Fichier : src/app/dashboard/page.js
 * Rôle : Page d'accueil authentifiée affichant les tâches assignées à l'utilisateur :
 *        1. En-tête principal et message de bienvenue personnalisés.
 *        2. Bouton "+ Créer un projet" ouvrant la modale de création.
 *        3. Commutateur de vue interactif (Vue Liste vs Vue Kanban).
 *        4. Panneau conteneur blanc avec barre de recherche (icône loupe) et tâches sous forme de cartes.
 *        5. Alignement exact à la maquette officielle (Badge en haut à droite, bouton Voir en bas à droite).
 * =========================================================================================
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, LayoutList, Kanban, Folder, Calendar, MessageSquare, Search } from "lucide-react";

import CreateProjectModal from "@/components/CreateProjectModal";
import ViewTaskModal from "@/components/ViewTaskModal";

export default function Dashboard() {
  const router = useRouter();

  // États locaux de données et d'affichage
  const [userName, setUserName] = useState("");
  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState("list"); // "list" ou "kanban"
  const [isLoading, setIsLoading] = useState(true);

  // États locaux de gestion des modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [taskToView, setTaskToView] = useState(null);

  /**
   * Ouvre la modale de consultation de la tâche sélectionnée
   */
  const handleOpenViewModal = (task) => {
    setTaskToView(task);
    setIsViewModalOpen(true);
  };

  /**
   * RÉCUPÉRATION DU PROFIL UTILISATEUR
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

  useEffect(() => {
    fetchProfile();
    fetchTasks();
  }, []);

  /**
   * Transcrit le code statut backend en libellé et classe CSS de badge
   */
  const getStatusBadge = (status) => {
    switch (status) {
      case "TODO":
        return { text: "À faire", class: "status-todo" };
      case "IN_PROGRESS":
        return { text: "En cours", class: "status-in-progress" };
      case "DONE":
        return { text: "Terminée", class: "status-done" };
      case "CANCELLED":
        return { text: "Annulée", class: "status-cancelled" };
      default:
        return { text: status, class: "" };
    }
  };

  // Filtrage dynamique des tâches par titre ou description
  const filteredTasks = tasks.filter((task) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const titleMatch = task.title?.toLowerCase().includes(query);
    const descMatch = task.description?.toLowerCase().includes(query);
    const projMatch = task.project?.name?.toLowerCase().includes(query);
    return titleMatch || descMatch || projMatch;
  });

  // Repartition des tâches pour la Vue Kanban
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
      {/* En-tête principal du tableau de bord conforme aux maquettes */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Tableau de bord</h1>
          <p className="dashboard-subtitle">
            Bonjour {userName || "Alice Dupont"}, voici un aperçu de vos projets et tâches
          </p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-primary" 
            onClick={() => setIsCreateModalOpen(true)}
            aria-label="Créer un projet"
          >
            <Plus size={18} aria-hidden="true" /> Créer un projet
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
          <div className="list-header">
            <div>
              <h2 className="list-title">Mes tâches assignées</h2>
              <p className="list-subtitle">Par ordre de priorité</p>
            </div>
            
            {/* Barre de recherche instantanée avec loupe à droite */}
            <div className="search-bar-wrapper">
              <input
                type="text"
                placeholder="Rechercher une tâche"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input-mockup"
                aria-label="Rechercher une tâche"
              />
              <Search size={16} className="search-input-icon" aria-hidden="true" />
            </div>
          </div>

          <div className="task-list">
            {filteredTasks && filteredTasks.length > 0 ? (
              filteredTasks.map((task) => {
                const badge = getStatusBadge(task.status);
                return (
                  <div key={task.id} className="task-card-mockup">
                    {/* Ligne supérieure : Titre à gauche, pastille de statut en haut à droite */}
                    <div className="task-card-top-row">
                      <h3 className="task-card-title-text">{task.title}</h3>
                      <span className={`badge-status ${badge.class}`}>
                        {badge.text}
                      </span>
                    </div>

                    {/* Ligne médiane : Description */}
                    <p className="task-card-desc-text">
                      {task.description || "Aucune description fournie."}
                    </p>
                    
                    {/* Ligne inférieure : Métadonnées à gauche, bouton "Voir" noir en bas à droite */}
                    <div className="task-card-bottom-row">
                      <div className="task-card-meta-items">
                        <span className="meta-item-inline">
                          <Folder size={14} aria-hidden="true" /> {task.project?.name || "Sans projet"}
                        </span>
                        <span className="meta-separator">|</span>
                        {task.dueDate && (
                          <>
                            <span className="meta-item-inline">
                              <Calendar size={14} aria-hidden="true" /> {new Date(task.dueDate).toLocaleDateString("fr-FR")}
                            </span>
                            <span className="meta-separator">|</span>
                          </>
                        )}
                        <span className="meta-item-inline">
                          <MessageSquare size={14} aria-hidden="true" /> {task.comments?.length || 0}
                        </span>
                      </div>

                      <button 
                        className="btn-voir-mockup" 
                        onClick={() => handleOpenViewModal(task)}
                        aria-label={`Voir les détails de la tâche ${task.title}`}
                      >
                        Voir
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <p className="empty-search-msg">Aucune tâche assignée correspondant à vos critères.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Vue Kanban avec colonnes À faire, En cours et Terminées */
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
                    <div className="kanban-card-footer">
                      <button 
                        className="btn-secondary" 
                        onClick={() => handleOpenViewModal(task)}
                        aria-label={`Voir les détails de la tâche ${task.title}`}
                      >
                        Voir
                      </button>
                    </div>
                  </div>
                );
              })}
              {todoTasks.length === 0 && (
                <div className="kanban-empty-column">Aucune tâche à faire</div>
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
                    <div className="kanban-card-footer">
                      <button 
                        className="btn-secondary" 
                        onClick={() => handleOpenViewModal(task)}
                        aria-label={`Voir les détails de la tâche ${task.title}`}
                      >
                        Voir
                      </button>
                    </div>
                  </div>
                );
              })}
              {inProgressTasks.length === 0 && (
                <div className="kanban-empty-column">Aucune tâche en cours</div>
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
                    <div className="kanban-card-footer">
                      <button 
                        className="btn-secondary" 
                        onClick={() => handleOpenViewModal(task)}
                        aria-label={`Voir les détails de la tâche ${task.title}`}
                      >
                        Voir
                      </button>
                    </div>
                  </div>
                );
              })}
              {doneTasks.length === 0 && (
                <div className="kanban-empty-column">Aucune tâche terminée</div>
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