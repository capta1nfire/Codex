import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from '@/components/ErrorBoundary';
import SystemAlerts from '@/components/SystemAlerts';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Codex - Generador Códigos',
  description: 'Genera códigos de barras y QR fácilmente',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-100`}>
        <AuthProvider>
          <ErrorBoundary>
            <Navbar />
            <main className="pt-16 lg:pt-20 xl:pt-24">{children}</main>
            
            <SystemAlerts />
          </ErrorBoundary>
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
                marginTop: '120px',
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
        </AuthProvider>
      </body>
    </html>
  );
}
