import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { toast } from "sonner";

export function useProjectTasksQuery(projectId) {
  return useQuery({
    queryKey: ["tasks", "project", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await api.getProjectTasks(projectId);
      return res.data?.tasks || [];
    },
    enabled: !!projectId,
  });
}

export function useUserAssignedTasksQuery() {
  return useQuery({
    queryKey: ["tasks", "assigned"],
    queryFn: async () => {
      const res = await api.getUserTasks();
      return res.data?.tasks || [];
    },
  });
}

export function useCreateTaskMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskData) => api.createTask(taskData),
    onSuccess: (data, variables) => {
      toast.success("Tâche créée avec succès !");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", "project", variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      if (options.onSuccess) options.onSuccess();
    },
    onError: (err) => {
      toast.error(err.message || "Erreur lors de la création de la tâche.");
    },
  });
}

export function useUpdateTaskMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskData) => api.updateTask(taskData),
    onSuccess: (data, variables) => {
      toast.success("Tâche mise à jour avec succès !");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      if (options.onSuccess) options.onSuccess();
    },
    onError: (err) => {
      toast.error(err.message || "Erreur lors de la mise à jour de la tâche.");
    },
  });
}

export function useDeleteTaskMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId) => api.deleteTask(taskId),
    onSuccess: () => {
      toast.success("Tâche supprimée avec succès !");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      if (options.onSuccess) options.onSuccess();
    },
    onError: (err) => {
      toast.error(err.message || "Erreur lors de la suppression de la tâche.");
    },
  });
}

export function useAddCommentMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentData) => api.addComment(commentData),
    onSuccess: (data, variables) => {
      toast.success("Commentaire ajouté !");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", "project", variables.projectId] });
      if (options.onSuccess) options.onSuccess();
    },
    onError: (err) => {
      toast.error(err.message || "Erreur lors de l'ajout du commentaire.");
    },
  });
}
