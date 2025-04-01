use rxing::{BarcodeFormat, MultiFormatWriter, Writer, common::BitMatrix};
use std::error::Error;

// --- Función Manual SVG (AHORA ACEPTA 'scale') ---
fn manual_bit_matrix_to_svg(bit_matrix: &BitMatrix, scale: u32) -> Result<String, Box<dyn Error>> {
    let width = bit_matrix.getWidth();
    let height = bit_matrix.getHeight();

    // Asegurarse que la escala sea al menos 1
    let scale = if scale == 0 { 1 } else { scale };

    if width == 0 || height == 0 {
        return Err("Las dimensiones de BitMatrix no pueden ser cero para SVG".into());
    }

    // Calcular dimensiones SVG basadas en la escala
    let svg_width = width * scale;
    let svg_height = height * scale;

    // Estimar capacidad del String
    let mut svg = String::with_capacity(
        150 + (width as usize * height as usize / 2) * 70 // Aproximado
    );

    // Cabecera SVG (sin width/height fijos, usa viewBox)
    svg.push_str(&format!(
        r#"<svg viewBox="0 0 {} {}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">"#,
        svg_width, svg_height // ViewBox ahora usa dimensiones escaladas
    ));
    // Fondo blanco
    svg.push_str(&format!(r#"<rect width="{}" height="{}" fill="white"/>"#, svg_width, svg_height));

    // Grupo para módulos negros
    svg.push_str(r#"<g fill="black">"#);
    for y in 0..height {
        for x in 0..width {
            if bit_matrix.get(x, y) {
                // Dibujar rectángulo escalado
                svg.push_str(&format!(
                    r#"<rect x="{}" y="{}" width="{}" height="{}"/>"#,
                    x * scale, // Posición X escalada
                    y * scale, // Posición Y escalada
                    scale,     // Ancho del módulo = escala
                    scale      // Alto del módulo = escala
                ));
            }
        }
    }
    svg.push_str(r#"</g>"#);
    svg.push_str("</svg>");

    Ok(svg)
}


// --- Función Pública Principal (AHORA ACEPTA 'scale') ---
pub fn generate_code(
    code_type: &str,
    data: &str,
    width_hint: i32, // Siguen siendo hints para el encoder
    height_hint: i32,
    scale: u32, // <-- NUEVO PARÁMETRO
) -> Result<String, Box<dyn Error>> { // Devuelve SVG String o Error

    let format = match code_type.to_lowercase().as_str() {
        "qrcode" => BarcodeFormat::QR_CODE,
        "code128" => BarcodeFormat::CODE_128,
        "pdf417" => BarcodeFormat::PDF_417,
        "ean13" => BarcodeFormat::EAN_13,
        "upca" => BarcodeFormat::UPC_A,
        "code39" => BarcodeFormat::CODE_39,
        "datamatrix" => BarcodeFormat::DATA_MATRIX,
        _ => return Err(format!("Tipo de código no soportado: {}", code_type).into()),
    };

    let writer = MultiFormatWriter;

    let bit_matrix = writer
        .encode(data, &format, width_hint, height_hint)
        .map_err(|e| Box::new(e) as Box<dyn Error>)?;

    println!("Generando SVG usando el método manual con escala: {}", scale); // Log con escala
    // Llamamos a la función manual pasando la escala
    manual_bit_matrix_to_svg(&bit_matrix, scale)
}

// --- TESTS (Actualizados para pasar 'scale') ---
#[cfg(test)]
mod tests {
    use super::*;

    fn check_is_svg(result: &Result<String, Box<dyn Error>>) {
        // ... (sin cambios) ...
    }

    #[test]
    fn generate_qr_code_svg() {
        let data = "Test QR SVG";
        let result = generate_code("qrcode", data, 0, 0, 5); // <-- Pasar escala (ej. 5)
        check_is_svg(&result);
    }

    #[test]
    fn generate_code128_svg() {
        let data = "CODE128SVG";
        let result = generate_code("code128", data, 0, 0, 3); // <-- Pasar escala (ej. 3)
        check_is_svg(&result);
    }

    #[test]
    fn generate_pdf417_svg() {
        let data = "PDF417 SVG test data string";
        let result = generate_code("pdf417", data, 0, 0, 2); // <-- Pasar escala (ej. 2)
        check_is_svg(&result);
    }

    #[test]
    fn unsupported_type() {
        let data = "Test";
        let result = generate_code("invalidtype", data, 0, 0, 1); // Añadir escala
        assert!(result.is_err());
    }
    #[test]
    fn encoding_error_example() {
        let data = "CódigoConÑ";
        let result = generate_code("code128", data, 0, 0, 1); // Añadir escala
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Bad character"));
    }
}