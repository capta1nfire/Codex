import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, FileText, LogIn, User, LogOut, Barcode } from 'lucide-react';
import { LanguageSelector } from '@/components/common/LanguageSelector';
import { useTranslations } from '@/hooks/use-translations';

export default function Navbar() {
  //TODO: Add the logic for login/logout
  const isLoggedIn = false;
  const { t } = useTranslations();
  return (
    <nav className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between w-full">
      {/* Logo */}
      <Link href="/" className="font-bold text-xl flex items-center gap-2">
        <LayoutDashboard className='text-blue-600'/>
        Codex
      </Link>

      {/* Navigation Menu */}
      <div className="flex items-center space-x-6">
        <Link href="/" className="hover:text-blue-600 transition-colors flex items-center gap-2">
          <FileText className="w-4 h-4" />
          {t('Generador')}
        </Link>
        <Link href="/dashboard" className="hover:text-blue-600 transition-colors flex items-center gap-2">
          <LayoutDashboard className="w-4 h-4" />
          {t('Dashboard')}
        </Link>
        <Link href="/api" className="hover:text-blue-600 transition-colors flex items-center gap-2">
          <Barcode className="w-4 h-4" />
          {t('API')}
        </Link>
        <Link href="/pricing" className="hover:text-blue-600 transition-colors flex items-center gap-2">
          {t('Precios')}
        </Link>

        {/* Login/Profile */}
        {isLoggedIn ? (
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/user" className="hover:text-blue-600 transition-colors">
              <User className="w-4 h-4 mr-1" />
            </Link>
            <Button variant="outline" size="sm" className='flex items-center gap-2'>
              <LogOut className='w-4 h-4'/>
              Cerrar Sesión
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className='flex items-center gap-2'>
              <LogIn className='w-4 h-4'/>
              Iniciar Sesión
            </Button>
            <Button variant="default" size="sm">
              Registrarse
            </Button>
          </div>
        )}

        {/* Language Selector */}
        <LanguageSelector />
      </div>
    </nav>
  );
}