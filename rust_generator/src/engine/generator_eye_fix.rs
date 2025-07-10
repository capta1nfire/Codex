// generator_eye_fix.rs - Fix para el modo unificado de eye_shape
// Este código debe reemplazar la lógica actual en generator.rs

/// Genera el path para un ojo específico en modo unificado
/// FIXED: Ahora genera correctamente marco + centro relleno en lugar de un anillo
fn generate_eye_path_fixed(&self, region: &EyeRegion, eye_type: &str) -> String {
    // Primero verificar si tenemos los nuevos estilos separados
    if let Some(customization) = &self.customization {
        if customization.eye_border_style.is_some() || customization.eye_center_style.is_some() {
            return self.generate_eye_path_separated(region, eye_type);
        }
    }
    
    // Fallback al sistema antiguo si no hay estilos separados
    let eye_shape = self.customization.as_ref()
        .and_then(|c| c.eye_shape)
        .unwrap_or(EyeShape::Square);
    
    let x = region.x + self.quiet_zone;
    let y = region.y + self.quiet_zone;
    
    // IMPORTANTE: En el modo unificado, generamos un path que incluye
    // tanto el marco como el centro relleno, NO un agujero
    let mut path_parts = Vec::new();
    
    match eye_shape {
        EyeShape::Square => {
            // Marco exterior completo (7x7)
            path_parts.push(format!("M {} {} h 7 v 7 h -7 Z", x, y));
            // NO crear agujero, el centro se renderiza con el mismo color
        }
        EyeShape::RoundedSquare => {
            // Marco exterior redondeado completo
            path_parts.push(format!(
                "M {:.1} {} h 5.6 a 0.7 0.7 0 0 1 0.7 0.7 v 5.6 a 0.7 0.7 0 0 1 -0.7 0.7 h -5.6 a 0.7 0.7 0 0 1 -0.7 -0.7 v -5.6 a 0.7 0.7 0 0 1 0.7 -0.7 Z",
                x as f32 + 0.7, y
            ));
        }
        EyeShape::Circle => {
            // FIXED: Solo generar el círculo exterior completo, sin agujero
            let cx = x as f32 + 3.5;
            let cy = y as f32 + 3.5;
            path_parts.push(format!(
                "M {} {} A 3.5 3.5 0 1 0 {} {} A 3.5 3.5 0 1 0 {} {} Z",
                cx - 3.5, cy, cx + 3.5, cy, cx - 3.5, cy
            ));
            // NO agregar el círculo interior como agujero
        }
        EyeShape::Dot => {
            // Marco exterior cuadrado completo
            path_parts.push(format!("M {} {} h 7 v 7 h -7 Z", x, y));
        }
        EyeShape::Leaf => {
            let cx = x as f32 + 3.5;
            let cy = y as f32 + 3.5;
            path_parts.push(format!(
                "M {} {} Q {} {} {} {} Q {} {} {} {} Q {} {} {} {} Q {} {} {} {} Z",
                cx, y as f32,
                x as f32 + 5.6, y as f32 + 1.4, x as f32 + 7.0, cy,
                x as f32 + 5.6, y as f32 + 5.6, cx, y as f32 + 7.0,
                x as f32 + 1.4, y as f32 + 5.6, x as f32, cy,
                x as f32 + 1.4, y as f32 + 1.4, cx, y as f32
            ));
        }
        EyeShape::Star => {
            let cx = x as f32 + 3.5;
            let cy = y as f32 + 3.5;
            let outer_r = 3.5;
            let inner_r = 1.75;
            
            let mut star_path = String::from("M ");
            for i in 0..10 {
                let angle = (i as f32 * 36.0 - 90.0).to_radians();
                let r = if i % 2 == 0 { outer_r } else { inner_r };
                let px = cx + r * angle.cos();
                let py = cy + r * angle.sin();
                
                if i == 0 {
                    star_path.push_str(&format!("{:.2} {:.2}", px, py));
                } else {
                    star_path.push_str(&format!(" L {:.2} {:.2}", px, py));
                }
            }
            star_path.push_str(" Z");
            path_parts.push(star_path);
        }
        EyeShape::Diamond => {
            let cx = x as f32 + 3.5;
            let cy = y as f32 + 3.5;
            path_parts.push(format!(
                "M {} {} L {} {} L {} {} L {} {} Z",
                cx, y as f32,
                x as f32 + 7.0, cy,
                cx, y as f32 + 7.0,
                x as f32, cy
            ));
        }
        EyeShape::Cross => {
            let thickness = 7.0 / 3.0;
            let offset = (7.0 - thickness) / 2.0;
            path_parts.push(format!(
                "M {} {} h {} v {} h {} v {} h -{} v {} h -{} v -{} h -{} v -{} h {} Z",
                x as f32 + offset, y as f32,
                thickness, offset,
                offset, thickness,
                offset, offset,
                thickness, offset,
                thickness, thickness,
                offset
            ));
        }
        EyeShape::Hexagon => {
            let cx = x as f32 + 3.5;
            let cy = y as f32 + 3.5;
            let r = 3.5;
            
            let mut hex_path = String::from("M ");
            for i in 0..6 {
                let angle = (i as f32 * 60.0 - 30.0).to_radians();
                let px = cx + r * angle.cos();
                let py = cy + r * angle.sin();
                
                if i == 0 {
                    hex_path.push_str(&format!("{:.2} {:.2}", px, py));
                } else {
                    hex_path.push_str(&format!(" L {:.2} {:.2}", px, py));
                }
            }
            hex_path.push_str(" Z");
            path_parts.push(hex_path);
        }
        EyeShape::Heart => {
            // Marco exterior - corazón con rotación según posición
            let cx = x as f32 + 3.5;
            let cy = y as f32 + 3.5;
            
            // Determinar el ángulo de rotación según la posición del ojo
            let rotation_angle = match eye_type {
                "top_left" => -std::f32::consts::PI / 4.0,
                "top_right" => std::f32::consts::PI / 4.0,
                "bottom_left" => -std::f32::consts::PI * 3.0 / 4.0,
                _ => 0.0,
            };
            
            // Función para rotar un punto alrededor del centro
            let rotate_point = |px: f32, py: f32, angle: f32| -> (f32, f32) {
                let cos_a = angle.cos();
                let sin_a = angle.sin();
                let dx = px - cx;
                let dy = py - cy;
                let rx = dx * cos_a - dy * sin_a + cx;
                let ry = dx * sin_a + dy * cos_a + cy;
                (rx, ry)
            };
            
            // Generar el path del corazón completo
            // ... (mantener la lógica actual del corazón pero sin el agujero)
        }
        // ... otros casos similares
    }
    
    path_parts.join(" ")
}

// ALTERNATIVA: Generar modo unificado como dos elementos separados pero tratados como unidad
fn generate_eye_path_unified_v2(&self, region: &EyeRegion, eye_type: &str) -> (String, String) {
    let eye_shape = self.customization.as_ref()
        .and_then(|c| c.eye_shape)
        .unwrap_or(EyeShape::Square);
    
    let x = region.x + self.quiet_zone;
    let y = region.y + self.quiet_zone;
    
    // Generar marco (7x7)
    let border_path = match eye_shape {
        EyeShape::Square => {
            format!("M {} {} h 7 v 7 h -7 Z M {} {} h 3 v 3 h -3 Z", 
                x, y, x + 2, y + 2)
        }
        EyeShape::Circle => {
            let cx = x as f32 + 3.5;
            let cy = y as f32 + 3.5;
            // Marco como anillo
            format!(
                "M {} {} A 3.5 3.5 0 1 0 {} {} A 3.5 3.5 0 1 0 {} {} Z M {} {} A 2.5 2.5 0 1 0 {} {} A 2.5 2.5 0 1 0 {} {} Z",
                cx - 3.5, cy, cx + 3.5, cy, cx - 3.5, cy,
                cx - 2.5, cy, cx + 2.5, cy, cx - 2.5, cy
            )
        }
        // ... otros casos
    };
    
    // Generar centro (3x3)
    let center_path = match eye_shape {
        EyeShape::Square => {
            format!("M {} {} h 3 v 3 h -3 Z", x + 2, y + 2)
        }
        EyeShape::Circle => {
            let cx = (x + 2) as f32 + 1.5;
            let cy = (y + 2) as f32 + 1.5;
            format!(
                "M {} {} A 1.5 1.5 0 1 0 {} {} A 1.5 1.5 0 1 0 {} {} Z",
                cx - 1.5, cy, cx + 1.5, cy, cx - 1.5, cy
            )
        }
        // ... otros casos
    };
    
    (border_path, center_path)
}