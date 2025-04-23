// Imports
use rxing::{common::BitMatrix, BarcodeFormat, MultiFormatWriter, Writer, EncodeHints};
use std::error::Error;

// --- Función Manual SVG (Usa scale para coords/viewBox, SIN width/height en <svg>) ---
fn manual_bit_matrix_to_svg(
    bit_matrix: &BitMatrix,
    scale: u32,
    fgcolor_opt: Option<&str>,
    bgcolor_opt: Option<&str>,
) -> Result<String, Box<dyn Error>> {
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

    // Definir colores con valores por defecto
    let fg_color = fgcolor_opt.unwrap_or("#000000");
    let bg_color = bgcolor_opt.unwrap_or("#FFFFFF");

    // Estimar capacidad
    let mut svg = String::with_capacity(
        150 + (width as usize * height as usize / 2) * 70, // Aproximado
    );

    // --- Cabecera SVG CORREGIDA ---
    svg.push_str(&format!(
        r#"<svg viewBox="0 0 {} {}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">"#,
        svg_width, svg_height
    ));

    // Fondo (usa bgcolor)
    svg.push_str(&format!(
        r#"<rect width="{}" height="{}" fill="{}"/>"#,
        svg_width, svg_height, bg_color
    ));

    // Grupo para módulos (usa fgcolor)
    svg.push_str(&format!(r#"<g fill="{}">"#, fg_color));
    for y in 0..height {
        for x in 0..width {
            if bit_matrix.get(x, y) {
                // --- Dibujar rectángulo ESCALADO ---
                svg.push_str(&format!(
                    r#"<rect x="{}" y="{}" width="{}" height="{}"/>"#,
                    x * scale, y * scale, scale, scale
                ));
            }
        }
    }
    svg.push_str(r#"</g>"#);
    svg.push_str("</svg>");

    Ok(svg)
}

// --- Función Pública Principal (firma actualizada, sin hints internos por ahora) ---
#[allow(clippy::too_many_arguments)]
pub fn generate_code(
    code_type: &str,
    data: &str,
    scale: u32,
    _ecl: Option<&str>,      // Parámetro recibido pero IGNORADO por ahora
    height: Option<u32>,   // Parámetro recibido pero IGNORADO por ahora por rxing
    _includetext: Option<bool>, // Parámetro recibido pero IGNORADO por ahora
    fgcolor: Option<&str>,
    bgcolor: Option<&str>,
) -> Result<String, Box<dyn Error>> {
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

    // --- Crear y poblar EncodeHints ---
    let mut hints = EncodeHints::default();

    // Nivel de corrección de errores (ECL) - Principalmente para QR
    if let Some(ecl_val) = _ecl {
        // TODO: Validar que ecl_val sea L, M, Q, H si el formato es QR?
        // La validación debería ocurrir antes, pero añadimos el hint igualmente.
        hints.ErrorCorrection = Some(ecl_val.to_uppercase()); // Convertir a String
    }

    // Margen - Usamos 'scale' como indicativo, aunque su significado varía.
    // Un valor > 0 podría indicar un margen deseado. '0' podría ser sin margen.
    // rxing espera un String para Margin.
    if scale > 0 {
         hints.Margin = Some(scale.to_string());
    } else {
         // Podríamos explícitamente pedir sin margen si scale es 0, si rxing lo soporta
         // hints.Margin = Some("0".to_string()); // Ejemplo, verificar API rxing
         // Por ahora, si scale es 0, no establecemos el hint de margen.
    }

    // TODO: Mapear otras opciones de BarcodeRequestOptions si es necesario
    // Por ejemplo, para PDF417: min_columns, max_columns, compact
    // Para DataMatrix: shape, compact
    // Para Code128: compact, force_codeset
    // if let Some(options) = ??? { // Necesitaríamos pasar las 'options' a esta función
    //     if format == BarcodeFormat::PDF_417 {
    //         if let Some(min_cols) = options.min_columns {
    //              // hints.Pdf417Dimensions... necesita struct Dimensions
    //         }
    //         // ... etc ...
    //     }
    // }


    // Usar altura solo si se necesita para alguna lógica futura, si no, eliminar el let
    let _effective_height = height.unwrap_or(0) as i32;
    let width_hint = 0; // Usar 0 para que rxing decida el tamaño base
    let height_hint = 0;// Usar 0 para que rxing decida el tamaño base

    let writer = MultiFormatWriter;
    // --- Usar encode_with_hints ---
    let bit_matrix = writer
        .encode_with_hints(data, &format, width_hint, height_hint, &hints) // Pasar &hints
        .map_err(|e| Box::new(e) as Box<dyn Error>)?;

    println!(
        "Generando SVG manual con escala: {}, fg: {:?}, bg: {:?}",
        scale, fgcolor, bgcolor
    );
    // Llamamos a la función manual pasando la escala y colores
    manual_bit_matrix_to_svg(&bit_matrix, scale, fgcolor, bgcolor)
}

// --- TESTS (ajustar llamadas para quitar hints no soportados) ---
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
        // Llamada sin ECL, height, includetext por ahora -> AHORA podemos pasar ECL!
        let result = generate_code("qr", "Hello World", 3, Some("H"), None, None, Some("#112233"), Some("#EFEFEF"));
        check_is_svg(&result);
        // Verificar colores si es posible
        if let Ok(svg) = result {
             assert!(svg.contains("fill=\"#112233\""));
             assert!(svg.contains("fill=\"#EFEFEF\""));
        }
    }

    #[test]
    fn generate_code128_svg() {
        let result = generate_code("code128", "12345678", 3, None, None, None, None, None);
        check_is_svg(&result);
    }

    #[test]
    fn generate_pdf417_svg() {
        let result = generate_code("pdf417", "Hello PDF417", 3, None, None, None, None, None);
        check_is_svg(&result);
    }

    #[test]
    fn unsupported_type() {
        let result = generate_code("unsupported", "test", 3, None, None, None, None, None);
        assert!(result.is_err());
        if let Err(e) = result {
            assert!(e.to_string().contains("no soportado"));
        }
    }

    #[test]
    fn encoding_error_example() {
        let result = generate_code("ean13", "invalido", 3, None, None, None, None, None);
        assert!(result.is_err());
    }
}
