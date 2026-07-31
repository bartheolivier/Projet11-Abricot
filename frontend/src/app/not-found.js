import Link from 'next/link';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '70vh',
      textAlign: 'center',
      padding: '2rem',
    }}>
      <div style={{
        backgroundColor: '#fff3e0',
        color: '#e65100',
        padding: '1.5rem',
        borderRadius: '50%',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <AlertCircle size={48} aria-hidden="true" />
      </div>

      <h1 style={{
        fontSize: '2.5rem',
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: '0.5rem',
      }}>
        Page 404 - Page introuvable
      </h1>

      <p style={{
        fontSize: '1.1rem',
        color: '#666',
        maxWidth: '500px',
        marginBottom: '2rem',
        lineHeight: '1.5',
      }}>
        Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
      </p>

      <Link 
        href="/dashboard"
        className="btn-primary"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          textDecoration: 'none',
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
        }}
      >
        <ArrowLeft size={18} aria-hidden="true" /> Retour au tableau de bord
      </Link>
    </div>
  );
}
