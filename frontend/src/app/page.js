"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // Permet de gérer les redirections
import Link from "next/link";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  const router = useRouter(); // Initialisation du router

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setError(""); 

    try {
      // 1. Envoi de la requête au back-end
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      // 2. Gestion des erreurs (mauvais mot de passe, compte inexistant...)
      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de la connexion");
      }

      // 3. On extrait le token (selon la documentation Swagger, il est dans l'objet "data")
      const token = data.data.token;
      
      // Stockage sécurisé du token dans un Cookie
      document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Strict`;

      // 4. Redirection vers le tableau de bord
      router.push("/dashboard");

    } catch (err) {
      // On affiche le message d'erreur dans l'interface
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto" }}>
      <h1>Connexion</h1>
      
      {error && <p style={{ color: "var(--error)", fontWeight: "bold" }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label htmlFor="email">Adresse e-mail</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: "0.5rem", borderRadius: "var(--border-radius)" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <label htmlFor="password">Mot de passe</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: "0.5rem", borderRadius: "var(--border-radius)" }}
          />
        </div>

        <button 
          type="submit" 
          style={{ 
            padding: "0.75rem", 
            background: "var(--primary-color)", 
            color: "white", 
            border: "none", 
            borderRadius: "var(--border-radius)",
            cursor: "pointer"
          }}
        >
          Se connecter
        </button>

      </form>
      <p style={{ marginTop: "1rem", textAlign: "center" }}>
        Pas encore de compte ? <Link href="/register" style={{ color: "var(--primary-color)", textDecoration: "underline" }}>S'inscrire</Link>
      </p>
    </div>
  );
}