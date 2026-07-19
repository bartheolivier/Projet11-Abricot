"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setError(""); 

    try {
      // Appel à l'API pour l'inscription (grâce à notre proxy, /api remplace http://localhost:8000)
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de l'inscription");
      }
      
      // 3. On extrait le token (selon la documentation Swagger, il est dans l'objet "data")
      const token = data.data?.token;

      // Si l'API renvoie directement un token après l'inscription, on le sauvegarde
      if (token) {
        document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Strict`;
        router.push("/dashboard");
      } else {
        // Sinon on renvoie vers la page de connexion
        router.push("/");
      }

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto" }}>
      <h1>Inscription</h1>
      
      {error && <p style={{ color: "var(--error)", fontWeight: "bold" }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label htmlFor="name">Nom complet</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ padding: "0.5rem", borderRadius: "var(--border-radius)" }}
          />
        </div>

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
          S'inscrire
        </button>
      </form>

      <p style={{ marginTop: "1rem", textAlign: "center" }}>
        Déjà un compte ? <Link href="/" style={{ color: "var(--primary-color)", textDecoration: "underline" }}>Se connecter</Link>
      </p>
    </div>
  );
}