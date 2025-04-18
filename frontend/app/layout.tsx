import type { Metadata } from 'next';
import './globals.css';
import Navbar from '../src/components/Navbar';

export const metadata: Metadata = {
  title: 'Codex - Dashboard',
  description: 'Dashboard de análisis de rendimiento para Codex',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}