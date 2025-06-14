'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function TestQRv2FeaturesPage() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<string | null>(null);

  const tests = [
    {
      id: 'gradient-eyes',
      name: 'Gradient + Custom Eyes',
      description: 'Linear gradient with star-shaped eyes',
      payload: {
        data: 'QR Engine v2 - Gradient + Eyes',
        options: {
          size: 400,
          eyeShape: 'star',
          gradient: {
            type: 'linear',
            colors: ['#3B82F6', '#8B5CF6'],
            angle: 45
          }
        }
      }
    },
    {
      id: 'pattern-effects',
      name: 'Pattern + Effects',
      description: 'Circular pattern with shadow and glow',
      payload: {
        data: 'QR Engine v2 - Patterns + Effects',
        options: {
          size: 400,
          dataPattern: 'circular',
          eyeShape: 'circle',
          effects: [
            { type: 'shadow', intensity: 2.0 },
            { type: 'glow', intensity: 1.5, color: '#3B82F6' }
          ]
        }
      }
    },
    {
      id: 'frame-text',
      name: 'Frame with Text',
      description: 'Bubble frame with custom text',
      payload: {
        data: 'QR Engine v2 - Framed',
        options: {
          size: 400,
          frame: {
            style: 'bubble',
            text: 'Scan for Magic! ✨',
            color: '#8B5CF6',
            text_position: 'bottom'
          }
        }
      }
    },
    {
      id: 'all-features',
      name: 'All Features Combined',
      description: 'Everything at once!',
      payload: {
        data: 'https://qr-engine-v2-demo.com',
        options: {
          size: 500,
          eyeShape: 'heart',
          dataPattern: 'wave',
          gradient: {
            type: 'radial',
            colors: ['#10B981', '#047857']
          },
          effects: [
            { type: 'shadow', intensity: 1.5 },
            { type: 'vintage', intensity: 0.3 }
          ],
          frame: {
            style: 'badge',
            text: 'QR Engine v2',
            color: '#047857'
          }
        }
      }
    }
  ];

  const runTest = async (test: typeof tests[0]) => {
    setLoading(test.id);
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004';
      const response = await fetch(`${backendUrl}/api/v2/qr/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test.payload)
      });

      const result = await response.json();
      
      if (response.ok) {
        setResults(prev => ({
          ...prev,
          [test.id]: {
            success: true,
            svg: result.svg,
            metadata: result.metadata,
            cached: result.cached
          }
        }));
      } else {
        setResults(prev => ({
          ...prev,
          [test.id]: {
            success: false,
            error: result.error || 'Unknown error'
          }
        }));
      }
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [test.id]: {
          success: false,
          error: error instanceof Error ? error.message : 'Network error'
        }
      }));
    } finally {
      setLoading(null);
    }
  };

  const runAllTests = async () => {
    for (const test of tests) {
      await runTest(test);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">QR Engine v2 - Feature Test Suite</h1>
        <p className="text-muted-foreground">
          Test all the new QR Engine v2 features: gradients, eye shapes, patterns, effects, and frames.
        </p>
      </div>

      <div className="mb-6 flex gap-4">
        <Button onClick={runAllTests} disabled={loading !== null}>
          Run All Tests
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setResults({})}
          disabled={loading !== null}
        >
          Clear Results
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {tests.map((test) => (
          <Card key={test.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{test.name}</span>
                {results[test.id] && (
                  <Badge variant={results[test.id].success ? 'default' : 'destructive'}>
                    {results[test.id].success ? 'Success' : 'Failed'}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{test.description}</p>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="config" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="config">Config</TabsTrigger>
                  <TabsTrigger value="result">Result</TabsTrigger>
                  <TabsTrigger value="metadata">Metadata</TabsTrigger>
                </TabsList>
                
                <TabsContent value="config" className="space-y-4">
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                    {JSON.stringify(test.payload, null, 2)}
                  </pre>
                  <Button 
                    onClick={() => runTest(test)}
                    disabled={loading !== null}
                    className="w-full"
                  >
                    {loading === test.id ? 'Running...' : 'Run Test'}
                  </Button>
                </TabsContent>
                
                <TabsContent value="result">
                  {results[test.id] ? (
                    results[test.id].success ? (
                      <div className="space-y-4">
                        <div 
                          className="bg-white p-4 rounded border flex items-center justify-center"
                          dangerouslySetInnerHTML={{ __html: results[test.id].svg }}
                          style={{ minHeight: '200px' }}
                        />
                        {results[test.id].cached && (
                          <Badge variant="secondary">From Cache</Badge>
                        )}
                      </div>
                    ) : (
                      <div className="text-destructive">
                        Error: {results[test.id].error}
                      </div>
                    )
                  ) : (
                    <div className="text-muted-foreground text-center py-8">
                      No results yet. Run the test to see output.
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="metadata">
                  {results[test.id]?.metadata ? (
                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                      {JSON.stringify(results[test.id].metadata, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-muted-foreground text-center py-8">
                      No metadata available
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Backend API</span>
              <Badge variant="default">✅ 100% Complete</Badge>
            </div>
            <div className="flex justify-between">
              <span>Frontend Hook</span>
              <Badge variant="secondary">✅ Updated with mappings</Badge>
            </div>
            <div className="flex justify-between">
              <span>UI Components</span>
              <Badge variant="destructive">❌ Need implementation</Badge>
            </div>
            <div className="flex justify-between">
              <span>Overall Integration</span>
              <Badge variant="secondary">40% Complete</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}