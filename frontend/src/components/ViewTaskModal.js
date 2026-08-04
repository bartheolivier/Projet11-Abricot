'use client';

import React, { useEffect } from 'react';
import {
  X,
  Calendar,
  Folder,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

export default function ViewTaskModal({ isOpen, task, onClose }) {
  // Verrouiller le défilement du fond + Gestion de la touche Échap (WCAG 2.1)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !task) return null;

  // Calcul des couleurs et initiales pour les avatars des collaborateurs
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (identifier) => {
    if (!identifier) return '#e0e0e0';
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      '#ffeaa7',
      '#fab1a0',
      '#ff7675',
      '#fd79a8',
      '#a29bfe',
      '#74b9ff',
      '#81ecec',
      '#55efc4',
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'TODO':
        return { label: 'À faire', className: 'badge-todo', icon: Clock };
      case 'IN_PROGRESS':
        return {
          label: 'En cours',
          className: 'badge-progress',
          icon: AlertCircle,
        };
      case 'DONE':
        return {
          label: 'Terminée',
          className: 'badge-done',
          icon: CheckCircle,
        };
      default:
        return { label: status, className: 'badge-todo', icon: Clock };
    }
  };

  const statusDetails = getStatusBadge(task.status);
  const StatusIcon = statusDetails.icon;

  // Extraire les collaborateurs assignés
  const assigneesList = (task.assignees || []).map((a) => a.user || a);

  // Formater la date d'échéance
  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    const d = new Date(dateString);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content view-task-modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title-view"
      >
        {/* Bouton fermer avec aria-label WCAG */}
        <button
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Fermer la modale de détails"
          title="Fermer"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <div className="view-modal-header">
          <h2 id="modal-title-view" className="modal-title">
            Détails de la tâche
          </h2>
        </div>

        <div className="view-modal-body">
          {/* Titre */}
          <div className="view-field-group">
            <label className="view-field-label">Titre</label>
            <p className="view-field-value title-value">{task.title}</p>
          </div>

          {/* Description */}
          <div className="view-field-group">
            <label className="view-field-label">Description</label>
            <div className="view-field-value desc-value">
              {task.description || 'Aucune description fournie.'}
            </div>
          </div>

          {/* Projet & Échéance */}
          <div className="view-fields-row">
            <div className="view-field-group">
              <label className="view-field-label">Projet associé</label>
              <div className="view-field-value inline-flex">
                <Folder size={16} className="field-icon" aria-hidden="true" />
                <span>{task.project?.name || 'Sans projet'}</span>
              </div>
            </div>

            <div className="view-field-group">
              <label className="view-field-label">Échéance</label>
              <div className="view-field-value inline-flex">
                <Calendar size={16} className="field-icon" aria-hidden="true" />
                <span>{formatDate(task.dueDate)}</span>
              </div>
            </div>
          </div>

          {/* Collaborateurs assignés */}
          <div className="view-field-group">
            <label className="view-field-label">
              Assigné à ({assigneesList.length})
            </label>
            {assigneesList.length > 0 ? (
              <div className="view-assignees-capsules-list">
                {assigneesList.map((user) => (
                  <div key={user.id || user.email} className="assignee-capsule">
                    <div
                      className="assignee-capsule-avatar"
                      style={{
                        backgroundColor: getAvatarColor(
                          user.name || user.email
                        ),
                      }}
                      aria-hidden="true"
                    >
                      {getInitials(user.name || user.email)}
                    </div>
                    <span className="assignee-capsule-name">
                      {user.name || user.email}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-assignees-text">Aucun collaborateur assigné</p>
            )}
          </div>

          {/* Statut de la tâche */}
          <div className="view-field-group">
            <label className="view-field-label">Statut</label>
            <div>
              <span className={`status-badge ${statusDetails.className}`}>
                <StatusIcon
                  size={14}
                  className="status-icon"
                  aria-hidden="true"
                />
                {statusDetails.label}
              </span>
            </div>
          </div>

          {/* Commentaires de la tâche */}
          <div className="view-field-group">
            <label className="view-field-label">
              Commentaires ({(task.comments || []).length})
            </label>
            {(task.comments || []).length > 0 ? (
              <div className="view-comments-list">
                {(task.comments || []).map((c, index) => {
                  const authorName =
                    c.user?.name ||
                    c.user?.email ||
                    c.author?.name ||
                    c.author?.email ||
                    'Utilisateur';
                  return (
                    <div key={c.id || index} className="view-comment-item">
                      <div
                        className="view-comment-avatar"
                        style={{ backgroundColor: getAvatarColor(authorName) }}
                        aria-hidden="true"
                      >
                        {getInitials(authorName)}
                      </div>
                      <div className="view-comment-content-box">
                        <div className="view-comment-meta">
                          <span className="view-comment-author">
                            {authorName}
                          </span>
                          {c.createdAt && (
                            <span className="view-comment-date">
                              {new Date(c.createdAt).toLocaleDateString(
                                'fr-FR'
                              )}
                            </span>
                          )}
                        </div>
                        <p className="view-comment-text">{c.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="no-assignees-text">
                Aucun commentaire pour le moment.
              </p>
            )}
          </div>
        </div>

        {/* Pied de modale */}
        <div className="view-modal-footer">
          <button
            type="button"
            className="modal-btn-close-only"
            onClick={onClose}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
