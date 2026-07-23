// Helper centralisé d'appels API REST avec injection automatique du Token JWT

const getTokenFromCookie = () => {
  if (typeof document === "undefined") return "";
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1] || "";
};

const fetchWithAuth = async (url, options = {}) => {
  const token = getTokenFromCookie();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(json.message || `Erreur requete API (${response.status})`);
  }

  return json;
};

// Fonctions d'appels API exportées
export const api = {
  // Profil
  getProfile: () => fetchWithAuth("/api/auth/profile"),

  // Projets
  getProjects: () => fetchWithAuth("/api/projects"),
  getProjectById: (id) => fetchWithAuth(`/api/projects/${id}`),
  createProject: (data) => fetchWithAuth("/api/projects", { method: "POST", body: JSON.stringify(data) }),
  updateProject: ({ id, ...data }) => fetchWithAuth(`/api/projects/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteProject: (id) => fetchWithAuth(`/api/projects/${id}`, { method: "DELETE" }),

  // Tâches
  getProjectTasks: (projectId) => fetchWithAuth(`/api/projects/${projectId}/tasks`),
  getUserTasks: () => fetchWithAuth("/api/dashboard/assigned-tasks"),
  getAssignedTasks: () => fetchWithAuth("/api/dashboard/assigned-tasks"),
  createTask: ({ projectId, ...data }) => fetchWithAuth(`/api/projects/${projectId}/tasks`, { method: "POST", body: JSON.stringify(data) }),
  updateTask: ({ id, ...data }) => fetchWithAuth(`/api/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTask: (id) => fetchWithAuth(`/api/tasks/${id}`, { method: "DELETE" }),
  addComment: ({ projectId, taskId, content }) => fetchWithAuth(`/api/projects/${projectId}/tasks/${taskId}/comments`, { method: "POST", body: JSON.stringify({ content }) }),

  // Utilisateurs
  searchUsers: (query) => fetchWithAuth(`/api/users/search?query=${encodeURIComponent(query)}`),
};
