// examples/visual_effects.rs - Ejemplo de uso del módulo de efectos visuales

use rust_generator::processing::effects::{
    EffectProcessor, ShadowConfig, GlowConfig, BlurConfig, 
    NoiseConfig, VintageConfig, EffectConfig
};
use rust_generator::engine::types::Effect;
use rust_generator::generate_code;

fn main() {
    // Generar un código QR básico
    let qr_result = generate_code(
        "qr",
        "https://codex.example.com",
        10,
        Some("H"),
        None,
        None,
        Some("#000000"),
        Some("#FFFFFF"),
    );

    match qr_result {
        Ok(svg) => {
            println!("QR generado exitosamente!");
            
            // Crear procesador de efectos
            let mut effect_processor = EffectProcessor::new();
            
            // Ejemplo 1: Aplicar sombra
            println!("\n=== Aplicando efecto de sombra ===");
            let shadow_config = ShadowConfig {
                offset_x: 3.0,
                offset_y: 3.0,
                blur_radius: 5.0,
                color: "#333333".to_string(),
                opacity: 0.4,
            };
            
            match effect_processor.apply_shadow(&svg, Some(shadow_config)) {
                Ok(svg_with_shadow) => {
                    println!("Sombra aplicada correctamente");
                    save_svg("qr_shadow.svg", &svg_with_shadow);
                }
                Err(e) => println!("Error aplicando sombra: {}", e),
            }
            
            // Ejemplo 2: Aplicar brillo/resplandor
            println!("\n=== Aplicando efecto de brillo ===");
            let glow_config = GlowConfig {
                intensity: 4.0,
                color: "#3B82F6".to_string(), // Azul CODEX
            };
            
            match effect_processor.apply_glow(&svg, Some(glow_config)) {
                Ok(svg_with_glow) => {
                    println!("Brillo aplicado correctamente");
                    save_svg("qr_glow.svg", &svg_with_glow);
                }
                Err(e) => println!("Error aplicando brillo: {}", e),
            }
            
            // Ejemplo 3: Aplicar efecto vintage
            println!("\n=== Aplicando efecto vintage ===");
            let vintage_config = VintageConfig {
                sepia_intensity: 0.9,
                vignette_intensity: 0.5,
            };
            
            match effect_processor.apply_vintage(&svg, Some(vintage_config)) {
                Ok(svg_vintage) => {
                    println!("Efecto vintage aplicado correctamente");
                    save_svg("qr_vintage.svg", &svg_vintage);
                }
                Err(e) => println!("Error aplicando efecto vintage: {}", e),
            }
            
            // Ejemplo 4: Aplicar múltiples efectos
            println!("\n=== Aplicando múltiples efectos ===");
            let effects = vec![
                Effect::Shadow,
                Effect::Glow,
                Effect::Noise,
            ];
            
            // Validar combinación de efectos
            match effect_processor.validate_effect_combination(&effects) {
                Ok(_) => {
                    match effect_processor.apply_effects(&svg, &effects) {
                        Ok(svg_multi) => {
                            println!("Múltiples efectos aplicados correctamente");
                            save_svg("qr_multi_effects.svg", &svg_multi);
                        }
                        Err(e) => println!("Error aplicando múltiples efectos: {}", e),
                    }
                }
                Err(e) => println!("Combinación de efectos inválida: {}", e),
            }
            
            // Ejemplo 5: Crear filtro compuesto personalizado
            println!("\n=== Creando filtro compuesto personalizado ===");
            let custom_effects = vec![
                (Effect::Shadow, EffectConfig::Shadow(ShadowConfig {
                    offset_x: 2.0,
                    offset_y: 2.0,
                    blur_radius: 2.0,
                    color: "#000000".to_string(),
                    opacity: 0.2,
                })),
                (Effect::Glow, EffectConfig::Glow(GlowConfig {
                    intensity: 2.0,
                    color: "#FFFFFF".to_string(),
                })),
            ];
            
            // Optimizar para escaneabilidad
            let mut optimized_effects = custom_effects.clone();
            effect_processor.optimize_for_scanability(&mut optimized_effects);
            
            match effect_processor.create_composite_filter(&optimized_effects) {
                Ok(composite_filter) => {
                    println!("Filtro compuesto creado:");
                    println!("{}", composite_filter);
                }
                Err(e) => println!("Error creando filtro compuesto: {}", e),
            }
            
            // Ejemplo 6: Efectos problemáticos (debería fallar)
            println!("\n=== Probando combinación problemática ===");
            let problematic_effects = vec![Effect::Blur, Effect::Noise];
            
            match effect_processor.validate_effect_combination(&problematic_effects) {
                Ok(_) => println!("Combinación válida (inesperado)"),
                Err(e) => println!("Combinación rechazada correctamente: {}", e),
            }
        }
        Err(e) => {
            println!("Error generando QR: {}", e);
        }
    }
}

// Función auxiliar para guardar SVG
fn save_svg(filename: &str, svg_content: &str) {
    use std::fs;
    match fs::write(filename, svg_content) {
        Ok(_) => println!("  → Guardado en: {}", filename),
        Err(e) => println!("  → Error guardando {}: {}", filename, e),
    }
}