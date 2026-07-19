import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import dotenv from "dotenv";

// Routes
import authRoutes from "./routes/authRoutes";
import projectRoutes from "./routes/projectRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import { searchUsers } from "./controllers/projectController";

// Middleware
import { authenticateToken } from "./middleware/auth";

// Swagger
import { specs } from "./config/swagger";

// Prisma singleton
import prisma from "./lib/prisma";

// Charger les variables d'environnement
dotenv.config();

// Créer l'application Express
const app = express();
const PORT = process.env.PORT || 8000;

// Middleware de sécurité
app.use(helmet());

// Middleware CORS
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://votre-domaine.com"]
        : ["http://localhost:8000", "http://localhost:8001"],
    credentials: true,
  })
);

// Middleware de logging
app.use(morgan("combined"));

// Middleware pour parser le JSON
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Documentation Swagger
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "API Gestionnaire de Projets - Documentation",
    customfavIcon: "/favicon.ico",
  })
);

// Routes
app.use("/auth", authRoutes);
app.use("/projects", projectRoutes);
app.use("/dashboard", dashboardRoutes);

// Route pour la recherche d'utilisateurs
app.get("/users/search", authenticateToken, searchUsers);

// Route de santé
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API en ligne",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Route racine
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API REST avec authentification et gestion de projets",
    version: "1.0.0",
    endpoints: {
      auth: {
        register: "POST /auth/register",
        login: "POST /auth/login",
        profile: "GET /auth/profile",
        updateProfile: "PUT /auth/profile",
        updatePassword: "PUT /auth/password",
      },
      projects: {
        create: "POST /projects",
        getAll: "GET /projects",
        getOne: "GET /projects/:id",
        update: "PUT /projects/:id",
        delete: "DELETE /projects/:id",
        addContributor: "POST /projects/:id/contributors",
        removeContributor: "DELETE /projects/:id/contributors/:userId",
      },
      tasks: {
        create: "POST /projects/:id/tasks",
        getAll: "GET /projects/:id/tasks",
        getOne: "GET /projects/:id/tasks/:taskId",
        update: "PUT /projects/:id/tasks/:taskId",
        delete: "DELETE /projects/:id/tasks/:taskId",
      },
      comments: {
        create: "POST /projects/:id/tasks/:taskId/comments",
        getAll: "GET /projects/:id/tasks/:taskId/comments",
        getOne: "GET /projects/:id/tasks/:taskId/comments/:commentId",
        update: "PUT /projects/:id/tasks/:taskId/comments/:commentId",
        delete: "DELETE /projects/:id/tasks/:taskId/comments/:commentId",
      },
      health: "GET /health",
    },
  });
});

// Middleware de gestion des erreurs 404
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route non trouvée",
    error: "NOT_FOUND",
  });
});

// Middleware de gestion des erreurs global
app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Erreur serveur:", error);

    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
);

// Fonction pour démarrer le serveur
const startServer = async () => {
  try {
    // Tester la connexion à la base de données
    await prisma.$connect();
    console.log("✅ Connexion à la base de données établie");

    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`📊 Environnement: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 URL: http://localhost:${PORT}`);
      console.log(`📖 Documentation: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Erreur lors du démarrage du serveur:", error);
    process.exit(1);
  }
};

// Gestion de l'arrêt propre du serveur
process.on("SIGINT", async () => {
  console.log("\n🛑 Arrêt du serveur...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Arrêt du serveur...");
  await prisma.$disconnect();
  process.exit(0);
});

// Démarrer le serveur
startServer();
