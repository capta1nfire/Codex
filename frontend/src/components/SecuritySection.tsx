'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Lock, Smartphone, Activity, AlertTriangle, Key, CheckCircle, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'password_change' | 'device_added' | 'suspicious_activity';
  description: string;
  location: string;
  device: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error';
}

interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  location: string;
  ip: string;
  lastActive: Date;
  isCurrent: boolean;
}

interface PrivacySetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  category: 'visibility' | 'sharing' | 'communication';
}

export const SecuritySection: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [privacySettings, setPrivacySettings] = useState<PrivacySetting[]>([]);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setSessions([
        {
          id: '1',
          device: 'MacBook Pro',
          browser: 'Chrome 120.0',
          location: 'Madrid, Spain',
          ip: '192.168.1.1',
          lastActive: new Date(),
          isCurrent: true
        },
        {
          id: '2',
          device: 'iPhone 15 Pro',
          browser: 'Safari Mobile',
          location: 'Madrid, Spain',
          ip: '192.168.1.25',
          lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
          isCurrent: false
        }
      ]);

      setSecurityEvents([
        {
          id: '1',
          type: 'login',
          description: 'Successful login from new device',
          location: 'Madrid, Spain',
          device: 'MacBook Pro',
          timestamp: new Date(),
          status: 'success'
        },
        {
          id: '2',
          type: 'password_change',
          description: 'Password changed successfully',
          location: 'Madrid, Spain',
          device: 'iPhone 15 Pro',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          status: 'success'
        }
      ]);

      setPrivacySettings([
        {
          id: '1',
          title: 'Profile Visibility',
          description: 'Allow others to see your profile information',
          enabled: true,
          category: 'visibility'
        },
        {
          id: '2',
          title: 'Activity Status',
          description: 'Show when you were last active',
          enabled: false,
          category: 'visibility'
        },
        {
          id: '3',
          title: 'Analytics Sharing',
          description: 'Share anonymous usage data to improve the platform',
          enabled: true,
          category: 'sharing'
        }
      ]);

      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getEventIcon = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'login': return <Key className="h-4 w-4" />;
      case 'logout': return <Lock className="h-4 w-4" />;
      case 'password_change': return <Shield className="h-4 w-4" />;
      case 'device_added': return <Smartphone className="h-4 w-4" />;
      case 'suspicious_activity': return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getEventBadgeVariant = (status: SecurityEvent['status']) => {
    switch (status) {
      case 'success': return 'default';
      case 'warning': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  const terminateSession = (sessionId: string) => {
    setSessions(prev => prev.filter(session => session.id !== sessionId));
  };

  const togglePrivacySetting = (settingId: string) => {
    setPrivacySettings(prev =>
      prev.map(setting =>
        setting.id === settingId
          ? { ...setting, enabled: !setting.enabled }
          : setting
      )
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-corporate-blue-50 to-slate-50 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Hero Loading */}
          <div className="relative bg-gradient-to-r from-corporate-blue-500 to-corporate-blue-600 rounded-xl p-8 overflow-hidden">
            <div className="absolute inset-0 bg-corporate-blue-600/20"></div>
            <div className="relative">
              <div className="h-8 bg-white/20 rounded-lg w-64 mb-4 animate-pulse"></div>
              <div className="h-4 bg-white/15 rounded w-96 animate-pulse"></div>
            </div>
          </div>

          {/* Loading Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-slate-200 rounded w-32"></div>
                  <div className="h-4 bg-slate-150 rounded w-48"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 bg-slate-200 rounded"></div>
                    <div className="h-4 bg-slate-150 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-corporate-blue-50 to-slate-50 p-6">
      {/* Floating Navigation */}
      <div className="fixed top-6 left-6 z-40 flex gap-3">
        <Button
          onClick={() => router.back()}
          variant="outline"
          size="sm"
          className="shadow-corporate-lg backdrop-blur-sm bg-white/90 hover:bg-white border-corporate-blue-200 hover:border-corporate-blue-300"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Link href="/">
          <Button
            variant="outline"
            size="sm"
            className="shadow-corporate-lg backdrop-blur-sm bg-white/90 hover:bg-white border-corporate-blue-200 hover:border-corporate-blue-300"
          >
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        </Link>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Hero Section */}
                 <div className="relative bg-gradient-to-r from-corporate-blue-500 to-corporate-blue-600 rounded-xl p-8 overflow-hidden shadow-corporate-hero">
           <div className="absolute inset-0 bg-corporate-blue-600/20"></div>
          <div className="relative flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Security Center</h1>
              <p className="text-corporate-blue-100 text-lg">
                Manage your account security, privacy settings, and monitor activity
              </p>
            </div>
          </div>
        </div>

        {/* Security Overview Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-corporate-lg transition-all duration-300 border-corporate-blue-200 hover:border-corporate-blue-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Security Score</p>
                  <p className="text-2xl font-bold text-green-600">85%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-corporate-lg transition-all duration-300 border-corporate-blue-200 hover:border-corporate-blue-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-corporate-blue-100 flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-corporate-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Sessions</p>
                  <p className="text-2xl font-bold">{sessions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-corporate-lg transition-all duration-300 border-corporate-blue-200 hover:border-corporate-blue-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recent Events</p>
                  <p className="text-2xl font-bold">{securityEvents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-corporate-lg transition-all duration-300 border-corporate-blue-200 hover:border-corporate-blue-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  twoFactorEnabled ? 'bg-green-100' : 'bg-orange-100'
                }`}>
                  <Lock className={`h-5 w-5 ${
                    twoFactorEnabled ? 'text-green-600' : 'text-orange-600'
                  }`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">2FA Status</p>
                  <p className={`text-lg font-semibold ${
                    twoFactorEnabled ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-corporate-sm">
            <TabsTrigger value="overview" className="data-[state=active]:bg-corporate-blue-500 data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-corporate-blue-500 data-[state=active]:text-white">
              Sessions
            </TabsTrigger>
            <TabsTrigger value="privacy" className="data-[state=active]:bg-corporate-blue-500 data-[state=active]:text-white">
              Privacy
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-corporate-blue-500 data-[state=active]:text-white">
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Two-Factor Authentication */}
            <Card className="hero-card border-2 border-corporate-blue-200 shadow-corporate-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-corporate-blue-600" />
                      Two-Factor Authentication
                    </CardTitle>
                    <CardDescription>
                      Add an extra layer of security to your account
                    </CardDescription>
                  </div>
                  <Switch
                    checked={twoFactorEnabled}
                    onCheckedChange={setTwoFactorEnabled}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!twoFactorEnabled ? (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <p className="font-medium text-orange-800">2FA Not Enabled</p>
                    </div>
                    <p className="text-sm text-orange-700">
                      Your account is vulnerable without two-factor authentication. Enable it now for better security.
                    </p>
                    <Button 
                      className="mt-3"
                      onClick={() => setShowQRCode(true)}
                    >
                      Enable 2FA
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <p className="font-medium text-green-800">2FA Enabled</p>
                    </div>
                    <p className="text-sm text-green-700">
                      Your account is protected with two-factor authentication.
                    </p>
                    <Button 
                      variant="outline"
                      className="mt-3"
                      onClick={() => setTwoFactorEnabled(false)}
                    >
                      Disable 2FA
                    </Button>
                  </div>
                )}

                {showQRCode && !twoFactorEnabled && (
                  <div className="p-4 border border-corporate-blue-200 rounded-lg bg-corporate-blue-50">
                    <h4 className="font-medium mb-3">Set up 2FA</h4>
                    <div className="space-y-4">
                                             <div className="qr-placeholder h-32 w-32 border-2 border-corporate-blue-300 rounded-lg flex items-center justify-center mx-auto">
                         <p className="text-xs text-center text-muted-foreground">QR Code Placeholder</p>
                       </div>
                      <div className="space-y-2">
                        <Label htmlFor="verification-code">Enter verification code</Label>
                        <Input
                          id="verification-code"
                          placeholder="000000"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          maxLength={6}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => {
                            if (verificationCode.length === 6) {
                              setTwoFactorEnabled(true);
                              setShowQRCode(false);
                              setVerificationCode('');
                            }
                          }}
                          disabled={verificationCode.length !== 6}
                        >
                          Verify & Enable
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setShowQRCode(false);
                            setVerificationCode('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Password Security */}
            <Card className="border-corporate-blue-200 hover:shadow-corporate-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-corporate-blue-600" />
                  Password Security
                </CardTitle>
                <CardDescription>
                  Manage your password and security preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-green-200 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-green-800">Strong Password</p>
                    <p className="text-sm text-green-700">Last changed 30 days ago</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <Button variant="outline" className="w-full">
                  Change Password
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card className="border-corporate-blue-200">
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>
                  Manage devices and browsers that are currently signed in to your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                                 {sessions.map((session) => (
                   <div 
                     key={session.id}
                     className="session-card flex items-center justify-between p-4 border border-slate-200 rounded-lg"
                   >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-corporate-blue-100 flex items-center justify-center">
                        <Smartphone className="h-5 w-5 text-corporate-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{session.device}</p>
                          {session.isCurrent && (
                            <Badge variant="secondary" className="text-xs">Current</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{session.browser}</p>
                        <p className="text-xs text-muted-foreground">
                          {session.location} • {session.ip} • {formatRelativeTime(session.lastActive)}
                        </p>
                      </div>
                    </div>
                    {!session.isCurrent && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => terminateSession(session.id)}
                      >
                        Terminate
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <Card className="border-corporate-blue-200">
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>
                  Control how your information is shared and displayed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                                 {privacySettings.map((setting) => (
                   <div 
                     key={setting.id}
                     className="privacy-switch-card flex items-center justify-between p-4 border border-slate-200 rounded-lg"
                   >
                    <div>
                      <p className="font-medium">{setting.title}</p>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                    <Switch
                      checked={setting.enabled}
                      onCheckedChange={() => togglePrivacySetting(setting.id)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card className="border-corporate-blue-200">
              <CardHeader>
                <CardTitle>Security Activity</CardTitle>
                <CardDescription>
                  Monitor recent security events and account activities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                                 {securityEvents.map((event) => (
                   <div 
                     key={event.id}
                     className="activity-event flex items-center gap-4 p-4 border border-slate-200 rounded-lg"
                   >
                    <div className="flex-shrink-0">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        event.status === 'success' ? 'bg-green-100 text-green-600' :
                        event.status === 'warning' ? 'bg-orange-100 text-orange-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {getEventIcon(event.type)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{event.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {event.device} from {event.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getEventBadgeVariant(event.status)}>
                        {event.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(event.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}; 