// Quitamos wasm_bindgen y las dependencias PNG/Base64
use rxing::{BarcodeFormat, MultiFormatWriter, Writer, common::BitMatrix};
// Añadimos Box<dyn Error> para un manejo de errores más genérico
use std::error::Error;

// --- Función Manual SVG (Plan B, basada en Manus) ---
// Genera SVG dibujando rectángulos para cada módulo negro
fn manual_bit_matrix_to_svg(bit_matrix: &BitMatrix) -> Result<String, Box<dyn Error>> {
    let width = bit_matrix.getWidth(); // Asumimos que getWidth/Height son correctos
    let height = bit_matrix.getHeight();

    if width == 0 || height == 0 {
        return Err("Las dimensiones de BitMatrix no pueden ser cero para SVG".into());
    }

    // Tamaño de cada cuadrado negro/blanco en el SVG final
    let module_size = 1; // Podemos hacerlo configurable después
    let svg_width = width as i32 * module_size;
    let svg_height = height as i32 * module_size;

    // Usamos una String con capacidad preasignada para eficiencia
    let mut svg = String::with_capacity(
        150 // Cabecera/Pie aprox
        + (width as usize * height as usize / 2) * 70 // Estimación de rectángulos
    );

    // Cabecera SVG
    svg.push_str(&format!(
        r#"<svg width="{}" height="{}" viewBox="0 0 {} {}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">"#,
        svg_width, svg_height, svg_width, svg_height
    ));
    // Fondo blanco (importante para códigos QR y otros)
    svg.push_str(&format!(r#"<rect width="{}" height="{}" fill="white"/>"#, svg_width, svg_height));

    // Grupo para los módulos negros
    svg.push_str(r#"<g fill="black">"#);
    for y in 0..height {
        for x in 0..width {
            if bit_matrix.get(x, y) { // Usamos get(x, y) asumiendo que funcionó antes
                svg.push_str(&format!(
                    r#"<rect x="{}" y="{}" width="{}" height="{}"/>"#,
                    x as i32 * module_size,
                    y as i32 * module_size,
                    module_size,
                    module_size
                ));
            }
        }
    }
    svg.push_str(r#"</g>"#);
    svg.push_str("</svg>");

    Ok(svg)
}


// --- Función Pública Principal ---
// Ya no necesita #[wasm_bindgen]
pub fn generate_code(
    code_type: &str,
    data: &str,
    width_hint: i32, // Estos son hints, el tamaño SVG real lo da la matriz/module_size
    height_hint: i32,
) -> Result<String, Box<dyn Error>> { // Devolvemos SVG String o un Error genérico

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

    // Codificar a BitMatrix (mismo que antes)
    let bit_matrix = writer
        .encode(data, &format, width_hint, height_hint)
        // Convertimos el error específico de rxing a un error genérico
        .map_err(|e| Box::new(e) as Box<dyn Error>)?;

    // --- INTENTO #3 de generar SVG ---
    // Intentamos el método manual de Manus directamente, ya que el nativo es incierto
    println!("Generando SVG usando el método manual...");
    manual_bit_matrix_to_svg(&bit_matrix)

    // --- Código para intentar .to_svg() nativo (si quisiéramos probarlo de nuevo) ---
    // println!("Intentando llamar a bit_matrix.to_svg()...");
    // let svg_string = bit_matrix.to_svg()?; // Necesitaría que to_svg devuelva Result<String, AlgúnError>
    // Ok(svg_string)
    // --- Fin código .to_svg() ---
}

// --- TESTS (Actualizados para esperar SVG) ---
#[cfg(test)]
mod tests {
    use super::*;

    // Helper para verificar si la salida es un SVG válido (simplificado)
    fn check_is_svg(result: &Result<String, Box<dyn Error>>) {
        assert!(result.is_ok(), "El resultado debería ser Ok, pero fue Err: {:?}", result.as_ref().err());
        let output = result.as_ref().unwrap();
        assert!(output.trim().starts_with("<svg"), "La salida no empieza con <svg");
        assert!(output.trim().ends_with("</svg>"), "La salida no termina con </svg>");
        // Imprime solo una parte para no llenar la consola
        // println!("SVG Generado (primeros 100 chars): {}...", &output[..output.len().min(100)]);
    }

    #[test]
    fn generate_qr_code_svg() {
        let data = "Test QR SVG";
        let result = generate_code("qrcode", data, 0, 0); // Hints de tamaño no muy relevantes para SVG manual
        check_is_svg(&result);
    }

    #[test]
    fn generate_code128_svg() {
        let data = "CODE128SVG";
        let result = generate_code("code128", data, 0, 0);
        check_is_svg(&result);
    }

    #[test]
    fn generate_pdf417_svg() {
        let data = "PDF417 SVG test data string";
        let result = generate_code("pdf417", data, 0, 0);
        check_is_svg(&result);
    }

    // Estos tests de error deberían seguir funcionando
    #[test]
    fn unsupported_type() {
        let data = "Test";
        let result = generate_code("invalidtype", data, 0, 0);
        assert!(result.is_err());
    }
    #[test]
    fn encoding_error_example() {
        let data = "CódigoConÑ"; // Caracter inválido para Code128
        let result = generate_code("code128", data, 0, 0);
        assert!(result.is_err());
        eprintln!("DEBUG: Actual error message: {:?}", result.as_ref().err().unwrap());
        // Verifica que el error sea de codificación (podría ser más específico)
        assert!(result.unwrap_err().to_string().contains("Bad character"));
    }
}