// shapes/frames.rs - Renderizado de marcos para QR

use crate::engine::types::{FrameType, TextPosition};

/// Renderizador de marcos
pub struct FrameRenderer {
    module_size: u32,
}

impl FrameRenderer {
    pub fn new(module_size: u32) -> Self {
        Self { module_size }
    }

    /// Renderiza un marco alrededor del QR
    pub fn render_frame(
        &self,
        qr_size: usize,
        frame_type: FrameType,
        text: Option<&str>,
        text_position: TextPosition,
        color: &str,
    ) -> String {
        let size = qr_size as f32;
        let padding = 20.0; // Padding del marco
        let frame_width = size + 2.0 * padding;
        let frame_height = if text.is_some() {
            size + 2.0 * padding + 30.0 // Espacio extra para texto
        } else {
            size + 2.0 * padding
        };

        let mut svg = String::new();
        
        // Renderizar el marco según el tipo
        match frame_type {
            FrameType::Simple => {
                svg.push_str(&self.render_simple_frame(
                    padding, padding, size, size, 4.0, color
                ));
            },
            FrameType::Rounded => {
                svg.push_str(&self.render_rounded_frame(
                    padding, padding, size, size, 12.0, color
                ));
            },
            FrameType::Bubble => {
                svg.push_str(&self.render_bubble_frame(
                    padding, padding, size, size, color
                ));
            },
            FrameType::Speech => {
                svg.push_str(&self.render_speech_frame(
                    padding, padding, size, size, color
                ));
            },
            FrameType::Badge => {
                svg.push_str(&self.render_badge_frame(
                    padding, padding, size, size, color
                ));
            },
        }

        // Agregar texto si existe
        if let Some(text_content) = text {
            svg.push_str(&self.render_frame_text(
                text_content,
                text_position,
                frame_width,
                frame_height,
                padding,
                size,
                color
            ));
        }

        // Envolver en grupo con viewBox expandido
        format!(
            r#"<g transform="translate(-{}, -{})">{}</g>"#,
            padding, padding, svg
        )
    }

    /// Marco simple con bordes rectos
    fn render_simple_frame(&self, x: f32, y: f32, width: f32, height: f32, border_width: f32, color: &str) -> String {
        format!(
            r#"<rect x="{}" y="{}" width="{}" height="{}" fill="none" stroke="{}" stroke-width="{}" />"#,
            x - border_width/2.0,
            y - border_width/2.0,
            width + border_width,
            height + border_width,
            color,
            border_width
        )
    }

    /// Marco con esquinas redondeadas
    fn render_rounded_frame(&self, x: f32, y: f32, width: f32, height: f32, radius: f32, color: &str) -> String {
        let border_width = 4.0;
        format!(
            r#"<rect x="{}" y="{}" width="{}" height="{}" rx="{}" ry="{}" fill="none" stroke="{}" stroke-width="{}" />"#,
            x - border_width/2.0,
            y - border_width/2.0,
            width + border_width,
            height + border_width,
            radius,
            radius,
            color,
            border_width
        )
    }

    /// Marco tipo burbuja de diálogo
    fn render_bubble_frame(&self, x: f32, y: f32, width: f32, height: f32, color: &str) -> String {
        let border_width = 3.0;
        let radius = 20.0;
        let tail_size = 20.0;
        
        format!(
            r#"<path d="M {} {} 
                h {} 
                a {} {} 0 0 1 {} {} 
                v {} 
                a {} {} 0 0 1 -{} {} 
                h -{} 
                l -{} {} 
                l -{} -{} 
                h -{} 
                a {} {} 0 0 1 -{} -{} 
                v -{} 
                a {} {} 0 0 1 {} -{} 
                Z" 
                fill="white" stroke="{}" stroke-width="{}" />"#,
            x + radius, y,
            width - 2.0 * radius,
            radius, radius, radius, radius,
            height - 2.0 * radius,
            radius, radius, radius, radius,
            width - 2.0 * radius - tail_size * 2.0,
            tail_size, tail_size,
            tail_size * 0.5, tail_size,
            tail_size * 0.5,
            radius, radius, radius, radius,
            height - 2.0 * radius,
            radius, radius, radius, radius,
            color, border_width
        )
    }

    /// Marco tipo bocadillo de diálogo
    fn render_speech_frame(&self, x: f32, y: f32, width: f32, height: f32, color: &str) -> String {
        let border_width = 3.0;
        let radius = 15.0;
        let pointer_width = 30.0;
        let pointer_height = 20.0;
        
        format!(
            r#"<g>
                <rect x="{}" y="{}" width="{}" height="{}" rx="{}" ry="{}" 
                      fill="white" stroke="{}" stroke-width="{}" />
                <path d="M {} {} L {} {} L {} {} Z" 
                      fill="white" stroke="{}" stroke-width="{}" stroke-linejoin="round" />
            </g>"#,
            x, y, width, height - pointer_height, radius, radius,
            color, border_width,
            x + width * 0.2, y + height - pointer_height - 1.0,
            x + width * 0.2 + pointer_width / 2.0, y + height,
            x + width * 0.2 + pointer_width, y + height - pointer_height - 1.0,
            color, border_width
        )
    }

    /// Marco tipo insignia/badge
    fn render_badge_frame(&self, x: f32, y: f32, width: f32, height: f32, color: &str) -> String {
        let border_width = 4.0;
        let corner_cut = 20.0;
        
        format!(
            r#"<path d="M {} {} 
                h {} 
                l {} {} 
                v {} 
                l -{} {} 
                h -{} 
                l -{} -{} 
                v -{} 
                Z" 
                fill="white" stroke="{}" stroke-width="{}" />"#,
            x + corner_cut, y,
            width - 2.0 * corner_cut,
            corner_cut, corner_cut,
            height - 2.0 * corner_cut,
            corner_cut, corner_cut,
            width - 2.0 * corner_cut,
            corner_cut, corner_cut,
            height - 2.0 * corner_cut,
            color, border_width
        )
    }

    /// Renderiza texto del marco
    fn render_frame_text(
        &self,
        text: &str,
        position: TextPosition,
        frame_width: f32,
        frame_height: f32,
        padding: f32,
        qr_size: f32,
        color: &str,
    ) -> String {
        let font_size = 16.0;
        let (x, y, anchor) = match position {
            TextPosition::Top => (
                frame_width / 2.0,
                padding - 5.0,
                "middle"
            ),
            TextPosition::Bottom => (
                frame_width / 2.0,
                padding + qr_size + 25.0,
                "middle"
            ),
            TextPosition::Left => (
                padding - 5.0,
                frame_height / 2.0,
                "end"
            ),
            TextPosition::Right => (
                padding + qr_size + 5.0,
                frame_height / 2.0,
                "start"
            ),
        };

        format!(
            r#"<text x="{}" y="{}" text-anchor="{}" fill="{}" font-family="Arial, sans-serif" font-size="{}" font-weight="bold">{}</text>"#,
            x, y, anchor, color, font_size, text
        )
    }
}