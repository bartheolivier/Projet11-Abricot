import Link from 'next/link';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="not-found-container">
      <div className="not-found-icon-wrapper">
        <AlertCircle size={48} aria-hidden="true" />
      </div>

      <h1 className="not-found-title">Page 404 - Page introuvable</h1>

      <p className="not-found-desc">
        Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
      </p>

      <Link href="/dashboard" className="btn-primary not-found-btn">
        <ArrowLeft size={18} aria-hidden="true" /> Retour
      </Link>
    </div>
  );
}
