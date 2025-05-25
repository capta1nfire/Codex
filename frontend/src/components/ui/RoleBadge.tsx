'use client';

import React from 'react';
import { Crown, Shield, Star, Gem, User, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

type UserRole = 'USER' | 'PREMIUM' | 'ADVANCED' | 'WEBADMIN' | 'SUPERADMIN';

interface RoleBadgeProps {
  role: UserRole;
  variant?: 'default' | 'compact' | 'mobile';
  className?: string;
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ 
  role, 
  variant = 'default',
  className 
}) => {
  const getRoleConfig = (role: UserRole) => {
    switch (role) {
      case 'SUPERADMIN':
        return {
          label: 'Super Admin',
          icon: Zap,
          // Glassmorphism azul corporativo premium
          gradient: 'from-blue-400 to-indigo-500',
          bgGradient: 'from-white/25 to-blue-50/30',
          textColor: 'text-white font-semibold',
          borderColor: 'border-blue-200/50',
          shadowColor: 'shadow-blue-400/25',
          iconBg: 'bg-gradient-to-br from-slate-100 to-white',
          glowEffect: 'shadow-blue-400/20',
        };
      case 'WEBADMIN':
        return {
          label: 'Admin',
          icon: Crown,
          // Glassmorphism plateado profesional
          gradient: 'from-slate-300 to-slate-400',
          bgGradient: 'from-white/15 to-slate-100/25',
          textColor: 'text-slate-100 font-medium',
          borderColor: 'border-slate-300/30',
          shadowColor: 'shadow-slate-400/20',
          iconBg: 'bg-gradient-to-br from-slate-400 to-slate-500',
          glowEffect: 'shadow-slate-400/15',
        };
      case 'ADVANCED':
        return {
          label: 'Enterprise',
          icon: Crown,
          // Glassmorphism dorado corporativo para clientes enterprise
          gradient: 'from-amber-400 to-yellow-500',
          bgGradient: 'from-white/15 to-amber-50/25',
          textColor: 'text-amber-100 font-medium',
          borderColor: 'border-amber-300/30',
          shadowColor: 'shadow-amber-400/20',
          iconBg: 'bg-gradient-to-br from-amber-400 to-yellow-500',
          glowEffect: 'shadow-amber-400/15',
        };
      case 'PREMIUM':
        return {
          label: 'PRO',
          icon: Shield,
          // Glassmorphism púrpura para clientes profesionales
          gradient: 'from-violet-400 to-purple-400',
          bgGradient: 'from-white/15 to-violet-50/25',
          textColor: 'text-violet-100 font-medium',
          borderColor: 'border-violet-300/30',
          shadowColor: 'shadow-violet-400/20',
          iconBg: 'bg-gradient-to-br from-violet-400 to-purple-500',
          glowEffect: 'shadow-violet-400/15',
        };
      case 'USER':
        return {
          label: 'Freemium',
          icon: Star,
          // Glassmorphism azul suave para clientes freemium
          gradient: 'from-blue-300 to-blue-400',
          bgGradient: 'from-white/10 to-blue-50/20',
          textColor: 'text-blue-100 font-normal',
          borderColor: 'border-blue-300/25',
          shadowColor: 'shadow-blue-400/15',
          iconBg: 'bg-gradient-to-br from-blue-400 to-blue-500',
          glowEffect: 'shadow-blue-400/10',
        };
      default:
        return {
          label: 'Usuario',
          icon: User,
          gradient: 'from-gray-300 to-gray-400',
          bgGradient: 'from-white/10 to-gray-50/20',
          textColor: 'text-gray-100 font-normal',
          borderColor: 'border-gray-300/25',
          shadowColor: 'shadow-gray-400/15',
          iconBg: 'bg-gradient-to-br from-gray-400 to-gray-500',
          glowEffect: 'shadow-gray-400/10',
        };
    }
  };

  const config = getRoleConfig(role);
  const IconComponent = config.icon;

  // Variantes de tamaño y estilo
  const variants = {
    default: {
      container: 'px-3 py-1.5 rounded-full',
      text: 'text-xs font-semibold tracking-wide',
      icon: 'h-3.5 w-3.5',
      spacing: 'gap-2',
      iconPadding: 'p-1',
    },
    compact: {
      container: 'px-2.5 py-1 rounded-lg',
      text: 'text-xs font-medium',
      icon: 'h-3 w-3',
      spacing: 'gap-1.5',
      iconPadding: 'p-0.5',
    },
    mobile: {
      container: 'px-2.5 py-1 rounded-md',
      text: 'text-xs font-medium',
      icon: 'h-3 w-3',
      spacing: 'gap-1.5',
      iconPadding: 'p-0.5',
    },
  };

  const currentVariant = variants[variant];

  return (
    <div
      className={cn(
        // Base glassmorphism styles
        'inline-flex items-center border backdrop-blur-md transition-all duration-300',
        'hover:scale-105 hover:backdrop-blur-lg',
        // Container variant
        currentVariant.container,
        currentVariant.spacing,
        // Background glassmorphism
        `bg-gradient-to-r ${config.bgGradient}`,
        // Border and shadow
        config.borderColor,
        config.shadowColor,
        `hover:${config.glowEffect}`,
        // Enhanced hover effects
        'hover:shadow-lg hover:border-white/40',
        // Custom className
        className
      )}
    >
      {/* Icon with gradient background */}
      <div className={cn(
        'flex items-center justify-center rounded-full',
        config.iconBg,
        currentVariant.iconPadding,
        'shadow-sm'
      )}>
        <IconComponent 
          className={cn(
            currentVariant.icon,
            role === 'SUPERADMIN' ? 'text-blue-600 drop-shadow-sm' : 
            role === 'WEBADMIN' ? 'text-slate-600 drop-shadow-sm' :
            role === 'ADVANCED' ? 'text-amber-600 drop-shadow-sm' :
            'text-white drop-shadow-sm'
          )}
        />
      </div>
      
      {/* Label with glassmorphism text */}
      <span className={cn(
        currentVariant.text,
        config.textColor,
        'uppercase tracking-wider drop-shadow-sm',
        'text-shadow-sm'
      )}>
        {config.label}
      </span>
    </div>
  );
};

export default RoleBadge; 