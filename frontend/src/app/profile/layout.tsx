import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from '@/components/ErrorBoundary';
import SystemAlerts from '@/components/SystemAlerts';

export const metadata: Metadata = {
  title: 'Mi Perfil - Codex',
  description: 'Gestiona tu información personal y configuración de cuenta',
};

export default function ProfileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative">
      {/* No navbar for clean profile experience */}
      <main className="min-h-screen">{children}</main>
      
      <SystemAlerts />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            fontSize: '14px',
            padding: '16px',
            borderRadius: '8px',
            marginTop: '20px', // Reduced margin since no navbar
          },
          success: {
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
} 