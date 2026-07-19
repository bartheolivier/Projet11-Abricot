import { Role } from "../types";
import prisma from "../lib/prisma";

/**
 * Vérifie si un utilisateur a accès à un projet
 * @param userId - ID de l'utilisateur
 * @param projectId - ID du projet
 * @returns true si l'utilisateur a accès, false sinon
 */
export const hasProjectAccess = async (
  userId: string,
  projectId: string
): Promise<boolean> => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId: userId,
              },
            },
          },
        ],
      },
    });

    return !!project;
  } catch (error) {
    console.error("Erreur lors de la vérification d'accès au projet:", error);
    return false;
  }
};

/**
 * Vérifie si un utilisateur est administrateur d'un projet
 * @param userId - ID de l'utilisateur
 * @param projectId - ID du projet
 * @returns true si l'utilisateur est admin, false sinon
 */
export const isProjectAdmin = async (
  userId: string,
  projectId: string
): Promise<boolean> => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId: userId,
                role: Role.ADMIN,
              },
            },
          },
        ],
      },
    });

    return !!project;
  } catch (error) {
    console.error("Erreur lors de la vérification des droits d'admin:", error);
    return false;
  }
};

/**
 * Vérifie si un utilisateur est propriétaire d'un projet
 * @param userId - ID de l'utilisateur
 * @param projectId - ID du projet
 * @returns true si l'utilisateur est propriétaire, false sinon
 */
export const isProjectOwner = async (
  userId: string,
  projectId: string
): Promise<boolean> => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId,
      },
    });

    return !!project;
  } catch (error) {
    console.error("Erreur lors de la vérification de propriété:", error);
    return false;
  }
};

/**
 * Vérifie si un utilisateur peut créer des tâches dans un projet
 * @param userId - ID de l'utilisateur
 * @param projectId - ID du projet
 * @returns true si l'utilisateur peut créer des tâches, false sinon
 */
export const canCreateTasks = async (
  userId: string,
  projectId: string
): Promise<boolean> => {
  return await hasProjectAccess(userId, projectId);
};

/**
 * Vérifie si un utilisateur peut modifier/supprimer des tâches dans un projet
 * @param userId - ID de l'utilisateur
 * @param projectId - ID du projet
 * @returns true si l'utilisateur peut modifier des tâches, false sinon
 */
export const canModifyTasks = async (
  userId: string,
  projectId: string
): Promise<boolean> => {
  return await hasProjectAccess(userId, projectId);
};

/**
 * Vérifie si un utilisateur peut modifier un projet
 * @param userId - ID de l'utilisateur
 * @param projectId - ID du projet
 * @returns true si l'utilisateur peut modifier le projet, false sinon
 */
export const canModifyProject = async (
  userId: string,
  projectId: string
): Promise<boolean> => {
  return await isProjectAdmin(userId, projectId);
};

/**
 * Vérifie si un utilisateur peut supprimer un projet
 * @param userId - ID de l'utilisateur
 * @param projectId - ID du projet
 * @returns true si l'utilisateur peut supprimer le projet, false sinon
 */
export const canDeleteProject = async (
  userId: string,
  projectId: string
): Promise<boolean> => {
  return await isProjectOwner(userId, projectId);
};

/**
 * Récupère le rôle d'un utilisateur dans un projet
 * @param userId - ID de l'utilisateur
 * @param projectId - ID du projet
 * @returns Le rôle de l'utilisateur ou null s'il n'a pas accès
 */
export const getUserProjectRole = async (
  userId: string,
  projectId: string
): Promise<Role | null> => {
  try {
    // Vérifier si l'utilisateur est propriétaire
    const isOwner = await isProjectOwner(userId, projectId);
    if (isOwner) {
      return Role.ADMIN;
    }

    // Vérifier le rôle dans les membres
    const membership = await prisma.projectMember.findFirst({
      where: {
        userId: userId,
        projectId: projectId,
      },
    });

    return membership ? (membership.role as Role) : null;
  } catch (error) {
    console.error("Erreur lors de la récupération du rôle:", error);
    return null;
  }
};
