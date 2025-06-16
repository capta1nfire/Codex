// engine/types.rs - Tipos principales del motor QR

use serde::{Deserialize, Serialize};
use image::DynamicImage;

/// Solicitud principal de generación QR
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QrRequest {
    /// Datos a codificar
    pub data: String,
    
    /// Tamaño en píxeles
    pub size: u32,
    
    /// Formato de salida deseado
    pub format: OutputFormat,
    
    /// Opciones de personalización
    pub customization: Option<QrCustomization>,
}

/// Opciones de personalización
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QrCustomization {
    /// Forma de los ojos
    pub eye_shape: Option<EyeShape>,
    
    /// Patrón de datos
    pub data_pattern: Option<DataPattern>,
    
    /// Colores
    pub colors: Option<ColorOptions>,
    
    /// Gradiente
    pub gradient: Option<GradientOptions>,
    
    /// Logo
    pub logo: Option<LogoOptions>,
    
    /// Marco
    pub frame: Option<FrameOptions>,
    
    /// Efectos especiales con configuración
    pub effects: Option<Vec<EffectOptions>>,
    
    /// Nivel de corrección de errores
    pub error_correction: Option<ErrorCorrectionLevel>,
}

/// Formas de ojos disponibles
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum EyeShape {
    // Básicas
    Square,
    RoundedSquare,
    Circle,
    
    // Intermedias
    Dot,
    Leaf,
    BarsHorizontal,
    BarsVertical,
    
    // Avanzadas
    Star,
    Diamond,
    Cross,
    Hexagon,
    
    // Premium
    Heart,
    Shield,
    Crystal,
    Flower,
    Arrow,
}

/// Patrones de datos
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum DataPattern {
    // Estándar
    Square,
    Dots,
    
    // Creativos
    Rounded,
    Vertical,
    Horizontal,
    Diamond,
    
    // Artísticos
    Circular,
    Star,
    Cross,
    Random,
    Wave,
    Mosaic,
}

/// Opciones de color
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ColorOptions {
    pub foreground: String,  // Hex color
    pub background: String,  // Hex color
}

/// Opciones de gradiente
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GradientOptions {
    pub enabled: bool,
    pub gradient_type: GradientType,
    pub colors: Vec<String>,  // Hex colors
    pub angle: Option<f32>,   // Para linear
    pub apply_to_eyes: bool,
    pub apply_to_data: bool,
    pub stroke_style: Option<StrokeStyle>,
}

/// Estilo de borde para gradientes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StrokeStyle {
    pub enabled: bool,
    pub color: Option<String>,
    pub width: Option<f32>,
    pub opacity: Option<f32>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum GradientType {
    Linear,
    Radial,
    Conic,
    Diamond,
    Spiral,
}

/// Opciones de logo
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogoOptions {
    pub data: String,  // Base64 o URL
    pub size_percentage: f32,  // 10-30%
    pub padding: u32,
    pub background: Option<String>,  // Hex color
    pub shape: LogoShape,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum LogoShape {
    Square,
    Circle,
    RoundedSquare,
}

/// Opciones de marco
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameOptions {
    pub frame_type: FrameType,
    pub text: Option<String>,
    pub color: String,  // Hex color
    pub text_position: TextPosition,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum FrameType {
    Simple,
    Rounded,
    Bubble,
    Speech,
    Badge,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum TextPosition {
    Top,
    Bottom,
    Left,
    Right,
}

/// Efectos especiales
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum Effect {
    Shadow,
    Glow,
    Blur,
    Noise,
    Vintage,
}

/// Opciones de efectos con configuración
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EffectOptions {
    /// Tipo de efecto
    pub effect_type: Effect,
    
    /// Configuración del efecto
    #[serde(flatten)]
    pub config: EffectConfiguration,
}

/// Configuración específica por tipo de efecto
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum EffectConfiguration {
    Shadow {
        offset_x: Option<f64>,
        offset_y: Option<f64>,
        blur_radius: Option<f64>,
        color: Option<String>,
        opacity: Option<f64>,
    },
    Glow {
        intensity: Option<f64>,
        color: Option<String>,
    },
    Blur {
        radius: Option<f64>,
    },
    Noise {
        intensity: Option<f64>,
    },
    Vintage {
        sepia_intensity: Option<f64>,
        vignette_intensity: Option<f64>,
    },
}

/// Nivel de corrección de errores
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
pub enum ErrorCorrectionLevel {
    Low,     // 7%
    Medium,  // 15%
    Quartile,// 25%
    High,    // 30%
}

/// Formato de salida
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum OutputFormat {
    Svg,
    Png,
    Jpeg,
    Webp,
    Eps,
    Pdf,
}

/// Resultado de generación
#[derive(Debug, Clone, Serialize)]
pub struct QrOutput {
    pub data: String,  // SVG string o base64 para imágenes
    pub format: OutputFormat,
    pub metadata: QrMetadata,
}

/// Metadatos del QR generado
#[derive(Debug, Clone, Serialize)]
pub struct QrMetadata {
    pub generation_time_ms: u64,
    pub complexity_level: ComplexityLevel,
    pub features_used: Vec<String>,
    pub quality_score: f32,  // 0.0 - 1.0
}

/// Nivel de complejidad
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum ComplexityLevel {
    Basic,
    Medium,
    Advanced,
    Ultra,
}

/// Código QR interno
#[derive(Debug)]
pub struct QrCode {
    pub matrix: Vec<Vec<bool>>,
    pub size: usize,
    pub quiet_zone: usize,
    pub customization: Option<QrCustomization>,
}

// La implementación de to_svg está en generator.rs

/// Assets pre-procesados para generación avanzada
#[derive(Default)]
pub struct AdvancedAssets {
    pub logo: Option<DynamicImage>,
    pub gradient_data: Option<GradientData>,
}

/// Datos pre-computados de gradiente
pub struct GradientData {
    pub colors: Vec<[u8; 4]>,  // RGBA
    pub stops: Vec<f32>,
    pub gradient_type: GradientType,
}

/// Color RGBA
#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct Color {
    pub r: u8,
    pub g: u8,
    pub b: u8,
    pub a: u8,
}

/// Modo de color
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ColorMode {
    Solid,
    Gradient,
    Pattern,
}

/// Gradiente
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Gradient {
    pub id: String,
    pub start_color: Color,
    pub end_color: Color,
    pub gradient_type: String,
    pub svg_definition: String,
    pub fill_reference: String,
}

/// Resultado de validación
#[derive(Debug, Clone, Serialize)]
pub struct ValidationResult {
    pub score: f32,  // 0.0 - 1.0
    pub scan_success: bool,
    pub issues: Vec<ValidationIssue>,
    pub recommendations: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ValidationIssue {
    pub severity: IssueSeverity,
    pub message: String,
}

#[derive(Debug, Clone, Copy, Serialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum IssueSeverity {
    Info,
    Warning,
    Error,
    Critical,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_serialization() {
        let request = QrRequest {
            data: "test".to_string(),
            size: 400,
            format: OutputFormat::Svg,
            customization: Some(QrCustomization {
                eye_shape: Some(EyeShape::RoundedSquare),
                data_pattern: Some(DataPattern::Dots),
                colors: Some(ColorOptions {
                    foreground: "#000000".to_string(),
                    background: "#FFFFFF".to_string(),
                }),
                gradient: None,
                logo: None,
                frame: None,
                effects: None,
                error_correction: Some(ErrorCorrectionLevel::Medium),
            }),
        };
        
        let json = serde_json::to_string(&request).unwrap();
        let _decoded: QrRequest = serde_json::from_str(&json).unwrap();
    }
}