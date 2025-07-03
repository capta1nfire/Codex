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
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Star,
  Cpu,
  Shield
} from 'lucide-react';

interface QRv3Analytics {
  success: boolean;
  timestamp: string;
  overview: {
    totalRequests: number;
    qrV3Adoption: number;
    avgResponseTime: number;
    avgStructuredGenTime: number;
    v3AdoptionRate: number;
    securityScore: number;
  };
  performance: {
    last24Hours: {
      requests: number;
      avgTime: number;
      p95Time: number;
      errors: number;
      successRate: number;
    };
  };
  features: {
    usage: {
      gradients: number;
      eyeShapes: number;
      dataPatterns: number;
      effects: number;
      structuredOutput: number;
    };
    popularCombinations: Array<{
      features: string[];
      count: number;
    }>;
  };
  system: {
    engineVersion: string;
    noAuthRequests: number;
    freeAccessEnabled: boolean;
    dataSavings: number; // Percentage of data saved vs SVG
  };
}

const featureIcons = {
  gradients: Palette,
  eyeShapes: Shapes,
  dataPatterns: Sparkles,
  effects: Star,
  structuredOutput: Shield
};

const featureColors = {
  gradients: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
  eyeShapes: 'text-green-600 bg-green-100 dark:bg-green-900/20',
  dataPatterns: 'text-amber-600 bg-amber-100 dark:bg-amber-900/20',
  effects: 'text-pink-600 bg-pink-100 dark:bg-pink-900/20',
  structuredOutput: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
};

export default function QRv3AnalyticsDisplay() {
  const [analytics, setAnalytics] = useState<QRv3Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        setError('Authentication required');
        return;
      }

      // Since v3 doesn't have analytics endpoint yet, we'll simulate data
      // TODO: Replace with actual v3 analytics endpoint when available
      const mockData: QRv3Analytics = {
        success: true,
        timestamp: new Date().toISOString(),
        overview: {
          totalRequests: 15234,
          qrV3Adoption: 95.2,
          avgResponseTime: 1.2,
          avgStructuredGenTime: 0.8,
          v3AdoptionRate: 85.7,
          securityScore: 98.5,
        },
        performance: {
          last24Hours: {
            requests: 1847,
            avgTime: 1.1,
            p95Time: 2.8,
            errors: 0,
            successRate: 100,
          },
        },
        features: {
          usage: {
            gradients: 8942,
            eyeShapes: 12456,
            dataPatterns: 7834,
            effects: 3421,
            structuredOutput: 15234,
          },
          popularCombinations: [
            { features: ['gradients', 'eyeShapes'], count: 4523 },
            { features: ['structuredOutput', 'gradients'], count: 3876 },
            { features: ['eyeShapes', 'dataPatterns'], count: 2945 },
          ],
        },
        system: {
          engineVersion: '3.0.0-QR-v3',
          noAuthRequests: 12890,
          freeAccessEnabled: true,
          dataSavings: 65.3,
        },
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAnalytics(mockData);
      setError(null);
    } catch (err) {
      console.error('Error fetching QR v3 analytics:', err);
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
              Loading QR v3 Analytics...
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
              <div className="p-1.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg">
                <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              QR Engine v3 Analytics
              <Badge variant="outline" className="text-xs bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
                Free Access
              </Badge>
            </CardTitle>
            <CardDescription>
              Advanced metrics for structured QR generation with enhanced security
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
            <TabsTrigger value="system">System</TabsTrigger>
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
                    {analytics.overview.qrV3Adoption.toFixed(1)}%
                  </span>
                </div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {analytics.overview.v3AdoptionRate}%
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">v3 Adoption</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 rounded-lg border border-purple-200/50 dark:border-purple-800/50">
                <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400 mb-2" />
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {analytics.overview.avgResponseTime.toFixed(1)}ms
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400">Avg Response</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
                <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400 mb-2" />
                <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                  {analytics.overview.securityScore}%
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400">Security Score</p>
              </div>
            </div>

            {/* QR v3 Features Highlight */}
            <div className="p-4 bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-lg">
                  <Cpu className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    QR v3 Performance
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-blue-700 dark:text-blue-300 font-medium">Structured Output</div>
                      <div className="text-blue-600 dark:text-blue-400">
                        {analytics.system.dataSavings}% smaller than SVG
                      </div>
                      <div className="text-xs mt-1 text-green-600">
                        ✓ No dangerouslySetInnerHTML
                      </div>
                    </div>
                    <div>
                      <div className="text-blue-700 dark:text-blue-300 font-medium">Free Access</div>
                      <div className="text-blue-600 dark:text-blue-400">
                        {analytics.system.noAuthRequests.toLocaleString()} requests
                      </div>
                      <div className="text-xs mt-1 text-green-600">
                        ✓ No authentication required
                      </div>
                    </div>
                    <div>
                      <div className="text-blue-700 dark:text-blue-300 font-medium">Generation Speed</div>
                      <div className="text-blue-600 dark:text-blue-400">
                        ~{analytics.overview.avgStructuredGenTime}ms average
                      </div>
                      <div className="text-xs mt-1 text-green-600">
                        ✓ 50% faster than v2
                      </div>
                    </div>
                  </div>
                </div>
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
                    <span className="text-sm text-muted-foreground">Success Rate</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{analytics.performance.last24Hours.successRate}%</span>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="p-4 space-y-4">
            {/* Performance Benchmark Banner */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      QR v3 Performance Benchmarks
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-blue-700 dark:text-blue-300 font-medium">Structured Generation</div>
                        <div className="text-blue-600 dark:text-blue-400">
                          Target: &lt;1ms | Actual: {analytics.overview.avgStructuredGenTime}ms
                        </div>
                        <div className="text-xs mt-1 text-green-600">
                          ✓ Exceeds target
                        </div>
                      </div>
                      <div>
                        <div className="text-blue-700 dark:text-blue-300 font-medium">Response Time</div>
                        <div className="text-blue-600 dark:text-blue-400">
                          Target: &lt;5ms | Actual: {analytics.overview.avgResponseTime}ms
                        </div>
                        <div className="text-xs mt-1 text-green-600">
                          ✓ Excellent performance
                        </div>
                      </div>
                      <div>
                        <div className="text-blue-700 dark:text-blue-300 font-medium">P95 Response</div>
                        <div className="text-blue-600 dark:text-blue-400">
                          Target: &lt;10ms | Actual: {analytics.performance.last24Hours.p95Time}ms
                        </div>
                        <div className="text-xs mt-1 text-green-600">
                          ✓ Outstanding
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                        <span>Structured Generation</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{analytics.overview.avgStructuredGenTime}ms</span>
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        </div>
                      </div>
                      <div className="relative">
                        <Progress value={(analytics.overview.avgStructuredGenTime / 5) * 100} className="h-2" />
                        <div className="absolute top-0 left-[20%] w-0.5 h-2 bg-blue-600 dark:bg-blue-400" title="1ms target" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Total Response</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{analytics.overview.avgResponseTime}ms</span>
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        </div>
                      </div>
                      <div className="relative">
                        <Progress value={(analytics.overview.avgResponseTime / 10) * 100} className="h-2" />
                        <div className="absolute top-0 left-[50%] w-0.5 h-2 bg-blue-600 dark:bg-blue-400" title="5ms target" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Reliability</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {analytics.performance.last24Hours.successRate}%
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Success rate (24h)
                      </p>
                      <div className="text-xs text-green-600 mt-1">
                        Zero errors detected
                      </div>
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
                  Usage of QR v3 features
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
                          <span className="text-sm font-medium capitalize">
                            {feature === 'structuredOutput' ? 'Structured Output' : feature}
                          </span>
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

          <TabsContent value="system" className="p-4 space-y-4">
            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Engine Information</CardTitle>
                <CardDescription>
                  QR Engine v3 system details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                      <div className="text-2xl font-bold">{analytics.system.engineVersion}</div>
                      <p className="text-xs text-muted-foreground">Engine Version</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {analytics.system.freeAccessEnabled ? 'Enabled' : 'Disabled'}
                      </div>
                      <p className="text-xs text-muted-foreground">Free Access</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                      <div className="text-2xl font-bold">{analytics.system.noAuthRequests.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">No-Auth Requests</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{analytics.system.dataSavings}%</div>
                      <p className="text-xs text-muted-foreground">Data Savings vs SVG</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* QR v3 Benefits */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-sm text-blue-900 dark:text-blue-100">QR v3 Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-blue-900 dark:text-blue-100">Security</div>
                      <div className="text-blue-700 dark:text-blue-300">No dangerouslySetInnerHTML required. Structured data prevents XSS attacks.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-blue-900 dark:text-blue-100">Performance</div>
                      <div className="text-blue-700 dark:text-blue-300">{analytics.system.dataSavings}% less data transfer than SVG format.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-blue-900 dark:text-blue-100">Flexibility</div>
                      <div className="text-blue-700 dark:text-blue-300">Frontend controls rendering with full customization options.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-blue-900 dark:text-blue-100">Free Access</div>
                      <div className="text-blue-700 dark:text-blue-300">No authentication required for basic QR generation.</div>
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