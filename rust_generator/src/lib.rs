// Imports
use rxing::{BarcodeFormat, MultiFormatWriter, Writer, common::BitMatrix};
use std::error::Error;

// --- Función Manual SVG (Enfoque Estándar Escalable) ---
// Dibuja módulos 1x1 en un viewBox definido por las dimensiones de la matriz
fn manual_bit_matrix_to_svg(bit_matrix: &BitMatrix, _scale: u32) -> Result<String, Box<dyn Error>> { // Recibe scale pero NO lo usa para dibujar
    let width = bit_matrix.getWidth();
    let height = bit_matrix.getHeight();

    // Ya no necesitamos la variable scale aquí para el dibujo básico
    // let scale = if scale == 0 { 1 } else { scale }; // No se usa para dibujar

    if width == 0 || height == 0 {
        return Err("Las dimensiones de BitMatrix no pueden ser cero para SVG".into());
    }

    // Ya no necesitamos svg_width, svg_height basados en scale para la cabecera

    // Estimar capacidad del String
    let mut svg = String::with_capacity(
        150 + (width as usize * height as usize / 2) * 50 // Ajustada estimación
    );

    // --- Cabecera SVG CORREGIDA ---
    // Quitamos width/height, viewBox usa dimensiones de MODULOS (sin escalar)
    svg.push_str(&format!(
        r#"<svg viewBox="0 0 {} {}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">"#,
        width, height // <-- USA width y height originales (en módulos)
    ));
    // Fondo blanco (usa dimensiones originales)
    svg.push_str(&format!(r#"<rect width="{}" height="{}" fill="white"/>"#, width, height));

    // Grupo para módulos negros
    svg.push_str(r#"<g fill="black">"#);
    for y in 0..height {
        for x in 0..width {
            if bit_matrix.get(x, y) {
                // --- Dibujar rectángulo SIEMPRE de tamaño 1x1 ---
                // Las coordenadas x,y ya son las correctas en el viewBox
                svg.push_str(&format!(
                    r#"<rect x="{}" y="{}" width="1" height="1"/>"#, // <-- Tamaño fijo 1x1
                    x, // <-- Posición X original
                    y  // <-- Posición Y original
                ));
                // --- FIN Dibujo Rectángulo ---
            }
        }
    }
    svg.push_str(r#"</g>"#);
    svg.push_str("</svg>");

    Ok(svg)
}


// --- Función Pública Principal ---
// La firma acepta 'scale', pero la implementación actual de SVG lo ignora
pub fn generate_code(
    code_type: &str,
    data: &str,
    width_hint: i32,
    height_hint: i32,
    scale: u32, // Recibe scale por compatibilidad con main.rs
) -> Result<String, Box<dyn Error>> {

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

    println!("Generando SVG (escalado por navegador/CSS) para escala solicitada: {}", scale);
    // Llamamos a la función manual (que ahora ignora 'scale' internamente para el dibujo)
    manual_bit_matrix_to_svg(&bit_matrix, scale)
}

// --- TESTS ---
// Los tests verifican que se genere un SVG válido, el tamaño visual final depende del renderizador.
#[cfg(test)]
mod tests {
    use super::*;

    fn check_is_svg(result: &Result<String, Box<dyn Error>>) {
        assert!(result.is_ok(), "El resultado debería ser Ok, pero fue Err: {:?}", result.as_ref().err());
        let output = result.as_ref().unwrap();
        assert!(output.trim().starts_with("<svg"), "La salida no empieza con <svg");
        assert!(output.trim().ends_with("</svg>"), "La salida no termina con </svg>");
    }

    #[test]
    fn generate_qr_code_svg() {
        let data = "Test QR SVG";
        let result = generate_code("qrcode", data, 0, 0, 5); // Scale ya no afecta el SVG generado
        check_is_svg(&result);
    }

    #[test]
    fn generate_code128_svg() {
        let data = "CODE128SVG";
        let result = generate_code("code128", data, 0, 0, 3); // Scale ya no afecta
        check_is_svg(&result);
    }

    #[test]
    fn generate_pdf417_svg() {
        let data = "PDF417 SVG test data string";
        let result = generate_code("pdf417", data, 0, 0, 2); // Scale ya no afecta
        check_is_svg(&result);
    }

    #[test]
    fn unsupported_type() {
        let data = "Test";
        let result = generate_code("invalidtype", data, 0, 0, 1);
        assert!(result.is_err());
    }
    #[test]
    fn encoding_error_example() {
        let data = "CódigoConÑ";
        let result = generate_code("code128", data, 0, 0, 1);
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Bad character"));
    }
}