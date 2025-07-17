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

/// Tamaño fijo para QR codes
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum QrSize {
    /// Pequeño: Version 1-5 (21x21 a 37x37 módulos)
    Small,
    /// Mediano: Version 6-10 (41x41 a 57x57 módulos)
    Medium,
    /// Grande: Version 11-15 (61x61 a 77x77 módulos)
    Large,
    /// Extra grande: Version 16-25 (81x81 a 117x117 módulos)
    ExtraLarge,
    /// Automático: El tamaño mínimo necesario
    Auto,
}

impl QrSize {
    /// Obtiene el rango de versiones para este tamaño
    pub fn version_range(&self) -> (i16, i16) {
        match self {
            QrSize::Small => (1, 5),
            QrSize::Medium => (6, 10),
            QrSize::Large => (11, 15),
            QrSize::ExtraLarge => (16, 25),
            QrSize::Auto => (1, 40),
        }
    }
    
    /// Obtiene la versión objetivo para este tamaño
    pub fn target_version(&self) -> Option<i16> {
        match self {
            QrSize::Small => Some(3),      // Version 3 (29x29) como objetivo
            QrSize::Medium => Some(8),      // Version 8 (49x49) como objetivo
            QrSize::Large => Some(13),      // Version 13 (69x69) como objetivo
            QrSize::ExtraLarge => Some(20), // Version 20 (97x97) como objetivo
            QrSize::Auto => None,
        }
    }
}

/// Opciones de personalización
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QrCustomization {
    /// Forma de los ojos (LEGACY - usar eye_border_style y eye_center_style)
    pub eye_shape: Option<EyeShape>,
    
    /// Estilo del borde de los ojos (nuevo)
    pub eye_border_style: Option<EyeBorderStyle>,
    
    /// Estilo del centro de los ojos (nuevo)
    pub eye_center_style: Option<EyeCenterStyle>,
    
    /// Patrón de datos
    pub data_pattern: Option<DataPattern>,
    
    /// Colores
    pub colors: Option<ColorOptions>,
    
    /// Gradiente
    pub gradient: Option<GradientOptions>,
    
    /// Gradiente específico para bordes de ojos
    pub eye_border_gradient: Option<GradientOptions>,
    
    /// Gradiente específico para centros de ojos
    pub eye_center_gradient: Option<GradientOptions>,
    
    /// Logo
    pub logo: Option<LogoOptions>,
    
    /// Marco
    pub frame: Option<FrameOptions>,
    
    /// Efectos especiales con configuración (LEGACY - mantener para compatibilidad)
    pub effects: Option<Vec<EffectOptions>>,
    
    /// Efectos selectivos por componente (Fase 2.2)
    pub selective_effects: Option<SelectiveEffects>,
    
    /// Nivel de corrección de errores
    pub error_correction: Option<ErrorCorrectionLevel>,
    
    /// Ratio del tamaño del logo (0.0 - 0.3)
    pub logo_size_ratio: Option<f32>,
    
    /// Tamaño fijo del QR (para batch uniforme)
    pub fixed_size: Option<QrSize>,
}

/// Formas de ojos disponibles (LEGACY - mantener para compatibilidad)
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

/// Estilos de borde para los ojos (marco exterior)
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum EyeBorderStyle {
    Square,           // Cuadrado básico
    RoundedSquare,    // Cuadrado con esquinas redondeadas
    Circle,           // Círculo
    QuarterRound,     // Esquina redondeada (quarter circle)
    CutCorner,        // Esquina cortada (cut corner)
    ThickBorder,      // Marco grueso
    DoubleBorder,     // Marco doble
    Diamond,          // Diamante (como marco)
    Hexagon,          // Hexágono (como marco)
    Cross,            // Cruz (como marco)
    // Mantenemos algunos ornamentales para compatibilidad hacia atrás
    Star,             // Estrella (mejor como center)
    Leaf,             // Forma de hoja (decorativo)
    Arrow,            // Flecha (decorativo)
    
    // Nuevas formas orgánicas (Fase 2.1)
    Teardrop,         // Gota de agua asimétrica
    Wave,             // Bordes ondulados como agua
    Petal,            // Pétalo de flor suave
    Crystal,          // Cristal facetado suave
    Flame,            // Llama estilizada
    Organic,          // Forma orgánica aleatoria
    
    // Propuestas temporales
    Propuesta01,      // Marco con esquinas asimétricamente redondeadas
}

/// Estilos de centro para los ojos (punto interior)
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum EyeCenterStyle {
    Square,           // Cuadrado
    RoundedSquare,    // Cuadrado redondeado
    Circle,           // Círculo
    Squircle,         // Squircle (cuadrado con esquinas redondeadas)
    Dot,              // Punto pequeño
    Star,             // Estrella
    Diamond,          // Diamante
    Cross,            // Cruz
    Plus,             // Símbolo más
}

/// Patrones de datos
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum DataPattern {
    // Estándar
    Square,
    SquareSmall,
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
    /// Colores específicos para los ojos (opcional)
    pub eye_colors: Option<EyeColors>,
}

/// Colores independientes para ojos
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EyeColors {
    /// Color del borde exterior de los ojos
    pub outer: Option<String>,  // Hex color
    /// Color del centro interior de los ojos
    pub inner: Option<String>,  // Hex color
    /// Gradiente para borde exterior (si se usa en lugar de color sólido)
    pub outer_gradient: Option<GradientOptions>,
    /// Gradiente para centro interior (si se usa en lugar de color sólido)
    pub inner_gradient: Option<GradientOptions>,
    /// Aplicar colores diferentes a cada ojo
    pub per_eye: Option<PerEyeColors>,
}

/// Colores por cada ojo individual
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerEyeColors {
    /// Ojo superior izquierdo
    pub top_left: Option<EyeColorPair>,
    /// Ojo superior derecho
    pub top_right: Option<EyeColorPair>,
    /// Ojo inferior izquierdo
    pub bottom_left: Option<EyeColorPair>,
}

/// Par de colores para un ojo específico
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EyeColorPair {
    /// Color del borde exterior
    pub outer: String,  // Hex color
    /// Color del centro interior
    pub inner: String,  // Hex color
}

/// Opciones de gradiente
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GradientOptions {
    pub enabled: bool,
    pub gradient_type: GradientType,
    pub colors: Vec<String>,  // Hex colors
    pub angle: Option<f32>,   // Para linear
    #[serde(default)]
    pub apply_to_eyes: bool,
    #[serde(default)]
    pub apply_to_data: bool,
    #[serde(default)]
    pub per_module: bool,
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
    // Nuevos efectos para Fase 2.2
    Distort,
    Emboss,
    Outline,
    DropShadow,
    InnerShadow,
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
    // Nuevos efectos Fase 2.2
    Distort {
        strength: Option<f64>,
        frequency: Option<f64>,
        direction: Option<String>, // "horizontal", "vertical", "radial"
    },
    Emboss {
        height: Option<f64>,
        direction: Option<f64>, // ángulo en grados
        strength: Option<f64>,
    },
    Outline {
        width: Option<f64>,
        color: Option<String>,
        opacity: Option<f64>,
    },
    DropShadow {
        offset_x: Option<f64>,
        offset_y: Option<f64>,
        blur_radius: Option<f64>,
        spread_radius: Option<f64>,
        color: Option<String>,
        opacity: Option<f64>,
    },
    InnerShadow {
        offset_x: Option<f64>,
        offset_y: Option<f64>,
        blur_radius: Option<f64>,
        color: Option<String>,
        opacity: Option<f64>,
    },
}

// ==================== SELECTIVE EFFECTS SYSTEM (FASE 2.2) ====================

/// Sistema de efectos selectivos por componente
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SelectiveEffects {
    /// Efectos aplicados solo a los ojos
    pub eyes: Option<ComponentEffects>,
    
    /// Efectos aplicados solo a los datos
    pub data: Option<ComponentEffects>,
    
    /// Efectos aplicados solo al marco (si existe)
    pub frame: Option<ComponentEffects>,
    
    /// Efectos aplicados al QR completo
    pub global: Option<ComponentEffects>,
}

/// Efectos para un componente específico
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComponentEffects {
    /// Lista de efectos a aplicar
    pub effects: Vec<EffectOptions>,
    
    /// Modo de combinación de efectos
    pub blend_mode: Option<BlendMode>,
    
    /// Prioridad de renderizado (mayor número = se aplica después)
    pub render_priority: Option<u8>,
    
    /// Si los efectos se aplican solo al borde o también al relleno
    pub apply_to_fill: Option<bool>,
    
    /// Si los efectos se aplican solo al relleno o también al borde
    pub apply_to_stroke: Option<bool>,
}

/// Modos de combinación para efectos múltiples
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum BlendMode {
    Normal,
    Multiply,
    Screen,
    Overlay,
    SoftLight,
    HardLight,
    ColorDodge,
    ColorBurn,
    Darken,
    Lighten,
    Difference,
    Exclusion,
}

/// Tipos de componentes para aplicación selectiva
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ComponentType {
    Eyes,
    EyeBorders,
    EyeCenters,
    Data,
    Frame,
    Logo,
    Global,
}

/// Configuración avanzada de efectos con validación de compatibilidad
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdvancedEffectConfig {
    /// Efectos base
    pub base_effects: Vec<EffectOptions>,
    
    /// Reglas de compatibilidad
    pub compatibility_rules: Option<CompatibilityRules>,
    
    /// Configuración de performance
    pub performance_config: Option<PerformanceConfig>,
}

/// Reglas de compatibilidad entre efectos
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompatibilityRules {
    /// Efectos que no pueden combinarse
    pub incompatible_combinations: Vec<Vec<Effect>>,
    
    /// Efectos que requieren otros efectos
    pub required_dependencies: Vec<(Effect, Vec<Effect>)>,
    
    /// Límite máximo de efectos simultáneos
    pub max_concurrent_effects: Option<u8>,
    
    /// Validación de intensidad automática
    pub auto_intensity_validation: Option<bool>,
}

/// Configuración de performance para efectos
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceConfig {
    /// Límite de tiempo de renderizado en ms
    pub max_render_time_ms: Option<u32>,
    
    /// Usar cache para efectos complejos
    pub use_effect_cache: Option<bool>,
    
    /// Optimizar para escaneabilidad sobre efectos visuales
    pub prioritize_scanability: Option<bool>,
    
    /// Degradar efectos automáticamente si impactan performance
    pub auto_degrade_effects: Option<bool>,
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
    pub logo_zone: Option<crate::engine::geometry::LogoExclusionZone>,
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

/// Información sobre boost ECL aplicado
#[derive(Debug, Clone, Serialize)]
pub struct BoostInfo {
    /// ECL original solicitado
    pub original_ecl: ErrorCorrectionLevel,
    /// ECL final después del boost
    pub final_ecl: ErrorCorrectionLevel,
    /// Si se aplicó boost
    pub boost_applied: bool,
    /// Versión del QR generado
    pub version: i16,
    /// Número total de módulos
    pub modules_count: i32,
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

/// Salida estructurada para QR v3
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
    /// Zonas intocables (solo cuando hay logo)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub untouchable_zones: Option<Vec<UntouchableZoneInfo>>,
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
    /// Información de exclusión de logo (si aplica)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub exclusion_info: Option<ExclusionInfo>,
}

/// Información sobre la zona de exclusión del logo
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExclusionInfo {
    /// Número de módulos excluidos
    pub excluded_modules: usize,
    /// Número de codewords afectados
    pub affected_codewords: usize,
    /// Porcentaje de oclusión
    pub occlusion_percentage: f32,
    /// ECL seleccionado dinámicamente
    pub selected_ecl: String,
    /// Si se usó override de ECL
    pub ecl_override: bool,
}

/// Información sobre una zona intocable
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UntouchableZoneInfo {
    /// Tipo de zona
    pub zone_type: String,
    /// Coordenada X inicial
    pub x: u16,
    /// Coordenada Y inicial
    pub y: u16,
    /// Ancho de la zona
    pub width: u16,
    /// Alto de la zona
    pub height: u16,
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
    /// Path principal de datos (para patrones continuos)
    #[serde(skip_serializing_if = "String::is_empty")]
    pub data: String,
    /// Módulos individuales de datos (para gradiente por módulo)
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub data_modules: Vec<QrDataModule>,
    /// Paths de los ojos (esquinas)
    pub eyes: Vec<QrEyePath>,
}

/// Módulo individual de datos para gradiente por módulo
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QrDataModule {
    /// Posición X del módulo
    pub x: u32,
    /// Posición Y del módulo
    pub y: u32,
    /// Path SVG del módulo
    pub path: String,
}

/// Path individual de un ojo
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QrEyePath {
    /// Tipo de ojo (top_left, top_right, bottom_left)
    #[serde(rename = "type")]
    pub eye_type: String,
    /// Path data SVG (legacy - para compatibilidad hacia atrás)
    #[serde(skip_serializing_if = "String::is_empty")]
    pub path: String,
    /// Path data SVG del borde (marco exterior)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub border_path: Option<String>,
    /// Path data SVG del centro (punto interior)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub center_path: Option<String>,
    /// Forma usada (para metadata legacy)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub shape: Option<String>,
    /// Forma del borde usada (para metadata)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub border_shape: Option<String>,
    /// Forma del centro usada (para metadata)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub center_shape: Option<String>,
    /// Color del borde (si es diferente al global)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub border_color: Option<String>,
    /// Color del centro (si es diferente al global)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub center_color: Option<String>,
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
    /// Si es verdadero, el gradiente se aplica por módulo
    #[serde(skip_serializing_if = "Option::is_none")]
    pub per_module: Option<bool>,
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
                eye_border_style: None,
                eye_center_style: None,
                data_pattern: Some(DataPattern::Dots),
                colors: Some(ColorOptions {
                    foreground: "#000000".to_string(),
                    background: "#FFFFFF".to_string(),
                    eye_colors: None,
                }),
                gradient: None,
                logo: None,
                frame: None,
                effects: None,
                error_correction: Some(ErrorCorrectionLevel::Medium),
                logo_size_ratio: None,
                selective_effects: None,
            }),
        };
        
        let json = serde_json::to_string(&request).unwrap();
        let _decoded: QrRequest = serde_json::from_str(&json).unwrap();
    }
}