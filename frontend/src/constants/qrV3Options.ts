/**
 * QR v3 Supported Options
 * 
 * These constants define all supported customization options for QR v3 engine.
 * They serve as the single source of truth for frontend validation and UI options.
 * 
 * Last synced with backend: June 28, 2025
 */

export const QR_V3_GRADIENTS = [
  { value: 'linear', label: 'Lineal', icon: 'bg-gradient-to-r' },
  { value: 'radial', label: 'Radial', icon: 'bg-gradient-radial' },
  { value: 'conic', label: 'Cónico', icon: 'bg-gradient-conic' },
  { value: 'diamond', label: 'Diamante', icon: 'rotate-45 bg-gradient-to-r' },
  { value: 'spiral', label: 'Espiral', icon: 'bg-gradient-radial' },
] as const;

export const QR_V3_EYE_SHAPES = [
  { value: 'square', label: 'Cuadrado', icon: '◼' },
  { value: 'rounded_square', label: 'Redondeado', icon: '▢' },
  { value: 'circle', label: 'Círculo', icon: '●' },
  { value: 'dot', label: 'Punto', icon: '•' },
  { value: 'leaf', label: 'Hoja', icon: '🍃' },
  { value: 'bars_horizontal', label: 'Barras Horiz.', icon: '☰' },
  { value: 'bars_vertical', label: 'Barras Vert.', icon: '☷' },
  { value: 'star', label: 'Estrella', icon: '⭐' },
  { value: 'diamond', label: 'Diamante', icon: '◆' },
  { value: 'cross', label: 'Cruz', icon: '➕' },
  { value: 'hexagon', label: 'Hexágono', icon: '⬢' },
  { value: 'heart', label: 'Corazón', icon: '❤️' },
  { value: 'shield', label: 'Escudo', icon: '🛡️' },
  { value: 'crystal', label: 'Cristal', icon: '💎' },
  { value: 'flower', label: 'Flor', icon: '🌸' },
  { value: 'arrow', label: 'Flecha', icon: '⬆️' },
] as const;

// Opciones de marcos/bordes para ojos (estructurales y visualmente compatibles)
export const QR_V3_EYE_BORDER_STYLES = [
  // Marcos estructurales básicos (recomendados)
  { value: 'square', label: 'Cuadrado', icon: '◼' },
  { value: 'rounded_square', label: 'Redondeado', icon: '▢' },
  { value: 'circle', label: 'Círculo', icon: '●' },
  { value: 'quarter_round', label: 'Esquina Curva', icon: '◜' },
  { value: 'cut_corner', label: 'Esquina Cortada', icon: '◤' },
  { value: 'thick_border', label: 'Marco Grueso', icon: '⬛' },
  { value: 'double_border', label: 'Marco Doble', icon: '◈' },
  // Marcos geométricos
  { value: 'diamond', label: 'Diamante', icon: '◆' },
  { value: 'hexagon', label: 'Hexágono', icon: '⬢' },
  { value: 'cross', label: 'Cruz', icon: '➕' },
  // Marcos ornamentales (mejor como centros)
  { value: 'star', label: 'Estrella', icon: '⭐' },
  { value: 'leaf', label: 'Hoja', icon: '🍃' },
  { value: 'arrow', label: 'Flecha', icon: '⬆️' },
  
  // Formas orgánicas (Fase 2.1)
  { value: 'teardrop', label: 'Gota', icon: '💧' },
  { value: 'wave', label: 'Onda', icon: '🌊' },
  { value: 'petal', label: 'Pétalo', icon: '🌸' },
  { value: 'crystal', label: 'Cristal', icon: '💎' },
  { value: 'flame', label: 'Llama', icon: '🔥' },
  { value: 'organic', label: 'Orgánico', icon: '🌿' },
  
  // Propuestas temporales
  { value: 'propuesta01', label: 'Propuesta 01', icon: '📐' },
] as const;

export const QR_V3_EYE_CENTER_STYLES = [
  { value: 'square', label: 'Cuadrado', icon: '■' },
  { value: 'rounded_square', label: 'Redondeado', icon: '▢' },
  { value: 'circle', label: 'Círculo', icon: '●' },
  { value: 'dot', label: 'Punto', icon: '•' },
  { value: 'star', label: 'Estrella', icon: '★' },
  { value: 'diamond', label: 'Diamante', icon: '♦' },
  { value: 'cross', label: 'Cruz', icon: '+' },
  { value: 'plus', label: 'Más', icon: '✚' },
] as const;

export const QR_V3_DATA_PATTERNS = [
  { value: 'square', label: 'Cuadrado', preview: '■' },
  { value: 'square_small', label: 'Cuadrado Pequeño', preview: '▪' },
  { value: 'dots', label: 'Puntos', preview: '●' },
  { value: 'rounded', label: 'Redondeado', preview: '▢' },
  { value: 'vertical', label: 'Vertical', preview: '|||' },
  { value: 'horizontal', label: 'Horizontal', preview: '===' },
  { value: 'diamond', label: 'Diamante', preview: '◆' },
  { value: 'circular', label: 'Circular', preview: '○' },
  { value: 'star', label: 'Estrella', preview: '★' },
  { value: 'cross', label: 'Cruz', preview: '➕' },
  { value: 'random', label: 'Aleatorio', preview: '?' },
  { value: 'wave', label: 'Onda', preview: '∿' },
  { value: 'mosaic', label: 'Mosaico', preview: '▦' },
] as const;

export const QR_V3_EFFECTS = [
  { value: 'shadow', label: 'Sombra', icon: '🌑' },
  { value: 'glow', label: 'Brillo', icon: '✨' },
  { value: 'blur', label: 'Desenfoque', icon: '🌫️' },
  { value: 'noise', label: 'Ruido', icon: '📺' },
  { value: 'vintage', label: 'Vintage', icon: '📷' },
] as const;

export const QR_V3_FRAME_STYLES = [
  { value: 'simple', label: 'Simple' },
  { value: 'rounded', label: 'Redondeado' },
  { value: 'bubble', label: 'Burbuja' },
  { value: 'speech', label: 'Diálogo' },
  { value: 'badge', label: 'Insignia' },
] as const;

export const QR_V3_LOGO_SHAPES = [
  { value: 'square', label: 'Cuadrado', icon: '⬜' },
  { value: 'circle', label: 'Círculo', icon: '⚪' },
  { value: 'rounded_square', label: 'Redondeado', icon: '🔲' },
] as const;

// Type exports for TypeScript
export type QRGradientType = typeof QR_V3_GRADIENTS[number]['value'];
export type QREyeShape = typeof QR_V3_EYE_SHAPES[number]['value'];
export type QREyeBorderStyle = typeof QR_V3_EYE_BORDER_STYLES[number]['value'];
export type QREyeCenterStyle = typeof QR_V3_EYE_CENTER_STYLES[number]['value'];
export type QRDataPattern = typeof QR_V3_DATA_PATTERNS[number]['value'];
export type QREffect = typeof QR_V3_EFFECTS[number]['value'];
export type QRFrameStyle = typeof QR_V3_FRAME_STYLES[number]['value'];
export type QRLogoShape = typeof QR_V3_LOGO_SHAPES[number]['value'];

// Validation helpers
export const isValidGradientType = (type: string): type is QRGradientType => {
  return QR_V3_GRADIENTS.some(g => g.value === type);
};

export const isValidEyeShape = (shape: string): shape is QREyeShape => {
  return QR_V3_EYE_SHAPES.some(s => s.value === shape);
};

export const isValidEyeBorderStyle = (style: string): style is QREyeBorderStyle => {
  return QR_V3_EYE_BORDER_STYLES.some(s => s.value === style);
};

export const isValidEyeCenterStyle = (style: string): style is QREyeCenterStyle => {
  return QR_V3_EYE_CENTER_STYLES.some(s => s.value === style);
};

export const isValidDataPattern = (pattern: string): pattern is QRDataPattern => {
  return QR_V3_DATA_PATTERNS.some(p => p.value === pattern);
};

export const isValidEffect = (effect: string): effect is QREffect => {
  return QR_V3_EFFECTS.some(e => e.value === effect);
};

export const isValidFrameStyle = (style: string): style is QRFrameStyle => {
  return QR_V3_FRAME_STYLES.some(f => f.value === style);
};

export const isValidLogoShape = (shape: string): shape is QRLogoShape => {
  return QR_V3_LOGO_SHAPES.some(l => l.value === shape);
};