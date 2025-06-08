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

// Imports para tipos de contenido QR
import { 
  Link,
  Type,
  Mail,
  Phone,
  MessageSquare,
  User,
  MessageCircle,
  Wifi,
  FileText,
  Smartphone,
  Image,
  Video,
  Share2,
  Calendar,
  Grid3X3
} from 'lucide-react';

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

  // Estado para el tipo de contenido QR seleccionado
  const [selectedQRType, setSelectedQRType] = useState<string>('link');
  
  // Estado para los datos del formulario QR específico
  const [qrFormData, setQrFormData] = useState<Record<string, any>>({
    email: { email: 'correo@ejemplo.com', subject: 'Asunto', message: 'Mensaje' },
    call: { countryCode: '+1', phoneNumber: '1234567890' },
    sms: { countryCode: '+1', phoneNumber: '1234567890', message: 'Tu mensaje aquí' },
    whatsapp: { countryCode: '+1', phoneNumber: '1234567890', message: 'Hola!' },
    wifi: { networkName: 'NombreRed', password: 'contraseña', security: 'WPA', hidden: false },
    vcard: { 
      firstName: 'Juan', lastName: 'Pérez', organization: 'Tu Empresa', title: 'Cargo',
      phone: '+1234567890', email: 'juan@ejemplo.com', website: 'https://ejemplo.com', address: 'Tu Dirección' 
    },
    text: { message: 'Tu mensaje personalizado aquí' },
    link: { url: 'https://tu-sitio-web.com' }
  });
  
  // Definir tipos de contenido para QR Code
  const qrContentTypes = [
    { id: 'link', name: 'Link', icon: Link, placeholder: 'https://tu-sitio-web.com', defaultData: 'https://tu-sitio-web.com' },
    { id: 'text', name: 'Text', icon: Type, placeholder: 'Escribe tu mensaje aquí', defaultData: 'Tu mensaje personalizado aquí' },
    { id: 'email', name: 'E-mail', icon: Mail, placeholder: 'correo@ejemplo.com', defaultData: 'mailto:correo@ejemplo.com?subject=Asunto&body=Mensaje' },
    { id: 'call', name: 'Call', icon: Phone, placeholder: '+1234567890', defaultData: 'tel:+1234567890' },
    { id: 'sms', name: 'SMS', icon: MessageSquare, placeholder: '+1234567890', defaultData: 'sms:+1234567890?body=Tu mensaje aquí' },
    { id: 'vcard', name: 'V-card', icon: User, placeholder: 'Contacto', defaultData: 'BEGIN:VCARD\nVERSION:3.0\nFN:Juan Pérez\nORG:Tu Empresa\nTEL:+1234567890\nEMAIL:juan@ejemplo.com\nEND:VCARD' },
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, placeholder: '+1234567890', defaultData: 'https://wa.me/1234567890?text=Hola!' },
    { id: 'wifi', name: 'Wi-Fi', icon: Wifi, placeholder: 'Red WiFi', defaultData: 'WIFI:T:WPA;S:NombreRed;P:contraseña;H:false;;' },
    { id: 'pdf', name: 'PDF', icon: FileText, placeholder: 'URL del PDF', defaultData: 'https://ejemplo.com/documento.pdf' },
    { id: 'app', name: 'App', icon: Smartphone, placeholder: 'URL de la app', defaultData: 'https://play.google.com/store/apps/details?id=com.ejemplo.app' },
    { id: 'images', name: 'Images', icon: Image, placeholder: 'URL de la imagen', defaultData: 'https://ejemplo.com/imagen.jpg' },
    { id: 'video', name: 'Video', icon: Video, placeholder: 'URL del video', defaultData: 'https://ejemplo.com/video.mp4' },
    { id: 'social', name: 'Social Media', icon: Share2, placeholder: 'URL social', defaultData: 'https://twitter.com/tu_usuario' },
    { id: 'event', name: 'Event', icon: Calendar, placeholder: 'Evento', defaultData: 'BEGIN:VEVENT\nSUMMARY:Mi Evento\nDTSTART:20241201T100000Z\nDTEND:20241201T110000Z\nLOCATION:Mi Ubicación\nEND:VEVENT' },
    { id: 'barcode', name: '2D Barcode', icon: Grid3X3, placeholder: 'Datos del código', defaultData: 'Datos para código 2D' }
  ];

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

  // Función para generar contenido QR basado en los datos del formulario
  const generateQRContent = useCallback((type: string, data: any) => {
    switch (type) {
      case 'email':
        return `mailto:${data.email}?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(data.message)}`;
      case 'call':
        return `tel:${data.countryCode}${data.phoneNumber}`;
      case 'sms':
        return `sms:${data.countryCode}${data.phoneNumber}?body=${encodeURIComponent(data.message)}`;
      case 'whatsapp':
        const whatsappNumber = `${data.countryCode}${data.phoneNumber}`.replace(/\D/g, '');
        return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(data.message)}`;
      case 'wifi':
        return `WIFI:T:${data.security};S:${data.networkName};P:${data.password};H:${data.hidden ? 'true' : 'false'};;`;
      case 'vcard':
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${data.firstName} ${data.lastName}\nORG:${data.organization}\nTITLE:${data.title}\nTEL:${data.phone}\nEMAIL:${data.email}\nURL:${data.website}\nADR:;;${data.address};;;;\nEND:VCARD`;
      case 'text':
        return data.message;
      case 'link':
        return data.url;
      default:
        return '';
    }
  }, []);

  // Función para actualizar datos del formulario QR
  const updateQRFormData = useCallback((type: string, field: string, value: any) => {
    setQrFormData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
    
    // Generar contenido y actualizar el formulario principal
    const updatedData = {
      ...qrFormData[type],
      [field]: value
    };
    const qrContent = generateQRContent(type, updatedData);
    setValue('data', qrContent, { shouldValidate: true });
  }, [qrFormData, generateQRContent, setValue]);

  // TABS DIRECTOS - Tipos populares como tabs fijos, otros en dropdown
  const [popularTypes, setPopularTypes] = useState([
    // Los más populares y comunes
    { id: 'qrcode', name: 'QR Code', category: '2d', color: 'blue', icon: '⬛' },
    { id: 'code128', name: 'Code 128', category: 'lineales', color: 'green', icon: '📊' },
    { id: 'ean13', name: 'EAN-13', category: 'ean', color: 'orange', icon: '🛒' },
    { id: 'pdf417', name: 'PDF417', category: '2d', color: 'blue', icon: '⬛' },
    { id: 'code39', name: 'Code 39', category: 'lineales', color: 'green', icon: '📊' },
  ]);

  const [additionalTypes, setAdditionalTypes] = useState([
    // Menos comunes - van en dropdown
    { id: 'datamatrix', name: 'Data Matrix', category: '2d', color: 'blue', icon: '⬛' },
    { id: 'aztec', name: 'Aztec', category: '2d', color: 'blue', icon: '⬛' },
    { id: 'code93', name: 'Code 93', category: 'lineales', color: 'green', icon: '📊' },
    { id: 'codabar', name: 'Codabar', category: 'lineales', color: 'green', icon: '📊' },
    { id: 'ean8', name: 'EAN-8', category: 'ean', color: 'orange', icon: '🛒' },
    { id: 'upca', name: 'UPC-A', category: 'ean', color: 'orange', icon: '🛒' },
    { id: 'upce', name: 'UPC-E', category: 'ean', color: 'orange', icon: '🛒' },
    { id: 'itf', name: 'ITF-14', category: 'especializados', color: 'purple', icon: '📦' },
  ]);

  // Estado para el dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Función para reorganizar las listas cuando se selecciona del dropdown
  const moveToPopular = useCallback((selectedTypeId: string) => {
    const selectedTypeObj = additionalTypes.find(type => type.id === selectedTypeId);
    if (!selectedTypeObj) return;

    // Remover el tipo seleccionado de additionalTypes
    const newAdditionalTypes = additionalTypes.filter(type => type.id !== selectedTypeId);
    
    // El tipo seleccionado pasa al primer lugar
    // Todos los elementos de popularTypes se desplazan una posición a la derecha
    // El último elemento de popularTypes se mueve al dropdown
    const lastPopular = popularTypes[popularTypes.length - 1];
    const newPopularTypes = [selectedTypeObj, ...popularTypes.slice(0, -1)];
    
    // Agregar el último elemento de popular al inicio de additionalTypes
    const updatedAdditionalTypes = [lastPopular, ...newAdditionalTypes];

    // Actualizar ambos estados
    setPopularTypes(newPopularTypes);
    setAdditionalTypes(updatedAdditionalTypes);
  }, [popularTypes, additionalTypes]);

  // Función helper para obtener colores por tipo
  const getTypeColors = (color: string, isSelected: boolean) => {
    const colors = {
      blue: {
        bg: isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-slate-900 hover:bg-blue-50/50 dark:hover:bg-blue-900/10',
        border: isSelected ? 'border-blue-500 dark:border-blue-400' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600',
        text: isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400',
        textSelected: 'text-blue-700 dark:text-blue-300'
      },
      green: {
        bg: isSelected ? 'bg-green-50 dark:bg-green-900/20' : 'bg-white dark:bg-slate-900 hover:bg-green-50/50 dark:hover:bg-green-900/10',
        border: isSelected ? 'border-green-500 dark:border-green-400' : 'border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-600',
        text: isSelected ? 'text-green-700 dark:text-green-300' : 'text-slate-600 dark:text-slate-400',
        textSelected: 'text-green-700 dark:text-green-300'
      },
      orange: {
        bg: isSelected ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-white dark:bg-slate-900 hover:bg-orange-50/50 dark:hover:bg-orange-900/10',
        border: isSelected ? 'border-orange-500 dark:border-orange-400' : 'border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600',
        text: isSelected ? 'text-orange-700 dark:text-orange-300' : 'text-slate-600 dark:text-slate-400',
        textSelected: 'text-orange-700 dark:text-orange-300'
      },
      purple: {
        bg: isSelected ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-white dark:bg-slate-900 hover:bg-purple-50/50 dark:hover:bg-purple-900/10',
        border: isSelected ? 'border-purple-500 dark:border-purple-400' : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600',
        text: isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-slate-600 dark:text-slate-400',
        textSelected: 'text-purple-700 dark:text-purple-300'
      }
    };
    return colors[color as keyof typeof colors] || colors.blue;
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

  // Handler para cambio de tipo de código (actualizado)
  const handleTypeChange = useCallback(async (newType: string) => {
    const newData = getDefaultDataForType(newType);
    setValue('barcode_type', newType, { shouldValidate: true });
    setValue('data', newData, { shouldValidate: true });
    setServerError(null);

    const currentFormValues = getValues();
    // Asegurar que las opciones de gradiente estén incluidas
    const completeFormValues = {
      ...currentFormValues,
      barcode_type: newType,
      data: newData,
      options: {
        ...defaultFormValues.options,
        ...currentFormValues.options,
      }
    };
    await onSubmit(completeFormValues);
  }, [setValue, onSubmit, getValues]);

  // Handler especializado para selección desde dropdown
  const handleDropdownSelection = useCallback(async (selectedTypeId: string) => {
    // Primero reorganizar las listas
    moveToPopular(selectedTypeId);
    
    // Luego cambiar el tipo de código
    await handleTypeChange(selectedTypeId);
    
    // Cerrar el dropdown
    setIsDropdownOpen(false);
  }, [moveToPopular, handleTypeChange]);

  // Handler para cambiar el tipo de contenido QR
  const handleQRTypeChange = useCallback(async (newQRType: string) => {
    setSelectedQRType(newQRType);
    
    // Generar contenido inicial basado en el tipo y datos por defecto
    const initialData = qrFormData[newQRType];
    const qrContent = generateQRContent(newQRType, initialData);
    
    setValue('data', qrContent, { shouldValidate: true });
    
    // Regenerar automáticamente con el nuevo tipo
    const currentFormValues = getValues();
    const completeFormValues = {
      ...currentFormValues,
      data: qrContent,
      options: {
        ...defaultFormValues.options,
        ...currentFormValues.options,
      }
    };
    await onSubmit(completeFormValues);
  }, [setValue, getValues, onSubmit, qrFormData, generateQRContent]);

  // useEffect para generar al montar
  useEffect(() => {
    onSubmit(defaultFormValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // useEffect para cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isDropdownOpen && !target.closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // --- Action Handlers ---
  const handleDownload = useCallback((format: string = 'svg') => {
    if (!svgContent) return;

    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    const safeFilename = (selectedType || 'barcode').replace(/[^a-z0-9]/gi, '_').toLowerCase();

    downloadLink.href = svgUrl;
    downloadLink.download = `${safeFilename}_${Date.now()}.${format}`;
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

  // --- Renderizado REESTRUCTURADO CON TABS ---
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* GENERADOR PRINCIPAL CON TABS INTEGRADOS */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        {/* TABS DE CÓDIGOS DE BARRAS - Integrados en el generador */}
        <div className="mb-6">
          {/* Tabs Fijos + Dropdown para tipos adicionales */}
          <div className="flex items-center gap-1 w-full">
            {/* Contenedor de tabs principales distribuidos uniformemente */}
            <div className="flex items-center justify-between flex-1 gap-2">
              {popularTypes.map((type) => {
                const isSelected = selectedType === type.id;
                const colors = getTypeColors(type.color, isSelected);
                
                return (
                  <button
                    key={type.id}
                    onClick={() => handleDropdownSelection(type.id)}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3.5 rounded-lg transition-all duration-200 border flex-1",
                      colors.bg,
                      colors.border,
                      "hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                      "min-w-0 justify-center"
                    )}
                  >
                    <span className="text-sm">{type.icon}</span>
                    <span className={cn(
                      "font-medium text-sm whitespace-nowrap",
                      colors.text
                    )}>
                      {type.name}
                    </span>
                    {isSelected && (
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        type.color === 'blue' && "bg-blue-500",
                        type.color === 'green' && "bg-green-500", 
                        type.color === 'orange' && "bg-orange-500",
                        type.color === 'purple' && "bg-purple-500"
                      )}></div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Dropdown solo con flecha - Sin texto */}
            <div className="relative dropdown-container">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200 border",
                  "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700",
                  "hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                )}
              >
                <svg 
                  className={cn(
                    "w-5 h-5 transition-transform duration-200 text-slate-500 dark:text-slate-400",
                    isDropdownOpen && "rotate-180"
                  )}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown content */}
              {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-1 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10">
                  <div className="p-2 space-y-1">
                    {additionalTypes.map((type) => {
                      const isSelected = selectedType === type.id;
                      const colors = getTypeColors(type.color, isSelected);
                      
                      return (
                        <button
                          key={type.id}
                          onClick={() => handleDropdownSelection(type.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 text-left",
                            isSelected 
                              ? `${colors.bg} ${colors.border.replace('hover:', '')} border`
                              : "hover:bg-slate-50 dark:hover:bg-slate-800"
                          )}
                        >
                          <span className="text-sm">{type.icon}</span>
                          <span className={cn(
                            "font-medium text-sm",
                            isSelected ? colors.text : "text-slate-700 dark:text-slate-300"
                          )}>
                            {type.name}
                          </span>
                          {isSelected && (
                            <div className={cn(
                              "w-2 h-2 rounded-full ml-auto",
                              type.color === 'blue' && "bg-blue-500",
                              type.color === 'green' && "bg-green-500", 
                              type.color === 'orange' && "bg-orange-500",
                              type.color === 'purple' && "bg-purple-500"
                            )}></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FORMULARIO DEL GENERADOR */}
        <form onSubmit={handleSubmit(onSubmit)} className="scroll-smooth">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* COLUMNA 1-2: Configuración Amplia */}
            <section className="lg:col-span-2 space-y-4" id="form-content">
              {/* Input de Datos */}
              <div className="shadow-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950">
                <div className="px-6 py-4">
                  <h3 className="text-base font-semibold mb-3">Datos</h3>
                  
                  {/* QR Content Type Selection - Solo para QR Code */}
                  {selectedType === 'qrcode' && (
                    <div className="space-y-3 mb-4">
                      {/* Grid de tipos de contenido QR */}
                      <div className="grid grid-cols-5 gap-2">
                        {qrContentTypes.slice(0, 10).map((qrType) => {
                          const Icon = qrType.icon;
                          const isSelected = selectedQRType === qrType.id;
                          
                          return (
                            <button
                              key={qrType.id}
                              type="button"
                              onClick={() => handleQRTypeChange(qrType.id)}
                              className={cn(
                                "flex flex-col items-center gap-1 p-1 rounded transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800",
                                isSelected && "bg-green-50 dark:bg-green-900/20"
                              )}
                              disabled={isLoading}
                            >
                              <Icon className={cn(
                                "h-5 w-5 transition-colors",
                                isSelected ? "text-green-600 dark:text-green-400" : "text-slate-600 dark:text-slate-400"
                              )} />
                              <span className={cn(
                                "text-xs font-medium text-center leading-tight",
                                isSelected ? "text-green-700 dark:text-green-300" : "text-slate-600 dark:text-slate-400"
                              )}>
                                {qrType.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Segunda fila para los tipos restantes */}
                      <div className="grid grid-cols-5 gap-2">
                        {qrContentTypes.slice(10).map((qrType) => {
                          const Icon = qrType.icon;
                          const isSelected = selectedQRType === qrType.id;
                          
                          return (
                            <button
                              key={qrType.id}
                              type="button"
                              onClick={() => handleQRTypeChange(qrType.id)}
                              className={cn(
                                "flex flex-col items-center gap-1 p-1 rounded transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800",
                                isSelected && "bg-green-50 dark:bg-green-900/20"
                              )}
                              disabled={isLoading}
                            >
                              <Icon className={cn(
                                "h-5 w-5 transition-colors",
                                isSelected ? "text-green-600 dark:text-green-400" : "text-slate-600 dark:text-slate-400"
                              )} />
                              <span className={cn(
                                "text-xs font-medium text-center leading-tight",
                                isSelected ? "text-green-700 dark:text-green-300" : "text-slate-600 dark:text-slate-400"
                              )}>
                                {qrType.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Formularios dinámicos para QR Code */}
                  {selectedType === 'qrcode' ? (
                    <div className="space-y-4">
                      {/* Formulario para Email */}
                      {selectedQRType === 'email' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Email</label>
                              <Input
                                value={qrFormData.email.email}
                                onChange={(e) => updateQRFormData('email', 'email', e.target.value)}
                                placeholder="Your Email Address"
                                className="h-9"
                                disabled={isLoading}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Subject</label>
                              <Input
                                value={qrFormData.email.subject}
                                onChange={(e) => updateQRFormData('email', 'subject', e.target.value)}
                                placeholder="Subject Of Email"
                                className="h-9"
                                disabled={isLoading}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Message</label>
                            <textarea
                              value={qrFormData.email.message}
                              onChange={(e) => updateQRFormData('email', 'message', e.target.value)}
                              placeholder="Message"
                              className="w-full min-h-[80px] px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 resize-none"
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                      )}

                      {/* Formulario para Call */}
                      {selectedQRType === 'call' && (
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Country Code</label>
                            <Input
                              value={qrFormData.call.countryCode}
                              onChange={(e) => updateQRFormData('call', 'countryCode', e.target.value)}
                              placeholder="+1"
                              className="h-9"
                              disabled={isLoading}
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Phone Number</label>
                            <Input
                              value={qrFormData.call.phoneNumber}
                              onChange={(e) => updateQRFormData('call', 'phoneNumber', e.target.value)}
                              placeholder="1234567890"
                              className="h-9"
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                      )}

                      {/* Formulario para SMS */}
                      {selectedQRType === 'sms' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Country Code</label>
                              <Input
                                value={qrFormData.sms.countryCode}
                                onChange={(e) => updateQRFormData('sms', 'countryCode', e.target.value)}
                                placeholder="+1"
                                className="h-9"
                                disabled={isLoading}
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Phone Number</label>
                              <Input
                                value={qrFormData.sms.phoneNumber}
                                onChange={(e) => updateQRFormData('sms', 'phoneNumber', e.target.value)}
                                placeholder="1234567890"
                                className="h-9"
                                disabled={isLoading}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Message</label>
                            <Input
                              value={qrFormData.sms.message}
                              onChange={(e) => updateQRFormData('sms', 'message', e.target.value)}
                              placeholder="Your message here"
                              className="h-9"
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                      )}

                      {/* Formulario para WhatsApp */}
                      {selectedQRType === 'whatsapp' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Country Code</label>
                              <Input
                                value={qrFormData.whatsapp.countryCode}
                                onChange={(e) => updateQRFormData('whatsapp', 'countryCode', e.target.value)}
                                placeholder="+1"
                                className="h-9"
                                disabled={isLoading}
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Phone Number</label>
                              <Input
                                value={qrFormData.whatsapp.phoneNumber}
                                onChange={(e) => updateQRFormData('whatsapp', 'phoneNumber', e.target.value)}
                                placeholder="1234567890"
                                className="h-9"
                                disabled={isLoading}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Message</label>
                            <Input
                              value={qrFormData.whatsapp.message}
                              onChange={(e) => updateQRFormData('whatsapp', 'message', e.target.value)}
                              placeholder="Hola!"
                              className="h-9"
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                      )}

                      {/* Formulario para Wi-Fi */}
                      {selectedQRType === 'wifi' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Network Name</label>
                              <Input
                                value={qrFormData.wifi.networkName}
                                onChange={(e) => updateQRFormData('wifi', 'networkName', e.target.value)}
                                placeholder="WiFi Network Name"
                                className="h-9"
                                disabled={isLoading}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Password</label>
                              <Input
                                value={qrFormData.wifi.password}
                                onChange={(e) => updateQRFormData('wifi', 'password', e.target.value)}
                                placeholder="Password"
                                type="password"
                                className="h-9"
                                disabled={isLoading}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Security</label>
                              <select
                                value={qrFormData.wifi.security}
                                onChange={(e) => updateQRFormData('wifi', 'security', e.target.value)}
                                className="w-full h-9 px-3 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950"
                                disabled={isLoading}
                              >
                                <option value="WPA">WPA/WPA2</option>
                                <option value="WEP">WEP</option>
                                <option value="nopass">Open Network</option>
                              </select>
                            </div>
                            <div className="flex items-end">
                              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                <input
                                  type="checkbox"
                                  checked={qrFormData.wifi.hidden}
                                  onChange={(e) => updateQRFormData('wifi', 'hidden', e.target.checked)}
                                  disabled={isLoading}
                                />
                                Hidden Network
                              </label>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Formulario para Text */}
                      {selectedQRType === 'text' && (
                        <div>
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Message</label>
                          <textarea
                            value={qrFormData.text.message}
                            onChange={(e) => updateQRFormData('text', 'message', e.target.value)}
                            placeholder="Write your message here"
                            className="w-full min-h-[80px] px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 resize-none"
                            disabled={isLoading}
                          />
                        </div>
                      )}

                      {/* Formulario para Link */}
                      {selectedQRType === 'link' && (
                        <div>
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Website URL</label>
                          <Input
                            value={qrFormData.link.url}
                            onChange={(e) => updateQRFormData('link', 'url', e.target.value)}
                            placeholder="https://your-website.com"
                            className="h-9"
                            disabled={isLoading}
                          />
                        </div>
                      )}

                      {/* Formulario para V-Card */}
                      {selectedQRType === 'vcard' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">First Name</label>
                              <Input
                                value={qrFormData.vcard.firstName}
                                onChange={(e) => updateQRFormData('vcard', 'firstName', e.target.value)}
                                placeholder="Juan"
                                className="h-9"
                                disabled={isLoading}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Last Name</label>
                              <Input
                                value={qrFormData.vcard.lastName}
                                onChange={(e) => updateQRFormData('vcard', 'lastName', e.target.value)}
                                placeholder="Pérez"
                                className="h-9"
                                disabled={isLoading}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Organization</label>
                              <Input
                                value={qrFormData.vcard.organization}
                                onChange={(e) => updateQRFormData('vcard', 'organization', e.target.value)}
                                placeholder="Tu Empresa"
                                className="h-9"
                                disabled={isLoading}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Title</label>
                              <Input
                                value={qrFormData.vcard.title}
                                onChange={(e) => updateQRFormData('vcard', 'title', e.target.value)}
                                placeholder="Cargo"
                                className="h-9"
                                disabled={isLoading}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Phone</label>
                              <Input
                                value={qrFormData.vcard.phone}
                                onChange={(e) => updateQRFormData('vcard', 'phone', e.target.value)}
                                placeholder="+1234567890"
                                className="h-9"
                                disabled={isLoading}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Email</label>
                              <Input
                                value={qrFormData.vcard.email}
                                onChange={(e) => updateQRFormData('vcard', 'email', e.target.value)}
                                placeholder="juan@ejemplo.com"
                                className="h-9"
                                disabled={isLoading}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Website</label>
                              <Input
                                value={qrFormData.vcard.website}
                                onChange={(e) => updateQRFormData('vcard', 'website', e.target.value)}
                                placeholder="https://ejemplo.com"
                                className="h-9"
                                disabled={isLoading}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Address</label>
                              <Input
                                value={qrFormData.vcard.address}
                                onChange={(e) => updateQRFormData('vcard', 'address', e.target.value)}
                                placeholder="Tu Dirección"
                                className="h-9"
                                disabled={isLoading}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Formulario genérico para otros tipos */}
                      {!['email', 'call', 'sms', 'whatsapp', 'wifi', 'text', 'link', 'vcard'].includes(selectedQRType) && (
                        <div>
                          <Input
                            {...register('data')}
                            placeholder="Ingresa el contenido..."
                            className="h-9"
                            disabled={isLoading}
                          />
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-10 bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
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
                  ) : (
                    /* Formulario simple para códigos que no son QR */
                    <div className="flex gap-3">
                      <Input
                        {...register('data')}
                        placeholder="Ingresa el contenido..."
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
                  )}
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

            {/* COLUMNA 3: Vista Previa Natural como QR.io */}
            <section className="lg:col-span-1">
              <div className="lg:sticky lg:top-6">
                <Card className="shadow-sm border border-slate-200 dark:border-slate-700">
                  <CardContent className="p-6">
                    {isLoading ? (
                      <div className="flex items-center justify-center min-h-[300px]">
                        <div className="text-center space-y-4">
                          <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-700 rounded-full animate-spin border-t-blue-600 dark:border-t-blue-400 mx-auto"></div>
                          <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">Generando código...</p>
                        </div>
                      </div>
                    ) : serverError ? (
                      <div className="flex items-center justify-center min-h-[300px]">
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
                        <div className="flex items-center justify-center min-h-[300px] lg:min-h-[350px] barcode-container">
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

                        {/* Control de Calidad */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Calidad</label>
                            <span className="text-sm font-mono text-slate-700 dark:text-slate-300">
                              {(() => {
                                const scale = watch('options.scale') || 2;
                                const size = scale * 100;
                                return `${size} x ${size} px`;
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
                            <div className="flex justify-between text-xs text-slate-500 mt-2">
                              <span>Baja</span>
                              <span>Alta</span>
                            </div>
                          </div>
                        </div>

                        {/* Botones de Descarga */}
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload('png')}
                            disabled={!svgContent || isLoading}
                            className="h-11 text-sm font-medium"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            PNG
                          </Button>
                          <Button 
                            type="button"
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDownload('svg')}
                            disabled={!svgContent || isLoading}
                            className="h-11 text-sm font-medium"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            SVG
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload('pdf')}
                            disabled={!svgContent || isLoading}
                            className="h-11 text-sm font-medium"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            PDF
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload('eps')}
                            disabled={!svgContent || isLoading}
                            className="h-11 text-sm font-medium"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            EPS
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center min-h-[300px] text-center">
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
              </div>
            </section>
          </div>
        </form>
      </main>

      {/* SECCIÓN HERO */}
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
