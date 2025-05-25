'use client';

import { useState } from 'react';
import { Users, Crown, Search, Plus, Edit, Trash2, Shield, Zap, Star } from 'lucide-react';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function WebAdminUsersPage() {
  return (
    <ProtectedRoute requiredRole="WEBADMIN">
      <WebAdminUsersContent />
    </ProtectedRoute>
  );
}

function WebAdminUsersContent() {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data para demostración
  const mockUsers = [
    {
      id: '1',
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@example.com',
      role: 'USER',
      isActive: true,
      lastLogin: '2024-01-15T10:30:00Z',
      createdAt: '2023-12-01T09:00:00Z'
    },
    {
      id: '2',
      firstName: 'María',
      lastName: 'García',
      email: 'maria.garcia@example.com',
      role: 'PREMIUM',
      isActive: true,
      lastLogin: '2024-01-14T15:45:00Z',
      createdAt: '2023-11-15T14:00:00Z'
    },
    {
      id: '3',
      firstName: 'Carlos',
      lastName: 'López',
      email: 'carlos.lopez@example.com',
      role: 'ADVANCED',
      isActive: true,
      lastLogin: '2024-01-16T08:15:00Z',
      createdAt: '2023-10-01T16:30:00Z'
    },
    {
      id: '4',
      firstName: 'Ana',
      lastName: 'Martínez',
      email: 'ana.martinez@example.com',
      role: 'WEBADMIN',
      isActive: true,
      lastLogin: '2024-01-16T12:00:00Z',
      createdAt: '2023-09-01T10:00:00Z'
    }
  ];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPERADMIN':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300"><Zap className="h-3 w-3 mr-1" />Super Admin</Badge>;
      case 'WEBADMIN':
        return <Badge className="bg-slate-100 text-slate-800 border-slate-300"><Crown className="h-3 w-3 mr-1" />Admin</Badge>;
      case 'ADVANCED':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300"><Crown className="h-3 w-3 mr-1" />Enterprise</Badge>;
      case 'PREMIUM':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-300"><Shield className="h-3 w-3 mr-1" />PRO</Badge>;
      case 'USER':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300"><Star className="h-3 w-3 mr-1" />Freemium</Badge>;
      default:
        return <Badge variant="secondary"><Star className="h-3 w-3 mr-1" />Freemium</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredUsers = mockUsers.filter(user =>
    user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-slate-50/20 to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50/50 via-slate-50/50 to-blue-50/50 dark:from-blue-950/20 dark:via-slate-950/20 dark:to-blue-950/20 border-b border-blue-200/30 dark:border-blue-800/30 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <Crown className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                Gestión de Usuarios
              </h1>
              <p className="text-sm text-blue-600/70 dark:text-blue-400/70 mt-1 font-medium">
                Panel de administración para gestionar usuarios del sistema
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controles superiores */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuarios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>

        {/* Lista de usuarios */}
        <Card className="shadow-lg shadow-blue-500/10 border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Usuarios del Sistema
            </CardTitle>
            <CardDescription>
              {filteredUsers.length} usuarios encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border border-border/30 rounded-lg bg-card/50 hover:bg-card/70 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Último acceso: {formatDate(user.lastLogin)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {getRoleBadge(user.role)}
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-lg shadow-blue-500/10 border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Star className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {mockUsers.filter(u => u.role === 'USER').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Freemium</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg shadow-purple-500/10 border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {mockUsers.filter(u => u.role === 'PREMIUM').length}
                  </div>
                  <div className="text-sm text-muted-foreground">PRO</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg shadow-amber-500/10 border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Crown className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {mockUsers.filter(u => u.role === 'ADVANCED').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Enterprise</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg shadow-slate-500/10 border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-900/30">
                  <Crown className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {mockUsers.filter(u => u.role === 'WEBADMIN').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Admins</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
} 