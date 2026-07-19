import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { CreateTaskRequest, UpdateTaskRequest, AuthRequest } from "../types";
import {
  validateCreateTaskData,
  validateUpdateTaskData,
} from "../utils/validation";
import {
  hasProjectAccess,
  canCreateTasks,
  canModifyTasks,
} from "../utils/permissions";
import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendServerError,
} from "../utils/response";
import {
  validateProjectMembers,
  updateTaskAssignments,
  getTaskAssignments,
} from "../utils/taskAssignments";
import { getTaskComments } from "../utils/taskComments";

/**
 * Créer une nouvelle tâche
 * POST /projects/:id/tasks
 */
export const createTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const projectId = req.params.id;

    if (!projectId || typeof projectId !== "string") {
      sendError(res, "ID de projet invalide", "INVALID_PROJECT_ID", 400);
      return;
    }
    const {
      title,
      description,
      priority,
      dueDate,
      assigneeIds,
    }: CreateTaskRequest = req.body;
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      sendError(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
      return;
    }

    // Validation des données
    const validationErrors = validateCreateTaskData({
      title,
      description,
      priority,
      dueDate,
      assigneeIds,
    });
    if (validationErrors.length > 0) {
      sendValidationError(
        res,
        "Données de création de tâche invalides",
        validationErrors
      );
      return;
    }

    // Vérifier l'accès au projet
    const hasAccess = await hasProjectAccess(authReq.user.id, projectId);
    if (!hasAccess) {
      sendError(res, "Accès refusé au projet", "FORBIDDEN", 403);
      return;
    }

    // Vérifier que le projet existe
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      sendError(res, "Projet non trouvé", "PROJECT_NOT_FOUND", 404);
      return;
    }

    // Vérifier les permissions pour créer des tâches
    const canCreate = await canCreateTasks(authReq.user.id, projectId);
    if (!canCreate) {
      sendError(
        res,
        "Vous n'avez pas les permissions pour créer des tâches dans ce projet",
        "FORBIDDEN",
        403
      );
      return;
    }

    // Vérifier que tous les utilisateurs assignés sont membres du projet
    if (assigneeIds && assigneeIds.length > 0) {
      const areValidMembers = await validateProjectMembers(
        projectId,
        assigneeIds
      );
      if (!areValidMembers) {
        sendError(
          res,
          "Certains utilisateurs assignés ne sont pas membres du projet",
          "INVALID_ASSIGNEES",
          400
        );
        return;
      }
    }

    // Créer la tâche
    const taskData = {
      title: title.trim(),
      description: description?.trim() || null,
      priority: priority || "MEDIUM",
      dueDate: dueDate ? new Date(dueDate) : null,
      projectId,
      creatorId: authReq.user.id,
    };

    const task = await prisma.task.create({
      data: taskData,
    });

    // Ajouter les assignations si fournies
    if (assigneeIds && assigneeIds.length > 0) {
      await updateTaskAssignments(task.id, assigneeIds);
    }

    // Récupérer la tâche complète avec les relations
    const taskWithRelations = await prisma.task.findUnique({
      where: { id: task.id },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!taskWithRelations) {
      sendError(
        res,
        "Erreur lors de la récupération de la tâche créée",
        "TASK_NOT_FOUND",
        404
      );
      return;
    }

    // Ajouter les assignations et commentaires manuellement
    const assignees = await getTaskAssignments(task.id);
    const comments = await getTaskComments(task.id);

    const taskResponse = {
      ...taskWithRelations,
      assignees,
      comments,
    };

    sendSuccess(res, "Tâche créée avec succès", { task: taskResponse }, 201);
  } catch (error) {
    console.error("Erreur lors de la création de la tâche:", error);
    sendServerError(res, "Erreur lors de la création de la tâche");
  }
};

/**
 * @swagger
 * /projects/{id}/tasks:
 *   get:
 *     summary: Récupérer toutes les tâches d'un projet
 *     description: Retourne la liste complète des tâches associées à un projet spécifique, incluant les détails du créateur, les assignations et les commentaires
 *     tags: [Projets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du projet
 *         example: "clm123abc456"
 *     responses:
 *       200:
 *         description: Tâches récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         tasks:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Task'
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Accès refusé - L'utilisateur n'a pas accès à ce projet
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id;
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      sendError(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
      return;
    }

    // Vérifier l'accès au projet
    const hasAccess = await hasProjectAccess(authReq.user.id, projectId);
    if (!hasAccess) {
      sendError(res, "Accès refusé au projet", "FORBIDDEN", 403);
      return;
    }

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    // Ajouter les assignations et commentaires pour chaque tâche
    const tasksWithAssignments = await Promise.all(
      tasks.map(async (task) => {
        const assignees = await getTaskAssignments(task.id);
        const comments = await getTaskComments(task.id);
        return {
          ...task,
          assignees,
          comments,
        };
      })
    );

    sendSuccess(res, "Tâches récupérées avec succès", {
      tasks: tasksWithAssignments,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des tâches:", error);
    sendServerError(res, "Erreur lors de la récupération des tâches");
  }
};

/**
 * Récupérer une tâche spécifique
 * GET /projects/:id/tasks/:taskId
 */
export const getTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id;
    const { taskId } = req.params;
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      sendError(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
      return;
    }

    // Vérifier l'accès au projet
    const hasAccess = await hasProjectAccess(authReq.user.id, projectId);
    if (!hasAccess) {
      sendError(res, "Accès refusé au projet", "FORBIDDEN", 403);
      return;
    }

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!task) {
      sendError(res, "Tâche non trouvée", "TASK_NOT_FOUND", 404);
      return;
    }

    // Ajouter les assignations et commentaires
    const assignees = await getTaskAssignments(task.id);
    const comments = await getTaskComments(task.id);

    const taskWithAssignments = {
      ...task,
      assignees,
      comments,
    };

    sendSuccess(res, "Tâche récupérée avec succès", {
      task: taskWithAssignments,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de la tâche:", error);
    sendServerError(res, "Erreur lors de la récupération de la tâche");
  }
};

/**
 * Mettre à jour une tâche
 * PUT /projects/:id/tasks/:taskId
 */
export const updateTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const projectId = req.params.id;
    const { taskId } = req.params;
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      assigneeIds,
    }: UpdateTaskRequest = req.body;
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      sendError(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
      return;
    }

    // Validation des données
    const validationErrors = validateUpdateTaskData({
      title,
      description,
      status,
      priority,
      dueDate,
      assigneeIds,
    });
    if (validationErrors.length > 0) {
      sendValidationError(
        res,
        "Données de mise à jour invalides",
        validationErrors
      );
      return;
    }

    // Vérifier l'accès au projet
    const hasAccess = await hasProjectAccess(authReq.user.id, projectId);
    if (!hasAccess) {
      sendError(res, "Accès refusé au projet", "FORBIDDEN", 403);
      return;
    }

    // Vérifier les permissions pour modifier des tâches
    const canModify = await canModifyTasks(authReq.user.id, projectId);
    if (!canModify) {
      sendError(
        res,
        "Vous n'avez pas les permissions pour modifier des tâches dans ce projet",
        "FORBIDDEN",
        403
      );
      return;
    }

    // Vérifier que la tâche existe
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
      },
    });

    if (!existingTask) {
      sendError(res, "Tâche non trouvée", "TASK_NOT_FOUND", 404);
      return;
    }

    // Vérifier que tous les utilisateurs assignés sont membres du projet
    if (assigneeIds && assigneeIds.length > 0) {
      const areValidMembers = await validateProjectMembers(
        projectId,
        assigneeIds
      );
      if (!areValidMembers) {
        sendError(
          res,
          "Certains utilisateurs assignés ne sont pas membres du projet",
          "INVALID_ASSIGNEES",
          400
        );
        return;
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {};
    if (title !== undefined) {
      updateData.title = title.trim();
    }
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }
    if (status !== undefined) {
      updateData.status = status;
    }
    if (priority !== undefined) {
      updateData.priority = priority;
    }
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }

    // Mettre à jour la tâche
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Mettre à jour les assignations si fournies
    if (assigneeIds !== undefined) {
      await updateTaskAssignments(taskId, assigneeIds);
    }

    // Récupérer la tâche avec les assignations et commentaires
    const assignees = await getTaskAssignments(taskId);
    const comments = await getTaskComments(taskId);
    const taskWithAssignments = {
      ...updatedTask,
      assignees,
      comments,
    };

    sendSuccess(res, "Tâche mise à jour avec succès", {
      task: taskWithAssignments,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la tâche:", error);
    sendServerError(res, "Erreur lors de la mise à jour de la tâche");
  }
};

/**
 * Supprimer une tâche
 * DELETE /projects/:id/tasks/:taskId
 */
export const deleteTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const projectId = req.params.id;
    const { taskId } = req.params;
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      sendError(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
      return;
    }

    // Vérifier l'accès au projet
    const hasAccess = await hasProjectAccess(authReq.user.id, projectId);
    if (!hasAccess) {
      sendError(res, "Accès refusé au projet", "FORBIDDEN", 403);
      return;
    }

    // Vérifier les permissions pour modifier des tâches
    const canModify = await canModifyTasks(authReq.user.id, projectId);
    if (!canModify) {
      sendError(
        res,
        "Vous n'avez pas les permissions pour supprimer des tâches dans ce projet",
        "FORBIDDEN",
        403
      );
      return;
    }

    // Vérifier que la tâche existe
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
      },
    });

    if (!existingTask) {
      sendError(res, "Tâche non trouvée", "TASK_NOT_FOUND", 404);
      return;
    }

    // Supprimer la tâche
    await prisma.task.delete({
      where: { id: taskId },
    });

    sendSuccess(res, "Tâche supprimée avec succès");
  } catch (error) {
    console.error("Erreur lors de la suppression de la tâche:", error);
    sendServerError(res, "Erreur lors de la suppression de la tâche");
  }
};
