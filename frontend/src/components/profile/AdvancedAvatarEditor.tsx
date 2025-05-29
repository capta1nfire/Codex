'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Pencil, 
  Scissors, 
  Palette, 
  RotateCw,
  ZoomIn,
  ZoomOut,
  X,
  Check,
  Sparkles,
  Grid3X3
} from 'lucide-react';
import ProfilePicture from '../ui/ProfilePicture';

interface AdvancedAvatarEditorProps {
  user: any;
  isLoading: boolean;
  onFileUpload: (file: File) => Promise<void>;
  onSetDefaultPicture: (type: string) => Promise<void>;
  onResetPicture: () => Promise<void>;
}

// Filtros disponibles con configuraciones avanzadas
const AVATAR_FILTERS = {
  none: { name: 'Original', css: '', icon: '🔄' },
  professional: { name: 'Profesional', css: 'contrast(110%) brightness(105%) saturate(95%)', icon: '💼' },
  warm: { name: 'Cálido', css: 'sepia(15%) saturate(120%) hue-rotate(5deg)', icon: '☀️' },
  cool: { name: 'Fresco', css: 'hue-rotate(180deg) saturate(110%) brightness(105%)', icon: '❄️' },
  vintage: { name: 'Vintage', css: 'sepia(30%) contrast(85%) brightness(110%)', icon: '📸' },
  sharp: { name: 'Nítido', css: 'contrast(125%) brightness(102%) saturate(105%)', icon: '💎' },
  soft: { name: 'Suave', css: 'blur(0.3px) brightness(108%) saturate(90%)', icon: '🌸' },
  dramatic: { name: 'Dramático', css: 'contrast(140%) brightness(95%) saturate(120%)', icon: '🎭' },
};

// Galería expandida de avatares predeterminados
const EXPANDED_AVATAR_GALLERY = [
  { type: 'avatar_corporate_1', name: 'Ejecutivo Azul', category: 'Corporativo' },
  { type: 'avatar_corporate_2', name: 'Profesional Verde', category: 'Corporativo' },
  { type: 'avatar_corporate_3', name: 'Líder Púrpura', category: 'Corporativo' },
  { type: 'avatar_creative_1', name: 'Creativo Naranja', category: 'Creativo' },
  { type: 'avatar_creative_2', name: 'Artista Rosa', category: 'Creativo' },
  { type: 'avatar_creative_3', name: 'Diseñador Amarillo', category: 'Creativo' },
  { type: 'avatar_tech_1', name: 'Desarrollador', category: 'Tech' },
  { type: 'avatar_tech_2', name: 'Analista', category: 'Tech' },
  { type: 'avatar_minimal_1', name: 'Minimalista', category: 'Minimal' },
  { type: 'avatar_minimal_2', name: 'Elegante', category: 'Minimal' },
];

export default function AdvancedAvatarEditor({
  user,
  isLoading,
  onFileUpload,
  onSetDefaultPicture,
  onResetPicture,
}: AdvancedAvatarEditorProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'gallery' | 'crop' | 'filters'>('upload');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<keyof typeof AVATAR_FILTERS>('none');
  const [cropSettings, setCropSettings] = useState({
    zoom: 100,
    rotation: 0,
    x: 0,
    y: 0,
  });
  const [isHovered, setIsHovered] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Hero moment: Cerrar editor con Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEditorOpen) {
        handleCloseEditor();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isEditorOpen]);

  const handleOpenEditor = () => {
    setIsEditorOpen(true);
    setActiveTab('upload');
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setSelectedImage(null);
    setSelectedFilter('none');
    setCropSettings({ zoom: 100, rotation: 0, x: 0, y: 0 });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB para editor avanzado

    if (!validTypes.includes(file.type)) {
      return;
    }

    if (file.size > maxSize) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
      setActiveTab('crop');
    };
    reader.readAsDataURL(file);
  };

  const handleGallerySelect = (avatarType: string) => {
    onSetDefaultPicture(avatarType);
    handleCloseEditor();
  };

  const handleFilterApply = (filterKey: keyof typeof AVATAR_FILTERS) => {
    setSelectedFilter(filterKey);
  };

  const handleCropSave = async () => {
    if (!selectedImage) return;

    // Aquí iría la lógica de cropping avanzado
    // Por simplicidad, convertimos dataURL a File y subimos
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
        await onFileUpload(file);
        handleCloseEditor();
      }, 'image/jpeg', 0.9);
    } catch (error) {
      console.error('Error processing image:', error);
    }
  };

  // Tabs del editor
  const editorTabs = [
    { id: 'upload', icon: Upload, label: 'Subir', description: 'Nueva imagen' },
    { id: 'gallery', icon: Grid3X3, label: 'Galería', description: 'Predeterminados' },
    { id: 'crop', icon: Scissors, label: 'Recortar', description: 'Ajustar tamaño', disabled: !selectedImage },
    { id: 'filters', icon: Palette, label: 'Filtros', description: 'Efectos visuales', disabled: !selectedImage },
  ];

  return (
    <>
      {/* Avatar Display with Advanced Hover Effects */}
      <div className="flex flex-col items-center mb-6 relative">
        <div 
          className="relative mb-3 group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Hero Moment: Gradient Ring Animation */}
          <div className={`
            absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 
            rounded-full transition-all duration-500 ease-smooth
            ${isHovered ? 'opacity-100 animate-spin-slow' : 'opacity-0'}
          `}></div>
          
          <div className="relative">
            <ProfilePicture 
              user={user} 
              size="xl" 
              className={`
                border-2 border-blue-200 dark:border-blue-700 
                transition-all duration-300 ease-subtle
                ${isHovered ? 'scale-105 shadow-xl shadow-blue-500/25' : 'shadow-lg'}
                ${selectedFilter !== 'none' ? `filter: ${AVATAR_FILTERS[selectedFilter].css}` : ''}
              `} 
            />
            
            {/* Edit Button with Hero Animation - FIXED: Smaller and more subtle */}
            <button
              onClick={handleOpenEditor}
              disabled={isLoading}
              className={`
                absolute -bottom-1 -right-1 p-2 bg-gradient-to-r from-corporate-blue-500 to-corporate-blue-600 
                rounded-full shadow-corporate-lg border-2 border-white dark:border-slate-800
                hover:from-corporate-blue-600 hover:to-corporate-blue-700 focus:outline-none focus:ring-2 
                focus:ring-offset-2 focus:ring-corporate-blue-500 disabled:opacity-50 
                disabled:cursor-not-allowed transition-all duration-300 ease-smooth
                transform scale-90 hover:scale-100 
                ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-70 translate-y-1'}
                backdrop-blur-sm
              `}
              aria-label="Editor avanzado de avatar"
            >
              <div className="relative">
                <Pencil className="h-3.5 w-3.5 text-white transition-transform duration-200" />
                {isHovered && (
                  <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping"></div>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* User Info with Enhanced Typography */}
        <div className="text-center">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            Avatar actual: <span className="text-blue-600 dark:text-blue-400 font-semibold">
              {user?.profilePictureType === 'initial' ? 'Iniciales' : 'Personalizado'}
            </span>
          </p>
          {selectedFilter !== 'none' && (
            <Badge variant="outline" className="text-xs">
              {AVATAR_FILTERS[selectedFilter].icon} {AVATAR_FILTERS[selectedFilter].name}
            </Badge>
          )}
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg,image/png,image/jpg,image/webp"
        onChange={handleFileSelect}
        disabled={isLoading}
      />

      {/* Advanced Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className={`
            bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] 
            overflow-hidden transition-all duration-500 ease-smooth transform
            ${isEditorOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
          `}>
            {/* Header with Corporate Gradient */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-blue-600" />
                    Editor Avanzado de Avatar
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Personaliza tu imagen con herramientas profesionales
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseEditor}
                  className="hover:bg-blue-100 dark:hover:bg-blue-900"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Enhanced Tab Navigation */}
              <div className="flex space-x-1 mt-4 bg-white/50 dark:bg-slate-800/50 p-1 rounded-lg">
                {editorTabs.map((tab) => {
                  const IconComponent = tab.icon;
                  const isActive = activeTab === tab.id;
                  const isDisabled = tab.disabled;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => !isDisabled && setActiveTab(tab.id as any)}
                      disabled={isDisabled}
                      className={`
                        flex-1 flex flex-col items-center px-4 py-3 rounded-lg transition-all duration-200 ease-subtle
                        ${isActive 
                          ? 'bg-blue-500 text-white shadow-md transform scale-105' 
                          : isDisabled 
                            ? 'text-slate-400 cursor-not-allowed' 
                            : 'text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/50'
                        }
                      `}
                    >
                      <IconComponent className={`h-5 w-5 mb-1 ${isActive ? 'animate-pulse' : ''}`} />
                      <span className="text-xs font-medium">{tab.label}</span>
                      <span className="text-xs opacity-70">{tab.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Editor Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Upload Tab */}
              {activeTab === 'upload' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
                      Subir Nueva Imagen
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                      Acepta JPG, PNG, WebP hasta 10MB
                    </p>
                  </div>

                  {/* Drop Zone con Corporate Style */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                      border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl p-8
                      bg-gradient-to-br from-blue-50/50 to-slate-50/50 dark:from-blue-950/50 dark:to-slate-950/50
                      hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/70
                      cursor-pointer transition-all duration-300 ease-smooth
                      group relative overflow-hidden
                    `}
                  >
                    <div className="text-center relative z-10">
                      <Upload className="h-12 w-12 text-blue-500 mx-auto mb-4 group-hover:scale-110 transition-transform duration-200" />
                      <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Arrastra una imagen aquí
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        o haz clic para seleccionar
                      </p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={() => onResetPicture()}
                      variant="outline"
                      className="h-12 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <RotateCw className="h-4 w-4 mr-2" />
                      Restablecer a Iniciales
                    </Button>
                    <Button
                      onClick={() => setActiveTab('gallery')}
                      variant="outline"
                      className="h-12 hover:bg-blue-50 dark:hover:bg-blue-900"
                    >
                      <Grid3X3 className="h-4 w-4 mr-2" />
                      Ver Galería
                    </Button>
                  </div>
                </div>
              )}

              {/* Gallery Tab */}
              {activeTab === 'gallery' && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
                      Galería de Avatares
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Elige de nuestra colección profesional
                    </p>
                  </div>

                  {/* Compact Gallery Container with Fixed Height */}
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 max-h-[320px] overflow-y-auto">
                    <div className="space-y-4">
                      {['Corporativo', 'Creativo', 'Tech', 'Minimal'].map((category) => (
                        <div key={category} className="space-y-2">
                          <h5 className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 text-sm">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            {category}
                          </h5>
                          <div className="grid grid-cols-8 gap-2">
                            {EXPANDED_AVATAR_GALLERY
                              .filter(avatar => avatar.category === category)
                              .map((avatar) => (
                                <button
                                  key={avatar.type}
                                  onClick={() => handleGallerySelect(avatar.type)}
                                  className={`
                                    aspect-square rounded-md border border-slate-200 dark:border-slate-700
                                    hover:border-blue-500 hover:scale-105 transition-all duration-200 ease-subtle
                                    bg-gradient-to-br from-blue-50 to-slate-50 dark:from-blue-950 to-slate-950
                                    p-1 group relative overflow-hidden
                                  `}
                                >
                                  <div className="w-full h-full bg-slate-200 dark:bg-slate-700 rounded-sm flex items-center justify-center">
                                    <span className="text-xs text-slate-500 group-hover:text-blue-600 transition-colors leading-none">
                                      {avatar.name.split(' ')[0].slice(0, 3)}
                                    </span>
                                  </div>
                                  
                                  {/* Hover Effect */}
                                  <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-md">
                                    <Check className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-2.5 w-2.5 text-blue-600" />
                                  </div>
                                </button>
                              ))
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Crop Tab */}
              {activeTab === 'crop' && selectedImage && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
                      Recortar y Ajustar
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Perfecciona el encuadre de tu imagen
                    </p>
                  </div>

                  {/* Crop Preview Area */}
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 flex items-center justify-center min-h-[300px]">
                    <div className="relative">
                      <img
                        ref={imageRef}
                        src={selectedImage}
                        alt="Preview"
                        className={`
                          max-w-sm max-h-64 object-contain rounded-lg shadow-corporate-lg
                          transform transition-transform duration-200
                          border-2 border-white/50 dark:border-slate-700/50
                        `}
                        style={{
                          transform: `scale(${cropSettings.zoom / 100}) rotate(${cropSettings.rotation}deg)`,
                          filter: AVATAR_FILTERS[selectedFilter].css,
                        }}
                      />
                      
                      {/* Crop Grid Overlay */}
                      <div className="absolute inset-0 pointer-events-none">
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <defs>
                            <pattern id="cropGrid" width="33.33" height="33.33" patternUnits="userSpaceOnUse">
                              <path d="M 33.33 0 L 0 0 0 33.33" fill="none" stroke="white" strokeWidth="0.8" opacity="0.6"/>
                            </pattern>
                          </defs>
                          <rect width="100%" height="100%" fill="url(#cropGrid)" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Crop Controls */}
                  <div className="space-y-4">
                    {/* Zoom Control */}
                    <div className="flex items-center gap-4">
                      <ZoomOut className="h-4 w-4 text-slate-500" />
                      <input
                        type="range"
                        min="50"
                        max="200"
                        value={cropSettings.zoom}
                        onChange={(e) => setCropSettings(prev => ({ ...prev, zoom: Number(e.target.value) }))}
                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <ZoomIn className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-mono text-slate-600 dark:text-slate-400 w-12">
                        {cropSettings.zoom}%
                      </span>
                    </div>

                    {/* Rotation Control */}
                    <div className="flex items-center gap-4">
                      <RotateCw className="h-4 w-4 text-slate-500" />
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={cropSettings.rotation}
                        onChange={(e) => setCropSettings(prev => ({ ...prev, rotation: Number(e.target.value) }))}
                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-sm font-mono text-slate-600 dark:text-slate-400 w-12">
                        {cropSettings.rotation}°
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Filters Tab */}
              {activeTab === 'filters' && selectedImage && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
                      Filtros y Efectos
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Aplica efectos profesionales a tu imagen
                    </p>
                  </div>

                  {/* Filter Preview */}
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 flex items-center justify-center">
                    <img
                      src={selectedImage}
                      alt="Filter Preview"
                      className="max-w-48 max-h-48 object-contain rounded-lg shadow-corporate-lg border-2 border-white/50 dark:border-slate-700/50"
                      style={{ filter: AVATAR_FILTERS[selectedFilter].css }}
                    />
                  </div>

                  {/* Filter Options */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(AVATAR_FILTERS).map(([key, filter]) => (
                      <button
                        key={key}
                        onClick={() => handleFilterApply(key as keyof typeof AVATAR_FILTERS)}
                        className={`
                          p-4 rounded-xl border-2 transition-all duration-200 ease-subtle text-center
                          ${selectedFilter === key 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                            : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                          }
                        `}
                      >
                        <div className="text-2xl mb-2">{filter.icon}</div>
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {filter.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="border-t border-border p-6 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex justify-between items-center">
                <Button
                  variant="ghost"
                  onClick={handleCloseEditor}
                  className="text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </Button>
                
                <div className="flex gap-3">
                  {selectedImage && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab('filters')}
                        className="hover:bg-purple-50 dark:hover:bg-purple-900"
                      >
                        <Grid3X3 className="h-4 w-4 mr-2" />
                        Más Filtros
                      </Button>
                      <Button
                        onClick={handleCropSave}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Aplicar Cambios
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Canvas for Image Processing */}
      <canvas ref={canvasRef} className="hidden" />
    </>
  );
} 