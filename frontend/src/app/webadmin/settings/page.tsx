'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Database, 
  Shield, 
  Server, 
  Mail, 
  Globe, 
  Key, 
  AlertTriangle,
  Save,
  RefreshCw
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function WebAdminSettingsPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <WebAdminSettingsContent />
    </ProtectedRoute>
  );
}

function WebAdminSettingsContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    // Database Settings
    dbMaxConnections: 100,
    dbTimeout: 30,
    dbBackupEnabled: true,
    
    // API Settings
    apiRateLimit: 1000,
    apiCacheTtl: 300,
    apiLoggingEnabled: true,
    
    // Security Settings
    sessionTimeout: 3600,
    passwordMinLength: 8,
    twoFactorRequired: false,
    
    // Email Settings
    smtpHost: '',
    smtpPort: 587,
    smtpSecure: true,
    
    // System Settings
    maintenanceMode: false,
    debugMode: false,
    systemName: 'CODEX',
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Simular guardado de configuración
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert('Configuración guardada exitosamente');
    } catch (error) {
      alert('Error al guardar la configuración');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm('¿Estás seguro de que quieres restaurar la configuración por defecto?')) {
      // Reset a valores por defecto
      setSettings({
        dbMaxConnections: 100,
        dbTimeout: 30,
        dbBackupEnabled: true,
        apiRateLimit: 1000,
        apiCacheTtl: 300,
        apiLoggingEnabled: true,
        sessionTimeout: 3600,
        passwordMinLength: 8,
        twoFactorRequired: false,
        smtpHost: '',
        smtpPort: 587,
        smtpSecure: true,
        maintenanceMode: false,
        debugMode: false,
        systemName: 'CODEX',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header - WebAdmin Theme */}
      <div className="bg-gradient-to-r from-red-50/50 via-slate-50/50 to-red-50/50 dark:from-red-950/20 dark:via-slate-950/20 dark:to-red-950/20 border-b border-red-200/30 dark:border-red-800/30 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <Settings className="h-6 w-6 text-red-600 dark:text-red-400" />
                Configuración del Sistema
              </h1>
              <p className="text-sm text-red-600/70 dark:text-red-400/70 mt-1 font-medium">
                Ajustes globales y configuración avanzada del sistema CODEX
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Database Configuration */}
          <Card className="shadow-lg shadow-red-500/10 border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                Configuración de Base de Datos
              </CardTitle>
              <CardDescription>
                Configurar parámetros de conexión y rendimiento de la base de datos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maxConnections">Máximo de Conexiones</Label>
                <Input
                  id="maxConnections"
                  type="number"
                  value={settings.dbMaxConnections}
                  onChange={(e) => setSettings({...settings, dbMaxConnections: parseInt(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dbTimeout">Timeout (segundos)</Label>
                <Input
                  id="dbTimeout"
                  type="number"
                  value={settings.dbTimeout}
                  onChange={(e) => setSettings({...settings, dbTimeout: parseInt(e.target.value)})}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="backupEnabled">Backup Automático</Label>
                <Switch
                  id="backupEnabled"
                  checked={settings.dbBackupEnabled}
                  onCheckedChange={(checked) => setSettings({...settings, dbBackupEnabled: checked})}
                />
              </div>
            </CardContent>
          </Card>

          {/* API Configuration */}
          <Card className="shadow-lg shadow-red-500/10 border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-green-600" />
                Configuración de API
              </CardTitle>
              <CardDescription>
                Configurar límites de velocidad y cacheo de la API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rateLimit">Rate Limit (req/hora)</Label>
                <Input
                  id="rateLimit"
                  type="number"
                  value={settings.apiRateLimit}
                  onChange={(e) => setSettings({...settings, apiRateLimit: parseInt(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cacheTtl">Cache TTL (segundos)</Label>
                <Input
                  id="cacheTtl"
                  type="number"
                  value={settings.apiCacheTtl}
                  onChange={(e) => setSettings({...settings, apiCacheTtl: parseInt(e.target.value)})}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="apiLogging">Logging de API</Label>
                <Switch
                  id="apiLogging"
                  checked={settings.apiLoggingEnabled}
                  onCheckedChange={(checked) => setSettings({...settings, apiLoggingEnabled: checked})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="shadow-lg shadow-red-500/10 border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-600" />
                Configuración de Seguridad
              </CardTitle>
              <CardDescription>
                Configurar políticas de seguridad y autenticación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Timeout de Sesión (segundos)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passwordLength">Longitud Mínima de Contraseña</Label>
                <Input
                  id="passwordLength"
                  type="number"
                  value={settings.passwordMinLength}
                  onChange={(e) => setSettings({...settings, passwordMinLength: parseInt(e.target.value)})}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="twoFactor">Requiere 2FA</Label>
                <Switch
                  id="twoFactor"
                  checked={settings.twoFactorRequired}
                  onCheckedChange={(checked) => setSettings({...settings, twoFactorRequired: checked})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Email Configuration */}
          <Card className="shadow-lg shadow-red-500/10 border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-purple-600" />
                Configuración de Email
              </CardTitle>
              <CardDescription>
                Configurar servidor SMTP para notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="smtpHost">Servidor SMTP</Label>
                <Input
                  id="smtpHost"
                  type="text"
                  placeholder="smtp.gmail.com"
                  value={settings.smtpHost}
                  onChange={(e) => setSettings({...settings, smtpHost: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPort">Puerto SMTP</Label>
                <Input
                  id="smtpPort"
                  type="number"
                  value={settings.smtpPort}
                  onChange={(e) => setSettings({...settings, smtpPort: parseInt(e.target.value)})}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="smtpSecure">Conexión Segura (TLS)</Label>
                <Switch
                  id="smtpSecure"
                  checked={settings.smtpSecure}
                  onCheckedChange={(checked) => setSettings({...settings, smtpSecure: checked})}
                />
              </div>
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card className="shadow-lg shadow-red-500/10 border-border/50 bg-card/80 backdrop-blur-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-indigo-600" />
                Configuración del Sistema
              </CardTitle>
              <CardDescription>
                Configuración global del sistema y modo de mantenimiento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="systemName">Nombre del Sistema</Label>
                  <Input
                    id="systemName"
                    type="text"
                    value={settings.systemName}
                    onChange={(e) => setSettings({...settings, systemName: e.target.value})}
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maintenanceMode" className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      Modo Mantenimiento
                    </Label>
                    <Switch
                      id="maintenanceMode"
                      checked={settings.maintenanceMode}
                      onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="debugMode" className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-gray-600" />
                      Modo Debug
                    </Label>
                    <Switch
                      id="debugMode"
                      checked={settings.debugMode}
                      onCheckedChange={(checked) => setSettings({...settings, debugMode: checked})}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={isLoading}
                  className="border-border/50 hover:border-border hover:bg-card hover:shadow-md transition-all duration-200"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Restaurar Defecto
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-500/25 transition-all duration-200 hover:-translate-y-0.5"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Guardando...
                    </div>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar Configuración
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 