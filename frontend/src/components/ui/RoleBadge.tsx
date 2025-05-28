'use client';

import React from 'react';
import { Crown, Shield, Star, Building2, User, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

type UserRole = 'STARTER' | 'PRO' | 'ENTERPRISE' | 'ADMIN' | 'SUPERADMIN';

interface RoleBadgeProps {
  role: UserRole;
  variant?: 'default' | 'compact' | 'mobile' | 'sidebar';
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
          icon: Crown,
          // Gris elegante y neutral
          bgColor: 'bg-slate-50 dark:bg-slate-900/40',
          textColor: 'text-slate-700 dark:text-slate-300',
          borderColor: 'border-slate-300 dark:border-slate-600',
          iconColor: 'text-slate-600 dark:text-slate-400',
        };
      case 'ADMIN':
        return {
          label: 'Admin',
          icon: Shield,
          // Azul sutil
          bgColor: 'bg-blue-50 dark:bg-blue-950/30',
          textColor: 'text-blue-700 dark:text-blue-300',
          borderColor: 'border-blue-200 dark:border-blue-800',
          iconColor: 'text-blue-600 dark:text-blue-400',
        };
      case 'ENTERPRISE':
        return {
          label: 'Enterprise',
          icon: Building2,
          // Gris elegante
          bgColor: 'bg-slate-50 dark:bg-slate-900/50',
          textColor: 'text-slate-700 dark:text-slate-300',
          borderColor: 'border-slate-200 dark:border-slate-700',
          iconColor: 'text-slate-600 dark:text-slate-400',
        };
      case 'PRO':
        return {
          label: 'Pro',
          icon: Star,
          // Púrpura sutil
          bgColor: 'bg-purple-50 dark:bg-purple-950/30',
          textColor: 'text-purple-700 dark:text-purple-300',
          borderColor: 'border-purple-200 dark:border-purple-800',
          iconColor: 'text-purple-600 dark:text-purple-400',
        };
      case 'STARTER':
        return {
          label: 'Starter',
          icon: Zap,
          // Verde sutil
          bgColor: 'bg-green-50 dark:bg-green-950/30',
          textColor: 'text-green-700 dark:text-green-300',
          borderColor: 'border-green-200 dark:border-green-800',
          iconColor: 'text-green-600 dark:text-green-400',
        };
      default:
        return {
          label: 'Usuario',
          icon: User,
          bgColor: 'bg-gray-50 dark:bg-gray-900/50',
          textColor: 'text-gray-700 dark:text-gray-300',
          borderColor: 'border-gray-200 dark:border-gray-700',
          iconColor: 'text-gray-600 dark:text-gray-400',
        };
    }
  };

  const config = getRoleConfig(role);
  const IconComponent = config.icon;

  // Variantes extra pequeñas y sutiles
  const variants = {
    default: {
      container: 'px-2 py-0.5 rounded-md',
      text: 'text-xs font-medium',
      icon: 'h-2.5 w-2.5',
      spacing: 'gap-1',
    },
    compact: {
      container: 'px-1.5 py-0.5 rounded-sm',
      text: 'text-xs font-medium',
      icon: 'h-2.5 w-2.5',
      spacing: 'gap-1',
    },
    mobile: {
      container: 'px-1.5 py-0.5 rounded-sm',
      text: 'text-xs font-medium',
      icon: 'h-2.5 w-2.5',
      spacing: 'gap-1',
    },
    sidebar: {
      container: 'px-1.5 py-0.5 rounded-sm',
      text: 'text-xs font-medium',
      icon: 'h-2.5 w-2.5',
      spacing: 'gap-1',
    },
  };

  const currentVariant = variants[variant];

  return (
    <div
      className={cn(
        // Base styles - Más sutil
        'inline-flex items-center border transition-all duration-150',
        // Container variant
        currentVariant.container,
        currentVariant.spacing,
        // Colores sutiles
        config.bgColor,
        config.borderColor,
        // Sin sombras pesadas
        'hover:shadow-sm',
        // Custom className
        className
      )}
    >
      {/* Icon */}
      <IconComponent 
        className={cn(
          currentVariant.icon,
          config.iconColor
        )}
      />
      
      {/* Label */}
      <span className={cn(
        currentVariant.text,
        config.textColor,
        'uppercase tracking-wide'
      )}>
        {config.label}
      </span>
    </div>
  );
};

export default RoleBadge; 