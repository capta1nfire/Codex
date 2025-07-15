import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from '@/components/ErrorBoundary';
import SystemAlerts from '@/components/SystemAlerts';
import AppLayout from '@/components/admin/AppLayout';
import { TooltipProvider } from '@/components/ui/tooltip';
import { StudioProvider } from '@/components/studio/StudioProvider';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Mejora el rendering inicial
  preload: true, // Solo preload cuando sea crítico
  variable: '--font-inter', // CSS variable para uso eficiente
});

export const metadata: Metadata = {
  title: 'Make it QReable',
  description: 'Genera códigos QR profesionales y personalizables en segundos',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-100`}>
        <TooltipProvider>
          <AuthProvider>
            <StudioProvider>
              <ErrorBoundary>
                <AppLayout>
                  {children}
                </AppLayout>
                
                <SystemAlerts />
              </ErrorBoundary>
            </StudioProvider>
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
                  marginTop: '20px',
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
        </TooltipProvider>
      </body>
    </html>
  );
}
