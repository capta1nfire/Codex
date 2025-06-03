'use client'; // Necesario para usar hooks como useState y manejar eventos

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BarcodeDisplay from './BarcodeDisplay';
import { generateFormSchema, GenerateFormData } from '@/schemas/generate.schema';
import { Download, QrCode } from 'lucide-react';
import GenerationOptions from '@/components/generator/GenerationOptions';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';

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
    scale: 2,
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
  },
};

export default function Home() {
  // --- Estados ---
  const [svgContent, setSvgContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<ErrorResponse | null>(null);
  const [expandedSection, setExpandedSection] = useState<string>('advanced'); // Opciones Avanzadas abiertas por defecto

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

  // CATEGORÍAS EXPANDIDAS con múltiples códigos por categoría - SISTEMA DE COLORES DISTINTIVOS
  const categories = useMemo(() => [
    {
      id: '2d',
      name: 'Códigos 2D',
      icon: '⬛',
      description: 'QR Code, Data Matrix, PDF417, Aztec - Alta capacidad de datos',
      types: [
        { id: 'qrcode', name: 'QR Code', priority: 1 },
        { id: 'datamatrix', name: 'Data Matrix', priority: 2 },
        { id: 'pdf417', name: 'PDF417', priority: 3 },
        { id: 'aztec', name: 'Aztec', priority: 4 }
      ],
      visual: 'square',
      color: 'blue',
      priority: 1
    },
    {
      id: 'lineales',
      name: 'Códigos Lineales',
      icon: '📊',
      description: 'Code 128, Code 39, Code 93 - Logística y cadena de suministro',
      types: [
        { id: 'code128', name: 'Code 128', priority: 1 },
        { id: 'code39', name: 'Code 39', priority: 2 },
        { id: 'code93', name: 'Code 93', priority: 3 },
        { id: 'codabar', name: 'Codabar', priority: 4 }
      ],
      visual: 'line',
      color: 'green',
      priority: 2
    },
    {
      id: 'ean',
      name: 'EAN/UPC',
      icon: '🛒',
      description: 'EAN-13, EAN-8, UPC-A, UPC-E - Retail universal "Sunrise 2027"',
      types: [
        { id: 'ean13', name: 'EAN-13', priority: 1 },
        { id: 'ean8', name: 'EAN-8', priority: 2 },
        { id: 'upca', name: 'UPC-A', priority: 3 },
        { id: 'upce', name: 'UPC-E', priority: 4 }
      ],
      visual: 'line',
      color: 'orange',
      priority: 3
    },
    {
      id: 'especializados',
      name: 'Especializados',
      icon: '📦',
      description: 'ITF-14, MSI, Pharmacode - Aplicaciones específicas',
      types: [
        { id: 'itf', name: 'ITF-14', priority: 1 }
        // Se pueden agregar más códigos especializados aquí
      ],
      visual: 'line',
      color: 'purple',
      priority: 4
    }
  ], []);

  // Estado para la categoría seleccionada - Empezar con Códigos 2D (QR Code #1 prioridad)
  const [selectedCategory, setSelectedCategory] = useState('2d');

  // Función helper para obtener colores por categoría
  const getCategoryColors = (categoryColor: string, isSelected: boolean) => {
    const colors = {
      blue: {
        bg: isSelected ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-white dark:bg-slate-900',
        border: isSelected ? 'border-blue-300 dark:border-blue-600' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600',
        text: isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300',
        accent: 'from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-200'
      },
      green: {
        bg: isSelected ? 'bg-green-100 dark:bg-green-900/30' : 'bg-white dark:bg-slate-900',
        border: isSelected ? 'border-green-300 dark:border-green-600' : 'border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-600',
        text: isSelected ? 'text-green-700 dark:text-green-300' : 'text-slate-700 dark:text-slate-300',
        accent: 'from-green-600 to-green-800 dark:from-green-400 dark:to-green-200'
      },
      orange: {
        bg: isSelected ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-white dark:bg-slate-900',
        border: isSelected ? 'border-orange-300 dark:border-orange-600' : 'border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600',
        text: isSelected ? 'text-orange-700 dark:text-orange-300' : 'text-slate-700 dark:text-slate-300',
        accent: 'from-orange-600 to-orange-800 dark:from-orange-400 dark:to-orange-200'
      },
      purple: {
        bg: isSelected ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-white dark:bg-slate-900',
        border: isSelected ? 'border-purple-300 dark:border-purple-600' : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600',
        text: isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-slate-700 dark:text-slate-300',
        accent: 'from-purple-600 to-purple-800 dark:from-purple-400 dark:to-purple-200'
      }
    };
    return colors[categoryColor as keyof typeof colors] || colors.blue;
  };

  // --- Handlers ---

  // Definir onSubmit PRIMERO porque handleTypeChange lo usa
  const onSubmit = useCallback(async (formData: GenerateFormData) => {
    const requestId = Date.now();
    console.log(`[onSubmit-${requestId}] 🚀 INICIO - Datos validados recibidos:`, formData);
    setServerError(null);
    setIsLoading(true);
    setSvgContent('');

    const payload = {
      barcode_type: formData.barcode_type,
      data: formData.data,
      options: formData.options || {},
    };

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004';
      const requestUrl = `${backendUrl}/api/generate`;
      
      // Obtener token de autenticación
      const token = localStorage.getItem('token');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000), // 10 segundos timeout
      });

      const result = await response.json();

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

        setServerError({
          success: false,
          error: message,
          suggestion,
          code,
        });
        setSvgContent('');
      } else {
        setSvgContent(result.svgString);
        setServerError(null);
      }
    } catch (err) {
      setServerError({
        success: false,
        error: err instanceof Error ? err.message : 'Error de conexión o inesperado.',
      });
      setSvgContent('');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handler para cambio de categoría
  const handleCategoryChange = useCallback(async (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    const newType = category?.types[0]?.id || 'qrcode'; // Tomar el primer código de la categoría
    setSelectedCategory(categoryId);
    
    const newData = getDefaultDataForType(newType);
    setValue('barcode_type', newType, { shouldValidate: true });
    setValue('data', newData, { shouldValidate: true });
    setServerError(null);

    const currentFormValues = getValues();
    // Asegurar que las opciones de gradiente estén incluidas
    const completeFormValues = {
      ...currentFormValues,
      options: {
        ...defaultFormValues.options,
        ...currentFormValues.options,
      }
    };
    await onSubmit(completeFormValues);
  }, [setValue, onSubmit, getValues, categories]);

  // Handler para cambio de código dentro de categoría
  const handleCodeTypeChange = useCallback(async (newType: string) => {
    const newData = getDefaultDataForType(newType);
    setValue('barcode_type', newType, { shouldValidate: true });
    setValue('data', newData, { shouldValidate: true });
    setServerError(null);

    const currentFormValues = getValues();
    // Asegurar que las opciones de gradiente estén incluidas
    const completeFormValues = {
      ...currentFormValues,
      options: {
        ...defaultFormValues.options,
        ...currentFormValues.options,
      }
    };
    await onSubmit(completeFormValues);
  }, [setValue, onSubmit, getValues]);

  // useEffect para generar al montar
  useEffect(() => {
    onSubmit(defaultFormValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Action Handlers ---
  const handleDownload = useCallback(() => {
    if (!svgContent) return;

    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    const safeFilename = (selectedType || 'barcode').replace(/[^a-z0-9]/gi, '_').toLowerCase();

    downloadLink.href = svgUrl;
    downloadLink.download = `${safeFilename}_${Date.now()}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  }, [svgContent, selectedType]);

  const handlePrint = useCallback(() => {
    if (!svgContent) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Imprimir Código</title></head>
          <body style="text-align: center; margin-top: 50px;">
            ${svgContent}
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() { window.close(); };
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      alert(
        'No se pudo abrir la ventana de impresión. Por favor, revisa si tu navegador está bloqueando las ventanas emergentes.'
      );
    }
  }, [svgContent]);

  // --- Renderizado REESTRUCTURADO ---
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* FILA 1: Selector Horizontal de Tipos de Códigos */}
      <section className="border-b border-slate-200/30 dark:border-slate-700/30 bg-gradient-to-r from-white via-slate-50/20 to-white dark:from-slate-950 dark:via-slate-900/20 dark:to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Selector Horizontal de Categorías - MEJORADO con colores distintivos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.map((category) => {
              const isSelected = selectedCategory === category.id;
              const colors = getCategoryColors(category.color, isSelected);
              
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={cn(
                    "group relative p-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md",
                    colors.bg,
                    `border-2 ${colors.border}`
                  )}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">{category.icon}</div>
                    <h3 className={cn("font-semibold text-sm", colors.text)}>
                      {category.name}
                    </h3>
                    <div className="mt-1 h-4 flex items-center justify-center">
                      {category.visual === 'line' ? (
                        <div className={cn(
                          "h-1 w-full bg-gradient-to-r bg-no-repeat bg-center opacity-60",
                          isSelected ? colors.accent : "from-slate-600 to-slate-800 dark:from-slate-300 dark:to-slate-100"
                        )}></div>
                      ) : (
                        <div className={cn(
                          "w-4 h-4 opacity-60",
                          isSelected ? `bg-gradient-to-br ${colors.accent}` : "bg-gradient-to-br from-slate-600 to-slate-800 dark:from-slate-300 dark:to-slate-100"
                        )}></div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* NUEVO: Selector de códigos específicos dentro de la categoría */}
          <div className="mt-4">
            {(() => {
              const currentCategory = categories.find(cat => cat.id === selectedCategory);
              const colors = getCategoryColors(currentCategory?.color || 'blue', true);
              
              return (
                <div className={cn(
                  "p-4 rounded-lg border-2",
                  colors.bg,
                  colors.border
                )}>
                  <h3 className={cn("text-sm font-medium mb-3 text-center", colors.text)}>
                    Selecciona el tipo de código:
                  </h3>
                  
                  {/* Selector horizontal de códigos dentro de la categoría */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {currentCategory?.types.map((codeType) => {
                      const isActiveCode = selectedType === codeType.id;
                      
                      return (
                        <button
                          key={codeType.id}
                          onClick={() => handleCodeTypeChange(codeType.id)}
                          className={cn(
                            "flex-shrink-0 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200",
                            isActiveCode
                              ? `bg-gradient-to-r ${colors.accent} text-white shadow-md`
                              : `bg-white dark:bg-slate-800 ${colors.text} border border-current/20 hover:${colors.bg}`
                          )}
                        >
                          {codeType.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* FILA 2: Generador Principal - Configuración y Vista Previa */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* COLUMNA 1-2: Configuración Amplia */}
            <section className="lg:col-span-2 space-y-4">
              {/* Input de Datos */}
              <div className="shadow-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950">
                <div className="px-6 py-4">
                  <h3 className="text-base font-semibold mb-3">Datos</h3>
                  <div className="flex gap-3">
                    <Input
                      {...register('data')}
                      placeholder={`Ingresa el contenido...`}
                      className={cn(
                        "h-10 flex-1",
                        errors.data && "border-red-400 dark:border-red-600"
                      )}
                    />
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className={cn(
                        "h-10 px-6 font-medium flex-shrink-0",
                        "bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600",
                        "transition-all duration-200"
                      )}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Generando...
                        </div>
                      ) : (
                        "Generar"
                      )}
                    </Button>
                  </div>
                  {errors.data && (
                    <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                      {errors.data.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Opciones Avanzadas Colapsibles */}
              {expandedSection === 'advanced' ? (
                <Card className="shadow-sm border border-slate-200 dark:border-slate-700">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold">Opciones Avanzadas</CardTitle>
                      <button
                        type="button"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        onClick={() => setExpandedSection('')}
                      >
                        Ocultar
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
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
              ) : (
                <Card className="shadow-sm border border-slate-200 dark:border-slate-700">
                  <CardContent className="p-4">
                    <button
                      type="button"
                      className="w-full text-left text-blue-600 dark:text-blue-400 hover:underline text-sm"
                      onClick={() => setExpandedSection('advanced')}
                    >
                      + Mostrar opciones avanzadas
                    </button>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* COLUMNA 3: Vista Previa Compacta */}
            <section className="lg:col-span-1">
              <Card className="shadow-sm border border-slate-200 dark:border-slate-700 min-h-[300px]">
                <CardContent className="p-6">
                  {isLoading ? (
                    <div className="flex items-center justify-center min-h-[250px]">
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-700 rounded-full animate-spin border-t-blue-600 dark:border-t-blue-400 mx-auto"></div>
                        <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">Generando código...</p>
                      </div>
                    </div>
                  ) : serverError ? (
                    <div className="flex items-center justify-center min-h-[250px]">
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                          <span className="text-3xl">⚠️</span>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-red-700 dark:text-red-400">Error en la generación</p>
                          <p className="text-sm text-red-600 dark:text-red-500">{serverError.error}</p>
                        </div>
                      </div>
                    </div>
                  ) : svgContent ? (
                    <div className="space-y-6">
                      {/* Preview Area */}
                      <div className="flex items-center justify-center min-h-[250px] bg-slate-50 dark:bg-slate-900/50 rounded-lg">
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

                      {/* Opciones de Descarga */}
                      <Card className="shadow-sm border border-slate-200 dark:border-slate-700">
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Opciones de Descarga</h3>
                            <div className="grid grid-cols-1 gap-4">
                              {/* Control de Escala */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs text-slate-600 dark:text-slate-400">Calidad</label>
                                  <span className="text-xs font-mono text-slate-700 dark:text-slate-300">
                                    {(() => {
                                      const scale = watch('options.scale') || 2;
                                      const size = scale * 100; // Estimación base de 100px por escala
                                      return `${size} x ${size} Px`;
                                    })()}
                                  </span>
                                </div>
                                <div className="relative">
                                  <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    step="1"
                                    value={watch('options.scale') || 2}
                                    onChange={(e) => setValue('options.scale', parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                    style={{
                                      background: 'linear-gradient(to right, #e2e8f0 0%, #93c5fd 50%, #3b82f6 100%)',
                                    }}
                                  />
                                  <style jsx>{`
                                    input[type="range"]::-webkit-slider-thumb {
                                      appearance: none;
                                      width: 20px;
                                      height: 20px;
                                      border-radius: 50%;
                                      background: #3b82f6;
                                      border: 3px solid white;
                                      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                                      cursor: pointer;
                                    }
                                    input[type="range"]::-moz-range-thumb {
                                      width: 20px;
                                      height: 20px;
                                      border-radius: 50%;
                                      background: #3b82f6;
                                      border: 3px solid white;
                                      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                                      cursor: pointer;
                                      border: none;
                                    }
                                  `}</style>
                                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                                    <span>Low Quality</span>
                                    <span>High Quality</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Selector de Formato */}
                              <div>
                                <label className="text-xs text-slate-600 dark:text-slate-400">Formato</label>
                                <select className="h-8 px-2 rounded-md border border-input bg-background text-sm w-full mt-1">
                                  <option value="svg">SVG</option>
                                  <option value="png">PNG</option>
                                  <option value="jpg">JPG</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Download Button */}
                      <div className="text-center">
                        <Button
                          type="button"
                          onClick={handleDownload}
                          disabled={!svgContent || isLoading}
                          className="h-12 px-8 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                        >
                          <Download className="mr-2 h-5 w-5" />
                          Descargar Código de Barras
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center min-h-[250px] text-center">
                      <div className="space-y-4">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center mx-auto">
                          <QrCode className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">Tu código aparecerá aquí</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Configura y genera para ver el resultado</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>
        </form>
      </main>

      {/* FILA 3: Sección Hero Movida Abajo */}
      <section className="bg-gradient-to-br from-slate-50/60 via-white/80 to-blue-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/30 border-t border-slate-200/50 dark:border-slate-700/50 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100/90 dark:bg-blue-900/40 border border-blue-200/60 dark:border-blue-700/60 text-blue-700 dark:text-blue-300 text-sm font-medium shadow-lg backdrop-blur-sm">
              <QrCode className="h-4 w-4" />
              Generador Profesional
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-slate-900 via-blue-800 to-slate-900 dark:from-slate-100 dark:via-blue-200 dark:to-slate-100 bg-clip-text text-transparent">
                Códigos QR y Barras
              </span>
              <br />
              <span className="text-blue-600 dark:text-blue-400">de Calidad Profesional</span>
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
