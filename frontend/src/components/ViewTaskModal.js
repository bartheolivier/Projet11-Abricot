'use client';

/**
 * =========================================================================================
 * MODALE DE CONSULTATION DÉTAILLÉE DE TÂCHE (VIEW TASK MODAL COMPONENT)
 * =========================================================================================
 * Fichier : src/components/ViewTaskModal.js
 * Rôle : Fenêtre modale en lecture seule permettant d'inspecter une tâche :
 *        1. Affichage du titre, de la description et du statut (badge sous le titre).
 *        2. Affichage du projet parent et de l'échéance.
 *        3. Affichage des membres assignés avec leurs initiales et couleurs d'avatar.
 *        4. Historique complet des commentaires avec les avatars des auteurs.
 *        5. Accessibilité WCAG 2.1 (Touche Échap, ARIA, Focus Trap).
 * =========================================================================================
 */

import React, { useEffect, useRef } from 'react';
import { X, Calendar, Folder } from 'lucide-react';

export default function ViewTaskModal({ isOpen, task, onClose }) {
  const modalRef = useRef(null);

  // Accessibilité WCAG 2.1 : Touche Échap, verrouillage du scroll et Focus Trap (Tab/Shift+Tab)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = Array.from(
          modalRef.current.querySelectorAll(
            'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter(
          (el) =>
            el.offsetWidth > 0 ||
            el.offsetHeight > 0 ||
            el === document.activeElement
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (
            document.activeElement === firstElement ||
            !modalRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (
            document.activeElement === lastElement ||
            !modalRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    if (isOpen) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);

      const timer = setTimeout(() => {
        if (modalRef.current) {
          const firstInput = modalRef.current.querySelector(
            'button:not([disabled]), a[href]'
          );
          if (firstInput) firstInput.focus();
        }
      }, 50);

      return () => {
        clearTimeout(timer);
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !task) return null;

  /**
   * Retourne le libellé et la classe CSS du badge de statut
   */
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

  /**
   * Formate une chaîne de date ISO en français (ex: "5 août 2026")
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'Aucune échéance';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Palette de couleurs et calcul des initiales pour les avatars
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

  const statusInfo = getStatusDetails(task.status);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className="modal-content view-task-modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title-view-task"
      >
        {/* Bouton de fermeture de la modale */}
        <button
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Fermer la vue détaillée de la tâche"
          title="Fermer"
        >
          <X size={20} aria-hidden="true" />
        </button>

        {/* En-tête de la modale : Titre de la tâche en premier, puis pastille de statut sous le titre */}
        <div className="view-modal-header">
          <h2 id="modal-title-view-task" className="modal-title">
            {task.title}
          </h2>
          <div className="view-modal-badge-wrapper">
            <span className={`status-badge ${statusInfo.className}`}>
              {statusInfo.label}
            </span>
          </div>
        </div>

        <div className="view-modal-body">
          {/* Métadonnées principales de la tâche (Projet, Échéance) */}
          <div className="task-detail-section">
            <div className="detail-row">
              <span className="detail-label">
                <Folder size={16} aria-hidden="true" /> Projet :
              </span>
              <span className="detail-value">
                {task.project?.name || 'Sans projet'}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-label">
                <Calendar size={16} aria-hidden="true" /> Échéance :
              </span>
              <span className="detail-value">{formatDate(task.dueDate)}</span>
            </div>
          </div>

          {/* Description complète de la tâche */}
          <div className="task-detail-section">
            <h3 className="section-subtitle">Description</h3>
            <p className="task-full-desc">
              {task.description ||
                'Aucune description fournie pour cette tâche.'}
            </p>
          </div>

          {/* Membres assignés avec pastilles et avatars */}
          {task.assignees && task.assignees.length > 0 && (
            <div className="task-detail-section">
              <h3 className="section-subtitle">
                Membres assignés ({task.assignees.length})
              </h3>
              <div className="assignees-capsules-list">
                {task.assignees.map((assignee) => {
                  const userObj = assignee.user || assignee;
                  const nameStr =
                    userObj.name || userObj.email || 'Utilisateur';
                  return (
                    <div
                      className="assignee-capsule"
                      key={userObj.id || userObj.email}
                    >
                      <div
                        className="assignee-capsule-avatar"
                        style={{ backgroundColor: getAvatarColor(nameStr) }}
                      >
                        {getInitials(nameStr)}
                      </div>
                      <span className="assignee-capsule-name">{nameStr}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section Historique des commentaires */}
          <div className="task-detail-section">
            <h3 className="section-subtitle">
              Commentaires ({task.comments?.length || 0})
            </h3>
            {task.comments && task.comments.length > 0 ? (
              <div className="comments-list">
                {task.comments.map((comment) => {
                  const authorObj = comment.author || comment.user || {};
                  const authorName =
                    authorObj.name || authorObj.email || 'Utilisateur';
                  return (
                    <div className="comment-item" key={comment.id}>
                      <div className="comment-header">
                        <div className="comment-author-info">
                          <div
                            className="comment-author-avatar"
                            style={{
                              backgroundColor: getAvatarColor(authorName),
                            }}
                          >
                            {getInitials(authorName)}
                          </div>
                          <span className="comment-author-name">
                            {authorName}
                          </span>
                        </div>
                        <span className="comment-date">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="comment-content">{comment.content}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="no-comments-text">
                Aucun commentaire sur cette tâche.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
