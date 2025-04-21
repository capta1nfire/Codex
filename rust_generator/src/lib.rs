// Imports
use rxing::{common::BitMatrix, BarcodeFormat, MultiFormatWriter, Writer};
use std::error::Error;

// --- Función Manual SVG (Usa scale para coords/viewBox, SIN width/height en <svg>) ---
fn manual_bit_matrix_to_svg(bit_matrix: &BitMatrix, scale: u32) -> Result<String, Box<dyn Error>> {
    let width = bit_matrix.getWidth();
    let height = bit_matrix.getHeight();

    // Asegurar que la escala sea al menos 1
    let scale = if scale == 0 { 1 } else { scale };

    if width == 0 || height == 0 {
        return Err("Las dimensiones de BitMatrix no pueden ser cero para SVG".into());
    }

    // Calcular dimensiones SVG escaladas PARA viewBox y contenido
    let svg_width = width * scale;
    let svg_height = height * scale;

    // Estimar capacidad
    let mut svg = String::with_capacity(
        150 + (width as usize * height as usize / 2) * 70, // Aproximado
    );

    // --- Cabecera SVG CORREGIDA ---
    // SIN width/height, pero viewBox USA dimensiones ESCALADAS
    svg.push_str(&format!(
        r#"<svg viewBox="0 0 {} {}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">"#,
        svg_width, svg_height // <-- ViewBox escalado
    ));

    // Fondo blanco (usa dimensiones escaladas)
    svg.push_str(&format!(
        r#"<rect width="{}" height="{}" fill="white"/>"#,
        svg_width, svg_height
    ));

    // Grupo para módulos negros
    svg.push_str(r#"<g fill="black">"#);
    for y in 0..height {
        for x in 0..width {
            if bit_matrix.get(x, y) {
                // --- Dibujar rectángulo ESCALADO ---
                svg.push_str(&format!(
                    r#"<rect x="{}" y="{}" width="{}" height="{}"/>"#,
                    x * scale, // Posición X escalada
                    y * scale, // Posición Y escalada
                    scale,     // Ancho del módulo = escala
                    scale      // Alto del módulo = escala
                ));
                // --- FIN Rectángulo ---
            }
        }
    }
    svg.push_str(r#"</g>"#);
    svg.push_str("</svg>");

    Ok(svg)
}

// --- Función Pública Principal ---
pub fn generate_code(
    code_type: &str,
    data: &str,
    width_hint: i32,
    height_hint: i32,
    scale: u32,
) -> Result<String, Box<dyn Error>> {
    // Corregir esto:
    // let code_type = code_type.to_lowercase().trim();

    // Por esto:
    let binding = code_type.to_lowercase();
    let code_type = binding.trim();

    let format = match code_type {
        // QR Code y variantes
        "qr" | "qrcode" | "qr-code" | "qr_code" => BarcodeFormat::QR_CODE,

        // Code 128 y variantes
        "code128" | "code-128" | "code_128" | "code 128" => BarcodeFormat::CODE_128,

        // PDF417 y variantes
        "pdf417" | "pdf-417" | "pdf_417" | "pdf 417" => BarcodeFormat::PDF_417,

        // Aztec
        "aztec" => BarcodeFormat::AZTEC,

        // DataMatrix y variantes
        "datamatrix" | "data-matrix" | "data_matrix" | "data matrix" => BarcodeFormat::DATA_MATRIX,

        // EAN-8 y variantes
        "ean8" | "ean-8" | "ean_8" | "ean 8" => BarcodeFormat::EAN_8,

        // EAN-13 y variantes
        "ean13" | "ean-13" | "ean_13" | "ean 13" => BarcodeFormat::EAN_13,

        // ITF
        "itf" => BarcodeFormat::ITF,

        // UPC-A y variantes
        "upca" | "upc-a" | "upc_a" | "upc a" => BarcodeFormat::UPC_A,

        // UPC-E y variantes
        "upce" | "upc-e" | "upc_e" | "upc e" => BarcodeFormat::UPC_E,

        // Code 39 y variantes
        "code39" | "code-39" | "code_39" | "code 39" => BarcodeFormat::CODE_39,

        // Code 93 y variantes
        "code93" | "code-93" | "code_93" | "code 93" => BarcodeFormat::CODE_93,

        // Codabar
        "codabar" => BarcodeFormat::CODABAR,

        // No reconocido
        _ => return Err(format!("Tipo de código no soportado: {}", code_type).into()),
    };

    let writer = MultiFormatWriter;
    let bit_matrix = writer
        .encode(data, &format, width_hint, height_hint)
        .map_err(|e| Box::new(e) as Box<dyn Error>)?;

    println!(
        "Generando SVG manual (coords escaladas) con escala: {}",
        scale
    );
    // Llamamos a la función manual pasando la escala
    manual_bit_matrix_to_svg(&bit_matrix, scale)
}

// --- TESTS ---
#[cfg(test)]
mod tests {
    use super::*;

    fn check_is_svg(result: &Result<String, Box<dyn Error>>) {
        match result {
            Ok(svg) => {
                assert!(svg.starts_with("<svg"));
                assert!(svg.ends_with("</svg>"));
            }
            Err(e) => panic!("Error inesperado: {}", e),
        }
    }

    #[test]
    fn generate_qr_code_svg() {
        let result = generate_code("qr", "Hello World", 0, 0, 3);
        check_is_svg(&result);
    }

    #[test]
    fn generate_code128_svg() {
        let result = generate_code("code128", "12345678", 0, 0, 3);
        check_is_svg(&result);
    }

    #[test]
    fn generate_pdf417_svg() {
        let result = generate_code("pdf417", "Hello PDF417", 0, 0, 3);
        check_is_svg(&result);
    }

    #[test]
    fn unsupported_type() {
        let result = generate_code("unsupported", "test", 0, 0, 3);
        assert!(result.is_err());
        if let Err(e) = result {
            assert!(e.to_string().contains("no soportado"));
        }
    }

    #[test]
    fn encoding_error_example() {
        // Este test puede necesitar ajustes según el comportamiento exacto de rxing
        // Es solo un ejemplo
        let result = generate_code("ean13", "invalido", 0, 0, 3);
        assert!(result.is_err());
    }
}
