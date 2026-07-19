import { ValidationError } from "../types";

/**
 * Valide un email
 * @param email - L'email à valider
 * @returns true si l'email est valide, false sinon
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valide un mot de passe
 * Au moins 8 caractères, une lettre majuscule, une lettre minuscule, un chiffre un caractère spécial : @$!%*?&
 * @param password - Le mot de passe à valider
 *
 * @returns true si le mot de passe est valide, false sinon
 */
export const isValidPassword = (password: string): boolean => {
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Valide une date ISO
 * @param dateString - La date à valider
 * @returns true si la date est valide, false sinon
 */
export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * Valide les données d'inscription
 * @param data - Les données à valider
 * @returns Un tableau d'erreurs de validation
 */
export const validateRegisterData = (data: {
  email: string;
  password: string;
  name?: string;
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Validation de l'email
  if (!data.email) {
    errors.push({ field: "email", message: "L'email est requis" });
  } else if (!isValidEmail(data.email)) {
    errors.push({ field: "email", message: "Format d'email invalide" });
  }

  // Validation du mot de passe
  if (!data.password) {
    errors.push({ field: "password", message: "Le mot de passe est requis" });
  } else if (!isValidPassword(data.password)) {
    errors.push({
      field: "password",
      message:
        "Le mot de passe doit contenir au moins 8 caractères, une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial (@$!%*?&)",
    });
  }

  // Validation du nom (optionnel)
  if (data.name && data.name.trim().length < 2) {
    errors.push({
      field: "name",
      message: "Le nom doit contenir au moins 2 caractères",
    });
  }

  return errors;
};

/**
 * Valide les données de connexion
 * @param data - Les données à valider
 * @returns Un tableau d'erreurs de validation
 */
export const validateLoginData = (data: {
  email: string;
  password: string;
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Validation de l'email
  if (!data.email) {
    errors.push({ field: "email", message: "L'email est requis" });
  }

  // Validation du mot de passe
  if (!data.password) {
    errors.push({ field: "password", message: "Le mot de passe est requis" });
  }

  return errors;
};

/**
 * Valide les données de mise à jour du profil
 * @param data - Les données à valider
 * @returns Un tableau d'erreurs de validation
 */
export const validateUpdateProfileData = (data: {
  name?: string;
  email?: string;
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Validation de l'email si fourni
  if (data.email !== undefined) {
    if (!data.email.trim()) {
      errors.push({ field: "email", message: "L'email ne peut pas être vide" });
    } else if (!isValidEmail(data.email)) {
      errors.push({ field: "email", message: "Format d'email invalide" });
    }
  }

  // Validation du nom si fourni
  if (data.name !== undefined) {
    if (data.name.trim().length < 2) {
      errors.push({
        field: "name",
        message: "Le nom doit contenir au moins 2 caractères",
      });
    }
  }

  return errors;
};

/**
 * Valide les données de mise à jour du mot de passe
 * @param data - Les données à valider
 * @returns Un tableau d'erreurs de validation
 */
export const validateUpdatePasswordData = (data: {
  currentPassword: string;
  newPassword: string;
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Validation du mot de passe actuel
  if (!data.currentPassword) {
    errors.push({
      field: "currentPassword",
      message: "Le mot de passe actuel est requis",
    });
  }

  // Validation du nouveau mot de passe
  if (!data.newPassword) {
    errors.push({
      field: "newPassword",
      message: "Le nouveau mot de passe est requis",
    });
  } else if (!isValidPassword(data.newPassword)) {
    errors.push({
      field: "newPassword",
      message:
        "Le nouveau mot de passe doit contenir au moins 8 caractères, une lettre majuscule, une lettre minuscule et un chiffre",
    });
  }

  // Vérifier que le nouveau mot de passe est différent de l'actuel
  if (
    data.currentPassword &&
    data.newPassword &&
    data.currentPassword === data.newPassword
  ) {
    errors.push({
      field: "newPassword",
      message: "Le nouveau mot de passe doit être différent de l'actuel",
    });
  }

  return errors;
};

/**
 * Valide les données de création de projet
 * @param data - Les données à valider
 * @returns Un tableau d'erreurs de validation
 */
export const validateCreateProjectData = (data: {
  name: string;
  description?: string;
  contributors?: string[];
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Validation du nom
  if (!data.name) {
    errors.push({ field: "name", message: "Le nom du projet est requis" });
  } else if (data.name.trim().length < 2) {
    errors.push({
      field: "name",
      message: "Le nom du projet doit contenir au moins 2 caractères",
    });
  } else if (data.name.trim().length > 100) {
    errors.push({
      field: "name",
      message: "Le nom du projet ne peut pas dépasser 100 caractères",
    });
  }

  // Validation de la description
  if (data.description && data.description.trim().length > 500) {
    errors.push({
      field: "description",
      message: "La description ne peut pas dépasser 500 caractères",
    });
  }

  // Validation des contributeurs
  if (data.contributors) {
    if (!Array.isArray(data.contributors)) {
      errors.push({
        field: "contributors",
        message: "Les contributeurs doivent être un tableau",
      });
    } else {
      data.contributors.forEach((email, index) => {
        if (!isValidEmail(email)) {
          errors.push({
            field: `contributors[${index}]`,
            message: "Format d'email invalide",
          });
        }
      });
    }
  }

  return errors;
};

/**
 * Valide les données de mise à jour de projet
 * @param data - Les données à valider
 * @returns Un tableau d'erreurs de validation
 */
export const validateUpdateProjectData = (data: {
  name?: string;
  description?: string;
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Validation du nom si fourni
  if (data.name !== undefined) {
    if (!data.name.trim()) {
      errors.push({
        field: "name",
        message: "Le nom du projet ne peut pas être vide",
      });
    } else if (data.name.trim().length < 2) {
      errors.push({
        field: "name",
        message: "Le nom du projet doit contenir au moins 2 caractères",
      });
    } else if (data.name.trim().length > 100) {
      errors.push({
        field: "name",
        message: "Le nom du projet ne peut pas dépasser 100 caractères",
      });
    }
  }

  // Validation de la description si fournie
  if (data.description !== undefined && data.description.trim().length > 500) {
    errors.push({
      field: "description",
      message: "La description ne peut pas dépasser 500 caractères",
    });
  }

  return errors;
};

/**
 * Valide les données de création de tâche
 * @param data - Les données à valider
 * @returns Un tableau d'erreurs de validation
 */
export const validateCreateTaskData = (data: {
  title: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  assigneeIds?: string[];
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Validation du titre
  if (!data.title) {
    errors.push({ field: "title", message: "Le titre de la tâche est requis" });
  } else if (data.title.trim().length < 2) {
    errors.push({
      field: "title",
      message: "Le titre de la tâche doit contenir au moins 2 caractères",
    });
  } else if (data.title.trim().length > 200) {
    errors.push({
      field: "title",
      message: "Le titre de la tâche ne peut pas dépasser 200 caractères",
    });
  }

  // Validation de la description
  if (data.description && data.description.trim().length > 1000) {
    errors.push({
      field: "description",
      message: "La description ne peut pas dépasser 1000 caractères",
    });
  }

  // Validation de la priorité
  if (
    data.priority &&
    !["LOW", "MEDIUM", "HIGH", "URGENT"].includes(data.priority)
  ) {
    errors.push({
      field: "priority",
      message: "La priorité doit être LOW, MEDIUM, HIGH ou URGENT",
    });
  }

  // Validation de la date d'échéance
  if (data.dueDate && !isValidDate(data.dueDate)) {
    errors.push({
      field: "dueDate",
      message: "Format de date invalide (utilisez le format ISO)",
    });
  }

  // Validation des assignations
  if (data.assigneeIds) {
    if (!Array.isArray(data.assigneeIds)) {
      errors.push({
        field: "assigneeIds",
        message: "Les assignations doivent être un tableau",
      });
    } else {
      data.assigneeIds.forEach((userId, index) => {
        if (!userId) {
          errors.push({
            field: `assigneeIds[${index}]`,
            message: "L'ID de l'utilisateur assigné est invalide",
          });
        }
      });
    }
  }

  return errors;
};

/**
 * Valide les données de mise à jour de tâche
 * @param data - Les données à valider
 * @returns Un tableau d'erreurs de validation
 */
export const validateUpdateTaskData = (data: {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  assigneeIds?: string[];
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Validation du titre si fourni
  if (data.title !== undefined) {
    if (!data.title.trim()) {
      errors.push({
        field: "title",
        message: "Le titre de la tâche ne peut pas être vide",
      });
    } else if (data.title.trim().length < 2) {
      errors.push({
        field: "title",
        message: "Le titre de la tâche doit contenir au moins 2 caractères",
      });
    } else if (data.title.trim().length > 200) {
      errors.push({
        field: "title",
        message: "Le titre de la tâche ne peut pas dépasser 200 caractères",
      });
    }
  }

  // Validation de la description si fournie
  if (data.description !== undefined && data.description.trim().length > 1000) {
    errors.push({
      field: "description",
      message: "La description ne peut pas dépasser 1000 caractères",
    });
  }

  // Validation du statut si fourni
  if (
    data.status &&
    !["TODO", "IN_PROGRESS", "DONE", "CANCELLED"].includes(data.status)
  ) {
    errors.push({
      field: "status",
      message: "Le statut doit être TODO, IN_PROGRESS, DONE ou CANCELLED",
    });
  }

  // Validation de la priorité si fournie
  if (
    data.priority &&
    !["LOW", "MEDIUM", "HIGH", "URGENT"].includes(data.priority)
  ) {
    errors.push({
      field: "priority",
      message: "La priorité doit être LOW, MEDIUM, HIGH ou URGENT",
    });
  }

  // Validation de la date d'échéance si fournie
  if (
    data.dueDate !== undefined &&
    data.dueDate &&
    !isValidDate(data.dueDate)
  ) {
    errors.push({
      field: "dueDate",
      message: "Format de date invalide (utilisez le format ISO)",
    });
  }

  // Validation des assignations si fournies
  if (data.assigneeIds !== undefined) {
    if (!Array.isArray(data.assigneeIds)) {
      errors.push({
        field: "assigneeIds",
        message: "Les assignations doivent être un tableau",
      });
    } else {
      data.assigneeIds.forEach((userId, index) => {
        if (!userId) {
          errors.push({
            field: `assigneeIds[${index}]`,
            message: "L'ID de l'utilisateur assigné est invalide",
          });
        }
      });
    }
  }

  return errors;
};

/**
 * Valide les données de création de commentaire
 * @param data - Les données à valider
 * @returns Un tableau d'erreurs de validation
 */
export const validateCreateCommentData = (data: {
  content: string;
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Validation du contenu
  if (!data.content) {
    errors.push({
      field: "content",
      message: "Le contenu du commentaire est requis",
    });
  } else if (data.content.trim().length < 1) {
    errors.push({
      field: "content",
      message: "Le contenu du commentaire ne peut pas être vide",
    });
  } else if (data.content.trim().length > 2000) {
    errors.push({
      field: "content",
      message: "Le contenu du commentaire ne peut pas dépasser 2000 caractères",
    });
  }

  return errors;
};

/**
 * Valide les données de mise à jour de commentaire
 * @param data - Les données à valider
 * @returns Un tableau d'erreurs de validation
 */
export const validateUpdateCommentData = (data: {
  content: string;
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Validation du contenu
  if (!data.content) {
    errors.push({
      field: "content",
      message: "Le contenu du commentaire est requis",
    });
  } else if (data.content.trim().length < 1) {
    errors.push({
      field: "content",
      message: "Le contenu du commentaire ne peut pas être vide",
    });
  } else if (data.content.trim().length > 2000) {
    errors.push({
      field: "content",
      message: "Le contenu du commentaire ne peut pas dépasser 2000 caractères",
    });
  }

  return errors;
};
