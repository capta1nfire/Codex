/**
 * Eye Style SVG Paths
 * 
 * Actual SVG path data for QR eye styles to display as visual previews
 * These are simplified representations for UI display purposes
 */

// Eye Border Styles (7x7 frames)
export const EYE_BORDER_SVG_PATHS = {
  square: "M0,0 L7,0 L7,7 L0,7 Z M1,1 L1,6 L6,6 L6,1 Z",
  rounded_square: "M1,0 Q0,0 0,1 L0,6 Q0,7 1,7 L6,7 Q7,7 7,6 L7,1 Q7,0 6,0 Z M2,1 Q1,1 1,2 L1,5 Q1,6 2,6 L5,6 Q6,6 6,5 L6,2 Q6,1 5,1 Z",
  circle: "M3.5,0 A3.5,3.5 0 1,1 3.5,7 A3.5,3.5 0 1,1 3.5,0 Z M3.5,1 A2.5,2.5 0 1,0 3.5,6 A2.5,2.5 0 1,0 3.5,1 Z",
  diamond: "M3.5,0 L7,3.5 L3.5,7 L0,3.5 Z M3.5,1.5 L1.5,3.5 L3.5,5.5 L5.5,3.5 Z",
  hexagon: "M2,0 L5,0 L7,3.5 L5,7 L2,7 L0,3.5 Z M2.5,1 L1,3.5 L2.5,6 L4.5,6 L6,3.5 L4.5,1 Z",
  cross: "M2,0 L5,0 L5,2 L7,2 L7,5 L5,5 L5,7 L2,7 L2,5 L0,5 L0,2 L2,2 Z M3,1 L3,3 L1,3 L1,4 L3,4 L3,6 L4,6 L4,4 L6,4 L6,3 L4,3 L4,1 Z",
  star: "M3.5,0 L4.3,2.2 L6.7,2.2 L4.9,3.7 L5.6,5.9 L3.5,4.4 L1.4,5.9 L2.1,3.7 L0.3,2.2 L2.7,2.2 Z",
  quarter_round: "M2,0 Q0,0 0,2 L0,5 Q0,7 2,7 L5,7 Q7,7 7,5 L7,2 Q7,0 5,0 Z M2,1 Q1,1 1,2 L1,5 Q1,6 2,6 L5,6 Q6,6 6,5 L6,2 Q6,1 5,1 Z",
  cut_corner: "M1,0 L7,0 L7,6 L6,7 L0,7 L0,1 Z M1,1 L1,6 L5.5,6 L6,5.5 L6,1 Z",
  thick_border: "M0,0 L7,0 L7,7 L0,7 Z M2,2 L2,5 L5,5 L5,2 Z",
  double_border: "M0,0 L7,0 L7,7 L0,7 Z M0.5,0.5 L0.5,6.5 L6.5,6.5 L6.5,0.5 Z M1.5,1.5 L1.5,5.5 L5.5,5.5 L5.5,1.5 Z M2,2 L2,5 L5,5 L5,2 Z",
  leaf: "M3.5,0 Q0,0 0,3.5 Q0,7 3.5,7 Q7,7 7,3.5 Q7,0 3.5,0 Z M3.5,1 Q1,1 1,3.5 Q1,6 3.5,6 Q6,6 6,3.5 Q6,1 3.5,1 Z",
  arrow: "M3.5,0 L7,3.5 L5.5,3.5 L5.5,7 L1.5,7 L1.5,3.5 L0,3.5 Z M3.5,1.5 L2,3 L2.5,3 L2.5,6 L4.5,6 L4.5,3 L5,3 Z",
  // Organic shapes
  teardrop: "M3.5,0 Q0,0 0,3 Q0,7 3.5,7 Q7,7 7,3 Q7,0 3.5,0 Z M3.5,1 Q1,1 1,3 Q1,6 3.5,6 Q6,6 6,3 Q6,1 3.5,1 Z",
  wave: "M0,2 Q1.75,0 3.5,2 Q5.25,4 7,2 L7,5 Q5.25,7 3.5,5 Q1.75,3 0,5 Z M0.5,3 Q1.75,1.5 3.5,3 Q5.25,4.5 6.5,3 L6.5,4 Q5.25,5.5 3.5,4 Q1.75,2.5 0.5,4 Z",
  petal: "M3.5,0 Q0,1 0,3.5 Q0,6 3.5,7 Q7,6 7,3.5 Q7,1 3.5,0 Z M3.5,1 Q1,2 1,3.5 Q1,5 3.5,6 Q6,5 6,3.5 Q6,2 3.5,1 Z",
  crystal: "M3.5,0 L5.5,1.5 L7,3.5 L5.5,5.5 L3.5,7 L1.5,5.5 L0,3.5 L1.5,1.5 Z M3.5,1.5 L2,2.5 L1,3.5 L2,4.5 L3.5,5.5 L5,4.5 L6,3.5 L5,2.5 Z",
  flame: "M3.5,0 Q2,1 2,3 Q0,4 0,5.5 Q0,7 3.5,7 Q7,7 7,5.5 Q7,4 5,3 Q5,1 3.5,0 Z M3.5,1.5 Q2.5,2 2.5,3.5 Q1,4.5 1,5.5 Q1,6 3.5,6 Q6,6 6,5.5 Q6,4.5 4.5,3.5 Q4.5,2 3.5,1.5 Z",
  organic: "M3.5,0 Q1,0 0,2 Q0,3 1,4 Q0,5 0,6 Q1,7 3.5,7 Q6,7 7,6 Q7,5 6,4 Q7,3 7,2 Q6,0 3.5,0 Z",
  propuesta01: "M0,1 L1,0 L6,0 L7,1 L7,6 L6,7 L1,7 L0,6 Z M1,2 L2,1 L5,1 L6,2 L6,5 L5,6 L2,6 L1,5 Z"
} as const;

// Eye Center Styles (3x3 centers)
export const EYE_CENTER_SVG_PATHS = {
  square: "M0,0 L3,0 L3,3 L0,3 Z",
  rounded_square: "M0.5,0 Q0,0 0,0.5 L0,2.5 Q0,3 0.5,3 L2.5,3 Q3,3 3,2.5 L3,0.5 Q3,0 2.5,0 Z",
  circle: "M1.5,0 A1.5,1.5 0 1,1 1.5,3 A1.5,1.5 0 1,1 1.5,0 Z",
  dot: "M1.5,0.75 A0.75,0.75 0 1,1 1.5,2.25 A0.75,0.75 0 1,1 1.5,0.75 Z",
  star: "M1.5,0 L2,1 L3,1.2 L2.2,2 L2.4,3 L1.5,2.5 L0.6,3 L0.8,2 L0,1.2 L1,1 Z",
  diamond: "M1.5,0 L3,1.5 L1.5,3 L0,1.5 Z",
  cross: "M1,0 L2,0 L2,1 L3,1 L3,2 L2,2 L2,3 L1,3 L1,2 L0,2 L0,1 L1,1 Z",
  plus: "M1.2,0 L1.8,0 L1.8,1.2 L3,1.2 L3,1.8 L1.8,1.8 L1.8,3 L1.2,3 L1.2,1.8 L0,1.8 L0,1.2 L1.2,1.2 Z",
  squircle: "M0.8,0 Q0,0 0,0.8 L0,2.2 Q0,3 0.8,3 L2.2,3 Q3,3 3,2.2 L3,0.8 Q3,0 2.2,0 Z"
} as const;

// Data Pattern Styles (showing a single module - maximized within viewBox)
export const DATA_PATTERN_SVG_PATHS = {
  square: "M0.1,0.1 L2.9,0.1 L2.9,2.9 L0.1,2.9 Z",
  square_small: "M0.5,0.5 L2.5,0.5 L2.5,2.5 L0.5,2.5 Z",
  dots: "M1.5,1.5 m-1.3,0 a1.3,1.3 0 1,0 2.6,0 a1.3,1.3 0 1,0 -2.6,0",
  rounded: "M0.5,0.1 Q0.1,0.1 0.1,0.5 L0.1,2.5 Q0.1,2.9 0.5,2.9 L2.5,2.9 Q2.9,2.9 2.9,2.5 L2.9,0.5 Q2.9,0.1 2.5,0.1 Z",
  squircle: "M0.8,0.1 Q0.1,0.1 0.1,0.8 L0.1,2.2 Q0.1,2.9 0.8,2.9 L2.2,2.9 Q2.9,2.9 2.9,2.2 L2.9,0.8 Q2.9,0.1 2.2,0.1 Z",
  vertical: "M1.0,0.1 L2.0,0.1 L2.0,2.9 L1.0,2.9 Z",
  horizontal: "M0.1,1.0 L2.9,1.0 L2.9,2.0 L0.1,2.0 Z",
  diamond: "M1.5,0.1 L2.9,1.5 L1.5,2.9 L0.1,1.5 Z",
  circular: "M1.5,0.2 A1.3,1.3 0 1,1 1.5,2.8 A1.3,1.3 0 1,1 1.5,0.2 Z",
  star: "M1.5,0.1 L1.9,0.9 L2.8,1.0 L2.1,1.7 L2.4,2.6 L1.5,2.1 L0.6,2.6 L0.9,1.7 L0.2,1.0 L1.1,0.9 Z",
  cross: "M1.0,0.1 L2.0,0.1 L2.0,1.0 L2.9,1.0 L2.9,2.0 L2.0,2.0 L2.0,2.9 L1.0,2.9 L1.0,2.0 L0.1,2.0 L0.1,1.0 L1.0,1.0 Z",
  random: "M0.2,0.4 L0.9,0.4 L0.9,1.1 L0.2,1.1 Z M1.8,1.3 L2.5,1.3 L2.5,2.0 L1.8,2.0 Z M0.6,2.1 L1.3,2.1 L1.3,2.8 L0.6,2.8 Z",
  wave: "M0,1.5 Q0.75,0.2 1.5,1.5 Q2.25,2.8 3,1.5 L3,2.3 Q2.25,3.5 1.5,2.3 Q0.75,1 0,2.3 Z",
  mosaic: "M0.1,0.1 L1.4,0.1 L1.4,1.4 L0.1,1.4 Z M1.6,1.6 L2.9,1.6 L2.9,2.9 L1.6,2.9 Z"
} as const;

// Helper function to create a full SVG element
export function createEyeStyleSvg(path: string, size: number = 40): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 7 7" xmlns="http://www.w3.org/2000/svg">
    <path d="${path}" fill="currentColor" fill-rule="evenodd"/>
  </svg>`;
}

export function createEyeCenterSvg(path: string, size: number = 40): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 3 3" xmlns="http://www.w3.org/2000/svg">
    <path d="${path}" fill="currentColor" fill-rule="evenodd"/>
  </svg>`;
}

export function createDataPatternSvg(path: string, size: number = 40): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 3 3" xmlns="http://www.w3.org/2000/svg">
    <path d="${path}" fill="currentColor" fill-rule="evenodd"/>
  </svg>`;
}