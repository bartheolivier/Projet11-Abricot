import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { toast } from "sonner";

export function useProjectsQuery() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await api.getProjects();
      return res.data?.projects || [];
    },
  });
}

export function useProjectDetailsQuery(id) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.getProjectById(id);
      return res.data?.project || null;
    },
    enabled: !!id,
  });
}

export function useCreateProjectMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newProjectData) => api.createProject(newProjectData),
    onSuccess: () => {
      toast.success("Projet créé avec succès !");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      if (options.onSuccess) options.onSuccess();
    },
    onError: (err) => {
      toast.error(err.message || "Erreur lors de la création du projet.");
    },
  });
}

export function useUpdateProjectMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updateData) => api.updateProject(updateData),
    onSuccess: (data, variables) => {
      toast.success("Projet mis à jour avec succès !");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", variables.id] });
      if (options.onSuccess) options.onSuccess();
    },
    onError: (err) => {
      toast.error(err.message || "Erreur lors de la mise à jour du projet.");
    },
  });
}

export function useDeleteProjectMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId) => api.deleteProject(projectId),
    onSuccess: () => {
      toast.success("Projet supprimé avec succès !");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      if (options.onSuccess) options.onSuccess();
    },
    onError: (err) => {
      toast.error(err.message || "Erreur lors de la suppression du projet.");
    },
  });
}
