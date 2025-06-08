// engine/error.rs - Sistema de manejo de errores

use thiserror::Error;

pub type QrResult<T> = Result<T, QrError>;

#[derive(Error, Debug)]
pub enum QrError {
    #[error("Datos demasiado largos: {0} bytes (máximo: {1})")]
    DataTooLong(usize, usize),
    
    #[error("Caracteres inválidos en los datos")]
    InvalidCharacters,
    
    #[error("Tamaño inválido: {0} (mínimo: {1}, máximo: {2})")]
    InvalidSize(u32, u32, u32),
    
    #[error("Error de codificación QR: {0}")]
    EncodingError(String),
    
    #[error("Error procesando logo: {0}")]
    LogoError(String),
    
    #[error("Logo demasiado grande: {0}% (máximo: {1}%)")]
    LogoTooLarge(f32, f32),
    
    #[error("Error de gradiente: {0}")]
    GradientError(String),
    
    #[error("Contraste insuficiente: {0:.2} (mínimo: {1:.2})")]
    InsufficientContrast(f32, f32),
    
    #[error("Error de validación: {0}")]
    ValidationError(String),
    
    #[error("Puntuación de calidad baja: {0:.2} (mínimo: {1:.2})")]
    LowQualityScore(f32, f32),
    
    #[error("Formato no soportado: {0}")]
    UnsupportedFormat(String),
    
    #[error("Error de renderizado: {0}")]
    RenderError(String),
    
    #[error("Timeout de generación excedido: {0}ms")]
    GenerationTimeout(u64),
    
    #[error("Memoria excedida: {0}MB (máximo: {1}MB)")]
    MemoryExceeded(usize, usize),
    
    #[error("URL maliciosa detectada: {0}")]
    MaliciousUrl(String),
    
    #[error("Error de E/O: {0}")]
    IoError(#[from] std::io::Error),
    
    #[error("Error de imagen: {0}")]
    ImageError(#[from] image::ImageError),
    
    #[error("Error interno: {0}")]
    InternalError(String),
}

impl QrError {
    /// Obtiene el código de error HTTP sugerido
    pub fn status_code(&self) -> u16 {
        match self {
            QrError::DataTooLong(_, _) => 400,
            QrError::InvalidCharacters => 400,
            QrError::InvalidSize(_, _, _) => 400,
            QrError::LogoTooLarge(_, _) => 400,
            QrError::InsufficientContrast(_, _) => 400,
            QrError::LowQualityScore(_, _) => 400,
            QrError::UnsupportedFormat(_) => 400,
            QrError::MaliciousUrl(_) => 403,
            QrError::GenerationTimeout(_) => 408,
            QrError::MemoryExceeded(_, _) => 413,
            _ => 500,
        }
    }
    
    /// Obtiene sugerencias para resolver el error
    pub fn suggestion(&self) -> Option<String> {
        match self {
            QrError::DataTooLong(_, max) => {
                Some(format!("Reduzca los datos a menos de {} caracteres", max))
            },
            QrError::InvalidCharacters => {
                Some("Use solo caracteres válidos o cambie el modo de codificación".to_string())
            },
            QrError::InvalidSize(_, min, max) => {
                Some(format!("Use un tamaño entre {} y {} píxeles", min, max))
            },
            QrError::LogoTooLarge(_, max) => {
                Some(format!("Reduzca el tamaño del logo a máximo {}%", max))
            },
            QrError::InsufficientContrast(current, min) => {
                Some(format!(
                    "Aumente el contraste entre colores. Actual: {:.2}, mínimo: {:.2}", 
                    current, min
                ))
            },
            QrError::LowQualityScore(score, min) => {
                Some(format!(
                    "Simplifique el diseño o reduzca personalizaciones. Score: {:.2}, mínimo: {:.2}",
                    score, min
                ))
            },
            QrError::MaliciousUrl(_) => {
                Some("La URL fue detectada como potencialmente maliciosa".to_string())
            },
            _ => None,
        }
    }
    
    /// Determina si el error es recuperable
    pub fn is_recoverable(&self) -> bool {
        matches!(
            self,
            QrError::InsufficientContrast(_, _) | 
            QrError::LowQualityScore(_, _) |
            QrError::GenerationTimeout(_)
        )
    }
}

/// Contexto adicional para errores
#[derive(Debug)]
pub struct ErrorContext {
    pub operation: String,
    pub details: Option<String>,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

impl ErrorContext {
    pub fn new(operation: impl Into<String>) -> Self {
        Self {
            operation: operation.into(),
            details: None,
            timestamp: chrono::Utc::now(),
        }
    }
    
    pub fn with_details(mut self, details: impl Into<String>) -> Self {
        self.details = Some(details.into());
        self
    }
}

/// Trait para agregar contexto a errores
pub trait ErrorExt<T> {
    fn context(self, ctx: ErrorContext) -> Result<T, QrError>;
}

impl<T> ErrorExt<T> for Result<T, QrError> {
    fn context(self, ctx: ErrorContext) -> Result<T, QrError> {
        self.map_err(|e| {
            tracing::error!(
                operation = %ctx.operation,
                details = ?ctx.details,
                error = %e,
                "Operation failed"
            );
            e
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_status_codes() {
        assert_eq!(QrError::DataTooLong(100, 50).status_code(), 400);
        assert_eq!(QrError::MaliciousUrl("test".to_string()).status_code(), 403);
        assert_eq!(QrError::GenerationTimeout(5000).status_code(), 408);
        assert_eq!(QrError::InternalError("test".to_string()).status_code(), 500);
    }
    
    #[test]
    fn test_error_suggestions() {
        let err = QrError::InsufficientContrast(1.5, 3.0);
        assert!(err.suggestion().is_some());
        
        let err = QrError::InternalError("test".to_string());
        assert!(err.suggestion().is_none());
    }
}