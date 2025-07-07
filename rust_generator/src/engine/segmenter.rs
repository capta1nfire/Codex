// engine/segmenter.rs - Analizador y segmentador de contenido para optimización QR
// Implementa la detección inteligente de segmentos numéricos, alfanuméricos y de bytes
// para reducir el tamaño del código QR usando las capacidades de qrcodegen

use qrcodegen::QrSegment;

/// Tipo de segmento detectado
#[derive(Debug, Clone, Copy, PartialEq)]
enum SegmentType {
    Numeric,
    Alphanumeric,
    Byte,
}

/// Segmento de datos con su tipo
#[derive(Debug, Clone)]
struct DataSegment {
    content: String,
    segment_type: SegmentType,
    start_index: usize,
    end_index: usize,
}

/// Analizador de contenido para segmentación óptima
pub struct ContentSegmenter {
    /// Umbral mínimo de caracteres para crear un segmento
    min_segment_length: usize,
}

impl ContentSegmenter {
    /// Crea un nuevo segmentador con configuración por defecto
    pub fn new() -> Self {
        Self {
            min_segment_length: 3, // Mínimo 3 caracteres para que valga la pena segmentar
        }
    }

    /// Analiza el contenido y retorna los segmentos QR optimizados
    pub fn analyze_and_segment(&self, data: &str) -> Result<Vec<QrSegment>, String> {
        // Validación de entrada según IA_MANIFESTO Pilar 1: Seguridad
        if data.is_empty() {
            return Err("Los datos no pueden estar vacíos".to_string());
        }

        if data.len() > 4296 {
            return Err(format!("Datos demasiado largos: {} caracteres (máximo 4296)", data.len()));
        }

        // Detectar segmentos en el contenido
        let segments = self.detect_segments(data);
        
        // Convertir a QrSegments
        self.convert_to_qr_segments(segments)
    }

    /// Detecta los tipos de segmentos en el contenido
    fn detect_segments(&self, data: &str) -> Vec<DataSegment> {
        let mut segments = Vec::new();
        let mut current_segment = String::new();
        let mut current_type: Option<SegmentType> = None;
        let mut start_index = 0;

        for (index, ch) in data.chars().enumerate() {
            let char_type = self.classify_character(ch);
            
            // Si cambia el tipo o es el primer carácter
            if current_type.is_none() || current_type.as_ref() != Some(&char_type) {
                // Guardar segmento anterior si existe y cumple el mínimo
                if !current_segment.is_empty() {
                    // Aplicar heurística: solo segmentar si vale la pena
                    if let Some(seg_type) = current_type {
                        if self.should_segment(&current_segment, &seg_type) {
                            segments.push(DataSegment {
                                content: current_segment.clone(),
                                segment_type: seg_type,
                                start_index,
                                end_index: index - 1,
                            });
                        } else if let Some(last) = segments.last_mut() {
                            // Fusionar con el segmento anterior si es muy corto
                            last.content.push_str(&current_segment);
                            last.end_index = index - 1;
                            last.segment_type = SegmentType::Byte; // Degradar a byte si es mixto
                        } else {
                            // Primer segmento muy corto, guardarlo como byte
                            segments.push(DataSegment {
                                content: current_segment.clone(),
                                segment_type: SegmentType::Byte,
                                start_index,
                                end_index: index - 1,
                            });
                        }
                    }
                }
                
                // Iniciar nuevo segmento
                current_segment = String::new();
                current_type = Some(char_type);
                start_index = index;
            }
            
            current_segment.push(ch);
        }

        // Procesar el último segmento
        if !current_segment.is_empty() {
            if let Some(seg_type) = current_type {
                if self.should_segment(&current_segment, &seg_type) {
                    segments.push(DataSegment {
                        content: current_segment,
                        segment_type: seg_type,
                        start_index,
                        end_index: data.len() - 1,
                    });
                } else if let Some(last) = segments.last_mut() {
                    last.content.push_str(&current_segment);
                    last.end_index = data.len() - 1;
                    last.segment_type = SegmentType::Byte;
                } else {
                    segments.push(DataSegment {
                        content: current_segment,
                        segment_type: SegmentType::Byte,
                        start_index,
                        end_index: data.len() - 1,
                    });
                }
            }
        }

        // Optimizar segmentos fusionando adyacentes del mismo tipo
        self.optimize_segments(segments)
    }

    /// Clasifica un carácter según el modo QR más eficiente
    fn classify_character(&self, ch: char) -> SegmentType {
        if ch.is_ascii_digit() {
            SegmentType::Numeric
        } else if self.is_alphanumeric_qr(ch) {
            SegmentType::Alphanumeric
        } else {
            SegmentType::Byte
        }
    }

    /// Verifica si un carácter es alfanumérico según el estándar QR
    fn is_alphanumeric_qr(&self, ch: char) -> bool {
        matches!(ch,
            '0'..='9' | 'A'..='Z' | ' ' | '$' | '%' | '*' | '+' | '-' | '.' | '/' | ':'
        )
    }

    /// Determina si vale la pena crear un segmento separado
    fn should_segment(&self, content: &str, segment_type: &SegmentType) -> bool {
        match segment_type {
            SegmentType::Numeric => content.len() >= self.min_segment_length,
            SegmentType::Alphanumeric => content.len() >= self.min_segment_length + 1,
            SegmentType::Byte => true, // Siempre segmentar bytes
        }
    }

    /// Optimiza los segmentos fusionando los adyacentes del mismo tipo
    fn optimize_segments(&self, segments: Vec<DataSegment>) -> Vec<DataSegment> {
        if segments.is_empty() {
            return segments;
        }

        let mut optimized = Vec::new();
        let mut current = segments[0].clone();

        for segment in segments.into_iter().skip(1) {
            if current.segment_type == segment.segment_type {
                // Fusionar segmentos del mismo tipo
                current.content.push_str(&segment.content);
                current.end_index = segment.end_index;
            } else {
                optimized.push(current);
                current = segment;
            }
        }
        
        optimized.push(current);
        optimized
    }

    /// Convierte los segmentos detectados a QrSegment de qrcodegen
    fn convert_to_qr_segments(&self, segments: Vec<DataSegment>) -> Result<Vec<QrSegment>, String> {
        let mut qr_segments = Vec::new();

        for segment in segments {
            let qr_segment = match segment.segment_type {
                SegmentType::Numeric => {
                    // QrSegment::make_numeric no retorna Result, solo paniquea si hay caracteres inválidos
                    // Validamos primero para evitar panics
                    if segment.content.chars().all(|c| c.is_ascii_digit()) {
                        QrSegment::make_numeric(&segment.content)
                    } else {
                        return Err(format!("Segmento numérico contiene caracteres inválidos: {}", segment.content));
                    }
                },
                SegmentType::Alphanumeric => {
                    // Validar que todos los caracteres sean alfanuméricos QR válidos
                    if segment.content.chars().all(|c| self.is_alphanumeric_qr(c)) {
                        QrSegment::make_alphanumeric(&segment.content)
                    } else {
                        return Err(format!("Segmento alfanumérico contiene caracteres inválidos: {}", segment.content));
                    }
                },
                SegmentType::Byte => {
                    QrSegment::make_bytes(segment.content.as_bytes())
                },
            };
            
            qr_segments.push(qr_segment);
        }

        Ok(qr_segments)
    }

    /// Calcula el ahorro estimado en bits usando segmentación
    pub fn estimate_savings(&self, data: &str) -> (usize, usize, f32) {
        // Tamaño sin segmentación (todo como bytes)
        let size_without = self.calculate_bit_size(data, &SegmentType::Byte);
        
        // Tamaño con segmentación
        let segments = self.detect_segments(data);
        let size_with: usize = segments.iter()
            .map(|s| self.calculate_bit_size(&s.content, &s.segment_type))
            .sum();
        
        let savings_percent = if size_without > 0 {
            ((size_without - size_with) as f32 / size_without as f32) * 100.0
        } else {
            0.0
        };

        (size_without, size_with, savings_percent)
    }

    /// Calcula el tamaño en bits de un segmento
    fn calculate_bit_size(&self, content: &str, segment_type: &SegmentType) -> usize {
        let char_count = content.len();
        
        // Overhead del modo + longitud del indicador
        let mode_bits = 4; // Bits para indicar el modo
        let count_bits = match segment_type {
            SegmentType::Numeric => {
                if char_count <= 10 { 10 }
                else if char_count <= 27 { 12 }
                else { 14 }
            },
            SegmentType::Alphanumeric => {
                if char_count <= 9 { 9 }
                else if char_count <= 26 { 11 }
                else { 13 }
            },
            SegmentType::Byte => {
                if char_count <= 8 { 8 }
                else { 16 }
            },
        };
        
        // Bits por carácter según el modo
        let data_bits = match segment_type {
            SegmentType::Numeric => (char_count * 10 + 2) / 3, // 3.33 bits por dígito
            SegmentType::Alphanumeric => (char_count * 11 + 1) / 2, // 5.5 bits por carácter
            SegmentType::Byte => char_count * 8, // 8 bits por byte
        };
        
        mode_bits + count_bits + data_bits
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_numeric_segmentation() {
        let segmenter = ContentSegmenter::new();
        let segments = segmenter.detect_segments("123456789");
        
        assert_eq!(segments.len(), 1);
        assert_eq!(segments[0].segment_type, SegmentType::Numeric);
        assert_eq!(segments[0].content, "123456789");
    }

    #[test]
    fn test_mixed_segmentation() {
        let segmenter = ContentSegmenter::new();
        let segments = segmenter.detect_segments("ABC123XYZ");
        
        assert_eq!(segments.len(), 3);
        assert_eq!(segments[0].segment_type, SegmentType::Alphanumeric);
        assert_eq!(segments[0].content, "ABC");
        assert_eq!(segments[1].segment_type, SegmentType::Numeric);
        assert_eq!(segments[1].content, "123");
        assert_eq!(segments[2].segment_type, SegmentType::Alphanumeric);
        assert_eq!(segments[2].content, "XYZ");
    }

    #[test]
    fn test_url_segmentation() {
        let segmenter = ContentSegmenter::new();
        let url = "https://instagram.com/user12345";
        let segments = segmenter.detect_segments(url);
        
        // Debería detectar el número al final
        let last_segment = segments.last().unwrap();
        assert!(last_segment.content.contains("12345"));
    }

    #[test]
    fn test_savings_calculation() {
        let segmenter = ContentSegmenter::new();
        let (without, with, savings) = segmenter.estimate_savings("HELLO123456");
        
        assert!(with < without);
        assert!(savings > 0.0);
    }

    #[test]
    fn test_empty_input() {
        let segmenter = ContentSegmenter::new();
        let result = segmenter.analyze_and_segment("");
        
        assert!(result.is_err());
        if let Err(e) = result {
            assert!(e.contains("vacíos"));
        }
    }

    #[test]
    fn test_too_long_input() {
        let segmenter = ContentSegmenter::new();
        let long_data = "A".repeat(5000);
        let result = segmenter.analyze_and_segment(&long_data);
        
        assert!(result.is_err());
        if let Err(e) = result {
            assert!(e.contains("demasiado largos"));
        }
    }
}