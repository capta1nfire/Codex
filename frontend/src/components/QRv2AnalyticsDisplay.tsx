'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { 
  Zap, 
  TrendingUp, 
  Database, 
  Activity,
  Palette,
  Image,
  Shapes,
  Sparkles,
  Frame,
  RefreshCw,
  Trash2,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface QRv2Analytics {
  success: boolean;
  timestamp: string;
  overview: {
    totalRequests: number;
    cacheHitRate: number;
    avgResponseTime: number;
    avgCacheHitTime: number;
    v2AdoptionRate: number;
  };
  performance: {
    last24Hours: {
      requests: number;
      avgTime: number;
      p95Time: number;
      errors: number;
    };
  };
  features: {
    usage: {
      gradients: number;
      logos: number;
      customShapes: number;
      effects: number;
      frames: number;
    };
    popularCombinations: Array<{
      features: string[];
      count: number;
    }>;
  };
  cache: {
    size: number;
    hitRate: number;
    memoryUsage: number;
  };
}

const featureIcons = {
  gradients: Palette,
  logos: Image,
  customShapes: Shapes,
  effects: Sparkles,
  frames: Frame
};

const featureColors = {
  gradients: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
  logos: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
  customShapes: 'text-green-600 bg-green-100 dark:bg-green-900/20',
  effects: 'text-amber-600 bg-amber-100 dark:bg-amber-900/20',
  frames: 'text-pink-600 bg-pink-100 dark:bg-pink-900/20'
};

export default function QRv2AnalyticsDisplay() {
  const [analytics, setAnalytics] = useState<QRv2Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/qr/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching QR v2 analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/qr/cache/clear`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Refresh analytics after clearing cache
        await fetchAnalytics();
      }
    } catch (err) {
      console.error('Error clearing cache:', err);
    } finally {
      setClearingCache(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 border-2 border-blue-200 dark:border-blue-700 rounded-full"></div>
              <div className="absolute inset-0 w-8 h-8 border-2 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
            </div>
            <p className="text-sm text-muted-foreground animate-pulse">
              Loading QR v2 Analytics...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !analytics) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-sm text-muted-foreground">{error || 'No data available'}</p>
            <Button onClick={fetchAnalytics} size="sm" variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate feature adoption percentages
  const totalFeatureUsage = Object.values(analytics.features.usage).reduce((a, b) => a + b, 0);
  const featureAdoption = Object.entries(analytics.features.usage).map(([feature, count]) => ({
    feature,
    percentage: totalFeatureUsage > 0 ? (count / totalFeatureUsage) * 100 : 0
  }));

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-500/10 rounded-lg">
                <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              QR Engine v2 Analytics
            </CardTitle>
            <CardDescription>
              Advanced metrics for QR code generation and customization
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              size="sm"
              variant="outline"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="w-full justify-start rounded-none border-b px-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="cache">Cache</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="p-4 space-y-4">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <Badge variant="secondary" className="text-xs">Live</Badge>
                </div>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {analytics.overview.totalRequests.toLocaleString()}
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400">Total Requests</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 rounded-lg border border-green-200/50 dark:border-green-800/50">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">
                    {analytics.overview.cacheHitRate.toFixed(1)}%
                  </span>
                </div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {analytics.overview.v2AdoptionRate}%
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">v2 Adoption</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 rounded-lg border border-purple-200/50 dark:border-purple-800/50">
                <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400 mb-2" />
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {analytics.overview.avgResponseTime.toFixed(1)}ms
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400">Avg Response</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
                <Database className="h-4 w-4 text-amber-600 dark:text-amber-400 mb-2" />
                <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                  {analytics.overview.avgCacheHitTime.toFixed(1)}ms
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400">Cache Hit Time</p>
              </div>
            </div>

            {/* Performance Overview */}
            <Card className="border-slate-200/50 dark:border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Last 24 Hours Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Requests</span>
                    <span className="font-medium">{analytics.performance.last24Hours.requests.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Average Time</span>
                    <span className="font-medium">{analytics.performance.last24Hours.avgTime.toFixed(2)}ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">95th Percentile</span>
                    <span className="font-medium">{analytics.performance.last24Hours.p95Time.toFixed(2)}ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Errors</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{analytics.performance.last24Hours.errors}</span>
                      {analytics.performance.last24Hours.errors === 0 ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="p-4 space-y-4">
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Response Time Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Cache Hits</span>
                        <span className="font-medium">{analytics.overview.avgCacheHitTime.toFixed(1)}ms</span>
                      </div>
                      <Progress value={20} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Cache Misses</span>
                        <span className="font-medium">{analytics.overview.avgResponseTime.toFixed(1)}ms</span>
                      </div>
                      <Progress value={80} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Error Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        0.00%
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        No errors in the last 24 hours
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="features" className="p-4 space-y-4">
            {/* Feature Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Feature Adoption</CardTitle>
                <CardDescription>
                  Usage of advanced customization features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {featureAdoption.map(({ feature, percentage }) => {
                  const Icon = featureIcons[feature as keyof typeof featureIcons];
                  const colorClass = featureColors[feature as keyof typeof featureColors];
                  
                  return (
                    <div key={feature} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn("p-1.5 rounded-lg", colorClass)}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium capitalize">{feature}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {analytics.features.usage[feature as keyof typeof analytics.features.usage]} uses
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Popular Combinations */}
            {analytics.features.popularCombinations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Popular Feature Combinations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.features.popularCombinations.map((combo, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          {combo.features.map(feature => {
                            const Icon = featureIcons[feature as keyof typeof featureIcons];
                            return Icon ? <Icon key={feature} className="h-4 w-4" /> : null;
                          })}
                        </div>
                        <Badge variant="secondary">{combo.count} uses</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="cache" className="p-4 space-y-4">
            {/* Cache Statistics */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">Cache Performance</CardTitle>
                    <CardDescription>
                      Distributed Redis cache statistics
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleClearCache}
                    disabled={clearingCache}
                    size="sm"
                    variant="destructive"
                  >
                    <Trash2 className={cn("h-4 w-4 mr-2", clearingCache && "animate-spin")} />
                    Clear Cache
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                      <div className="text-2xl font-bold">{analytics.cache.hitRate}%</div>
                      <p className="text-xs text-muted-foreground">Hit Rate</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                      <div className="text-2xl font-bold">{analytics.cache.size}</div>
                      <p className="text-xs text-muted-foreground">Total Entries</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                      <div className="text-2xl font-bold">{analytics.cache.memoryUsage}MB</div>
                      <p className="text-xs text-muted-foreground">Memory Usage</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                      <div className="text-2xl font-bold">{analytics.overview.avgCacheHitTime.toFixed(1)}ms</div>
                      <p className="text-xs text-muted-foreground">Avg Hit Time</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}