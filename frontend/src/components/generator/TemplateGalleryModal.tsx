/**
 * Template Gallery Modal
 * 
 * Modal wrapper for the template gallery that integrates with
 * the QR generator state machine.
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TemplateGallery } from './TemplateGallery';
import { StyleTemplate } from '@/types/styleTemplates';

interface TemplateGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: StyleTemplate) => void;
  selectedTemplateId?: string;
  userTier?: 'free' | 'premium' | 'enterprise';
}

export function TemplateGalleryModal({
  isOpen,
  onClose,
  onSelectTemplate,
  selectedTemplateId,
  userTier = 'free'
}: TemplateGalleryModalProps) {
  const handleSelectTemplate = (template: StyleTemplate) => {
    onSelectTemplate(template);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
        <TemplateGallery
          onSelectTemplate={handleSelectTemplate}
          selectedTemplateId={selectedTemplateId}
          userTier={userTier}
        />
      </DialogContent>
    </Dialog>
  );
}