/**
 * QR Generator Container
 * 
 * Main orchestrator component that uses the state machine to coordinate
 * all child components. This is the only component that knows about the
 * state machine, keeping child components pure and focused.
 */

import React, { useEffect, useState } from 'react';
import { useQRGeneratorOrchestrator } from '@/hooks/useQRGeneratorOrchestrator';
import { GeneratorLayout } from '../GeneratorLayout';
import { URLValidation } from '../URLValidation';
import { QRFormManager } from '../QRFormManager';
import { GenerationControls } from '../GenerationControls';
import { PreviewSection } from '../PreviewSectionV3';
import { BarcodeTypeTabs } from '../BarcodeTypeTabs';
import { QRContentSelector } from '../QRContentSelector';
import { SmartQRButton } from '@/features/smart-qr/components';
import { TemplateGalleryModal } from '../TemplateGalleryModal';
import { useStyleTemplates } from '@/hooks/useStyleTemplates';
import { StyleTemplate } from '@/types/styleTemplates';
import { GenerationOptions } from '@/types/generatorStates';

export function QRGeneratorContainer() {
  const {
    state,
    context,
    updateForm,
    updateOptions,
    changeBarcodeType,
    changeQRType,
    generateNow,
    generateAnyway,
    setEditingIntent,
    isLoading,
    hasError,
    canGenerate,
    showValidationFeedback
  } = useQRGeneratorOrchestrator();

  // Template gallery state
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const { selectedTemplate, selectTemplate, applyTemplate } = useStyleTemplates();

  // Generate initial QR on mount
  useEffect(() => {
    if (!context.hasGeneratedInitial && state === 'idle') {
      generateNow();
    }
  }, []);

  // Handle barcode type change
  const handleBarcodeTypeChange = (newType: string) => {
    changeBarcodeType(newType);
  };

  // Handle QR content type change
  const handleQRTypeChange = (newType: string) => {
    changeQRType(newType);
    // Reset form data for new type
    updateForm('url', '');
    updateForm('text', '');
    updateForm('email', '');
    updateForm('phone', '');
  };

  // Handle form field changes
  const handleFormChange = (field: string, value: any) => {
    updateForm(field, value);
  };
  
  // Handle editing intent changes
  const handleEditingIntentChange = (isEditing: boolean) => {
    // Calculate smart debounce time based on editing state
    const debounceTime = isEditing ? 2000 : 800;
    setEditingIntent(isEditing, debounceTime);
  };

  // Handle options changes from generation options
  const handleLegacyOptionsChange = (newOptions: any) => {
    updateOptions(newOptions);
  };

  // Remove unused handleOptionsChange function

  // Handle generation controls
  const handleGenerate = () => {
    generateNow();
  };

  const handleGenerateAnyway = () => {
    generateAnyway();
  };

  // Handle Smart QR
  const handleSmartQR = () => {
    updateOptions({ smart_qr: true });
    generateNow();
  };

  // Handle template selection
  const handleSelectTemplate = (template: StyleTemplate) => {
    selectTemplate(template);
    
    // Apply template customization to options
    const customization = applyTemplate(template);
    
    // Map template options to GenerationOptions format
    const newOptions: Partial<GenerationOptions> = {
      fgColor: customization.colors?.foreground || '#000000',
      bgColor: customization.colors?.background || '#FFFFFF',
      eyeShape: customization.eye_shape || 'square',
      dataShape: customization.data_pattern || 'square',
      gradient_enabled: customization.gradient?.enabled || false,
      gradient_type: customization.gradient?.gradient_type,
      gradient_colors: customization.gradient?.colors,
      gradient_direction: customization.gradient?.angle,
      // Include frame options if present
      frame: customization.frame ? {
        enabled: true,
        ...customization.frame
      } : undefined,
      // Store the complete customization for v3 API
      v3_customization: customization
    };
    
    // Update options with template configuration
    updateOptions(newOptions);
    
    // Generate QR with new template
    generateNow();
  };

  // Handle opening template gallery
  const handleOpenTemplates = () => {
    setShowTemplateGallery(true);
  };

  return (
    <GeneratorLayout>
      <div className="space-y-6">
        {/* Barcode Type Selection */}
        <BarcodeTypeTabs
          selectedType={context.barcodeType}
          onTypeChange={handleBarcodeTypeChange}
        />

        {/* QR Content Type Selection (only for QR codes) */}
        {context.barcodeType === 'qrcode' && (
          <QRContentSelector
            selectedQRType={context.qrType}
            onQRTypeChange={handleQRTypeChange}
          />
        )}

        {/* Form Fields */}
        <div className="space-y-4">
          {context.barcodeType === 'qrcode' && context.qrType === 'link' ? (
            <URLValidation
              url={context.formData.url || ''}
              onChange={(value) => handleFormChange('url', value)}
              isValidating={state === 'validating'}
              validationMetadata={context.validationMetadata}
              showFeedback={showValidationFeedback}
              onGenerateAnyway={handleGenerateAnyway}
              onEditingIntentChange={handleEditingIntentChange}
            />
          ) : (
            <QRFormManager
              barcodeType={context.barcodeType}
              qrType={context.qrType}
              formData={context.formData}
              onChange={handleFormChange}
              onEditingIntentChange={handleEditingIntentChange}
            />
          )}
        </div>

        {/* Smart QR Button (only for link type) */}
        {context.barcodeType === 'qrcode' && context.qrType === 'link' && (
          <div className="flex justify-center">
            <SmartQRButton onGenerate={handleSmartQR} />
          </div>
        )}

        {/* Generation Controls */}
        <GenerationControls
          options={context.options}
          onOptionsChange={handleLegacyOptionsChange}
          onGenerate={handleGenerate}
          canGenerate={canGenerate}
          isGenerating={state === 'generating'}
          barcodeType={context.barcodeType}
          onOpenTemplates={handleOpenTemplates}
        />

        {/* Preview Section */}
        <PreviewSection
          svgContent={context.svgContent || ''}
          isLoading={isLoading}
          barcodeType={context.barcodeType}
          enhancedData={context.enhancedData}
          scannabilityAnalysis={(() => {
            console.log('[QRGeneratorContainer] context.scannabilityAnalysis:', context.scannabilityAnalysis);
            return context.scannabilityAnalysis;
          })()}
          isUserTyping={context.isTyping}
          validationError={hasError && (context as any).error ? (context as any).error.message : undefined}
          isUsingV2={context.barcodeType === 'qrcode'}
          isUsingV3Enhanced={context.barcodeType === 'qrcode' && context.options.smart_qr}
        />
      </div>

      {/* Template Gallery Modal */}
      <TemplateGalleryModal
        isOpen={showTemplateGallery}
        onClose={() => setShowTemplateGallery(false)}
        onSelectTemplate={handleSelectTemplate}
        selectedTemplateId={selectedTemplate?.id}
        userTier="free" // In a real app, this would come from user context
      />
    </GeneratorLayout>
  );
}