'use client'; // Necesario para usar hooks como useState y manejar eventos

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BarcodeDisplay from './BarcodeDisplay';
import { generateFormSchema, GenerateFormData } from '@/schemas/generate.schema';
// import { useAuth } from '@/context/AuthContext';
import { Download, Printer, QrCode, Settings, Palette, Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react';
import BarcodeTypeSelector from '@/components/generator/BarcodeTypeSelector';
import GenerationOptions from '@/components/generator/GenerationOptions';


import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Interfaz para el error estructurado devuelto por el backend
interface ErrorResponse {
  success: boolean;
  error: string;
  suggestion?: string;
  code?: string;
}

// --- Función auxiliar para obtener datos por defecto según el tipo ---
function getDefaultDataForType(barcodeType: string): string {
  switch (barcodeType.toLowerCase()) {
    case 'qrcode':
      return 'https://tu-sitio-web.com';
    case 'code128':
      return 'CODE128 Ejemplo 123';
    case 'pdf417':
      return 'Texto de ejemplo un poco más largo para PDF417.';
    case 'ean13':
      return '978020137962'; // 12 dígitos
    case 'ean8':
      return '1234567'; // 7 dígitos
    case 'upca':
      return '03600029145'; // 11 dígitos
    case 'upce':
      return '012345'; // 6 dígitos (requiere empezar 0 o 1)
    case 'code39':
      return 'CODE-39-EJEMPLO';
    case 'code93':
      return 'CODE 93 EXAMPLE';
    case 'codabar':
      return 'A123456789B';
    case 'itf':
      return '123456789012'; // 12 dígitos (ITF requiere par, 14 es común)
    case 'datamatrix':
      return 'DataMatrix ejemplo 123';
    case 'aztec':
      return 'Texto de ejemplo para Aztec';
    default:
      return ''; // O un mensaje genérico
  }
}

// Definir los valores por defecto fuera del componente - SVG siempre transparente
const defaultFormValues: GenerateFormData = {
  barcode_type: 'qrcode',
  data: getDefaultDataForType('qrcode'),
  options: {
    scale: 4,
    fgcolor: '#000000',
    bgcolor: undefined, // undefined para SVG transparente que permita gradientes
    height: 100,
    includetext: true,
    ecl: 'M',
    // ✨ CODEX Hero Gradient - Azul corporativo con negro, radial desde centro
    gradient_enabled: true,
    gradient_type: 'radial',
    gradient_color1: '#2563EB', // CODEX Corporate Blue en el centro
    gradient_color2: '#000000', // Negro en los costados para máximo contraste
    gradient_direction: 'top-bottom', // No se usa en radial pero mantenemos por consistencia
    gradient_borders: true, // ✅ ACTIVADO POR DEFECTO - Bordes blancos transparentes
  },
};

export default function Home() {
  // --- Estados ---
  const [svgContent, setSvgContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<ErrorResponse | null>(null);
  const [showPreviewBackground, setShowPreviewBackground] = useState(true); // Fondo activado por defecto
  const [showSettingsMenu, setShowSettingsMenu] = useState(false); // Estado para el menú de configuración
  const [expandedSection, setExpandedSection] = useState<string>('essential'); // Configuración Esencial abierta por defecto
  // Estados para animaciones corporativas consistentes
  const [heroAnimated, setHeroAnimated] = useState(false);
  // const { user } = useAuth(); // Ya no necesitamos user directamente aquí si userRole no se usa
  // const userRole = user?.role; // userRole ya no se pasa a los hijos relevantes

  // --- react-hook-form Configuración ---
  const {
    register, // Para inputs estándar como 'data'
    handleSubmit,
    control, // Para componentes UI como Select, Slider, Switch
    watch, // Para observar cambios en los campos del formulario
    setValue, // Para actualizar campos programáticamente
    getValues, // Usar getValues
    reset, // Obtener la función reset
    formState: { errors }, // Re-add formState errors
  } = useForm<GenerateFormData>({
    resolver: zodResolver(generateFormSchema),
    mode: 'onBlur', // O 'onChange' para feedback más inmediato
    defaultValues: defaultFormValues, // Usar la constante
  });

  // Observar el tipo de código seleccionado para lógica condicional
  const selectedType = watch('barcode_type');

  // --- Variables Derivadas (Se mueven a GenerationOptions.tsx) ---
  // const is1DBarcode = selectedType ? !['qrcode', 'pdf417', 'datamatrix', 'aztec'].includes(selectedType) : false;
  // const isHeightRelevant = selectedType ? !['qrcode', 'datamatrix', 'aztec'].includes(selectedType) : false;
  // const isQrCode = selectedType === 'qrcode';

  // Animaciones corporativas al montar
  useEffect(() => {
    const timer = setTimeout(() => setHeroAnimated(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // --- Handlers ---

  // Definir onSubmit PRIMERO porque handleTypeChange lo usa
  const onSubmit = useCallback(async (formData: GenerateFormData) => {
    const requestId = Date.now();
    console.log(`[onSubmit-${requestId}] 🚀 INICIO - Datos validados recibidos:`, formData);
    console.log(`[onSubmit-${requestId}] 📋 formData.options ANTES de construir payload:`, formData.options);
    setServerError(null);
    setIsLoading(true);
    setSvgContent('');

    const payload = {
      barcode_type: formData.barcode_type,
      data: formData.data,
      options: formData.options || {},
    };

    console.log(`[onSubmit-${requestId}] 📦 Preparando fetch con payload:`, payload);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004';
      const requestUrl = `${backendUrl}/api/generate`;
      
      // Obtener token de autenticación
      const token = localStorage.getItem('token');
      console.log('[DEBUG] Token encontrado:', token ? 'Sí' : 'No');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('[DEBUG] Header Authorization agregado');
      }
      
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000), // 10 segundos timeout
      });

      const result = await response.json();
      console.log(`[onSubmit-${requestId}] 📥 Resultado JSON recibido:`, result);

      if (!response.ok) {
        let message = 'Error desconocido al generar el código.';
        let code: string | undefined = undefined;
        let suggestion: string | undefined = undefined;

        if (result && typeof result.error === 'object' && result.error !== null) {
          message = result.error.message || message;
          code = result.error.code;
          suggestion = result.error.context?.suggestion;
        } else if (result && result.error && typeof result.error === 'string') {
          message = result.error;
        } else if (result && result.message) {
          message = result.message;
        }

        console.error(`[onSubmit-${requestId}] ❌ Error de backend:`, { status: response.status, result });
        setServerError({
          success: false,
          error: message,
          suggestion,
          code,
        });
        setSvgContent('');
      } else {
        console.log(`[onSubmit-${requestId}] ✅ Generación exitosa.`);
        setSvgContent(result.svgString);
        setServerError(null);
      }
    } catch (err) {
      console.error(`[onSubmit-${requestId}] 💥 Error en fetch o procesando:`, err);
      setServerError({
        success: false,
        error: err instanceof Error ? err.message : 'Error de conexión o inesperado.',
      });
      setSvgContent('');
    } finally {
      setIsLoading(false);
      console.log(`[onSubmit-${requestId}] 🏁 FINALIZADO.`);
    }
  }, []);

  // Definir handleTypeChange DESPUÉS de onSubmit
  const handleTypeChange = useCallback(
    async (newType: string) => {
      const newData = getDefaultDataForType(newType);
      // Actualizar tipo y datos
      setValue('barcode_type', newType, { shouldValidate: true });
      setValue('data', newData, { shouldValidate: true });
      setServerError(null);

      // Obtener TODOS los valores actuales del formulario DESPUÉS de actualizarlos
      const currentFormValues = getValues();

      console.log(
        `[handleTypeChange] Tipo cambiado a ${newType}. Llamando a onSubmit con valores completos:`,
        currentFormValues
      );
      // Llamar a onSubmit con el objeto completo
      await onSubmit(currentFormValues);

      // Quitar el objeto parcial anterior
      // await onSubmit({
      //   barcode_type: newType,
      //   data: newData,
      // });
    },
    [setValue, onSubmit, getValues]
  ); // Añadir getValues a las dependencias

  // useEffect para generar al montar
  useEffect(() => {
    console.log('[useEffect] Montado. Llamando a onSubmit con valores por defecto.');
    // Llamar a onSubmit directamente aquí puede causar problemas si aún no está definida
    // o si sus dependencias no están listas. Es más seguro obtener los valores
    // por defecto y llamar a onSubmit con ellos.
    onSubmit(defaultFormValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // <--- Dependencias vacías para que solo se ejecute al montar

  // useEffect para actualizar bgcolor cuando cambie showPreviewBackground
  useEffect(() => {
    // Solo ejecutar si showPreviewBackground cambió después del montaje
    if (typeof showPreviewBackground === 'boolean') {
      const newBgcolor = undefined; // undefined en lugar de string vacía para SVG transparente
      console.log(`[DEBUG] showPreviewBackground cambió a: ${showPreviewBackground}, SVG bgcolor: "${newBgcolor}" (always transparent)`);
      setValue('options.bgcolor', newBgcolor, { shouldValidate: true });
      
      // Solo regenerar si tenemos contenido existente Y no es la primera carga
      if (svgContent) {
        const currentFormValues = getValues();
        console.log('[DEBUG] Regenerando por cambio en toggle de fondo');
        onSubmit(currentFormValues);
      }
    }
  }, [showPreviewBackground]); // Solo depender de showPreviewBackground

  // useEffect para cerrar el menú de configuración al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSettingsMenu) {
        const target = event.target as Element;
        if (!target.closest('.relative')) {
          setShowSettingsMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettingsMenu]);

  // --- Section Card Component - UPGRADED con filosofía corporativa ---
  const SectionCard = ({ 
    id, 
    title, 
    subtitle, 
    icon: Icon, 
    children, 
    isOpen, 
    badgeText,
    animationDelay = 0
  }: {
    id: string;
    title: string;
    subtitle: string;
    icon: any;
    children: React.ReactNode;
    isOpen: boolean;
    badgeText?: string;
    animationDelay?: number;
  }) => (
    <Card className={cn(
      // Sombras y bordes corporativos del perfil
      "shadow-corporate-lg border-corporate-blue-200/50 dark:border-corporate-blue-700/50 bg-card/95 backdrop-blur-sm",
      "hover:shadow-corporate-hero hover:border-corporate-blue-300/70 dark:hover:border-corporate-blue-600/70",
      "transition-all duration-500 ease-smooth transform overflow-hidden p-0",
      // Estados visuales corporativos
      isOpen ? "border-corporate-blue-300/70 dark:border-corporate-blue-600/70 bg-gradient-to-br from-blue-50/50 to-corporate-blue-50/30 dark:from-blue-950/30 dark:to-corporate-blue-950/20" : "",
      // Animaciones de entrada corporativas
      heroAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
    )}
    style={{ transitionDelay: `${animationDelay}ms` }}
    >
      <CardHeader 
        className={cn(
          "cursor-pointer py-6 px-6 m-0",
          // Gradientes corporativos consistentes con el perfil
          isOpen 
            ? "bg-gradient-to-r from-corporate-blue-50/50 to-slate-50/50 dark:from-corporate-blue-950/50 dark:to-slate-950/50 border-b border-corporate-blue-200/30 dark:border-corporate-blue-700/30"
            : "bg-gradient-to-r from-slate-50/30 to-slate-50/30 dark:from-slate-800/30 dark:to-slate-800/30 hover:from-corporate-blue-50/30 hover:to-slate-50/30 dark:hover:from-corporate-blue-950/30 dark:hover:to-slate-950/30"
        )}
        onClick={() => setExpandedSection(isOpen ? '' : id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg transition-all duration-300 ease-smooth",
              isOpen 
                ? "bg-corporate-blue-500/10 group-hover:bg-corporate-blue-500/20" 
                : "bg-slate-100 dark:bg-slate-800 hover:bg-corporate-blue-500/10"
            )}>
              <Icon className={cn(
                "h-5 w-5 transition-all duration-300 ease-smooth",
                isOpen 
                  ? "text-corporate-blue-600 dark:text-corporate-blue-400" 
                  : "text-slate-600 dark:text-slate-400 group-hover:text-corporate-blue-600 dark:group-hover:text-corporate-blue-400"
              )} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className={cn(
                  "text-lg transition-colors duration-200",
                  isOpen 
                    ? "bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent"
                    : "text-slate-800 dark:text-slate-200"
                )}>{title}</CardTitle>
                {badgeText && (
                  <Badge variant="secondary" className={cn(
                    "text-xs transition-all duration-200",
                    isOpen 
                      ? "bg-corporate-blue-100 dark:bg-corporate-blue-900 border-corporate-blue-200 dark:border-corporate-blue-700"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  )}>
                  {badgeText}
                </Badge>
              )}
              </div>
              <CardDescription className="text-slate-600 dark:text-slate-400 mt-1">{subtitle}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOpen ? (
              <ChevronDown className="h-5 w-5 text-corporate-blue-500 transition-all duration-300 ease-smooth" />
            ) : (
              <ChevronRight className="h-5 w-5 text-slate-400 transition-all duration-300 ease-smooth group-hover:text-corporate-blue-500" />
            )}
          </div>
        </div>
      </CardHeader>
      
      {isOpen && (
        <CardContent className="p-6 animate-in slide-in-from-top-2 duration-300 ease-smooth">
          {children}
        </CardContent>
      )}
    </Card>
  );

  // --- Action Handlers ---
  const handleDownload = useCallback(() => {
    if (!svgContent) return;

    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    const safeFilename = (selectedType || 'barcode').replace(/[^a-z0-9]/gi, '_').toLowerCase();

    downloadLink.href = svgUrl;
    downloadLink.download = `${safeFilename}_${Date.now()}.svg`; // Add timestamp for uniqueness
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
    console.log('[handleDownload] SVG descargado.');
  }, [svgContent, selectedType]);

  const handlePrint = useCallback(() => {
    if (!svgContent) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      // Simple print structure: just the SVG
      printWindow.document.write(`
        <html>
          <head><title>Imprimir Código</title></head>
          <body style="text-align: center; margin-top: 50px;">
            ${svgContent}
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() { window.close(); }; // Close after printing attempt
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close(); // Important for some browsers
      console.log('[handlePrint] Diálogo de impresión abierto.');
    } else {
      console.error(
        '[handlePrint] No se pudo abrir la ventana de impresión. Verifica bloqueadores de pop-ups.'
      );
      alert(
        'No se pudo abrir la ventana de impresión. Por favor, revisa si tu navegador está bloqueando las ventanas emergentes.'
      );
    }
  }, [svgContent]);

  // --- Renderizado ---
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Main Generator - Hero-Driven Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 lg:grid-cols-10 gap-6 lg:gap-8"
        >
          {/* LEVEL 1: Essential Controls - Now Collapsible */}
          <div className="lg:col-span-5 space-y-6">
            
            <SectionCard
              id="essential"
              title="Configuración Esencial"
              subtitle="Tipo de código y contenido principal"
              icon={Settings}
              isOpen={expandedSection === 'essential'}
              badgeText="Requerido"
              animationDelay={0}
            >
              <div className="space-y-4">
                {/* Type Selector */}
                <BarcodeTypeSelector
                  control={control}
                  isLoading={isLoading}
                  handleTypeChange={handleTypeChange}
                  errors={errors}
                />

                {/* Data Input */}
                <div className="space-y-2">
                  <Label htmlFor="data-input" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Contenido
                  </Label>
                  <Input
                    id="data-input"
                    placeholder={getDefaultDataForType(selectedType || 'qrcode')}
                    {...register('data')}
                    disabled={isLoading}
                    className={cn(
                      "h-12 transition-all duration-200",
                      errors.data ? 'border-destructive' : 'focus:border-corporate-blue-500 focus:ring-corporate-blue-500/20'
                    )}
                  />
                  {errors.data && (
                    <p className="text-xs text-destructive">{errors.data.message}</p>
                  )}
                </div>

                {/* HERO MOMENT: Generate Button */}
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className={cn(
                      "w-full h-14 text-lg font-bold rounded-xl",
                      "bg-gradient-to-r from-corporate-blue-600 via-corporate-blue-700 to-corporate-blue-600",
                      "hover:from-corporate-blue-700 hover:via-corporate-blue-800 hover:to-corporate-blue-700",
                      "shadow-corporate-lg shadow-corporate-blue-500/25 hover:shadow-corporate-hero hover:shadow-corporate-blue-500/30",
                      "transform hover:scale-[1.02] transition-all duration-300 ease-smooth",
                      "border-2 border-corporate-blue-400/50 hover:border-corporate-blue-300",
                      isLoading && "animate-pulse cursor-not-allowed"
                    )}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/30 rounded-full animate-spin border-t-white"></div>
                        Generando...
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <QrCode className="h-6 w-6" />
                        Generar Código
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </SectionCard>

            {/* LEVEL 2: Customization - UPGRADED con filosofía corporativa */}
            <Card className={cn(
              // Sombras y bordes corporativos del perfil
              "shadow-corporate-lg border-corporate-blue-200/50 dark:border-corporate-blue-700/50 bg-card/95 backdrop-blur-sm",
              "hover:shadow-corporate-hero hover:border-corporate-blue-300/70 dark:hover:border-corporate-blue-600/70",
              "transition-all duration-500 ease-smooth transform overflow-hidden p-0",
              // Animaciones de entrada corporativas
              heroAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            )}
            style={{ transitionDelay: '100ms' }}
            >
              <CardHeader className="bg-gradient-to-r from-corporate-blue-50/50 to-slate-50/50 dark:from-corporate-blue-950/50 dark:to-slate-950/50 border-b border-corporate-blue-200/30 dark:border-corporate-blue-700/30 rounded-t-lg m-0 py-6 px-6">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-corporate-blue-500/10 rounded-lg group-hover:bg-corporate-blue-500/20 transition-colors duration-200">
                    <Palette className="h-5 w-5 text-corporate-blue-600 dark:text-corporate-blue-400" />
                  </div>
                  <div>
                    <span className="bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                      Personalización
                    </span>
                    <Badge variant="secondary" className="ml-3 text-xs">
                      Opcional
                    </Badge>
                  </div>
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 mt-2">
                  Configura colores, tamaños y opciones avanzadas de tu código
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <GenerationOptions
                  control={control}
                  errors={errors}
                  watch={watch}
                  isLoading={isLoading}
                  selectedType={selectedType}
                  reset={reset}
                  setValue={setValue}
                  getValues={getValues}
                  onSubmit={onSubmit}
                  expandedSection={expandedSection}
                  setExpandedSection={setExpandedSection}
                />
              </CardContent>
            </Card>
          </div>

          {/* HERO AREA: Code Preview - UPGRADED con filosofía corporativa */}
          <div className="lg:col-span-5">
            <Card className={cn(
              // Sombras y bordes corporativos premium para el hero
              "shadow-corporate-hero border-2 border-corporate-blue-200/70 dark:border-corporate-blue-700/70",
              "bg-gradient-to-br from-white via-blue-50/30 to-corporate-blue-50/30 dark:from-slate-900 dark:via-blue-950/30 dark:to-corporate-blue-950/20",
              "hover:shadow-[0_25px_50px_-12px_rgba(37,99,235,0.25)] hover:border-corporate-blue-300/80 dark:hover:border-corporate-blue-600/80",
              "transition-all duration-500 ease-smooth transform sticky top-6 min-h-[600px] overflow-hidden",
              // Animación de entrada del hero
              heroAnimated ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-98'
            )}
            style={{ transitionDelay: '200ms' }}
            >
              <CardHeader className="border-b border-corporate-blue-200/40 dark:border-corporate-blue-700/40 bg-gradient-to-r from-corporate-blue-50/60 to-blue-50/60 dark:from-corporate-blue-950/40 dark:to-blue-950/40 m-0 py-8 px-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-corporate-blue-500 to-corporate-blue-600 rounded-xl shadow-corporate-lg">
                      <QrCode className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                        Vista Previa
                      </CardTitle>
                      <CardDescription className="text-lg text-slate-600 dark:text-slate-400">
                        Tu código generado en tiempo real
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Settings Menu - UPGRADED con estilo corporativo */}
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                        className={cn(
                          "h-10 w-10 rounded-lg transition-all duration-300 ease-smooth",
                          showSettingsMenu || svgContent
                            ? "bg-corporate-blue-100 dark:bg-corporate-blue-900/30 text-corporate-blue-700 dark:text-corporate-blue-300 border border-corporate-blue-200 dark:border-corporate-blue-700 shadow-lg" 
                            : "text-slate-500 dark:text-slate-400 hover:text-corporate-blue-700 dark:hover:text-corporate-blue-300 hover:bg-corporate-blue-50 dark:hover:bg-corporate-blue-950/30 hover:shadow-md"
                        )}
                        title="Configuración de vista previa"
                      >
                        <Settings className="h-5 w-5" />
                      </Button>
                      
                      {/* Dropdown Menu - UPGRADED */}
                      {showSettingsMenu && (
                        <div className="absolute right-0 top-12 w-48 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-xl border border-corporate-blue-200/50 dark:border-corporate-blue-700/50 shadow-corporate-lg z-50">
                          <div className="p-3">
                            <div className="text-xs font-semibold text-corporate-blue-700 dark:text-corporate-blue-300 px-2 py-1 mb-2">
                              Vista Previa
                            </div>
                            
                            <button
                              onClick={() => {
                                setShowPreviewBackground(!showPreviewBackground);
                                setShowSettingsMenu(false);
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-corporate-blue-50 dark:hover:bg-corporate-blue-950/30 rounded-lg transition-all duration-200"
                            >
                              {showPreviewBackground ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <EyeOff className="h-4 w-4" />
                              )}
                              <span>
                                {showPreviewBackground ? "Mostrar fondo" : "Ocultar fondo"}
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-4 lg:p-6">
                {/* UNIFIED PREVIEW DISPLAY - UPGRADED con filosofía corporativa */}
                {isLoading ? (
                  <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-corporate-blue-50/80 via-blue-50/60 to-corporate-blue-50/80 dark:from-corporate-blue-950/40 dark:via-blue-950/30 dark:to-corporate-blue-950/40 rounded-3xl border-2 border-dashed border-corporate-blue-300/60 dark:border-corporate-blue-700/60 mb-6 shadow-inner">
                    <div className="text-center space-y-6">
                      <div className="relative">
                        <div className="w-20 h-20 border-4 border-corporate-blue-200 dark:border-corporate-blue-700 rounded-full animate-spin border-t-corporate-blue-600 dark:border-t-corporate-blue-400"></div>
                        <QrCode className="absolute inset-0 m-auto h-8 w-8 text-corporate-blue-600 dark:text-corporate-blue-400" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-slate-700 dark:text-slate-300">Generando código...</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Creando tu código perfecto</p>
                      </div>
                    </div>
                  </div>
                ) : serverError ? (
                  <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-red-50/80 via-orange-50/60 to-red-50/80 dark:from-red-950/40 dark:via-orange-950/30 dark:to-red-950/40 rounded-3xl border-2 border-dashed border-red-300/60 dark:border-red-700/60 mb-6 shadow-inner">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                        <span className="text-3xl">⚠️</span>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-red-700 dark:text-red-400">Error en la generación</p>
                        <p className="text-sm text-red-600 dark:text-red-500">{serverError.error}</p>
                        {serverError.suggestion && (
                          <p className="text-xs text-red-500 dark:text-red-400 mt-2">{serverError.suggestion}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : svgContent ? (
                  <>
                    <div className={cn(
                      "rounded-3xl p-8 min-h-[400px] flex items-center justify-center mb-6 transform hover:scale-[1.01] transition-all duration-300 ease-smooth",
                      showPreviewBackground && "bg-gradient-to-br from-corporate-blue-50/40 via-blue-50/30 to-corporate-blue-50/40 dark:from-corporate-blue-950/30 dark:via-blue-950/20 dark:to-corporate-blue-950/30 border border-corporate-blue-100/60 dark:border-corporate-blue-800/40 shadow-inner"
                    )}>
                      <BarcodeDisplay
                        key={selectedType}
                        svgContent={svgContent}
                        type={selectedType}
                        data={watch('data')}
                        gradientOptions={{
                          enabled: watch('options.gradient_enabled') || false,
                          type: watch('options.gradient_type') || 'linear',
                          color1: watch('options.gradient_color1') || '#3B82F6',
                          color2: watch('options.gradient_color2') || '#8B5CF6',
                          direction: watch('options.gradient_direction') || 'top-bottom',
                          borders: watch('options.gradient_borders') || false,
                        }}
                      />
                    </div>

                    {/* INTEGRATED ACTIONS & SUCCESS INFO - UPGRADED con filosofía corporativa */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Button
                          variant="outline"
                          onClick={handleDownload}
                          disabled={!svgContent || isLoading}
                          className={cn(
                            "h-12 border-2 border-corporate-blue-200/70 dark:border-corporate-blue-700/70",
                            "bg-gradient-to-r from-corporate-blue-50/80 to-corporate-blue-100/60 dark:from-corporate-blue-950/40 dark:to-corporate-blue-900/40",
                            "hover:from-corporate-blue-100/90 hover:to-corporate-blue-200/70 dark:hover:from-corporate-blue-900/60 dark:hover:to-corporate-blue-800/60",
                            "hover:border-corporate-blue-300/80 dark:hover:border-corporate-blue-600/80",
                            "transform hover:scale-[1.02] transition-all duration-300 ease-smooth",
                            "text-sm font-semibold text-corporate-blue-700 dark:text-corporate-blue-300",
                            "shadow-corporate-lg shadow-corporate-blue-500/10 hover:shadow-corporate-hero hover:shadow-corporate-blue-500/20"
                          )}
                        >
                          <Download className="mr-2 h-5 w-5" />
                          Descargar SVG
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handlePrint} 
                          disabled={!svgContent || isLoading}
                          className={cn(
                            "h-12 border-2 border-slate-200/70 dark:border-slate-700/70",
                            "bg-gradient-to-r from-slate-50/80 to-slate-100/60 dark:from-slate-950/40 dark:to-slate-900/40",
                            "hover:from-slate-100/90 hover:to-slate-200/70 dark:hover:from-slate-900/60 dark:hover:to-slate-800/60",
                            "hover:border-slate-300/80 dark:hover:border-slate-600/80",
                            "transform hover:scale-[1.02] transition-all duration-300 ease-smooth",
                            "text-sm font-semibold text-slate-700 dark:text-slate-300",
                            "shadow-corporate-lg shadow-slate-500/10 hover:shadow-corporate-hero hover:shadow-slate-500/20"
                          )}
                        >
                          <Printer className="mr-2 h-5 w-5" />
                          Imprimir
                        </Button>
                      </div>
                      
                      {/* COMPACT SUCCESS INFO - UPGRADED con filosofía corporativa */}
                      <div className="bg-gradient-to-r from-corporate-blue-50/80 via-corporate-blue-50/80 to-corporate-blue-50/80 dark:from-corporate-blue-950/30 dark:via-corporate-blue-950/30 dark:to-corporate-blue-950/30 rounded-xl p-4 border border-corporate-blue-200/60 dark:border-corporate-blue-700/60 shadow-inner">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-corporate-blue-500 rounded-full flex items-center justify-center shadow-lg">
                              <span className="text-white text-sm">✓</span>
                            </div>
                            <p className="text-sm font-semibold text-corporate-blue-700 dark:text-corporate-blue-300">
                              Código generado exitosamente
                            </p>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-corporate-blue-600 dark:text-corporate-blue-400 font-medium">
                            <span>SVG</span>
                            <span>•</span>
                            <span>Alta Resolución</span>
                            <span>•</span>
                            <span>{selectedType?.toUpperCase()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-slate-50/60 via-corporate-blue-50/40 to-slate-50/60 dark:from-slate-900/60 dark:via-corporate-blue-950/30 dark:to-slate-900/60 rounded-3xl border-2 border-dashed border-slate-300/60 dark:border-slate-600/60 shadow-inner">
                    <div className="text-center space-y-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-corporate-blue-100 dark:from-slate-800 dark:to-corporate-blue-900 rounded-3xl flex items-center justify-center mx-auto shadow-corporate-lg">
                        <QrCode className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-slate-700 dark:text-slate-300">Tu código aparecerá aquí</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Configura y genera para ver el resultado</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </form>
      </main>

      {/* Hero Section - UPGRADED con filosofía corporativa */}
      <section className={cn(
        "relative overflow-hidden transition-all duration-700 ease-smooth",
        "bg-gradient-to-br from-slate-50/60 via-white/80 to-corporate-blue-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-corporate-blue-950/30",
        "border-t border-corporate-blue-200/50 dark:border-corporate-blue-700/50",
        heroAnimated ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      )}
      style={{ transitionDelay: '400ms' }}
      >
        <div className="absolute inset-0 bg-grid-slate-100/30 dark:bg-grid-slate-800/30 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.4))] dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.02))]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-corporate-blue-100/90 dark:bg-corporate-blue-900/40 border border-corporate-blue-200/60 dark:border-corporate-blue-700/60 text-corporate-blue-700 dark:text-corporate-blue-300 text-sm font-medium shadow-corporate-lg backdrop-blur-sm">
              <QrCode className="h-4 w-4" />
              Generador Profesional
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-slate-900 via-corporate-blue-800 to-slate-900 dark:from-slate-100 dark:via-corporate-blue-200 dark:to-slate-100 bg-clip-text text-transparent">
                Códigos QR y Barras
              </span>
              <br />
              <span className="text-corporate-blue-600 dark:text-corporate-blue-400">de Calidad Profesional</span>
            </h1>
            
            <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
              Genera códigos de alta calidad con opciones avanzadas de personalización para uso empresarial y personal.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
