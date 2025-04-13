// validators.rs - Nuevo archivo para el sistema de validación

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ----------------- 1. Estructuras de Datos -----------------

// Estructura completa de la petición que recibiremos
#[derive(Deserialize, Debug)]
pub struct BarcodeRequest {
    pub barcode_type: String,
    pub data: String,
    #[serde(default)]
    pub options: Option<BarcodeRequestOptions>,
}

// Opciones extendidas para soportar más parámetros específicos por tipo
#[derive(Debug, serde::Deserialize, Default)]
pub struct BarcodeRequestOptions {
    #[serde(default = "default_scale")]
    pub scale: u32,
    
    #[allow(dead_code)] // Se mantiene para futuras implementaciones
    pub margin: Option<u32>,
    
    #[serde(rename = "errorCorrectionLevel")]
    pub error_correction_level: Option<String>,
    
    #[serde(rename = "minColumns")]
    pub min_columns: Option<u32>,
    
    #[serde(rename = "maxColumns")]
    pub max_columns: Option<u32>,
    
    #[allow(dead_code)] // Se mantiene para futuras implementaciones
    pub compact: Option<bool>,
    
    // Nuevo campo para TTL personalizado
    #[serde(rename = "ttlSeconds")]
    pub ttl_seconds: Option<u64>,
}

pub fn default_scale() -> u32 { 3 }

// ----------------- 2. Estructura de Error de Validación -----------------

#[derive(Debug, Serialize)]
pub struct ValidationError {
    pub code: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub suggestion: Option<String>,
}

impl std::fmt::Display for ValidationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}: {}", self.code, self.message)
    }
}

impl std::error::Error for ValidationError {}

// ----------------- 3. Trait para Validadores -----------------

pub trait BarcodeValidator {
    fn validate(&self, request: &BarcodeRequest) -> Result<(), ValidationError>;
}

// ----------------- 4. Implementaciones de Validadores Específicos -----------------

// 4.1 Validador QR Code
pub struct QRValidator;

impl BarcodeValidator for QRValidator {
    fn validate(&self, request: &BarcodeRequest) -> Result<(), ValidationError> {
        // Validar longitud de datos según el modo detectado
        
        // Usar un enfoque heurístico para detectar el modo
        // Esta es una simplificación, el modo real lo decide la librería rxing
        let mode = detect_qr_mode(&request.data);
        let max_length = match mode {
            QRMode::Numeric => 7089,
            QRMode::Alphanumeric => 4296,
            QRMode::Byte => 2953,
            QRMode::Kanji => 1817,
        };
        
        if request.data.len() > max_length {
            return Err(ValidationError {
                code: "QR_DATA_TOO_LONG".to_string(),
                message: format!(
                    "Los datos exceden la longitud máxima permitida para el modo {} ({} > {})",
                    mode, request.data.len(), max_length
                ),
                suggestion: Some(format!("Reduzca la cantidad de datos o considere usar un formato diferente como PDF417 para datos más extensos.")),
            });
        }
        
        // Nueva validación especializada para URLs
        if request.data.starts_with("http://") || request.data.starts_with("https://") {
            // Verificar longitud recomendada para URLs en QR (evitar URLs muy largas)
            if request.data.len() > 300 {
                return Err(ValidationError {
                    code: "QR_URL_TOO_LONG".to_string(),
                    message: format!(
                        "La URL es demasiado larga para un QR óptimamente escaneable ({} caracteres)", 
                        request.data.len()
                    ),
                    suggestion: Some("Considere usar un servicio de acortamiento de URLs o reducir la longitud de los parámetros".to_string()),
                });
            }
            
            // Validar estructura básica de URL
            if !request.data.contains(".") {
                return Err(ValidationError {
                    code: "QR_URL_INVALID_FORMAT".to_string(),
                    message: "La URL no parece tener un formato válido".to_string(),
                    suggestion: Some("Verifique que la URL contenga un nombre de dominio correcto".to_string()),
                });
            }
        }
        
        // Validar nivel de corrección de errores si está especificado
        if let Some(options) = &request.options {
            if let Some(ecl) = &options.error_correction_level {
                let ecl_upper = ecl.to_uppercase();
                if !["L", "M", "Q", "H"].contains(&ecl_upper.as_str()) {
                    return Err(ValidationError {
                        code: "QR_INVALID_ECL".to_string(),
                        message: format!(
                            "Nivel de corrección de errores '{}' no válido para QR Code", 
                            ecl
                        ),
                        suggestion: Some("Use uno de los siguientes niveles: L (bajo), M (medio), Q (cuartil), H (alto)".to_string()),
                    });
                }
            }
        }
        
        // Validar escala
        validate_scale(request)
    }
}

// Enum para modos QR (simplificado)
#[derive(Debug)]
enum QRMode {
    Numeric,
    Alphanumeric,
    Byte,
    Kanji,
}

impl std::fmt::Display for QRMode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            QRMode::Numeric => write!(f, "Numérico"),
            QRMode::Alphanumeric => write!(f, "Alfanumérico"),
            QRMode::Byte => write!(f, "Byte"),
            QRMode::Kanji => write!(f, "Kanji"),
        }
    }
}

// Función para detectar el modo QR (heurística simple)
fn detect_qr_mode(data: &str) -> QRMode {
    // Si solo tiene dígitos, es numérico
    if data.chars().all(|c| c.is_ascii_digit()) {
        return QRMode::Numeric;
    }
    
    // Si tiene solo caracteres alfanuméricos según la especificación QR
    // (0-9, A-Z, espacio y algunos símbolos)
    let qr_alphanum = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
    if data.chars().all(|c| qr_alphanum.contains(c)) {
        return QRMode::Alphanumeric;
    }
    
    // Detección básica de Kanji (simplificado)
    if data.chars().any(|c| c > '\u{4E00}' && c <= '\u{9FFF}') {
        return QRMode::Kanji;
    }
    
    // Por defecto asumimos modo Byte
    QRMode::Byte
}

// 4.2 Validador Code128
pub struct Code128Validator;

impl BarcodeValidator for Code128Validator {
    fn validate(&self, request: &BarcodeRequest) -> Result<(), ValidationError> {
        // Detectar automáticamente el subtipo de Code128
        let subtype = detect_code128_subtype(&request.data);
        
        // Validar caracteres según el subtipo
        match subtype {
            Code128Subtype::A => {
                // Code128A: ASCII 00-95 (0-9, A-Z, control chars)
                if !request.data.chars().all(|c| c.is_ascii() && (c as u8) < 96) {
                    return Err(ValidationError {
                        code: "CODE128A_INVALID_CHAR".to_string(),
                        message: "Code128A solo acepta caracteres ASCII 00-95 (0-9, A-Z, caracteres de control)".to_string(),
                        suggestion: Some("Revise los datos de entrada o use Code128B para soporte de minúsculas".to_string()),
                    });
                }
            },
            Code128Subtype::B => {
                // Code128B: ASCII 32-127 (0-9, A-Z, a-z, caracteres especiales)
                if !request.data.chars().all(|c| c.is_ascii() && c >= ' ' && c <= '~') {
                    return Err(ValidationError {
                        code: "CODE128B_INVALID_CHAR".to_string(),
                        message: "Code128B solo acepta caracteres ASCII 32-127 (0-9, A-Z, a-z, caracteres especiales)".to_string(),
                        suggestion: Some("Revise los datos de entrada o use un formato diferente para caracteres no ASCII".to_string()),
                    });
                }
            },
            Code128Subtype::C => {
                // Code128C: Dígitos en pares (00-99)
                if !request.data.chars().all(|c| c.is_ascii_digit()) {
                    return Err(ValidationError {
                        code: "CODE128C_INVALID_CHAR".to_string(),
                        message: "Code128C solo acepta dígitos (0-9)".to_string(),
                        suggestion: Some("Utilice solo caracteres numéricos o cambie a Code128A/B para caracteres no numéricos".to_string()),
                    });
                }
                
                // Code128C requiere un número par de dígitos
                if request.data.len() % 2 != 0 {
                    return Err(ValidationError {
                        code: "CODE128C_ODD_LENGTH".to_string(),
                        message: "Code128C requiere un número par de dígitos".to_string(),
                        suggestion: Some("Añada un cero al principio o utilice Code128B para longitudes impares".to_string()),
                    });
                }
            },
        }
        
        // Validar longitud práctica (recomendación, no limitación estricta)
        const MAX_PRACTICAL_LENGTH: usize = 80;
        if request.data.len() > MAX_PRACTICAL_LENGTH {
            return Err(ValidationError {
                code: "CODE128_LONG_DATA".to_string(),
                message: format!(
                    "La longitud de datos ({}) excede la longitud práctica recomendada ({})", 
                    request.data.len(), MAX_PRACTICAL_LENGTH
                ),
                suggestion: Some("Los códigos demasiado largos pueden ser difíciles de escanear. Considere dividir los datos en múltiples códigos.".to_string()),
            });
        }
        
        // Validar escala
        validate_scale(request)
    }
}

#[derive(Debug)]
enum Code128Subtype {
    A,
    B,
    C,
}

// Función para detectar el subtipo de Code128 (heurística simple)
fn detect_code128_subtype(data: &str) -> Code128Subtype {
    // Si solo tiene dígitos y longitud par, probablemente es Code128C
    if data.chars().all(|c| c.is_ascii_digit()) && data.len() % 2 == 0 {
        return Code128Subtype::C;
    }
    
    // Si tiene minúsculas, debe ser Code128B
    if data.chars().any(|c| c.is_ascii_lowercase()) {
        return Code128Subtype::B;
    }
    
    // Si tiene caracteres de control (ASCII < 32), debe ser Code128A
    if data.chars().any(|c| c.is_ascii() && (c as u8) < 32) {
        return Code128Subtype::A;
    }
    
    // Por defecto usamos Code128B que es el más versátil
    Code128Subtype::B
}

// 4.3 Validador EAN/UPC
pub struct EANValidator;

impl BarcodeValidator for EANValidator {
    fn validate(&self, request: &BarcodeRequest) -> Result<(), ValidationError> {
        // Determinar el tipo específico de EAN/UPC a partir del barcode_type
        let ean_type = match request.barcode_type.to_lowercase().as_str() {
            "ean13" => EANType::EAN13,
            "ean8" => EANType::EAN8,
            "upca" => EANType::UPCA,
            "upce" => EANType::UPCE,
            _ => {
                return Err(ValidationError {
                    code: "EAN_UNKNOWN_TYPE".to_string(),
                    message: format!("Tipo EAN/UPC no reconocido: {}", request.barcode_type),
                    suggestion: Some("Tipos válidos: ean13, ean8, upca, upce".to_string()),
                });
            }
        };
        
        // Validar que solo contenga dígitos
        if !request.data.chars().all(|c| c.is_ascii_digit()) {
            return Err(ValidationError {
                code: "EAN_INVALID_CHARS".to_string(),
                message: "EAN/UPC solo acepta dígitos (0-9)".to_string(),
                suggestion: None,
            });
        }
        
        // Validar longitud según el tipo
        let expected_length = match ean_type {
            EANType::EAN13 => 12, // 12 dígitos de datos + 1 dígito de verificación (generado)
            EANType::EAN8 => 7,   // 7 dígitos de datos + 1 dígito de verificación
            EANType::UPCA => 11,  // 11 dígitos de datos + 1 dígito de verificación
            EANType::UPCE => 6,   // UPC-E es un formato comprimido
        };
        
        if request.data.len() != expected_length {
            return Err(ValidationError {
                code: format!("{}_{}", ean_type.to_string().replace("-", ""), "INVALID_LENGTH"),
                message: format!(
                    "{} requiere exactamente {} dígitos (el dígito de verificación se generará automáticamente)",
                    ean_type, expected_length
                ),
                suggestion: Some(format!("Asegúrese de que su entrada contiene exactamente {} dígitos", expected_length)),
            });
        }
        
        // Para UPCE, validar reglas adicionales de compresión
        if ean_type == EANType::UPCE {
            // UPC-E tiene reglas específicas - simplificado para este ejemplo
            let first = request.data.chars().next().unwrap().to_digit(10).unwrap();
            if first != 0 && first != 1 {
                return Err(ValidationError {
                    code: "UPCE_INVALID_FORMAT".to_string(),
                    message: "UPC-E debe comenzar con 0 o 1".to_string(),
                    suggestion: None,
                });
            }
        }
        
        // Validar escala
        validate_scale(request)
    }
}

#[derive(Debug, PartialEq)]
enum EANType {
    EAN13,
    EAN8,
    UPCA,
    UPCE,
}

impl std::fmt::Display for EANType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            EANType::EAN13 => write!(f, "EAN-13"),
            EANType::EAN8 => write!(f, "EAN-8"),
            EANType::UPCA => write!(f, "UPC-A"),
            EANType::UPCE => write!(f, "UPC-E"),
        }
    }
}

// 4.4 Validador PDF417
pub struct PDF417Validator;

impl BarcodeValidator for PDF417Validator {
    fn validate(&self, request: &BarcodeRequest) -> Result<(), ValidationError> {
        // PDF417 no tiene restricciones específicas de caracteres,
        // pero sí tiene límites de tamaño y parámetros
        
        // Validar longitud de datos (límite aproximado)
        const MAX_BYTES: usize = 1200; // Valor conservador
        if request.data.len() > MAX_BYTES {
            return Err(ValidationError {
                code: "PDF417_DATA_TOO_LONG".to_string(),
                message: format!(
                    "Los datos exceden la longitud máxima recomendada para PDF417 ({} > {})",
                    request.data.len(), MAX_BYTES
                ),
                suggestion: Some("Considere dividir los datos en múltiples códigos PDF417".to_string()),
            });
        }
        
        // Validar parámetros específicos si están presentes
        if let Some(options) = &request.options {
            // Validar min_columns si está presente
            if let Some(min_cols) = options.min_columns {
                if min_cols < 1 || min_cols > 30 {
                    return Err(ValidationError {
                        code: "PDF417_INVALID_MIN_COLUMNS".to_string(),
                        message: format!("Número mínimo de columnas inválido: {}", min_cols),
                        suggestion: Some("El valor debe estar entre 1 y 30".to_string()),
                    });
                }
            }
            
            // Validar max_columns si está presente
            if let Some(max_cols) = options.max_columns {
                if max_cols < 1 || max_cols > 30 {
                    return Err(ValidationError {
                        code: "PDF417_INVALID_MAX_COLUMNS".to_string(),
                        message: format!("Número máximo de columnas inválido: {}", max_cols),
                        suggestion: Some("El valor debe estar entre 1 y 30".to_string()),
                    });
                }
                
                // Validar que max_columns >= min_columns si ambos están especificados
                if let Some(min_cols) = options.min_columns {
                    if max_cols < min_cols {
                        return Err(ValidationError {
                            code: "PDF417_INVALID_COLUMN_RANGE".to_string(),
                            message: format!(
                                "El máximo de columnas ({}) no puede ser menor que el mínimo ({})",
                                max_cols, min_cols
                            ),
                            suggestion: None,
                        });
                    }
                }
            }
        }
        
        // Validar escala
        validate_scale(request)
    }
}

// 4.5 Validador por defecto para otros tipos
pub struct DefaultValidator;

impl BarcodeValidator for DefaultValidator {
    fn validate(&self, request: &BarcodeRequest) -> Result<(), ValidationError> {
        // Validación mínima para tipos no específicamente implementados
        
        // Validar que haya datos
        if request.data.is_empty() {
            return Err(ValidationError {
                code: "EMPTY_DATA".to_string(),
                message: "Los datos no pueden estar vacíos".to_string(),
                suggestion: None,
            });
        }
        
        // Validar escala
        validate_scale(request)
    }
}

// ----------------- 5. Función Utilitaria para Validar Escala -----------------

// Función común para validar la escala (usada por todos los validadores)
fn validate_scale(request: &BarcodeRequest) -> Result<(), ValidationError> {
    let scale = request.options.as_ref()
        .map(|o| o.scale)
        .unwrap_or_else(default_scale);
    
    const MIN_SCALE: u32 = 1;
    const MAX_SCALE: u32 = 20;
    
    if scale < MIN_SCALE || scale > MAX_SCALE {
        return Err(ValidationError {
            code: "INVALID_SCALE".to_string(),
            message: format!(
                "La escala {} está fuera del rango válido ({}-{})",
                scale, MIN_SCALE, MAX_SCALE
            ),
            suggestion: Some(format!("Use un valor entre {} y {}", MIN_SCALE, MAX_SCALE)),
        });
    }
    
    Ok(())
}

// ----------------- 6. Factory para Validadores -----------------

// Mapa estático de tipos de códigos a sus validadores
lazy_static::lazy_static! {
    static ref VALIDATOR_MAP: HashMap<&'static str, Box<dyn BarcodeValidator + Sync + Send>> = {
        let mut m = HashMap::new();
        m.insert("qr", Box::new(QRValidator) as Box<dyn BarcodeValidator + Sync + Send>);
        m.insert("code128", Box::new(Code128Validator) as Box<dyn BarcodeValidator + Sync + Send>);
        m.insert("ean13", Box::new(EANValidator) as Box<dyn BarcodeValidator + Sync + Send>);
        m.insert("ean8", Box::new(EANValidator) as Box<dyn BarcodeValidator + Sync + Send>);
        m.insert("upca", Box::new(EANValidator) as Box<dyn BarcodeValidator + Sync + Send>);
        m.insert("upce", Box::new(EANValidator) as Box<dyn BarcodeValidator + Sync + Send>);
        m.insert("pdf417", Box::new(PDF417Validator) as Box<dyn BarcodeValidator + Sync + Send>);
        m
    };
}

// Función pública para obtener el validador apropiado según el tipo de código
pub fn get_validator(barcode_type: &str) -> &'static (dyn BarcodeValidator + Sync + Send) {
    let barcode_type = barcode_type.to_lowercase();
    
    match VALIDATOR_MAP.get(barcode_type.as_str()) {
        Some(validator) => validator.as_ref(),
        None => &DefaultValidator as &(dyn BarcodeValidator + Sync + Send),
    }
}

// ----------------- 7. Función Pública Principal de Validación -----------------

pub fn validate_barcode_request(request: &BarcodeRequest) -> Result<(), ValidationError> {
    let barcode_type = request.barcode_type.to_lowercase();
    let validator = get_validator(&barcode_type);
    validator.validate(request)
}

// ----------------- 8. Test Module -----------------

#[cfg(test)]
mod tests {
    use super::*;
    
    // Test para QR con datos válidos
    #[test]
    fn test_valid_qr() {
        let request = BarcodeRequest {
            barcode_type: "qr".to_string(),
            data: "https://ejemplo.com".to_string(),
            options: Some(BarcodeRequestOptions {
                scale: 5,
                error_correction_level: Some("H".to_string()),
                ..Default::default()
            }),
        };
        
        let result = validate_barcode_request(&request);
        assert!(result.is_ok());
    }
    
    // Test para QR con nivel de corrección de errores inválido
    #[test]
    fn test_invalid_qr_ecl() {
        let request = BarcodeRequest {
            barcode_type: "qr".to_string(),
            data: "https://ejemplo.com".to_string(),
            options: Some(BarcodeRequestOptions {
                scale: 5,
                error_correction_level: Some("Z".to_string()), // Inválido
                ..Default::default()
            }),
        };
        
        let result = validate_barcode_request(&request);
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert_eq!(err.code, "QR_INVALID_ECL");
    }
    
    // Test para EAN-13 válido
    #[test]
    fn test_valid_ean13() {
        let request = BarcodeRequest {
            barcode_type: "ean13".to_string(),
            data: "978020137962".to_string(), // 12 dígitos
            options: None,
        };
        
        let result = validate_barcode_request(&request);
        assert!(result.is_ok());
    }
    
    // Test para EAN-13 con longitud incorrecta
    #[test]
    fn test_invalid_ean13_length() {
        let request = BarcodeRequest {
            barcode_type: "ean13".to_string(),
            data: "12345".to_string(), // Demasiado corto
            options: None,
        };
        
        let result = validate_barcode_request(&request);
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert_eq!(err.code, "EAN13_INVALID_LENGTH");
    }
    
    // Test para Code128 con datos válidos
    #[test]
    fn test_valid_code128() {
        let request = BarcodeRequest {
            barcode_type: "code128".to_string(),
            data: "ABC123".to_string(),
            options: None,
        };
        
        let result = validate_barcode_request(&request);
        assert!(result.is_ok());
    }
    
    // Test para Code128 con datos demasiado largos
    #[test]
    fn test_long_code128() {
        let long_data = "A".repeat(100);
        let request = BarcodeRequest {
            barcode_type: "code128".to_string(),
            data: long_data,
            options: None,
        };
        
        let result = validate_barcode_request(&request);
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert_eq!(err.code, "CODE128_LONG_DATA");
    }
    
    // Test para escala inválida
    #[test]
    fn test_invalid_scale() {
        let request = BarcodeRequest {
            barcode_type: "qr".to_string(),
            data: "Test".to_string(),
            options: Some(BarcodeRequestOptions {
                scale: 25, // Demasiado grande
                ..Default::default()
            }),
        };
        
        let result = validate_barcode_request(&request);
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert_eq!(err.code, "INVALID_SCALE");
    }
}