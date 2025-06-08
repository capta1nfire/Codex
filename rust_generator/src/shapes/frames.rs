// shapes/frames.rs - Renderizado de marcos para QR (stub para futura implementación)

use crate::engine::types::FrameType;

/// Renderizador de marcos
pub struct FrameRenderer;

impl FrameRenderer {
    pub fn new() -> Self {
        Self
    }

    /// Renderiza un marco alrededor del QR
    pub fn render_frame(
        &self,
        _qr_svg: &str,
        _frame_type: FrameType,
        _text: Option<&str>,
        _color: &str,
    ) -> String {
        // TODO: Implementar en fase futura
        _qr_svg.to_string()
    }
}