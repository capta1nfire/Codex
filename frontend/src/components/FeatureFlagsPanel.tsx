/**
 * Feature Flags Control Panel
 * Development tool for managing QR Engine v2 rollout
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  getFeatureFlags, 
  setFeatureFlag, 
  resetFeatureFlags,
  FEATURE_FLAGS
} from '@/config/feature-flags';
import { AlertCircle, RotateCcw, Settings } from 'lucide-react';

export function FeatureFlagsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const flags = getFeatureFlags();
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  const handleToggle = (key: keyof typeof FEATURE_FLAGS, currentValue: boolean) => {
    const confirmMessage = currentValue 
      ? `Disable ${key}? Page will reload.`
      : `Enable ${key}? Page will reload.`;
      
    if (window.confirm(confirmMessage)) {
      setFeatureFlag(key, !currentValue);
    }
  };
  
  const handleReset = () => {
    if (window.confirm('Reset all feature flags to defaults? Page will reload.')) {
      resetFeatureFlags();
    }
  };
  
  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 p-3 bg-slate-800 text-white rounded-full shadow-lg hover:bg-slate-700 transition-colors"
        title="Feature Flags"
      >
        <Settings className="w-5 h-5" />
      </button>
      
      {/* Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Feature Flags - QR Engine v2
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                ✕
              </Button>
            </CardHeader>
            
            <CardContent className="overflow-y-auto max-h-[calc(90vh-8rem)]">
              <div className="space-y-6">
                {/* Warning */}
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-semibold">Development Only</p>
                    <p>Changes will reload the page. Use for testing QR Engine v2 features.</p>
                  </div>
                </div>
                
                {/* Core Features */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Core Engine</h3>
                  <div className="space-y-3">
                    {flags.filter(f => f.key.startsWith('QR_ENGINE_')).map(flag => (
                      <div key={flag.key} className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <Label className="text-sm font-medium">
                            {flag.key.replace(/_/g, ' ')}
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            {flag.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {flag.enabled && (
                            <Badge variant="secondary" className="text-xs">
                              Active
                            </Badge>
                          )}
                          <Switch
                            checked={flag.enabled}
                            onCheckedChange={() => handleToggle(flag.key as any, flag.enabled)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* UI Features */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">UI Features</h3>
                  <div className="space-y-3">
                    {flags.filter(f => f.key.includes('_UI') || 
                                       f.key.includes('_SHAPES') || 
                                       f.key.includes('_PATTERNS') ||
                                       f.key.includes('_GRADIENTS') ||
                                       f.key.includes('_EFFECTS') ||
                                       f.key.includes('_FRAMES') ||
                                       f.key.includes('_LOGO')).map(flag => (
                      <div key={flag.key} className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <Label className="text-sm font-medium">
                            {flag.key.replace(/_/g, ' ')}
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            {flag.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {flag.enabled && (
                            <Badge variant="secondary" className="text-xs">
                              Active
                            </Badge>
                          )}
                          <Switch
                            checked={flag.enabled}
                            onCheckedChange={() => handleToggle(flag.key as any, flag.enabled)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Performance & Migration */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Performance & Migration</h3>
                  <div className="space-y-3">
                    {flags.filter(f => !f.key.startsWith('QR_ENGINE_') && 
                                       !f.key.includes('_UI') && 
                                       !f.key.includes('_SHAPES') && 
                                       !f.key.includes('_PATTERNS') &&
                                       !f.key.includes('_GRADIENTS') &&
                                       !f.key.includes('_EFFECTS') &&
                                       !f.key.includes('_FRAMES') &&
                                       !f.key.includes('_LOGO')).map(flag => (
                      <div key={flag.key} className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <Label className="text-sm font-medium">
                            {flag.key.replace(/_/g, ' ')}
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            {flag.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {flag.enabled && (
                            <Badge variant="secondary" className="text-xs">
                              Active
                            </Badge>
                          )}
                          <Switch
                            checked={flag.enabled}
                            onCheckedChange={() => handleToggle(flag.key as any, flag.enabled)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Reset button */}
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="w-full"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset All to Defaults
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}