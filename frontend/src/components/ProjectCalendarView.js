"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Calendar as CalendarIcon } from "lucide-react";

export default function ProjectCalendarView({ tasks, onSelectTask }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  // Génération de la liste des années (-5 ans à +5 ans par rapport à l'année en cours)
  const currentYearNow = new Date().getFullYear();
  const yearsList = [];
  for (let y = currentYearNow - 5; y <= currentYearNow + 5; y++) {
    yearsList.push(y);
  }
  if (!yearsList.includes(year)) {
    yearsList.push(year);
    yearsList.sort((a, b) => a - b);
  }

  // Changements de mois et d'années
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handlePrevYear = () => {
    setCurrentDate(new Date(year - 1, month, 1));
  };

  const handleNextYear = () => {
    setCurrentDate(new Date(year + 1, month, 1));
  };

  const handleMonthChange = (e) => {
    const newMonth = parseInt(e.target.value, 10);
    setCurrentDate(new Date(year, newMonth, 1));
  };

  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value, 10);
    setCurrentDate(new Date(newYear, month, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Calculer la grille du calendrier
  const firstDayOfMonth = new Date(year, month, 1);
  let startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const calendarDays = [];

  // Jours du mois précédent
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevDate = new Date(year, month - 1, dayNum);
    const dateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}-${String(prevDate.getDate()).padStart(2, "0")}`;
    calendarDays.push({
      dayNumber: dayNum,
      dateStr,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    });
  }

  // Jours du mois en cours
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    calendarDays.push({
      dayNumber: d,
      dateStr,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
    });
  }

  // Jours du mois suivant
  const remainingCells = (7 - (calendarDays.length % 7)) % 7;
  for (let j = 1; j <= remainingCells; j++) {
    const nextDate = new Date(year, month + 1, j);
    const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(nextDate.getDate()).padStart(2, "0")}`;
    calendarDays.push({
      dayNumber: j,
      dateStr,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    });
  }

  // Regrouper les tâches par date (Format YYYY-MM-DD)
  const tasksByDate = {};
  (tasks || []).forEach((t) => {
    if (!t.dueDate) return;
    const d = new Date(t.dueDate);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!tasksByDate[dateKey]) {
      tasksByDate[dateKey] = [];
    }
    tasksByDate[dateKey].push(t);
  });

  const getStatusClass = (status) => {
    switch (status) {
      case "TODO":
        return "cal-badge-todo";
      case "IN_PROGRESS":
        return "cal-badge-progress";
      case "DONE":
        return "cal-badge-done";
      default:
        return "cal-badge-todo";
    }
  };

  return (
    <div className="project-calendar-container" role="region" aria-label="Calendrier du projet">
      {/* En-tête de navigation du calendrier */}
      <div className="calendar-header-nav">
        <div className="calendar-month-title">
          <CalendarIcon size={20} className="cal-header-icon" aria-hidden="true" />
          <div className="calendar-select-group">
            {/* Sélecteur de mois avec aria-label */}
            <select
              value={month}
              onChange={handleMonthChange}
              className="cal-header-select"
              aria-label="Sélectionner le mois"
            >
              {monthNames.map((mName, idx) => (
                <option key={idx} value={idx}>
                  {mName}
                </option>
              ))}
            </select>

            {/* Sélecteur d'année avec aria-label */}
            <select
              value={year}
              onChange={handleYearChange}
              className="cal-header-select year-select"
              aria-label="Sélectionner l'année"
            >
              {yearsList.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="calendar-nav-actions">
          <button className="btn-cal-today" onClick={handleToday} aria-label="Revenir à la date d'aujourd'hui">
            Aujourd'hui
          </button>
          
          <div className="btn-group-nav" role="group" aria-label="Navigation dans le temps">
            <button
              className="btn-cal-nav"
              onClick={handlePrevYear}
              aria-label="Année précédente (-1 an)"
              title="Année précédente (-1 an)"
            >
              <ChevronsLeft size={18} aria-hidden="true" />
            </button>
            <button
              className="btn-cal-nav"
              onClick={handlePrevMonth}
              aria-label="Mois précédent"
              title="Mois précédent"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              className="btn-cal-nav"
              onClick={handleNextMonth}
              aria-label="Mois suivant"
              title="Mois suivant"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
            <button
              className="btn-cal-nav"
              onClick={handleNextYear}
              aria-label="Année suivante (+1 an)"
              title="Année suivante (+1 an)"
            >
              <ChevronsRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Grille du calendrier */}
      <div className="calendar-grid">
        {/* Jours de la semaine */}
        <div className="calendar-weekdays-header" role="row">
          {dayNames.map((name, i) => (
            <div key={i} className="weekday-name" role="columnheader">
              {name}
            </div>
          ))}
        </div>

        {/* Cellules des jours */}
        <div className="calendar-days-grid">
          {calendarDays.map((day, idx) => {
            const dayTasks = tasksByDate[day.dateStr] || [];

            return (
              <div
                key={idx}
                className={`calendar-day-cell ${!day.isCurrentMonth ? "other-month" : ""} ${day.isToday ? "today-cell" : ""}`}
              >
                <div className="cell-day-header">
                  <span className={`day-number ${day.isToday ? "today-badge" : ""}`}>
                    {day.dayNumber}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="tasks-count-pill">
                      {dayTasks.length} {dayTasks.length > 1 ? "tâches" : "tâche"}
                    </span>
                  )}
                </div>

                {/* Liste des tâches du jour avec support clavier WCAG */}
                <div className="cell-tasks-list">
                  {dayTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`calendar-task-chip ${getStatusClass(task.status)}`}
                      onClick={() => onSelectTask && onSelectTask(task)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelectTask && onSelectTask(task);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Voir les détails de la tâche: ${task.title}`}
                      title={`${task.title} (${task.status})`}
                    >
                      <span className="chip-status-dot" aria-hidden="true" />
                      <span className="chip-task-title">{task.title}</span>
                    </div>
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
