'use client';

import { User } from 'lucide-react';
import UserProfile from '@/components/UserProfile';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-slate-50/20 to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header consistente con otras páginas */}
      <div className="bg-gradient-to-r from-blue-50/50 via-slate-50/50 to-blue-50/50 dark:from-blue-950/20 dark:via-slate-950/20 dark:to-blue-950/20 border-b border-blue-200/30 dark:border-blue-800/30 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                Mi Perfil
              </h1>
              <p className="text-sm text-blue-600/70 dark:text-blue-400/70 mt-1 font-medium">
                Gestiona tu información personal y configuración
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserProfile isAdvancedMode={false} />
      </div>
    </div>
  );
}
