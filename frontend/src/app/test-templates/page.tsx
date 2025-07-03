'use client';

import React, { useState } from 'react';
import { TemplateGallery } from '@/components/generator/TemplateGallery';
import { StyleTemplate } from '@/types/styleTemplates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestTemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<StyleTemplate | null>(null);
  const [userTier, setUserTier] = useState<'free' | 'premium' | 'enterprise'>('free');

  const handleSelectTemplate = (template: StyleTemplate) => {
    setSelectedTemplate(template);
    console.log('Template selected:', template);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">
          Test Style Templates Gallery
        </h1>

        {/* User Tier Selector */}
        <div className="mb-6 flex justify-center gap-2">
          <Button
            variant={userTier === 'free' ? 'default' : 'outline'}
            onClick={() => setUserTier('free')}
          >
            Free User
          </Button>
          <Button
            variant={userTier === 'premium' ? 'default' : 'outline'}
            onClick={() => setUserTier('premium')}
          >
            Premium User
          </Button>
          <Button
            variant={userTier === 'enterprise' ? 'default' : 'outline'}
            onClick={() => setUserTier('enterprise')}
          >
            Enterprise User
          </Button>
        </div>

        {/* Template Gallery */}
        <TemplateGallery
          onSelectTemplate={handleSelectTemplate}
          selectedTemplateId={selectedTemplate?.id}
          userTier={userTier}
        />

        {/* Selected Template Info */}
        {selectedTemplate && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Selected Template: {selectedTemplate.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(selectedTemplate, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}