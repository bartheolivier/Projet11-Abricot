import { Toaster } from 'sonner';
import Navbar from '../components/Navbar'; // Import du nouveau composant
import Footer from '../components/Footer'; // Import du footer
import './globals.css';

export const metadata = {
  title: 'Abricot - SaaS',
  description: 'Gestion de projet collaboratif',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ backgroundColor: "#fafafa", margin: 0, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Toaster position="bottom-right" richColors />
        
        {/* La barre de navigation s'affichera partout (et se cachera toute seule sur l'accueil) */}
        <Navbar />
        
        <main style={{ padding: '2rem', flex: 1 }}>
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}