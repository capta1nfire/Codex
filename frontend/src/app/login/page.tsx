'use client';

import { useEffect } from 'react';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  useEffect(() => {
    // Prevenir scroll en la página de login
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // Cleanup al desmontar el componente
    return () => {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    };
  }, []);

  return <LoginForm />;
}
