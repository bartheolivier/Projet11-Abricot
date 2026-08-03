"use client";

/**
 * =========================================================================================
 * VUE CALENDRIER INTERACTIVE DES TÂCHES (PROJECT CALENDAR VIEW COMPONENT)
 * =========================================================================================
 * Fichier : src/components/ProjectCalendarView.js
 * Rôle : Composant de visualisation sous forme de calendrier mensuel interactif :
 *        1. Navigation par mois et par année.
 *        2. Placement automatique des tâches sur leurs jours d'échéance respectifs (`dueDate`).
 *        3. Badges de couleur par statut (À faire, En cours, Terminée).
 *        4. Clic sur une tâche pour ouvrir la modale de consultation détaillée.
 * =========================================================================================
 */

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export default function ProjectCalendarView({ tasks, onSelectTask }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  // Génération de la liste déroulante des années (-5 ans à +5 ans)
  const currentYearNow = new Date().getFullYear();
  const yearsList = [];
  for (let y = currentYearNow - 5; y <= currentYearNow + 5; y++) {
    yearsList.push(y);
  }
  if (!yearsList.includes(year)) {
    yearsList.push(year);
    yearsList.sort((a, b) => a - b);
  }

  // Fonctions de navigation dans le calendrier
  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handlePrevYear = () => setCurrentDate(new Date(year - 1, month, 1));
  const handleNextYear = () => setCurrentDate(new Date(year + 1, month, 1));

  const handleMonthChange = (e) => {
    const newMonth = parseInt(e.target.value, 10);
    setCurrentDate(new Date(year, newMonth, 1));
  };

  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value, 10);
    setCurrentDate(new Date(newYear, month, 1));
  };

  // Calcul du nombre de jours et du jour de démarrage dans la grille mensuelle
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const totalDays = lastDayOfMonth.getDate();

  // En JS, dimanche = 0, lundi = 1. On ajuste pour démarrer à lundi = 0
  let startingDay = firstDayOfMonth.getDay() - 1;
  if (startingDay === -1) startingDay = 6;

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();

  /**
   * Associe les tâches de la liste à chaque jour du mois selon leur date d'échéance `dueDate`
   */
  const getTasksForDay = (day) => {
    return tasks.filter((t) => {
      if (!t.dueDate) return false;
      const taskDate = new Date(t.dueDate);
      return (
        taskDate.getFullYear() === year &&
        taskDate.getMonth() === month &&
        taskDate.getDate() === day
      );
    });
  };

  const getBadgeClass = (status) => {
    switch (status) {
      case "TODO":
        return "cal-badge-todo";
      case "IN_PROGRESS":
        return "cal-badge-progress";
      case "DONE":
        return "cal-badge-done";
      default:
        return "cal-badge-default";
    }
  };

  return (
    <div className="calendar-view-container">
      {/* En-tête de la barre de navigation du calendrier */}
      <div className="calendar-controls-header">
        <div className="calendar-nav-buttons">
          <button onClick={handlePrevYear} className="cal-btn" title="Année précédente" aria-label="Année précédente">
            <ChevronsLeft size={16} aria-hidden="true" />
          </button>
          <button onClick={handlePrevMonth} className="cal-btn" title="Mois précédent" aria-label="Mois précédent">
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Sélecteurs déroulants du Mois et de l'Année */}
        <div className="calendar-selectors">
          <select 
            value={month} 
            onChange={handleMonthChange}
            className="cal-select month-select"
            aria-label="Sélectionner le mois"
          >
            {monthNames.map((name, index) => (
              <option key={index} value={index}>
                {name}
              </option>
            ))}
          </select>

          <select 
            value={year} 
            onChange={handleYearChange}
            className="cal-select year-select"
            aria-label="Sélectionner l'année"
          >
            {yearsList.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="calendar-nav-buttons">
          <button onClick={handleNextMonth} className="cal-btn" title="Mois suivant" aria-label="Mois suivant">
            <ChevronRight size={16} aria-hidden="true" />
          </button>
          <button onClick={handleNextYear} className="cal-btn" title="Année suivante" aria-label="Année suivante">
            <ChevronsRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Grille du calendrier */}
      <div className="calendar-grid">
        {/* Noms des jours de la semaine */}
        <div className="calendar-weekdays-header">
          {dayNames.map((d) => (
            <div key={d} className="weekday-name">{d}</div>
          ))}
        </div>

        {/* Cases des jours du mois */}
        <div className="calendar-days-grid">
          {/* Cases vides pour combler le début de semaine */}
          {Array.from({ length: startingDay }).map((_, idx) => (
            <div key={`empty-${idx}`} className="calendar-day-cell empty" />
          ))}

          {/* Cases réelles des jours du mois */}
          {Array.from({ length: totalDays }).map((_, idx) => {
            const dayNum = idx + 1;
            const dayTasks = getTasksForDay(dayNum);
            const isToday = isCurrentMonth && todayDate === dayNum;

            return (
              <div 
                key={dayNum} 
                className={`calendar-day-cell ${isToday ? "today" : ""}`}
              >
                <div className="day-number-header">
                  <span className="day-number">{dayNum}</span>
                </div>

                <div className="day-tasks-list">
                  {dayTasks.map((t) => (
                    <button
                      key={t.id}
                      className={`cal-task-pill ${getBadgeClass(t.status)}`}
                      onClick={() => onSelectTask(t)}
                      title={t.title}
                      aria-label={`Tâche : ${t.title}`}
                    >
                      <span className="cal-task-title">{t.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
