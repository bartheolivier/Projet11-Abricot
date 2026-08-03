import { Toaster } from 'sonner';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import QueryProvider from '../components/QueryProvider';
import './globals.css';

export const metadata = {
  title: 'Abricot - SaaS',
  description: 'Gestion de projet collaboratif',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <QueryProvider>
          <Toaster position="bottom-right" richColors />
          
          <Navbar />
          
          <main className="app-main-content">
            {children}
          </main>

          <Footer />
        </QueryProvider>
      </body>
    </html>
  );
}