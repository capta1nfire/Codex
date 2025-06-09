// standards/gs1.rs - Implementación de estándares GS1

use crate::engine::error::{QrError, QrResult};
use std::collections::HashMap;
use once_cell::sync::Lazy;

/// Identificadores de aplicación GS1 comunes
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum ApplicationIdentifier {
    // Identificación de productos
    GTIN,           // (01) Global Trade Item Number
    BatchLot,       // (10) Número de lote
    ProductionDate, // (11) Fecha de producción
    DueDate,        // (12) Fecha de vencimiento
    ExpiryDate,     // (17) Fecha de caducidad
    SerialNumber,   // (21) Número de serie
    
    // Medidas
    NetWeight,      // (310n) Peso neto en kg
    Length,         // (311n) Longitud en metros
    Width,          // (312n) Ancho en metros
    Height,         // (313n) Altura en metros
    Area,           // (314n) Área en m²
    Volume,         // (315n) Volumen en litros
    
    // Información adicional
    CountryOfOrigin,// (422) País de origen
    GLN,            // (410-417) Global Location Number
    SSCC,           // (00) Serial Shipping Container Code
    
    // URLs y referencias
    ProductURL,     // (8200) URL del producto
    
    // Custom/Otros
    Custom(String), // Para AIs no definidos aquí
}

/// Metadatos de un AI
struct AiMetadata {
    code: &'static str,
    name: &'static str,
    format: AiFormat,
    min_length: usize,
    max_length: usize,
    fnc1_required: bool,
}

/// Formato del valor del AI
#[derive(Debug, Clone, Copy)]
enum AiFormat {
    Numeric,
    Alphanumeric,
    Date,       // YYMMDD
    DateTime,   // YYMMDDHHMM
}

/// Mapa global de AIs
static AI_REGISTRY: Lazy<HashMap<&'static str, AiMetadata>> = Lazy::new(|| {
    let mut registry = HashMap::new();
    
    // Identificación de productos
    registry.insert("01", AiMetadata {
        code: "01",
        name: "GTIN",
        format: AiFormat::Numeric,
        min_length: 14,
        max_length: 14,
        fnc1_required: false,
    });
    
    registry.insert("10", AiMetadata {
        code: "10",
        name: "Batch/Lot Number",
        format: AiFormat::Alphanumeric,
        min_length: 1,
        max_length: 20,
        fnc1_required: true,
    });
    
    registry.insert("11", AiMetadata {
        code: "11",
        name: "Production Date",
        format: AiFormat::Date,
        min_length: 6,
        max_length: 6,
        fnc1_required: false,
    });
    
    registry.insert("17", AiMetadata {
        code: "17",
        name: "Expiry Date",
        format: AiFormat::Date,
        min_length: 6,
        max_length: 6,
        fnc1_required: false,
    });
    
    registry.insert("21", AiMetadata {
        code: "21",
        name: "Serial Number",
        format: AiFormat::Alphanumeric,
        min_length: 1,
        max_length: 20,
        fnc1_required: true,
    });
    
    // Medidas (ejemplo: 3103 = peso neto en kg con 3 decimales)
    registry.insert("3103", AiMetadata {
        code: "3103",
        name: "Net Weight (kg)",
        format: AiFormat::Numeric,
        min_length: 6,
        max_length: 6,
        fnc1_required: false,
    });
    
    registry.insert("00", AiMetadata {
        code: "00",
        name: "SSCC",
        format: AiFormat::Numeric,
        min_length: 18,
        max_length: 18,
        fnc1_required: false,
    });
    
    registry.insert("8200", AiMetadata {
        code: "8200",
        name: "Product URL",
        format: AiFormat::Alphanumeric,
        min_length: 1,
        max_length: 70,
        fnc1_required: true,
    });
    
    registry
});

/// Codificador GS1 para códigos QR y DataMatrix
pub struct Gs1Encoder {
    use_fnc1: bool,
    validate_check_digits: bool,
}

impl Gs1Encoder {
    pub fn new() -> Self {
        Self {
            use_fnc1: true,
            validate_check_digits: true,
        }
    }
    
    /// Codifica datos GS1 para QR/DataMatrix
    pub fn encode(&self, elements: &[(ApplicationIdentifier, String)]) -> QrResult<String> {
        let mut encoded = String::new();
        
        // Símbolo FNC1 al inicio para modo GS1
        if self.use_fnc1 {
            encoded.push_str("\\FNC1");
        }
        
        for (ai, value) in elements {
            let ai_code = self.get_ai_code(ai)?;
            let metadata = AI_REGISTRY.get(ai_code.as_str())
                .ok_or_else(|| QrError::ValidationError(format!("AI desconocido: {}", ai_code)))?;
            
            // Validar formato y longitud
            self.validate_ai_value(metadata, value)?;
            
            // Añadir AI y valor
            encoded.push_str(&ai_code);
            encoded.push_str(value);
            
            // Añadir FNC1 si es necesario (para AIs de longitud variable)
            if metadata.fnc1_required && self.use_fnc1 {
                encoded.push_str("\\FNC1");
            }
        }
        
        Ok(encoded)
    }
    
    /// Formatea datos GS1 en formato legible
    pub fn format_human_readable(&self, elements: &[(ApplicationIdentifier, String)]) -> String {
        let mut formatted = String::new();
        
        for (ai, value) in elements {
            if let Ok(ai_code) = self.get_ai_code(ai) {
                formatted.push('(');
                formatted.push_str(&ai_code);
                formatted.push(')');
                formatted.push_str(value);
                formatted.push(' ');
            }
        }
        
        formatted.trim().to_string()
    }
    
    /// Obtiene el código de AI
    fn get_ai_code(&self, ai: &ApplicationIdentifier) -> QrResult<String> {
        Ok(match ai {
            ApplicationIdentifier::GTIN => "01".to_string(),
            ApplicationIdentifier::BatchLot => "10".to_string(),
            ApplicationIdentifier::ProductionDate => "11".to_string(),
            ApplicationIdentifier::DueDate => "12".to_string(),
            ApplicationIdentifier::ExpiryDate => "17".to_string(),
            ApplicationIdentifier::SerialNumber => "21".to_string(),
            ApplicationIdentifier::NetWeight => "3103".to_string(),
            ApplicationIdentifier::Length => "3113".to_string(),
            ApplicationIdentifier::Width => "3123".to_string(),
            ApplicationIdentifier::Height => "3133".to_string(),
            ApplicationIdentifier::Area => "3143".to_string(),
            ApplicationIdentifier::Volume => "3153".to_string(),
            ApplicationIdentifier::CountryOfOrigin => "422".to_string(),
            ApplicationIdentifier::GLN => "410".to_string(),
            ApplicationIdentifier::SSCC => "00".to_string(),
            ApplicationIdentifier::ProductURL => "8200".to_string(),
            ApplicationIdentifier::Custom(code) => code.clone(),
        })
    }
    
    /// Valida el valor de un AI
    fn validate_ai_value(&self, metadata: &AiMetadata, value: &str) -> QrResult<()> {
        // Validar longitud
        if value.len() < metadata.min_length || value.len() > metadata.max_length {
            return Err(QrError::ValidationError(format!(
                "AI {} requiere longitud entre {} y {}, se proporcionó {}",
                metadata.code, metadata.min_length, metadata.max_length, value.len()
            )));
        }
        
        // Validar formato
        match metadata.format {
            AiFormat::Numeric => {
                if !value.chars().all(|c| c.is_ascii_digit()) {
                    return Err(QrError::ValidationError(format!(
                        "AI {} requiere solo dígitos numéricos",
                        metadata.code
                    )));
                }
            },
            AiFormat::Date => {
                if value.len() != 6 || !value.chars().all(|c| c.is_ascii_digit()) {
                    return Err(QrError::ValidationError(format!(
                        "AI {} requiere formato de fecha YYMMDD",
                        metadata.code
                    )));
                }
                // Validación básica de fecha
                let year: u32 = value[0..2].parse().unwrap_or(0);
                let month: u32 = value[2..4].parse().unwrap_or(0);
                let day: u32 = value[4..6].parse().unwrap_or(0);
                
                if month < 1 || month > 12 || day < 1 || day > 31 {
                    return Err(QrError::ValidationError(format!(
                        "AI {} contiene fecha inválida: {}",
                        metadata.code, value
                    )));
                }
            },
            AiFormat::DateTime => {
                if value.len() != 10 || !value.chars().all(|c| c.is_ascii_digit()) {
                    return Err(QrError::ValidationError(format!(
                        "AI {} requiere formato YYMMDDHHMM",
                        metadata.code
                    )));
                }
            },
            AiFormat::Alphanumeric => {
                // Permitir caracteres alfanuméricos y algunos especiales
                if !value.chars().all(|c| c.is_ascii_alphanumeric() || "-._/".contains(c)) {
                    return Err(QrError::ValidationError(format!(
                        "AI {} contiene caracteres no válidos",
                        metadata.code
                    )));
                }
            },
        }
        
        // Validar dígito de verificación para GTIN si está habilitado
        if self.validate_check_digits && metadata.code == "01" {
            self.validate_gtin_check_digit(value)?;
        }
        
        Ok(())
    }
    
    /// Valida el dígito de verificación de un GTIN
    fn validate_gtin_check_digit(&self, gtin: &str) -> QrResult<()> {
        if gtin.len() != 14 {
            return Err(QrError::ValidationError("GTIN debe tener 14 dígitos".to_string()));
        }
        
        let digits: Vec<u32> = gtin.chars()
            .filter_map(|c| c.to_digit(10))
            .collect();
        
        if digits.len() != 14 {
            return Err(QrError::ValidationError("GTIN contiene caracteres no numéricos".to_string()));
        }
        
        // Algoritmo de verificación GTIN
        let mut sum = 0;
        for (i, &digit) in digits[..13].iter().enumerate() {
            if i % 2 == 0 {
                sum += digit;
            } else {
                sum += digit * 3;
            }
        }
        
        let check_digit = (10 - (sum % 10)) % 10;
        
        if check_digit != digits[13] {
            return Err(QrError::ValidationError(format!(
                "Dígito de verificación GTIN inválido. Esperado: {}, Recibido: {}",
                check_digit, digits[13]
            )));
        }
        
        Ok(())
    }
}

/// Parser de datos GS1
pub struct Gs1Parser {
    strict_mode: bool,
}

impl Gs1Parser {
    pub fn new() -> Self {
        Self {
            strict_mode: true,
        }
    }
    
    /// Parsea una cadena GS1 en elementos AI
    pub fn parse(&self, data: &str) -> QrResult<Vec<(ApplicationIdentifier, String)>> {
        let mut elements = Vec::new();
        let mut remaining = data;
        
        // Remover FNC1 inicial si existe
        if remaining.starts_with("\\FNC1") {
            remaining = &remaining[5..];
        }
        
        while !remaining.is_empty() {
            // Buscar el AI (entre paréntesis o directamente)
            let (ai_code, value_start) = if remaining.starts_with('(') {
                // Formato con paréntesis: (01)12345678901234
                let end = remaining.find(')').ok_or_else(|| 
                    QrError::ValidationError("Paréntesis sin cerrar en datos GS1".to_string()))?;
                let ai = &remaining[1..end];
                (ai.to_string(), end + 1)
            } else {
                // Formato sin paréntesis: necesitamos identificar el AI
                let ai = self.identify_ai(remaining)?;
                (ai.clone(), ai.len())
            };
            
            // Obtener metadata del AI
            let metadata = AI_REGISTRY.get(ai_code.as_str())
                .ok_or_else(|| QrError::ValidationError(format!("AI desconocido: {}", ai_code)))?;
            
            // Extraer el valor
            remaining = &remaining[value_start..];
            let value_end = if metadata.fnc1_required {
                // Buscar FNC1 o siguiente AI
                remaining.find("\\FNC1")
                    .or_else(|| self.find_next_ai(remaining))
                    .unwrap_or(remaining.len())
            } else {
                // Longitud fija
                metadata.max_length.min(remaining.len())
            };
            
            let value = remaining[..value_end].to_string();
            remaining = &remaining[value_end..];
            
            // Remover FNC1 si existe
            if remaining.starts_with("\\FNC1") {
                remaining = &remaining[5..];
            }
            
            // Convertir a ApplicationIdentifier
            let ai = self.code_to_ai(&ai_code)?;
            elements.push((ai, value));
        }
        
        Ok(elements)
    }
    
    /// Identifica el AI al inicio de una cadena
    fn identify_ai(&self, data: &str) -> QrResult<String> {
        // Probar AIs de diferentes longitudes (2, 3, 4 dígitos)
        for len in &[4, 3, 2] {
            if data.len() >= *len {
                let potential_ai = &data[..*len];
                if AI_REGISTRY.contains_key(potential_ai) {
                    return Ok(potential_ai.to_string());
                }
            }
        }
        
        Err(QrError::ValidationError("No se pudo identificar AI válido".to_string()))
    }
    
    /// Busca el siguiente AI en la cadena
    fn find_next_ai(&self, data: &str) -> Option<usize> {
        for i in 1..data.len() {
            if let Ok(_) = self.identify_ai(&data[i..]) {
                return Some(i);
            }
        }
        None
    }
    
    /// Convierte código a ApplicationIdentifier
    fn code_to_ai(&self, code: &str) -> QrResult<ApplicationIdentifier> {
        Ok(match code {
            "01" => ApplicationIdentifier::GTIN,
            "10" => ApplicationIdentifier::BatchLot,
            "11" => ApplicationIdentifier::ProductionDate,
            "12" => ApplicationIdentifier::DueDate,
            "17" => ApplicationIdentifier::ExpiryDate,
            "21" => ApplicationIdentifier::SerialNumber,
            "3103" => ApplicationIdentifier::NetWeight,
            "3113" => ApplicationIdentifier::Length,
            "3123" => ApplicationIdentifier::Width,
            "3133" => ApplicationIdentifier::Height,
            "3143" => ApplicationIdentifier::Area,
            "3153" => ApplicationIdentifier::Volume,
            "422" => ApplicationIdentifier::CountryOfOrigin,
            "410" => ApplicationIdentifier::GLN,
            "00" => ApplicationIdentifier::SSCC,
            "8200" => ApplicationIdentifier::ProductURL,
            _ => ApplicationIdentifier::Custom(code.to_string()),
        })
    }
}

impl Default for Gs1Encoder {
    fn default() -> Self {
        Self::new()
    }
}

impl Default for Gs1Parser {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_encode_basic_gtin() {
        let encoder = Gs1Encoder::new();
        let elements = vec![
            (ApplicationIdentifier::GTIN, "01234567890128".to_string()),
        ];
        
        let result = encoder.encode(&elements);
        assert!(result.is_ok());
        let encoded = result.unwrap();
        assert!(encoded.contains("01234567890128"));
    }
    
    #[test]
    fn test_encode_multiple_ais() {
        let encoder = Gs1Encoder::new();
        let elements = vec![
            (ApplicationIdentifier::GTIN, "01234567890128".to_string()),
            (ApplicationIdentifier::BatchLot, "ABC123".to_string()),
            (ApplicationIdentifier::ExpiryDate, "251231".to_string()),
        ];
        
        let result = encoder.encode(&elements);
        assert!(result.is_ok());
    }
    
    #[test]
    fn test_validate_gtin_check_digit() {
        let encoder = Gs1Encoder::new();
        
        // GTIN válido
        let valid_gtin = vec![
            (ApplicationIdentifier::GTIN, "01234567890128".to_string()),
        ];
        assert!(encoder.encode(&valid_gtin).is_ok());
        
        // GTIN inválido
        let invalid_gtin = vec![
            (ApplicationIdentifier::GTIN, "01234567890123".to_string()),
        ];
        assert!(encoder.encode(&invalid_gtin).is_err());
    }
    
    #[test]
    fn test_parse_gs1_data() {
        let parser = Gs1Parser::new();
        
        // Formato con paréntesis
        let data = "(01)01234567890128(10)ABC123(17)251231";
        let result = parser.parse(data);
        assert!(result.is_ok());
        let elements = result.unwrap();
        assert_eq!(elements.len(), 3);
    }
    
    #[test]
    fn test_human_readable_format() {
        let encoder = Gs1Encoder::new();
        let elements = vec![
            (ApplicationIdentifier::GTIN, "01234567890128".to_string()),
            (ApplicationIdentifier::BatchLot, "ABC123".to_string()),
        ];
        
        let formatted = encoder.format_human_readable(&elements);
        assert_eq!(formatted, "(01)01234567890128 (10)ABC123");
    }
}