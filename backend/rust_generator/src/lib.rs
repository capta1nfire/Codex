// --- Imports ---
use rxing::{BarcodeFormat, MultiFormatWriter, Writer, common::BitMatrix};
// Necesitamos la librería 'image' (rxing la trae como dependencia por la feature flag)
// y tipos específicos para la conversión PNG.
use image::{ImageBuffer, Luma, ImageFormat};
// Necesitamos Cursor para escribir en un buffer en memoria.
use std::io::Cursor;
// Importamos la librería base64
use base64::{engine::general_purpose::STANDARD, Engine as _};

// --- Función Auxiliar para convertir BitMatrix a PNG Buffer ---
// (Basada en la excelente y detallada respuesta de Manus)
// Usamos Box<dyn std::error::Error> para un manejo de errores más flexible
fn bit_matrix_to_png(bit_matrix: &BitMatrix) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    let width = bit_matrix.getWidth() as u32;
    let height = bit_matrix.getHeight() as u32;

    // Validar dimensiones (evita pánico si son 0)
    if width == 0 || height == 0 {
        return Err("Las dimensiones de BitMatrix no pueden ser cero".into());
    }

    // Crear un buffer de imagen en escala de grises (Luma = 8 bits)
    let mut img = ImageBuffer::<Luma<u8>, Vec<u8>>::new(width, height);

    // Recorrer la matriz y establecer los píxeles
    for y in 0..height {
        for x in 0..width {
            // bit_matrix.get() devuelve true si el bit está activo (negro)
            let color_value = if bit_matrix.get(x, y) { 0u8 } else { 255u8 };
            img.put_pixel(x, y, Luma([color_value]));
        }
    }

    // Crear un buffer en memoria para almacenar los datos PNG
    let mut png_buffer = Vec::new();
    // Usamos un Cursor para permitir que el encoder PNG escriba en nuestro Vec<u8>
    let mut cursor = Cursor::new(&mut png_buffer);

    // Escribir la imagen en formato PNG al buffer
    // El '?' propagará cualquier error que ocurra durante la escritura/codificación PNG
    img.write_to(&mut cursor, ImageFormat::Png)?;

    // Si todo fue bien, devolver el buffer de bytes PNG
    Ok(png_buffer)
}


// --- Función Pública Principal ---
// Devuelve Result<String(Base64), String(Error)>
pub fn generate_code(
    code_type: &str,
    data: &str,
    width_hint: i32, // Renombrado para aclarar que son sugerencias
    height_hint: i32,
) -> Result<String, String> {

    let format = match code_type.to_lowercase().as_str() {
        "qrcode" => BarcodeFormat::QR_CODE,
        "code128" => BarcodeFormat::CODE_128,
        "pdf417" => BarcodeFormat::PDF_417,
        "ean13" => BarcodeFormat::EAN_13,
        "upca" => BarcodeFormat::UPC_A,
        "code39" => BarcodeFormat::CODE_39,
        "datamatrix" => BarcodeFormat::DATA_MATRIX,
        // TODO: Añadir más mapeos aquí...
        _ => return Err(format!("Tipo de código no soportado: {}", code_type)),
    };

    let writer = MultiFormatWriter; // Usamos directamente como nos funcionó en la compilación

    // Codificar a BitMatrix (el corazón de rxing)
    let bit_matrix = writer
        .encode(data, &format, width_hint, height_hint) // Usamos encode simple
        .map_err(|e| format!("Error de rxing al codificar: {}", e.to_string()))?;

    // Convertir la BitMatrix a un buffer de bytes PNG
    let png_buffer = bit_matrix_to_png(&bit_matrix)
        .map_err(|e| format!("Error al crear PNG desde BitMatrix: {}", e.to_string()))?;

    // Codificar el buffer PNG a Base64 String
    let base64_string = STANDARD.encode(&png_buffer);

    // Devolver el string Base64
    Ok(base64_string)
}


// --- Tests Unitarios ---
#[cfg(test)]
mod tests {
    use super::*; // Importa generate_code

    #[test]
    fn generate_qr_code_base64() {
        let data = "Test QR Base64";
        let result = generate_code("qrcode", data, 200, 200);
        assert!(result.is_ok());
        let base64 = result.unwrap();
        assert!(!base64.is_empty()); // Verifica que no esté vacío
        // Podríamos añadir una verificación más compleja de Base64 si quisiéramos
        // println!("QR Base64 length: {}", base64.len());
    }

    #[test]
    fn generate_code128_base64() {
        let data = "CODE128BASE64";
        let result = generate_code("code128", data, 300, 100);
        assert!(result.is_ok());
        let base64 = result.unwrap();
        assert!(!base64.is_empty());
        // println!("Code128 Base64 length: {}", base64.len());
    }

     #[test]
     fn generate_pdf417_base64() {
         // PDF417 puede necesitar más datos o tener restricciones
         let data = "PDF417 test data string";
         let result = generate_code("pdf417", data, 300, 100); // Ajustar tamaño si es necesario
         assert!(result.is_ok());
         let base64 = result.unwrap();
         assert!(!base64.is_empty());
         // println!("PDF417 Base64 length: {}", base64.len());
     }

    #[test]
    fn unsupported_type() {
        let data = "Test";
        let result = generate_code("invalidtype", data, 200, 200);
        assert!(result.is_err());
    }

    #[test]
    fn encoding_error_example() {
        let data = "CódigoConÑ"; // Caracter inválido para Code128
        let result = generate_code("code128", data, 300, 100);
        assert!(result.is_err()); // Esperamos un error de codificación de rxing
        assert!(result.unwrap_err().contains("Error de rxing al codificar"));
    }
}