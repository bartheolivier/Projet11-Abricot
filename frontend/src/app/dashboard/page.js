"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LayoutList, Kanban, Plus, Folder, Calendar, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import CreateProjectModal from "@/components/CreateProjectModal";
import ViewTaskModal from "@/components/ViewTaskModal";

export default function Dashboard() {
  const router = useRouter();
  
  const [view, setView] = useState("list");
  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [taskToView, setTaskToView] = useState(null);

  const handleOpenViewModal = (task) => {
    setTaskToView(task);
    setIsViewModalOpen(true);
  };

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



  // Petite fonction utilitaire pour traduire le statut de l'API en classe CSS et en texte lisible
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

  const filteredTasks = tasks ? tasks.filter((t) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const titleMatch = t.title && t.title.toLowerCase().includes(query);
    const descMatch = t.description && t.description.toLowerCase().includes(query);
    const projectMatch = t.project?.name && t.project.name.toLowerCase().includes(query);
    return titleMatch || descMatch || projectMatch;
  }) : [];

  const todoTasks = filteredTasks.filter((t) => t.status === "TODO");
  const inProgressTasks = filteredTasks.filter((t) => t.status === "IN_PROGRESS");
  const doneTasks = filteredTasks.filter((t) => t.status === "DONE");

  return (
    <div className="dashboard-container">
      {/* En-tête */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Tableau de bord</h1>
          <p className="dashboard-subtitle">Bonjour {userName ? userName : "Utilisateur"}, voici un aperçu de vos projets et tâches</p>
        </div>
        
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} /> Créer un projet
          </button>
        </div>
      </div>

      {/* Boutons de bascule (Toggle) */}
      <div className="view-toggles">
        <button 
          onClick={() => setView("list")}
          className={`btn-toggle ${view === "list" ? "active" : ""}`}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.1111 7.82222C14.5778 7.82222 14.2222 8.17778 14.2222 8.71111V13.6889C14.2222 13.9556 13.9556 14.2222 13.6889 14.2222H2.31111C2.04444 14.2222 1.77778 13.9556 1.77778 13.6889V2.31111C1.77778 2.04444 2.04444 1.77778 2.31111 1.77778H10.8444C11.3778 1.77778 11.7333 1.42222 11.7333 0.888889C11.7333 0.355556 11.3778 0 10.8444 0H2.31111C1.06667 0 0 1.06667 0 2.31111V13.6889C0 14.9333 1.06667 16 2.31111 16H13.6889C14.9333 16 16 14.9333 16 13.6889V8.71111C16 8.26667 15.6444 7.82222 15.1111 7.82222Z" fill="currentColor"/>
            <path d="M6.84435 7.11113C6.48879 6.75558 5.95546 6.84447 5.5999 7.20002C5.33324 7.46669 5.33324 8.00002 5.5999 8.35558L7.55546 10.4C7.73324 10.5778 7.91101 10.6667 8.17768 10.6667C8.44435 10.6667 8.62212 10.5778 8.7999 10.4L14.8443 4.1778C15.1999 3.82224 15.1999 3.28891 14.8443 2.93335C14.4888 2.5778 13.9555 2.5778 13.5999 2.93335L8.17768 8.53335L6.84435 7.11113Z" fill="currentColor"/>
          </svg> Liste
        </button>
        <button 
          onClick={() => setView("kanban")}
          className={`btn-toggle ${view === "kanban" ? "active" : ""}`}
        >
          <svg width="15" height="17" viewBox="0 0 15 17" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4.42285 0C4.10746 0 3.8457 0.261761 3.8457 0.577148V1.17871C1.39505 1.38897 0 2.96789 0 5.57715V12.1152C0 14.9229 1.61522 16.538 4.42285 16.5381H10.5771C13.3847 16.538 15 14.9229 15 12.1152V5.57715C15 2.96794 13.6049 1.38901 11.1543 1.17871V0.577148C11.1543 0.261782 10.8925 3.47543e-05 10.5771 0C10.2618 0 10 0.261761 10 0.577148V1.15332H5V0.577148C5 0.261793 4.7382 5.25452e-05 4.42285 0ZM13.8457 12.1152C13.8457 14.3152 12.777 15.3847 10.5771 15.3848H4.42285C2.22293 15.3847 1.15332 14.3152 1.15332 12.1152V6.60742H13.8457V12.1152ZM10.4844 11.4082C10.1998 11.2852 9.86186 11.3541 9.64648 11.5693C9.61572 11.6078 9.57679 11.6461 9.55371 11.6846C9.52294 11.7307 9.49976 11.7771 9.48438 11.8232C9.46134 11.8693 9.44616 11.9159 9.43848 11.9697C9.43082 12.0157 9.42288 12.0693 9.42285 12.1152C9.42285 12.3152 9.50802 12.516 9.64648 12.6621C9.7926 12.8003 9.99256 12.8848 10.1924 12.8848C10.2923 12.8848 10.3922 12.8616 10.4844 12.8232C10.5765 12.7848 10.6615 12.7312 10.7383 12.6621C10.8075 12.5852 10.8619 12.5081 10.9004 12.4082C10.9389 12.3159 10.9619 12.2152 10.9619 12.1152C10.9618 11.9153 10.8767 11.7154 10.7383 11.5693C10.6614 11.5001 10.5766 11.4466 10.4844 11.4082ZM10.0381 8.66895C9.99208 8.67665 9.94639 8.69283 9.90039 8.71582C9.85434 8.73117 9.80777 8.75352 9.76172 8.78418C9.72332 8.8149 9.68489 8.84623 9.64648 8.87695C9.61572 8.9154 9.57679 8.95374 9.55371 8.99219C9.52294 9.03834 9.49976 9.08471 9.48438 9.13086C9.46134 9.17696 9.44616 9.22343 9.43848 9.26953C9.43081 9.32318 9.42288 9.3692 9.42285 9.42285C9.42285 9.62285 9.50802 9.82357 9.64648 9.96973C9.7926 10.108 9.99256 10.1924 10.1924 10.1924C10.2923 10.1924 10.3922 10.1693 10.4844 10.1309C10.5765 10.0925 10.6614 10.0388 10.7383 9.96973C10.8075 9.89286 10.8619 9.80804 10.9004 9.71582C10.9389 9.62351 10.9619 9.52285 10.9619 9.42285C10.9618 9.22293 10.8767 9.02305 10.7383 8.87695C10.6614 8.80777 10.5766 8.75426 10.4844 8.71582C10.3459 8.65431 10.1919 8.63818 10.0381 8.66895ZM8.0459 8.87695C7.83052 8.66172 7.48485 8.59282 7.20801 8.71582C7.10806 8.75426 7.03098 8.80778 6.9541 8.87695C6.8157 9.02304 6.73055 9.22294 6.73047 9.42285C6.73047 9.4767 6.7384 9.5233 6.74609 9.57715C6.75379 9.62325 6.76894 9.66972 6.79199 9.71582C6.80733 9.76177 6.83074 9.80757 6.86133 9.85352C6.8921 9.89198 6.92333 9.93126 6.9541 9.96973C7.03091 10.0388 7.10815 10.0925 7.20801 10.1309C7.30023 10.1693 7.4001 10.1924 7.5 10.1924C7.69983 10.1924 7.89978 10.108 8.0459 9.96973C8.07667 9.93126 8.1079 9.89198 8.13867 9.85352C8.16927 9.80756 8.19266 9.76177 8.20801 9.71582C8.23106 9.66972 8.2462 9.62325 8.25391 9.57715C8.2616 9.5233 8.26953 9.4767 8.26953 9.42285C8.26949 9.32299 8.2464 9.22305 8.20801 9.13086C8.16955 9.03855 8.11513 8.95388 8.0459 8.87695ZM10 2.88477C10.0001 3.20009 10.2618 3.46191 10.5771 3.46191C10.8925 3.46188 11.1542 3.20007 11.1543 2.88477V2.33789C12.9266 2.51306 13.806 3.53533 13.8418 5.4541H1.15723C1.193 3.53528 2.07336 2.51303 3.8457 2.33789V2.88477C3.84578 3.20009 4.10751 3.46191 4.42285 3.46191C4.73815 3.46186 4.99992 3.20006 5 2.88477V2.30762H10V2.88477Z" fill="currentColor"/>
          </svg> Kanban
        </button>
      </div>

      {/* Zone d'affichage des tâches */}
      <div className="tasks-display-area">
        {isLoading ? (
          <div className="tasks-container">
            <p>Chargement de vos tâches...</p>
          </div>
        ) : (
          <div>
            {view === "list" ? (
              <div className="tasks-container">
                <div className="task-list">
                  
                  {/* Champ de recherche */}
                  <div className="list-header">
                    <p className="list-title">
                      Mes tâches assignées<br/>
                      <span className="list-subtitle">Par ordre de priorité</span>
                    </p>
                    <input 
                      type="search" 
                      placeholder="Rechercher une tâche par titre, description ou projet..." 
                      className="search-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Boucle sur les tâches filtrées */}
                  {filteredTasks && filteredTasks.length > 0 ? (
                    filteredTasks.map((task) => {
                      const badge = getStatusBadge(task.status);
                      
                      return (
                        <div key={task.id} className="task-card">
                          <div>
                            <h3 className="task-title">{task.title}</h3>
                            <p className="task-desc">{task.description}</p>
                            
                            <div className="task-meta">
                              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                <Folder size={14} /> {task.project?.name || "Sans projet"}
                              </span>
                              {task.dueDate && (
                                <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                  <Calendar size={14} /> {new Date(task.dueDate).toLocaleDateString("fr-FR")}
                                </span>
                              )}
                              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                <MessageSquare size={14} /> {task.comments?.length || 0}
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
                    <p style={{ textAlign: "center", color: "#888", padding: "2rem" }}>
                      {searchQuery.trim() 
                        ? `Aucune tâche ne correspond à la recherche "${searchQuery}".` 
                        : "Aucune tâche assignée pour le moment."}
                    </p>
                  )}
                </div>
              </div>
            ) : (
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
                            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                              <Folder size={14} /> {task.project?.name || "Sans projet"}
                            </span>
                            {task.dueDate && (
                              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                <Calendar size={14} /> {new Date(task.dueDate).toLocaleDateString("fr-FR")}
                              </span>
                            )}
                            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                              <MessageSquare size={14} /> {task.comments?.length || 0}
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
                            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                              <Folder size={14} /> {task.project?.name || "Sans projet"}
                            </span>
                            {task.dueDate && (
                              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                <Calendar size={14} /> {new Date(task.dueDate).toLocaleDateString("fr-FR")}
                              </span>
                            )}
                            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                              <MessageSquare size={14} /> {task.comments?.length || 0}
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
                            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                              <Folder size={14} /> {task.project?.name || "Sans projet"}
                            </span>
                            {task.dueDate && (
                              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                <Calendar size={14} /> {new Date(task.dueDate).toLocaleDateString("fr-FR")}
                              </span>
                            )}
                            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                              <MessageSquare size={14} /> {task.comments?.length || 0}
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
                      <p className="kanban-empty-msg">Aucune tâche Terminée</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <CreateProjectModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onProjectCreated={() => {
          fetchTasks();
        }} 
      />

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