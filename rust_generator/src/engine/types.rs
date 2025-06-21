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

/// Salida estructurada para QR v3 (ULTRATHINK)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QrStructuredOutput {
    /// Path data SVG (atributo 'd')
    pub path_data: String,
    /// Tamaño total incluyendo quiet zone
    pub total_modules: u32,
    /// Tamaño de datos sin quiet zone
    pub data_modules: u32,
    /// Versión QR (1-40)
    pub version: u8,
    /// Nivel de corrección de errores
    pub error_correction: String,
    /// Metadata adicional
    pub metadata: QrStructuredMetadata,
}

/// Metadata para salida estructurada
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QrStructuredMetadata {
    /// Tiempo de generación en ms
    pub generation_time_ms: u64,
    /// Tamaño de quiet zone aplicado
    pub quiet_zone: u32,
    /// Hash del contenido para cache
    pub content_hash: String,
    /// Total de módulos del QR (incluyendo quiet zone)
    pub total_modules: u32,
    /// Módulos de datos del QR (sin quiet zone)
    pub data_modules: u32,
    /// Versión del QR code
    pub version: u32,
    /// Nivel de corrección de errores
    pub error_correction: String,
}

// ==================== V3 ENHANCED STRUCTURES ====================
// Nuevas estructuras para arquitectura Enhanced Intermediate

/// Salida estructurada Enhanced para QR v3
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QrEnhancedOutput {
    /// Paths separados para personalización granular
    pub paths: QrPaths,
    /// Estilos aplicables a cada path
    pub styles: QrStyles,
    /// Definiciones reutilizables (gradientes, filtros)
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub definitions: Vec<QrDefinition>,
    /// Overlays opcionales (logo, frame)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub overlays: Option<QrOverlays>,
    /// Metadata de generación
    pub metadata: QrStructuredMetadata,
}

/// Paths separados del QR
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QrPaths {
    /// Path principal de datos
    pub data: String,
    /// Paths de los ojos (esquinas)
    pub eyes: Vec<QrEyePath>,
}

/// Path individual de un ojo
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QrEyePath {
    /// Tipo de ojo (top_left, top_right, bottom_left)
    #[serde(rename = "type")]
    pub eye_type: String,
    /// Path data SVG
    pub path: String,
    /// Forma usada (para metadata)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub shape: Option<String>,
}

/// Estilos aplicables a paths
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QrStyles {
    /// Estilo para datos
    pub data: QrStyleConfig,
    /// Estilo para ojos
    pub eyes: QrStyleConfig,
}

/// Configuración de estilo para un elemento
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QrStyleConfig {
    /// Fill (color sólido o referencia a gradiente)
    pub fill: String,
    /// Efectos aplicados
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub effects: Vec<String>,
    /// Shape hint (para ojos)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub shape: Option<String>,
    /// Stroke configuration
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stroke: Option<StrokeStyle>,
}

/// Definición reutilizable (gradiente o efecto)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum QrDefinition {
    #[serde(rename = "gradient")]
    Gradient(QrGradientDef),
    #[serde(rename = "effect")]
    Effect(QrEffectDef),
}

/// Definición de gradiente
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QrGradientDef {
    /// ID único para referencia
    pub id: String,
    /// Tipo de gradiente
    #[serde(rename = "gradient_type")]
    pub gradient_type: String,
    /// Colores (máximo 5)
    pub colors: Vec<String>,
    /// Ángulo (para linear)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub angle: Option<f32>,
    /// Coordenadas (para radial)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub coords: Option<GradientCoords>,
}

/// Coordenadas para gradientes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GradientCoords {
    pub x1: f32,
    pub y1: f32,
    pub x2: f32,
    pub y2: f32,
}

/// Definición de efecto
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QrEffectDef {
    /// ID único para referencia
    pub id: String,
    /// Tipo de efecto
    pub effect_type: String,
    /// Parámetros del efecto
    #[serde(flatten)]
    pub params: serde_json::Value,
}

/// Overlays del QR
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QrOverlays {
    /// Logo opcional
    #[serde(skip_serializing_if = "Option::is_none")]
    pub logo: Option<QrLogo>,
    /// Frame opcional
    #[serde(skip_serializing_if = "Option::is_none")]
    pub frame: Option<QrFrame>,
}

/// Configuración de logo
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QrLogo {
    /// URL o base64 de la imagen
    pub src: String,
    /// Tamaño relativo (0.1 a 0.3)
    pub size: f32,
    /// Forma del contenedor
    pub shape: String,
    /// Padding en módulos
    pub padding: u32,
    /// Posición x
    pub x: f32,
    /// Posición y
    pub y: f32,
}

/// Configuración de frame
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QrFrame {
    /// Estilo del frame
    pub style: String,
    /// Path del frame
    pub path: String,
    /// Estilo de relleno
    pub fill_style: QrStyleConfig,
    /// Texto opcional
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text: Option<QrFrameText>,
}

/// Texto del frame
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QrFrameText {
    /// Contenido del texto
    pub content: String,
    /// Posición x
    pub x: f32,
    /// Posición y
    pub y: f32,
    /// Familia de fuente
    pub font_family: String,
    /// Tamaño de fuente
    pub font_size: f32,
    /// Anclaje del texto
    pub text_anchor: String,
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