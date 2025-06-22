'use client';

/**
 * Smart QR Admin Dashboard
 * Control panel for Smart QR templates and statistics
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Lock, 
  Users, 
  TrendingUp, 
  Calendar,
  BarChart3,
  Settings,
  Plus,
  Eye,
  Code
} from 'lucide-react';

// Mock data for now - will be replaced with API calls
const ACTIVE_TEMPLATES = [
  {
    id: 'instagram-v1',
    name: 'Instagram Style',
    domains: ['instagram.com'],
    isActive: true,
    usage: 0,
    colors: ['#833AB4', '#FD1D1D', '#FCAF45'],
    icon: '📷'
  },
  {
    id: 'youtube-v1',
    name: 'YouTube Style',
    domains: ['youtube.com', 'youtu.be'],
    isActive: true,
    usage: 0,
    colors: ['#FF0000', '#CC0000'],
    icon: '▶️'
  }
];

const FUTURE_TEMPLATES = [
  { id: 'linkedin-v1', name: 'LinkedIn', icon: '💼' },
  { id: 'tiktok-v1', name: 'TikTok', icon: '🎵' },
  { id: 'twitter-v1', name: 'Twitter/X', icon: '🐦' },
  { id: 'facebook-v1', name: 'Facebook', icon: '👥' },
  { id: 'whatsapp-v1', name: 'WhatsApp', icon: '💬' },
  { id: 'spotify-v1', name: 'Spotify', icon: '🎧' }
];

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {trend && (
        <p className="text-xs text-muted-foreground mt-1">
          <TrendingUp className="inline h-3 w-3 mr-1" />
          {trend}
        </p>
      )}
    </CardContent>
  </Card>
);

export default function SmartQRAdminPage() {
  const [templates, setTemplates] = useState(ACTIVE_TEMPLATES);
  const [stats] = useState({
    today: 0,
    week: 0,
    month: 0,
    totalUsers: 0
  });

  // Toggle template active state
  const toggleTemplate = (id: string) => {
    setTemplates(prev => 
      prev.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t)
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-blue-600" />
            Smart QR Control Panel
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona plantillas inteligentes y visualiza estadísticas
          </p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          <Code className="h-3 w-3 mr-1" />
          v1.0.0 Beta
        </Badge>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Generados Hoy" 
          value={stats.today}
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard 
          title="Esta Semana" 
          value={stats.week}
          icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
          trend="+12% vs semana anterior"
        />
        <StatCard 
          title="Este Mes" 
          value={stats.month}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          trend="+25% vs mes anterior"
        />
        <StatCard 
          title="Usuarios Únicos" 
          value={stats.totalUsers}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Active Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Plantillas Activas</CardTitle>
          <CardDescription>
            Controla qué plantillas están disponibles para los usuarios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {templates.map(template => (
            <div 
              key={template.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-4">
                <div className="text-2xl">{template.icon}</div>
                <div>
                  <h3 className="font-semibold">{template.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {template.domains.join(', ')} • {template.usage} usos
                  </p>
                  <div className="flex gap-1 mt-2">
                    {template.colors.map((color, i) => (
                      <div 
                        key={i}
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                <Switch 
                  checked={template.isActive}
                  onCheckedChange={() => toggleTemplate(template.id)}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Future Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Próximas Plantillas</CardTitle>
          <CardDescription>
            Plantillas planificadas para futuras actualizaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FUTURE_TEMPLATES.map(template => (
              <div 
                key={template.id}
                className="flex items-center justify-between p-4 rounded-lg border border-dashed opacity-60"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl grayscale">{template.icon}</div>
                  <div>
                    <h3 className="font-medium">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">Próximamente</p>
                  </div>
                </div>
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
          
          <Alert className="mt-4">
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              Las nuevas plantillas se agregarán automáticamente basándose en los dominios más solicitados por los usuarios.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Analytics Placeholder */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-muted-foreground">Analytics Avanzados</CardTitle>
          <CardDescription>Próximamente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Dominios más solicitados sin plantilla</p>
            <p>• Tasa de conversión por plantilla</p>
            <p>• Análisis de uso por tipo de usuario</p>
            <p>• Tiempo promedio de generación</p>
            <p>• Distribución geográfica de uso</p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Configuración
        </Button>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Plantilla
        </Button>
      </div>
    </div>
  );
}