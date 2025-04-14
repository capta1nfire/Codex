import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import LanguageSelector from '@/components/common/LanguageSelector';
import { useStore } from '@/zustand/use-store';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Codex',
  description: 'Plataforma avanzada para generación de códigos de barras y QR',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const currentLanguage = useStore((state) => state.currentLanguage);
  return (<html lang={currentLanguage}>
    <body className={cn(geistSans.variable, geistMono.variable, 'antialiased bg-gray-50 text-gray-900')}>
      <Navbar />
      <main className="container mx-auto py-12">{children}</main>
      <Footer />
    </body>
  </html>);
}
