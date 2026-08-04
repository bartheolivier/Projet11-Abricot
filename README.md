# Abricot.co 🍑 – SaaS de Gestion de Projet Collaboratif

**Abricot.co** est une application web SaaS moderne de gestion de projet collaboratif. Elle permet aux équipes de créer des espaces de travail, de suivre l'avancement de leurs tâches à travers différentes vues interactives (Liste, Kanban, Calendrier) et de bénéficier d'une **assistance de génération automatique de tâches alimentée par l'IA (Google Gemini & RAG via LlamaIndex.TS)**.

---

## 🚀 Résumé du Projet Frontend

* **Framework :** Next.js 16 (App Router) & React 19.
* **Design & Styling :** Design System sur-mesure en **Vanilla CSS** (`globals.css`), garanti sans framework CSS lourd pour une souveraineté totale du style et des performances optimales.
* **Iconographie & UX :** `lucide-react` (icônes vectorielles SVG légères) et `sonner` (notifications Toast réactives).
* **Accessibilité & Conformité :** Développé selon les normes **WCAG 2.1 AA** (navigation au clavier, fermeture modales via la touche Échap, attributs ARIA complets).
* **Vues Multiples :** Affichage des tâches en vue Liste, vue Kanban réorganisable et vue Calendrier mensuelle.

---

## 🛠️ Guide d'Installation et de Lancement

### 📋 Prérequis
* **Node.js** (v18.0.0 ou supérieur)
* **npm** (v9.0.0 ou supérieur)

---

### 1️⃣ Installation & Lancement du Backend (Serveur API & Base SQLite)

Le backend fournit l'API REST authentifiée et repose sur **Prisma ORM** avec une base de données **SQLite**.

```bash
# 1. Se positionner dans le dossier backend
cd backend

# 2. Installer les dépendances
npm install

# 3. Appliquer les migrations et initialiser la base de données SQLite
npx prisma migrate dev

# 4. Lancer le serveur backend (Port 5000)
npm run dev
```

> 💡 Le serveur Backend sera accessible sur `http://localhost:5000`.

---

### 2️⃣ Installation & Lancement du Frontend (Application Next.js)

```bash
# 1. Dans un nouveau terminal, se positionner dans le dossier frontend
cd frontend

# 2. Installer les dépendances
npm install

# 3. (Optionnel) Configurer la clé d'API Gemini pour la fonctionnalité IA
# Créer un fichier .env.local à la racine du dossier frontend avec :
# GEMINI_API_KEY=votre_cle_api_gemini

# 4. Lancer l'application frontend en mode développement (Port 3000)
npm run dev
```

> 🌐 L'application web sera accessible dans votre navigateur sur **`http://localhost:3000`**.

---

## 👤 Identifiants de Test (Seeding)

Pour vous connecter immédiatement à l'application sans créer de compte :
* **Email :** `alice@example.com`
* **Mot de passe :** `P@ssword123`

---

## 📜 Scripts Utiles (Frontend)

* `npm run dev` : Lance l'application en mode développement (Turbopack).
* `npm run build` : Compile l'application pour la production.
* `npm run format` : Formate automatiquement l'ensemble du code avec Prettier.
