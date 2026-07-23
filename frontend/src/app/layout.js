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
      <body style={{ backgroundColor: "#fafafa", margin: 0, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <QueryProvider>
          <Toaster position="bottom-right" richColors />
          
          <Navbar />
          
          <main style={{ padding: '2rem', flex: 1 }}>
            {children}
          </main>

          <Footer />
        </QueryProvider>
      </body>
    </html>
  );
}