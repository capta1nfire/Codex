# Análisis de Formas de Ojos Orgánicas para QR v3 - Consulta para Gemini

## Contexto del Proyecto

Estamos desarrollando QReable, un generador avanzado de códigos QR con capacidades de personalización únicas. Acabamos de completar la Fase 1 que incluye:

### Estado Actual de Formas de Ojos

**Eye Border Styles (marcos) implementados:**
- `square` - Cuadrado básico
- `rounded_square` - Cuadrado con esquinas redondeadas  
- `circle` - Círculo
- `quarter_round` - Esquina redondeada (quarter circle)
- `cut_corner` - Esquina cortada
- `thick_border` - Marco grueso
- `double_border` - Marco doble
- `diamond` - Diamante
- `hexagon` - Hexágono
- `cross` - Cruz
- `star` - Estrella
- `leaf` - Hoja
- `arrow` - Flecha

**Eye Center Styles implementados:**
- `square` - Cuadrado
- `rounded_square` - Cuadrado redondeado
- `circle` - Círculo
- `dot` - Punto
- `star` - Estrella
- `diamond` - Diamante
- `cross` - Cruz
- `plus` - Más

### Arquitectura Técnica

1. **Backend Rust**: Genera paths SVG para cada forma
2. **Renderizado**: Usa `fillRule="evenodd"` para crear marcos huecos
3. **Estructura**: Ojo QR = marco 7x7 + centro 3x3
4. **Separación**: Border y center son paths independientes

## Objetivo de la Fase 2.1

Queremos implementar **formas de ojos orgánicas** que sean:
- Únicas en el mercado
- Visualmente atractivas
- Mantengan alta escaneabilidad (>95%)
- Asimétricas pero balanceadas
- Inspiradas en la naturaleza

## Preguntas para Gemini

### 1. Análisis de Tendencias de Diseño

¿Cuáles son las tendencias actuales en diseño orgánico y biomórfico que podrían aplicarse a códigos QR? Considera:
- Diseño biofílico
- Formas fluidas y líquidas
- Patrones naturales (fibonacci, fractales)
- Asimetría controlada
- Formas inspiradas en:
  - Flora (pétalos, hojas, flores)
  - Fauna (alas, escamas, plumas)
  - Elementos naturales (agua, fuego, viento)
  - Formas microscópicas (células, cristales)

### 2. Propuesta de Formas Específicas

Basándote en el análisis anterior, ¿qué 6-8 formas orgánicas específicas recomiendas implementar? Para cada una, proporciona:

1. **Nombre y concepto**
2. **Descripción visual**
3. **Industrias target** (ej: wellness, eco-friendly, arte)
4. **Nivel de complejidad técnica** (1-5)
5. **Riesgo de escaneabilidad** (bajo/medio/alto)
6. **Diferenciación vs competencia**

### 3. Consideraciones Técnicas

Para implementar formas orgánicas en SVG manteniendo la escaneabilidad:

1. **Curvas Bézier**: ¿Qué nivel de complejidad es seguro?
2. **Asimetría**: ¿Cuánta variación es aceptable sin afectar detección?
3. **Área mínima**: ¿Qué porcentaje del área 7x7 debe mantenerse?
4. **Suavidad vs definición**: ¿Cómo balancear formas fluidas con requisitos QR?

### 4. Implementación Progresiva

Sugiere un orden de implementación considerando:
- Complejidad técnica incremental
- Valor percibido por usuarios
- Riesgo de escaneabilidad
- Potencial de diferenciación

### 5. Casos de Uso y Marketing

Para cada forma orgánica propuesta:
- ¿Qué historia visual cuenta?
- ¿Qué emociones evoca?
- ¿Qué marcas/industrias se beneficiarían más?
- ¿Cómo se podría marketear esta característica única?

### 6. Ejemplos Visuales de Referencia

Si conoces ejemplos de:
- QR codes con formas orgánicas existentes
- Diseños biomórficos en otros contextos
- Patrones naturales adaptables a restricciones QR
- Arte generativo que mantenga funcionalidad

### 7. Riesgos y Mitigación

¿Cuáles son los principales riesgos al implementar formas orgánicas?
- Compatibilidad con escáneres
- Percepción de "demasiado artístico"
- Complejidad de implementación
- Mantenimiento de estándares ISO/IEC 18004

¿Cómo mitigar cada riesgo?

## Información Adicional

### Restricciones Técnicas
- Los ojos QR deben mantener su función de patrón de búsqueda
- El área central (3x3) debe ser claramente distinguible
- El contraste debe mantenerse alto
- Las formas deben funcionar en tamaños pequeños (21x21 módulos mínimo)

### Competencia Actual
La mayoría de generadores QR solo ofrecen:
- Formas geométricas básicas
- Círculos y cuadrados con variaciones mínimas
- Ninguno ofrece formas verdaderamente orgánicas

### Nuestra Ventaja Técnica
- Renderizado SVG completo (no limitado a canvas)
- Separación border/center para máxima flexibilidad
- Sistema de paths complejos ya implementado
- Performance <5ms mantenida

## Resultado Esperado

Buscamos una lista curada de 6-8 formas orgánicas que:
1. Sean técnicamente viables
2. Mantengan escaneabilidad >95%
3. Ofrezcan diferenciación clara
4. Apelen a mercados específicos
5. Cuenten una historia visual única

Por favor, proporciona recomendaciones detalladas considerando tanto el aspecto creativo como las limitaciones técnicas del formato QR.