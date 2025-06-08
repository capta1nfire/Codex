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

export const qrContentTypes = [
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