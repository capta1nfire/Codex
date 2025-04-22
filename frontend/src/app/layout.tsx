import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { AuthProvider } from '@/context/AuthContext';

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
          <Navbar />
          <main className="pt-16 lg:pt-20 xl:pt-24">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
